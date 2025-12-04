import prisma from '../config/prisma';

export const userModel = {

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

  updateUserProfileById: async (userId: number, updates: { age?: number, gender?: string, weight?: number, height?: number, target_weight?: number, reason_to_diet?: string, avatar_url?: string }) => {
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: userId },          // userId üzerinden profili bul
      data: updates,              // hangi alan geldiyse onu güncelle
    });
    return updatedProfile;
  },

  deleteUser: async (userId: number) => {
    return await prisma.user.delete({
      where: { id: userId }
    });
  },

  fetchUser: async (userId: number) => {
    return await prisma.user.findFirst({
      where: { id: userId },
      include: { profile: true },
    });
  },

};
