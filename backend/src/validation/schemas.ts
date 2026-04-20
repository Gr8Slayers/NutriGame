import { z } from 'zod';

const optionalTrimmedStringSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().optional(),
);

const optionalPositiveNumberSchema = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().positive().optional(),
);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid format. Use YYYY-MM-DD.');

export const nonEmptyStringSchema = z.string().trim().min(1);

export const authRegisterSchema = z.object({
  username: nonEmptyStringSchema,
  email: z.string().trim().email(),
  password: z.string().min(1),
  age: z.coerce.number().positive(),
  gender: nonEmptyStringSchema,
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  target_weight: optionalPositiveNumberSchema,
  reason_to_diet: optionalTrimmedStringSchema,
  avatar_url: optionalUrlSchema,
});

export const authLoginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  username: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
  password: z.string().min(1),
}).refine((data) => Boolean(data.email || data.username), {
  message: 'Email/username ve şifre gerekli.',
  path: ['email'],
});

export const chatbotSendSchema = z.object({
  message: z.string().trim().min(1, 'message is required.'),
  chatId: z.string().trim().min(1).optional(),
});

export const chatIdParamSchema = z.object({
  chatId: z.string().trim().min(1),
});

export const foodSearchQuerySchema = z.object({
  food_name: z.string().trim().min(1, 'Food name is not provided.'),
});

export const mealLogQuerySchema = z.object({
  date: isoDateSchema,
  meal_category: nonEmptyStringSchema,
});

export const addToMealSchema = z.object({
  date: isoDateSchema,
  meal_category: nonEmptyStringSchema,
  food_id: z.coerce.number().int().positive().optional(),
  p_count: z.coerce.number().positive(),
  food_name: optionalTrimmedStringSchema,
  p_calorie: z.coerce.number().nonnegative().optional(),
  p_protein: z.coerce.number().nonnegative().optional(),
  p_fat: z.coerce.number().nonnegative().optional(),
  p_carb: z.coerce.number().nonnegative().optional(),
  p_unit: optionalTrimmedStringSchema,
  p_amount: optionalPositiveNumberSchema,
  entry_method: z.enum(['manual', 'scan']).optional(),
  scan_image_url: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().url().nullable().optional(),
  ),
});

export const deleteMealSchema = z.object({
  meal_log_id: z.coerce.number().int().positive(),
});

export const waterEntrySchema = z.object({
  name: nonEmptyStringSchema,
  amount: z.coerce.number().positive(),
});

export const addToWaterSchema = z.object({
  date: isoDateSchema,
  entries: z.array(waterEntrySchema).min(1),
});

export const waterTotalQuerySchema = z.object({
  date: isoDateSchema,
});

export const dailyProgressUpsertSchema = z.object({
  date: isoDateSchema,
  currentWeight: optionalPositiveNumberSchema,
  mood: optionalTrimmedStringSchema,
  totalCaloriesConsumed: z.coerce.number().nonnegative().optional(),
  calorieGoal: z.coerce.number().nonnegative().optional(),
  goalAchieved: z.coerce.boolean().optional(),
  movement: z.coerce.number().int().nonnegative().optional(),
});
