import prisma from '../config/prisma';
import { MealPhoto } from '@prisma/client';

export const foodRecognitionModel = {
    mealPhoto: prisma.mealPhoto,

    async addMealPhoto(data: { userId: number; mealCategory: string; imageUrl: string }): Promise<MealPhoto> {
        return await prisma.mealPhoto.create({
            data: {
                userId: data.userId,
                mealCategory: data.mealCategory,
                imageUrl: data.imageUrl,
            },
        });
    },

    async getMealPhotosByUserId(userId: number): Promise<MealPhoto[]> {
        return await prisma.mealPhoto.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                uploadedAt: 'desc', // En son yüklenen fotoğraflar en başta (üstte) gelsin
            },
        });
    },

    async getMealPhotoById(photoId: number): Promise<MealPhoto | null> {
        return await prisma.mealPhoto.findUnique({
            where: {
                photoId: photoId,
            },
        });
    }
};