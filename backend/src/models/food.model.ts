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

    addFoodToMealLog: async (user_id: number, meal_category: string, p_count: number, food_id: number, food_name: string, p_unit: string, t_amount: number, t_calorie: number, t_protein: number, t_fat: number, t_carb: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // saat degil sadece gun tutabilmek icin

        return await prisma.$transaction(async (tx) => {
            //yemek once mealLoga ekleniyor
            const log = await tx.mealLog.create({
                data: { userId: user_id, date: today, meal_category, p_count, food_id, food_name, p_unit, t_amount, t_calorie, t_protein, t_fat, t_carb }
            });

            // ilgili ogune eklsense de bir de overall adi altinda tum gunun degerlerine de ekleme yapiliyor yoksa yeni olusturuluyor
            await tx.mealTotals.upsert({
                where: { userId_date_meal_category: { userId: user_id, date: today, meal_category: "OVERALL" } }, // user id, date, meal category primary key oluyor 3 degerin ayni oldugu iki row bulunamaz
                update: { t_calorie: { increment: t_calorie }, t_protein: { increment: t_protein }, t_fat: { increment: t_fat }, t_carb: { increment: t_carb } },
                create: { userId: user_id, date: today, meal_category: "OVERALL", t_calorie, t_protein, t_fat, t_carb }
            });

            // eklenilen yemegin kalori vs bilgileri mealtotals tablosunda ilgili ogunun uzerine ekleniyor hic row acilmamissa yeni olusuturup degerleri ekliyor
            await tx.mealTotals.upsert({
                where: { userId_date_meal_category: { userId: user_id, date: today, meal_category } },
                update: { t_calorie: { increment: t_calorie }, t_protein: { increment: t_protein }, t_fat: { increment: t_fat }, t_carb: { increment: t_carb } },
                create: { userId: user_id, date: today, meal_category, t_calorie, t_protein, t_fat, t_carb }
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

    addtoWaterLog: async (user_id: number, date: Date, ml: number) => {
        return await prisma.waterLog.upsert({
            where: { userId_date: { userId: user_id, date: date } },
            update: { t_amount: { increment: ml } },
            create: { userId: user_id, date: date, t_amount: ml }
        });
    },

    deletefromWaterLog: async (user_id: number, water_log_id: number, ml: number) => {
        return await prisma.$transaction(async (tx) => {
            // bu meal_log_id ye sahip bir log var mi kontrol ediliyor
            const fetched_water_log = await tx.waterLog.findUnique({
                where: {
                    water_log_id: water_log_id
                }
            });

            if (!fetched_water_log || fetched_water_log.t_amount < ml) {
                return { success: false, message: "The meal log is not found by the provided meal_log_id or the amount to be deleted is exceeds the total amount." };
            }

            // parametre olarak verilen miktar total miktardan eksiltiliyor
            await tx.waterLog.update({
                where: {
                    water_log_id: water_log_id
                },
                data: {
                    t_amount: { decrement: ml }
                }
            })
            return { success: true };
        });
    },

    getWaterTotal: async (user_id: number, date: Date) => {
        return await prisma.waterLog.findFirst({
            where: {
                userId: user_id,
                date: date
            }
        });
    }

}