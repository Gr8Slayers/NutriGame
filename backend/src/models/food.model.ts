import prisma from '../config/prisma';

export const foodModel = {

    searchFoodByName: async (food_name: string) => {
        return await prisma.foodLookup.findMany({
            where: {
                food_name: {
                    contains: food_name,
                    mode: 'insensitive', // bu sayede hem buyuk kucuk harf ayirt edilmiyor hem de icinde bu kelime gecen tum eslesmeler geliyor mesela tavuk dedigimde izgara tavuk da geliyor
                }
            }
        });
    },

    getFoodByFoodId: async (food_id: number) => {
        return await prisma.foodLookup.findFirst({
            where: {
                food_id: food_id
            }
        });
    },

    addFoodToMealLog: async (user_id: number, date: Date, meal_category: string, p_count: number, food_id: number, food_name: string, p_unit: string, t_amount: number, t_calorie: number, t_protein: number, t_fat: number, t_carb: number) => {

        return await prisma.$transaction(async (tx) => {
            //yemek once mealLoga ekleniyor
            const log = await tx.mealLog.create({
                data: { userId: user_id, date: date, meal_category, p_count, food_id, food_name, p_unit, t_amount, t_calorie, t_protein, t_fat, t_carb }
            });

            // ilgili ogune eklsense de bir de overall adi altinda tum gunun degerlerine de ekleme yapiliyor yoksa yeni olusturuluyor
            await tx.mealTotals.upsert({
                where: { userId_date_meal_category: { userId: user_id, date: date, meal_category: "OVERALL" } }, // user id, date, meal category primary key oluyor 3 degerin ayni oldugu iki row bulunamaz
                update: { t_calorie: { increment: t_calorie }, t_protein: { increment: t_protein }, t_fat: { increment: t_fat }, t_carb: { increment: t_carb } },
                create: { userId: user_id, date: date, meal_category: "OVERALL", t_calorie, t_protein, t_fat, t_carb }
            });

            // eklenilen yemegin kalori vs bilgileri mealtotals tablosunda ilgili ogunun uzerine ekleniyor hic row acilmamissa yeni olusuturup degerleri ekliyor
            await tx.mealTotals.upsert({
                where: { userId_date_meal_category: { userId: user_id, date: date, meal_category } },
                update: { t_calorie: { increment: t_calorie }, t_protein: { increment: t_protein }, t_fat: { increment: t_fat }, t_carb: { increment: t_carb } },
                create: { userId: user_id, date: date, meal_category, t_calorie, t_protein, t_fat, t_carb }
            });

            return log;
        });
    },

    // meal sildikten sonra totaller 0 olursa bu rowu temizlemek ileride yapilabilir suan karistirmak istemedim zor degil aslinda
    deleteFoodFromMealLog: async (user_id: number, meal_log_id: number) => {
        return await prisma.$transaction(async (tx) => {
            // bu meal_log_id ye sahip bir log var mi kontrol ediliyor
            const fetched_meal_log = await tx.mealLog.findUnique({
                where: {
                    meal_log_id: meal_log_id
                }
            });
            if (!fetched_meal_log) {
                return { success: false, message: "The meal log is not found by the provided meal_log_id." };
            }

            const { t_calorie, t_protein, t_fat, t_carb, date, meal_category } = fetched_meal_log;

            // buraya kadar geldiysek verilen id ye ait meal log bulmusuz demektir, bulunan logu siliyoruz
            await tx.mealLog.delete({
                where: { meal_log_id: meal_log_id }
            });

            // silinen logun bulundugu gunun totalleri logun degerleri kadar eksiltiliyor
            await tx.mealTotals.update({
                where: {
                    userId_date_meal_category: {
                        userId: user_id,
                        date: date,
                        meal_category: "OVERALL"
                    }
                },
                data: {
                    t_calorie: { decrement: t_calorie },
                    t_protein: { decrement: t_protein },
                    t_fat: { decrement: t_fat },
                    t_carb: { decrement: t_carb }
                }
            });

            await tx.mealTotals.update({
                where: {
                    userId_date_meal_category: {
                        userId: user_id,
                        date: date,
                        meal_category: meal_category
                    }
                },
                data: {
                    t_calorie: { decrement: t_calorie },
                    t_protein: { decrement: t_protein },
                    t_fat: { decrement: t_fat },
                    t_carb: { decrement: t_carb }
                }
            });

            return { success: true };
        });
    },

    getMealLogByDate: async (userId: number, date: Date, meal_category: string) => {
        return await prisma.mealLog.findMany({
            where: {
                date: date,
                meal_category: {
                    equals: meal_category,
                    mode: 'insensitive' //buyuk kucuk harf hassasiyetini kaldiriyoruz
                }
            }
        });
    },

    getMealTotalByDate: async (userId: number, date: Date, meal_category: string) => { // greetings from London... 30.12.25 @Camden Road, Costa Cafe
        return await prisma.mealTotals.findFirst({
            where: {
                userId: userId,
                date: date,
                meal_category: {
                    equals: meal_category, // overall tum gunun toplamini veriyor, ogunlari tek tek ogrenmek icin ayri ayri ogune ozel istek atilmali!
                    mode: 'insensitive' //buyuk kucuk harf hassasiyetini kaldiriyoruz
                }
            }
        });
    },

    addtoWaterLog: async (user_id: number, date: Date, entries: { name: string, amount: number }[]) => {
        const data = entries.map(e => ({
            userId: user_id,
            date: date,
            amount: e.amount,
            portion_name: e.name
        }));
        return await prisma.waterLog.createMany({
            data: data
        });
    },

    deletefromWaterLog: async (user_id: number, water_log_id: number) => {
        const fetched_water_log = await prisma.waterLog.findUnique({
            where: {
                water_log_id: water_log_id
            }
        });

        if (!fetched_water_log) {
            return { success: false, message: "The water log is not found by the provided water_log_id." };
        }

        await prisma.waterLog.delete({
            where: {
                water_log_id: water_log_id
            }
        });
        return { success: true };
    },

    async getWaterTotal(user_id: number, date: Date) {
        const logs = await prisma.waterLog.findMany({
            where: {
                userId: user_id,
                date: date
            }
        });
        const sum = logs.reduce((acc, curr) => acc + curr.amount, 0);
        return {
            t_amount: sum,
            logs: logs
        };
    },

    saveOffFoodToLookup: async (food_name: string, p_unit: string, p_amount: number, p_calorie: number, p_protein: number, p_fat: number, p_carb: number) => {
        // Check if this food already exists (by exact name match)
        const existing = await prisma.foodLookup.findFirst({
            where: { food_name: { equals: food_name, mode: 'insensitive' } }
        });
        if (existing) return existing;

        // Generate next food_id
        const maxRecord = await prisma.foodLookup.findFirst({
            orderBy: { food_id: 'desc' },
            select: { food_id: true }
        });
        const nextFoodId = (maxRecord?.food_id ?? 0) + 1;

        return await prisma.foodLookup.create({
            data: {
                food_id: nextFoodId,
                food_name,
                p_unit,
                p_amount,
                p_calorie,
                p_protein,
                p_fat,
                p_carb
            }
        });
    },

    getWeeklyMealTotals: async (userId: number) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the day 7 days ago

        return await prisma.mealTotals.findMany({
            where: {
                userId: userId,
                meal_category: 'OVERALL',
                date: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                date: 'asc'
            }
        });
    }

}