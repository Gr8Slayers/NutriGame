// Central mapping for dynamic badge images
// React Native requires static string literals for require() statements

export const BadgeImages: Record<string, any> = {
    // Water Badges
    'water_1': require('../assets/badges/water/water_1.png'),
    'water_2': require('../assets/badges/water/water_2.png'),
    'water_3': require('../assets/badges/water/water_3.png'),

    // Sugar Badges
    'sugar_1': require('../assets/badges/sugar/sugar_1.png'),
    'sugar_2': require('../assets/badges/sugar/sugar_2.png'),

    // Move / Step Badges
    'step_1': require('../assets/badges/move/move_1.png'),
    'step_2': require('../assets/badges/move/move_2.png'),
    'step_3': require('../assets/badges/move/move_3.png'),

    // We can also alias 'move_1' etc if the challenge type name is pure 'move' 
    'move_1': require('../assets/badges/move/move_1.png'),
    'move_2': require('../assets/badges/move/move_2.png'),
    'move_3': require('../assets/badges/move/move_3.png'),

    // Streak / General Badges
    'streak_1': require('../assets/badges/streak_score/streak_1.png'),
};
