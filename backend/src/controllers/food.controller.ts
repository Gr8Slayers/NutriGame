// src/controllers/food.controller.ts

import { Request, Response, NextFunction } from 'express';
import { foodModel } from '../models/food.model';
import { foodService } from '../services/food.service';
import prisma from '../config/prisma';

// ─── Sabitler ──────────────────────────────────────────────
const OFF_TIMEOUT_MS = 3000;   // Open Food Facts API timeout: 3 saniye
const OFF_MAX_RETRIES = 3;     // Retry denemesi: 3 kez
const CACHE_TTL_DAYS = 7;      // Önbellek ömrü: 7 gün

export class FoodController {

    search_food = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { food_name } = req.query as { food_name: string };

            if (!food_name) {
                return res.status(400).json({ success: false, message: 'Food name is not provided.' });
            }

            const searchResult = await foodService.searchAcrossAllSources(food_name);

            if (searchResult.data.length === 0) {
                return res.status(404).json({
                    success: false, message: 'No food items found matching that name.'
                });
            }

            return res.status(200).json({
                success: true,
                message: `${searchResult.data.length} items found from ${searchResult.source}.`,
                data: searchResult.data
            });

        } catch (err) {
            next(err);
        }
    }


    async add_to_meal(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const { date, meal_category, food_id, p_count, food_name, p_calorie, p_protein, p_fat, p_carb, p_unit, p_amount } = req.body;

            if (!date || !meal_category || !p_count) {
                return res.status(400).json({ success: false, message: 'Please provide required information { date, meal_category, p_count }.' });
            }

            // 1. Check format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!date || !dateRegex.test(date)) {
                return res.status(400).json({ success: false, message: 'Invalid format. Use YYYY-MM-DD.' });
            }
            // 2. Check if it's a valid calendar date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }

            // 3. Block future dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(parsedDate);
            targetDate.setHours(0, 0, 0, 0);

            if (targetDate > today) {
                return res.status(400).json({ success: false, message: 'Future dates are not allowed for logging.' });
            }

            let fetchedFood: any;

            if (food_id) {
                // Local food: look up by ID
                fetchedFood = await foodModel.getFoodByFoodId(food_id);
            } else {
                // No food_id → OFF/external product: cache to FoodLookup first
                if (!food_name || p_calorie === undefined) {
                    return res.status(400).json({ success: false, message: 'External foods require food_name, p_calorie, p_protein, p_fat, p_carb.' });
                }
                fetchedFood = await foodModel.saveOffFoodToLookup(
                    food_name,
                    p_unit || 'g',
                    p_amount || 100,
                    p_calorie || 0,
                    p_protein || 0,
                    p_fat || 0,
                    p_carb || 0
                );
            }

            if (!fetchedFood) {
                return res.status(404).json({ success: false, message: 'Food is not found in the database.' });
            }

            // porsiyon adeti ile birim miktarlari carpiyorum
            const t_amount = fetchedFood.p_amount * p_count;
            const t_calorie = fetchedFood.p_calorie * p_count;
            const t_protein = fetchedFood.p_protein * p_count;
            const t_fat = fetchedFood.p_fat * p_count;
            const t_carb_val = fetchedFood.p_carb * p_count;

            const added_food = await foodModel.addFoodToMealLog(user_id, parsedDate, meal_category, p_count, fetchedFood.food_id, fetchedFood.food_name, fetchedFood.p_unit, t_amount, t_calorie, t_protein, t_fat, t_carb_val);
            if (!added_food) {
                res.status(400).json({ success: false, message: 'Food could not be added to the meal log.' });
            }
            return res.status(200).json({ success: true, message: 'Food is successfully added to the meal log and daily totals are updated.' });

        } catch (err) {
            next(err);
        }
    }

    async delete_from_meal(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user
            const { meal_log_id } = req.body;

            if (!meal_log_id) {
                return res.status(400).json({ success: false, message: 'Please provide required information { meal_log_id }.' });
            }

            const deleted_food = await foodModel.deleteFoodFromMealLog(user_id, meal_log_id);

            if (deleted_food.success !== true) {
                res.status(400).json({ success: false, message: 'Food could not be deleted from the meal log.' });
            }

            return res.status(200).json({ success: true, message: 'Food is successfully deleted from the meal log.' });

        } catch (err) {
            next(err);
        }
    }

    async get_meal_log(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user
            const { date, meal_category } = req.query as { date: string, meal_category: string };

            if (!date || !meal_category) {
                return res.status(400).json({ success: false, message: 'Please provide required information { date, meal_category }.' });
            }

            // 1. Check format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!date || !dateRegex.test(date)) {
                return res.status(400).json({ success: false, message: 'Invalid format. Use YYYY-MM-DD.' });
            }
            // 2. Check if it's a valid calendar date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }
            // end of date format check

            const fetchedLogs = await foodModel.getMealLogByDate(user_id, parsedDate, meal_category);

            if (!fetchedLogs || fetchedLogs.length === 0) {
                return res.status(404).json({
                    success: false, message: 'No log found matching that date and meal category.'
                });
            }

            return res.status(200).json({
                success: true,
                message: `${fetchedLogs.length} logs found in the database.`,
                data: fetchedLogs // eslesen tum girdiler liste halinde gonderiliyor
            });

        } catch (err) {
            next(err)
        }
    }

    //TODO: istenilen gune ait total yoksa nasil handle edecegini daha detayli dusun, bulunamadi demek yerine 0 vermek daha uygun
    async get_meal_total(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user
            const { date, meal_category } = req.query as { date: string, meal_category: string };

            if (!date || !meal_category) {
                return res.status(400).json({ success: false, message: 'Please provide required information { date, meal_category }.' });
            }

            // 1. Check format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!date || !dateRegex.test(date)) {
                return res.status(400).json({ success: false, message: 'Invalid format. Use YYYY-MM-DD.' });
            }
            // 2. Check if it's a valid calendar date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }
            // end of date format check

            const fetchedTotal = await foodModel.getMealTotalByDate(user_id, parsedDate, meal_category);

            if (!fetchedTotal) {
                //return res.status(404).json({ success: false, message: 'No total found matching that date and meal category.' });
                // burada herhangi bir kayit bulmadigi durumda 0 mis gibi kabul ediyor, boylelikle ui da totale 0 gosteriyor yani bu bir hata degil aslinda
                return res.status(200).json({
                    success: true,
                    message: "No total found matching that date and meal category.",
                    data: 0
                });
            }

            return res.status(200).json({
                success: true,
                message: "The total is succesfully found.",
                data: fetchedTotal
            });

        } catch (err) {
            next(err)
        }
    }

    async add_to_water(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user
            const { date, entries } = req.body;


            if (!date || !entries || !Array.isArray(entries) || entries.length === 0) {
                return res.status(400).json({ success: false, message: 'Please provide required information { date, entries[name, amount] }.' });
            }

            // 1. Check format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!date || !dateRegex.test(date)) {
                return res.status(400).json({ success: false, message: 'Invalid format. Use YYYY-MM-DD.' });
            }
            // 2. Check if it's a valid calendar date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }

            // 3. Block future dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(parsedDate);
            targetDate.setHours(0, 0, 0, 0);

            if (targetDate > today) {
                return res.status(400).json({ success: false, message: 'Future dates are not allowed for logging.' });
            }

            const addedWater = await foodModel.addtoWaterLog(user_id, parsedDate, entries);

            if (!addedWater) {
                res.status(400).json({ success: false, message: 'Water could not be added to the water log.' });
            }

            return res.status(200).json({ success: true, message: 'Water is successfully added to the water log.' });

        } catch (err) {
            next(err)
        }
    }

    async delete_from_water(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user
            const { water_log_id } = req.body;

            if (!water_log_id) {
                return res.status(400).json({ success: false, message: 'Please provide required information { water_log_id }.' });
            }

            const deletedWater = await foodModel.deletefromWaterLog(user_id, water_log_id);

            if (deletedWater.success !== true) {
                return res.status(400).json({ success: false, message: deletedWater.message || 'Water could not be deleted from the water log.' });
            }

            return res.status(200).json({ success: true, message: 'Water is successfully deleted from the water log.' });

        } catch (err) {
            next(err)
        }
    }

    async get_water_total(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id; // Assuming jwt/auth middleware sets req.user

            const { date } = req.query as { date: string };

            if (!date) {
                return res.status(400).json({ success: false, message: 'Please provide required information { date }.' });
            }

            // 1. Check format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!date || !dateRegex.test(date)) {
                return res.status(400).json({ success: false, message: 'Invalid format. Use YYYY-MM-DD.' });
            }
            // 2. Check if it's a valid calendar date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }
            // end of date format check

            const fetched_water_total = await foodModel.getWaterTotal(user_id, parsedDate);

            if (!fetched_water_total || fetched_water_total.logs.length === 0) {
                //res.status(400).json({ success: false, message: 'Water summary could not be found.' });
                // burada herhangi bir kayit bulmadigi durumda 0 mis gibi kabul ediyor, boylelikle ui da totale 0 gosteriyor yani bu bir hata degil aslinda
                return res.status(200).json({
                    success: true,
                    message: "No total waterlog found matching that date.",
                    data: { t_amount: 0, logs: [] }
                });
            }

            return res.status(200).json({ success: true, message: 'Water summary succesfully found', data: fetched_water_total });

        } catch (err) {
            next(err)
        }
    }

    async get_weekly_summary(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const weeklyData = await foodModel.getWeeklyMealTotals(user_id);

            return res.status(200).json({
                success: true,
                message: "Weekly summary successfully found.",
                data: weeklyData
            });

        } catch (err) {
            next(err);
        }
    }
}

export const foodController = new FoodController();