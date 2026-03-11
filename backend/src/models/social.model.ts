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
            }
        });
    },

    // Feed: tüm postları kullanıcı bilgileriyle döndür (en yeni önce)
    getFeed: async (currentUserId: number) => {
        const posts = await prisma.post.findMany({
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
            where: { userId },
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
        await prisma.post.delete({ where: { id: postId } });
        return { success: true };
    },
};
