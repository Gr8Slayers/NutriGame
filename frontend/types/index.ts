// User Profile Interface
export interface UserProfile {
    username: string;
    email: string;
    avatar_url?: string;
    target_weight?: number;
    level?: number;
    streak?: number;
}

// Updated Meal Parameters
export interface UpdatedMealParams {
    updatedMeal: {
        date: string;
        type: string;
        mealName: string;
        calories: number;
    };
}
