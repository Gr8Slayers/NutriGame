import React, { useState } from 'react';
import {
    View, Image, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useEffect } from 'react';
import { Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/MainPage';
import CalorieCircle from '../components/calorieCircle';
import { IP_ADDRESS } from "@env";


const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'MainPage'>;
function MainPage({ navigation }: Props) {
    const route = useRoute();
    interface MealEntry {
        mealName: string;
        calories: number;
    }
    type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
    type DailyMeals = {
        [K in MealType]?: MealEntry;
    };
    interface MealsData {
        [date: string]: DailyMeals;
    }
    const [mealsData, setMealsData] = useState<MealsData>({});//boş obje

    const [calorie, setCalorie] = useState('');
    const [carb, setCarb] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    //changing date
    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formattedDate = selectedDate.toISOString().split("T")[0]; // "YYYY-MM-DD" formatı
    const todayMeals = mealsData[formattedDate] || {}; // Seçili tarihe ait tüm öğünler

    const totalCalories = Object.values(todayMeals).reduce((sum, meal: any) => sum + meal.calories, 0);
    const dailyGoal = 2000; // Hedef kaloriniz


    return (
        <View style={styles.container}>

            <View style={styles.mainChart}>
                <CalorieCircle calories={totalCalories} goal={dailyGoal} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => changeDate(-1)}>
                        <Text style={{ fontSize: 24, padding: 10, color: "#ffff" }}>{"<"}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateText}>
                        {selectedDate.toLocaleDateString('en-EN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeDate(1)}>
                        <Text style={{ fontSize: 24, padding: 10, color: "#ffff" }}>{">"}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.addMealCard}>
                    <Image
                        source={require("../assets/breakfast.png")}
                        style={styles.iconContainer}
                    />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>Add Breakfast</Text>
                        <Text style={styles.subtitle}>Recommended: 830-1170 kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}
                        onPress={() => navigation.navigate("AddMeal", {
                            selectedDate: formattedDate,
                            type: "Breakfast",
                        })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.addMealCard}>
                    <Image
                        source={require("../assets/lunch.png")}
                        style={styles.iconContainer}
                    />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>Add Lunch</Text>
                        <Text style={styles.subtitle}>Recommended: 830-1170 kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}
                        onPress={() => navigation.navigate("AddMeal", {
                            selectedDate: formattedDate,
                            type: "Lunch",
                        })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.addMealCard}>
                    <Image
                        source={require("../assets/dinner.png")}
                        style={styles.iconContainer}
                    />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>Add Dinner</Text>
                        <Text style={styles.subtitle}>Recommended: 830-1170 kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}
                        onPress={() => navigation.navigate("AddMeal", {
                            selectedDate: formattedDate,
                            type: "Dinner",
                        })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.addMealCard}>
                    <Image
                        source={require("../assets/snack.png")}
                        style={styles.iconContainer}
                    />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>Add Snack</Text>
                        <Text style={styles.subtitle}>Recommended: 830-1170 kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}
                        onPress={() => navigation.navigate("AddMeal", {
                            selectedDate: formattedDate,
                            type: "Snack",
                        })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.recipeButton}>
                    <Image
                        source={require("../assets/spoon.png")}
                        style={{ width: 70, height: 70 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatButton}>
                    <Image
                        source={require("../assets/plate.png")}
                        style={{ width: 100, height: 100 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.recipeButton}>
                    <Image
                        source={require("../assets/fork.png")}
                        style={{ width: 70, height: 70 }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}


export default MainPage;