import prisma from '../config/prisma';

export const socialModel = {

    // Post oluştur
    createPost: async (
        userId: number,
        caption: string,
        imageUrl: string | undefined,
        isRecipe: boolean,
        recipeTitle?: string,
        recipeIngredients?: string,
        recipeInstructions?: string,
        recipeCalories?: number,
        recipePrepTime?: number,
        challengeId?: number,
    ) => {
        return await prisma.post.create({
            data: {
                userId,
                caption,
                imageUrl,
                isRecipe,
                recipeTitle,
                recipeIngredients,
                recipeInstructions,
                recipeCalories,
                recipePrepTime,
                challengeId,
            }
        });
    },

    // Feed: tüm postları kullanıcı bilgileriyle döndür (en yeni önce)
    getFeed: async (currentUserId: number) => {
        // Find users that current user follows
        const following = await prisma.userFollow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);
        
        // Include current user's own ID in the list of allowed authors
        const allowedUserIds = [currentUserId, ...followingIds];

        const posts = await prisma.post.findMany({
            where: {
                userId: { in: allowedUserIds },
                challengeId: null,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                likes: true,
                comments: true,
            }
        });

        // Her post için kullanıcı bilgilerini al
        const enriched = await Promise.all(posts.map(async (post) => {
            const user = await prisma.user.findUnique({ where: { id: post.userId } });
            const profile = await prisma.userProfile.findUnique({ where: { userId: post.userId } });

            const isLikedByCurrentUser = post.likes.some(l => l.userId === currentUserId);

            return {
                id: String(post.id),
                userId: String(post.userId),
                username: user?.username ?? 'Unknown',
                userAvatar: profile?.avatar_url ?? null,
                imageUrl: post.imageUrl ?? null,
                caption: post.caption,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,
                createdAt: post.createdAt.toISOString(),
                isLikedByCurrentUser,
                isRecipe: post.isRecipe,
                recipeDetails: post.isRecipe ? {
                    title: post.recipeTitle ?? '',
                    ingredients: post.recipeIngredients ?? '',
                    instructions: post.recipeInstructions ?? '',
                    calories: post.recipeCalories ?? 0,
                    preparationTime: post.recipePrepTime ?? undefined,
                } : null,
            };
        }));

        return enriched;
    },

    // Postu bul
    findPost: async (postId: number) => {
        return await prisma.post.findUnique({ where: { id: postId } });
    },

    // Like ekle
    addLike: async (postId: number, userId: number) => {
        return await prisma.postLike.upsert({
            where: { postId_userId: { postId, userId } },
            update: {},
            create: { postId, userId }
        });
    },

    // Like kaldır
    removeLike: async (postId: number, userId: number) => {
        return await prisma.postLike.deleteMany({
            where: { postId, userId }
        });
    },

    // Yorum ekle
    addComment: async (postId: number, userId: number, text: string) => {
        return await prisma.postComment.create({
            data: { postId, userId, text }
        });
    },

    // Posttaki yorumları getir (kullanıcı bilgileriyle)
    getComments: async (postId: number) => {
        const comments = await prisma.postComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
        });

        return await Promise.all(comments.map(async (c) => {
            const user = await prisma.user.findUnique({ where: { id: c.userId } });
            const profile = await prisma.userProfile.findUnique({ where: { userId: c.userId } });
            return {
                id: String(c.id),
                postId: String(c.postId),
                userId: String(c.userId),
                username: user?.username ?? 'Unknown',
                userAvatar: profile?.avatar_url ?? null,
                text: c.text,
                createdAt: c.createdAt.toISOString(),
            };
        }));
    },

    // Kullanıcıyı takip et
    followUser: async (followerId: number, followingId: number) => {
        return await prisma.userFollow.upsert({
            where: { followerId_followingId: { followerId, followingId } },
            update: {},
            create: { followerId, followingId }
        });
    },

    // Takipten çık
    unfollowUser: async (followerId: number, followingId: number) => {
        return await prisma.userFollow.deleteMany({
            where: { followerId, followingId }
        });
    },

    // Kullanıcının postlarını getir
    getUserPosts: async (userId: number, currentUserId: number) => {
        const posts = await prisma.post.findMany({
            where: { userId, challengeId: null },
            orderBy: { createdAt: 'desc' },
            include: { likes: true, comments: true }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const profile = await prisma.userProfile.findUnique({ where: { userId } });

        return posts.map(post => ({
            id: String(post.id),
            userId: String(post.userId),
            username: user?.username ?? 'Unknown',
            userAvatar: profile?.avatar_url ?? null,
            imageUrl: post.imageUrl ?? null,
            caption: post.caption,
            likesCount: post.likes.length,
            commentsCount: post.comments.length,
            createdAt: post.createdAt.toISOString(),
            isLikedByCurrentUser: post.likes.some(l => l.userId === currentUserId),
            isRecipe: post.isRecipe,
            recipeDetails: post.isRecipe ? {
                title: post.recipeTitle ?? '',
                ingredients: post.recipeIngredients ?? '',
                instructions: post.recipeInstructions ?? '',
                calories: post.recipeCalories ?? 0,
                preparationTime: post.recipePrepTime ?? undefined,
            } : null,
        }));
    },

    // Post sil (sadece kendi postu)
    deletePost: async (postId: number, userId: number) => {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.userId !== userId) {
            return { success: false, message: 'Post bulunamadı veya yetkiniz yok.' };
        }

        // Eğer resim veritabanımızda yüklüyse, onu da sil
        if (post.imageUrl && post.imageUrl.includes('/api/images/')) {
            try {
                const parts = post.imageUrl.split('/api/images/');
                const imageId = parts[parts.length - 1]; // UUID kısmını al
                await prisma.uploadedFile.delete({ where: { id: imageId } });
            } catch (err) {
                console.error('Resim silinirken hata (post silme):', err);
                // Resim silinemese bile postun silinmesine engel olmasın
            }
        }

        await prisma.post.delete({ where: { id: postId } });
        return { success: true };
    },

    // Takipçileri getir
    getFollowers: async (userId: number) => {
        const follows = await prisma.userFollow.findMany({
            where: { followingId: userId }
        });

        return await Promise.all(follows.map(async (f) => {
            const user = await prisma.user.findUnique({ where: { id: f.followerId } });
            const profile = await prisma.userProfile.findUnique({ where: { userId: f.followerId } });
            return {
                id: String(f.followerId),
                username: user?.username ?? 'Unknown',
                avatarUrl: profile?.avatar_url ?? null,
            };
        }));
    },

    // Challenge katılımcısı mı kontrol
    isChallengeParticipant: async (challengeId: number, userId: number): Promise<boolean> => {
        const participant = await prisma.challengeParticipant.findUnique({
            where: { challengeId_userId: { challengeId, userId } },
        });
        return !!participant && participant.status === 'accepted';
    },

    // Challenge'a ait post feed (sadece katılımcılara)
    getChallengePosts: async (challengeId: number, currentUserId: number) => {
        const posts = await prisma.post.findMany({
            where: { challengeId },
            orderBy: { createdAt: 'desc' },
            include: { likes: true, comments: true },
        });

        return await Promise.all(posts.map(async (post) => {
            const user = await prisma.user.findUnique({ where: { id: post.userId } });
            const profile = await prisma.userProfile.findUnique({ where: { userId: post.userId } });

            const isLikedByCurrentUser = post.likes.some(l => l.userId === currentUserId);

            return {
                id: String(post.id),
                userId: String(post.userId),
                username: user?.username ?? 'Unknown',
                userAvatar: profile?.avatar_url ?? null,
                imageUrl: post.imageUrl ?? null,
                caption: post.caption,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,
                createdAt: post.createdAt.toISOString(),
                isLikedByCurrentUser,
                isRecipe: post.isRecipe,
                recipeDetails: post.isRecipe ? {
                    title: post.recipeTitle ?? '',
                    ingredients: post.recipeIngredients ?? '',
                    instructions: post.recipeInstructions ?? '',
                    calories: post.recipeCalories ?? 0,
                    preparationTime: post.recipePrepTime ?? undefined,
                } : null,
                challengeId: post.challengeId != null ? String(post.challengeId) : null,
            };
        }));
    },

    // Takip edilenleri getir
    getFollowing: async (userId: number) => {
        const follows = await prisma.userFollow.findMany({
            where: { followerId: userId }
        });

        return await Promise.all(follows.map(async (f) => {
            const user = await prisma.user.findUnique({ where: { id: f.followingId } });
            const profile = await prisma.userProfile.findUnique({ where: { userId: f.followingId } });
            return {
                id: String(f.followingId),
                username: user?.username ?? 'Unknown',
                avatarUrl: profile?.avatar_url ?? null,
            };
        }));
    },
};
