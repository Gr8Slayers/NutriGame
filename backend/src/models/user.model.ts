import prisma from '../config/prisma';

export const userModel = {

  //findUser: login esnasinda girilen username ya da email'e sahip bir user var mi diye kontrol ediliyor
  findUser(email: string, username: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ],
      },
    });
  },

  //createUser: register esnasinda girilen bilgiler ile user ve userprofile tablosuna girdi olusturuluyor
  createUser: async (username: string, email: string, password: string, age: number, gender: string, height: number, weight: number, target_weight: number, reason_to_diet: string, avatar_url: string) => {
    return prisma.user.create({
      data: {
        username,
        email,
        password,
        profile: {
          create: {
            age,
            gender,
            weight,
            height,
            target_weight,
            reason_to_diet,
            avatar_url,
          },
        },
      },
    });
  },

  //updateUserProfileById: user in profilinde degisiklik yapmasini sagliyor, saglanan id ye sahip userin saglanan degisiklikleri user ve userprofile tablosunda guncelleniyor
  updateUserProfileById: async (userId: number, updates: { age?: number, gender?: string, weight?: number, height?: number, target_weight?: number, reason_to_diet?: string, avatar_url?: string }) => {
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: userId },  // userId üzerinden profili bul
      data: updates,              // hangi alandan degisiklik geldiyse onu güncelle
    });
    return updatedProfile;
  },

  //deleteUser: verilen user id ye sahip userin user ve userprofile tablolari siliniyor
  deleteUser: async (userId: number) => {
    return await prisma.user.delete({
      where: { id: userId }
    });
  },

  //fetchUser: verilen user id ye sahip user in user ve userporfile tablolarindaki bilgileri donuluyor
  fetchUser: async (userId: number) => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return null;

    const [followerCount, followingCount] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } }),
    ]);

    return {
      ...user,
      followerCount,
      followingCount
    };
  },

  //searchUsers: username'e göre kullanıcı arama
  searchUsers: async (query: string, currentUserId: number) => {
    const users = await prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
        NOT: { id: currentUserId },
      },
      select: {
        id: true,
        username: true,
        profile: { select: { avatar_url: true } },
      },
      take: 20,
    });

    const followedIds = await prisma.userFollow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: users.map(u => u.id) },
      },
      select: { followingId: true },
    });
    const followedSet = new Set(followedIds.map(f => f.followingId));

    return users.map(u => ({
      id: String(u.id),
      username: u.username,
      avatarUrl: u.profile?.avatar_url ?? null,
      isFollowing: followedSet.has(u.id),
    }));
  },

  // Public profile: başka bir kullanıcının public bilgilerini getir
  fetchPublicProfile: async (targetUserId: number, currentUserId: number) => {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        streak: true,
      },
    });

    if (!user) return null;

    // Follower/following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: targetUserId } }),
      prisma.userFollow.count({ where: { followerId: targetUserId } }),
    ]);

    // Is current user following this user?
    const isFollowing = currentUserId !== targetUserId
      ? !!(await prisma.userFollow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
        }))
      : false;

    // Recipe post count
    const postCount = await prisma.post.count({
      where: { userId: targetUserId, isRecipe: true },
    });

    // Badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: targetUserId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return {
      id: String(user.id),
      username: user.username,
      avatarUrl: user.profile?.avatar_url ?? null,
      streak: {
        currentStreak: user.streak?.currentStreak ?? 0,
        longestStreak: user.streak?.longestStreak ?? 0,
        totalPoints: user.streak?.totalPoints ?? 0,
      },
      followerCount,
      followingCount,
      isFollowing,
      postCount,
      badges: userBadges.map(ub => ({
        id: String(ub.badge.id),
        name: ub.badge.name,
        description: ub.badge.description,
        iconName: ub.badge.iconName,
        earnedAt: ub.earnedAt.toISOString(),
      })),
    };
  },

  updateUser: async (userId: number, data: any) => {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

};

// ──────────────────────────────────────────────────────────────────────────────
// calculateDailyTargets: pure helper – no DB call needed.
// Inputs: fields from UserProfile. Returns per-meal calorie targets + water.
// ──────────────────────────────────────────────────────────────────────────────
export interface DailyTargets {
  tdee: number;          // total daily energy expenditure (adjusted for goal)
  breakfast: number;     // 25% of tdee
  lunch: number;         // 35% of tdee
  dinner: number;        // 30% of tdee
  snack: number;         // 10% of tdee
  water_ml: number;      // weight(kg) × 33 ml, min 1500
}

export function calculateDailyTargets(
  age: number,
  gender: string,
  weight: number,   // kg
  height: number,   // cm
  activity_level: string,
  reason_to_diet: string
): DailyTargets {
  // Step 1: BMR (Mifflin-St Jeor)
  let bmr: number;
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Step 2: Activity multiplier → TDEE
  const activityMap: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extra Active': 1.9,
  };
  const multiplier = activityMap[activity_level] ?? 1.375; // default Lightly Active
  let tdee = Math.round(bmr * multiplier);

  // Step 3: Adjust for goal
  const dietLower = reason_to_diet.toLowerCase();
  
  if (dietLower.includes('loss') || dietLower.includes('lose')) {
    // Medical lower limits: 1500 for men, 1200 for women
    const minCalories = gender.toLowerCase() === 'male' ? 1500 : 1200;
    tdee = Math.max(minCalories, tdee - 500); 
  } else if (dietLower.includes('gain') || dietLower.includes('muscle')) {
    tdee = tdee + 300;
  }
  // 'maintain' → no change

  // Step 4: Per-meal split
  const breakfast = Math.round(tdee * 0.25);
  const lunch = Math.round(tdee * 0.35);
  const dinner = Math.round(tdee * 0.30);
  const snack = Math.round(tdee * 0.10);

  // Step 5: Water target
  const water_ml = Math.max(1500, Math.round(weight * 33));

  return { tdee, breakfast, lunch, dinner, snack, water_ml };
}
