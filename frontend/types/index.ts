// User Profile Interface
export interface UserProfile {
    username: string;
    email: string;
    avatar_url?: string;
    target_weight?: number;
    weight?: number;
    height?: number;
    reason_to_diet?: string;
    activity_level?: string;
    level?: number;
    streak?: number;
    followerCount?: number;
    followingCount?: number;
    badgeCount?: number;
}

// Updated Meal Parameters
export interface UpdatedMealParams {
    updatedMeal: {
        date: string;
        type: string;
        mealName: string;
        calories: number;
    }
}

export interface WeeklySummary {
    date: string;
    t_calorie: number;
    t_protein: number;
    t_fat: number;
    t_carb: number;
}
export interface WaterPortion {
    id: string;
    name: string;
    amount: number;
    iconName: string;
    iconColor: string;
}

export interface AddedEntry {
    key: string;
    name: string;
    amount: number;
}

export interface SavedLog {
    water_log_id: number;
    amount: number;
    portion_name: string;
}

export interface PublicUser {
    id: string;
    username: string;
    avatarUrl?: string;
    isFollowing: boolean;
}

export interface Post {
    id: string;
    userId: string;
    username: string;
    userAvatar?: string;
    imageUrl?: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isLikedByCurrentUser: boolean;
    isRecipe: boolean;
    recipeDetails?: {
        title: string;
        ingredients: string;
        instructions: string;
        calories: number;
        preparationTime?: number;
    };
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'calorie' | 'water' | 'sugar' | 'step' | 'move' | 'custom';
    goalValue: number;
    currentProgress: number;
    unit: string;
    durationDays: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'failed' | 'pending_invite';
    creatorId: string;
    isGroupChallenge: boolean;
    participants?: PublicUser[];
}

export interface Badge {
    id: string;
    name: string;
    imageUrl: string;
    description: string;
    earnedAt: string;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
}


export interface DailyProgress {
    id: number;
    userId: number;
    date: string;
    totalCaloriesConsumed: number;
    calorieGoal: number;
    goalAchieved: boolean;
    currentWeight?: number;
    mood?: string;
    movement?: number;
}
