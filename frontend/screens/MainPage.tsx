import React, { useState, useCallback, useRef } from 'react';
import {
    View, Image, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/MainPage';
import CalorieCircle from '../components/calorieCircle';
import { Ionicons } from '@expo/vector-icons';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'MainPage'>;

function MainPage({ navigation }: Props) {
    const route = useRoute();
    const { t } = useLanguage();
    interface MealEntry {
        mealName: string;
        calories: number;
    }
    type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
    type DailyMeals = {
        [K in MealType]?: MealEntry;
    };

    const slideAnim = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const [calorie, setCalorie] = useState<number>(0);
    const [carb, setCarb] = useState<number>(0);
    const [protein, setProtein] = useState<number>(0);
    const [fat, setFat] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [dailyGoal, setDailyGoal] = useState<number>(2000);
    const [breakfastGoal, setBreakfastGoal] = useState<number>(500);
    const [lunchGoal, setLunchGoal] = useState<number>(700);
    const [dinnerGoal, setDinnerGoal] = useState<number>(600);
    const [snackGoal, setSnackGoal] = useState<number>(200);
    const [waterGoal, setWaterGoal] = useState<number>(2000);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        setCalorie(0);
        setProtein(0);
        setCarb(0);
        setFat(0);
    };

    const formattedDate = selectedDate.toISOString().split("T")[0];
    const fetchDailyData = useCallback(async () => {
        const token = await SecureStore.getItemAsync('userToken');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const queryParams = new URLSearchParams({ date: formattedDate, meal_category: "OVERALL" }).toString();
        const url = `${API_URL}/api/food/get_meal_total?${queryParams}`;
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            const result = data.data;
            if (res.ok && result != 0) {
                setCalorie(result.t_calorie);
                setCarb(result.t_carb);
                setFat(result.t_fat);
                setProtein(result.t_protein);
            } else {
                setCalorie(0); setCarb(0); setFat(0); setProtein(0);
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
        }
    }, [formattedDate]);

    const fetchDailyTargets = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/user/daily_targets`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const tg = data.data;
                setDailyGoal(tg.tdee);
                setBreakfastGoal(tg.breakfast);
                setLunchGoal(tg.lunch);
                setDinnerGoal(tg.dinner);
                setSnackGoal(tg.snack);
                setWaterGoal(tg.water_ml);
            }
        } catch (error) {
            console.log('Failed to fetch daily targets:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDailyData();
            fetchDailyTargets();
        }, [fetchDailyData, fetchDailyTargets])
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('main_title')}</Text>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
                    <Ionicons name="menu" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.placeholder} />
            </View>

            <Animated.View style={[styles.mainChart, { transform: [{ translateY: slideAnim }] }]}>
                <CalorieCircle
                    key={selectedDate.toISOString()}
                    calories={calorie}
                    goal={dailyGoal}
                    protein={protein}
                    carb={carb}
                    fat={fat}
                />
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.dateSelector}>
                    <View style={styles.datePill}>
                        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.dateContent}>
                            <Ionicons name="calendar-outline" size={18} color="#f7e5c5" style={{ marginRight: 6 }} />
                            <Text style={styles.dateText}>
                                {selectedDate.toLocaleDateString('en-EN', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.addMealCard}>
                    <Image source={require("../assets/breakfast.png")} style={styles.iconContainer} resizeMode="contain" />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>{t('main_add_breakfast')}</Text>
                        <Text style={styles.subtitle}>{t('recommended')}: {breakfastGoal} kcal | {Math.round((breakfastGoal * 0.30) / 4)}g P • {Math.round((breakfastGoal * 0.50) / 4)}g C • {Math.round((breakfastGoal * 0.20) / 9)}g F</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddMeal", { selectedDate: formattedDate, type: "Breakfast" })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.addMealCard}>
                    <Image source={require("../assets/lunch.png")} style={styles.iconContainer} resizeMode="contain" />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>{t('main_add_lunch')}</Text>
                        <Text style={styles.subtitle}>{t('recommended')}: {lunchGoal} kcal | {Math.round((lunchGoal * 0.30) / 4)}g P • {Math.round((lunchGoal * 0.50) / 4)}g C • {Math.round((lunchGoal * 0.20) / 9)}g F</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddMeal", { selectedDate: formattedDate, type: "Lunch" })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.addMealCard}>
                    <Image source={require("../assets/dinner.png")} style={styles.iconContainer} resizeMode="contain" />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>{t('main_add_dinner')}</Text>
                        <Text style={styles.subtitle}>{t('recommended')}: {dinnerGoal} kcal | {Math.round((dinnerGoal * 0.30) / 4)}g P • {Math.round((dinnerGoal * 0.50) / 4)}g C • {Math.round((dinnerGoal * 0.20) / 9)}g F</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddMeal", { selectedDate: formattedDate, type: "Dinner" })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.addMealCard}>
                    <Image source={require("../assets/snack.png")} style={styles.iconContainer} resizeMode="contain" />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>{t('main_add_snack')}</Text>
                        <Text style={styles.subtitle}>{t('recommended')}: {snackGoal} kcal | {Math.round((snackGoal * 0.30) / 4)}g P • {Math.round((snackGoal * 0.50) / 4)}g C • {Math.round((snackGoal * 0.20) / 9)}g F</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddMeal", { selectedDate: formattedDate, type: "Snack" })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.addMealCard}>
                    <Image source={require("../assets/water.png")} style={styles.iconContainer} resizeMode="contain" />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>{t('main_add_water')}</Text>
                        <Text style={styles.subtitle}>{t('main_recommended')}: {(waterGoal / 1000).toFixed(1)}L</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddWater", { selectedDate: formattedDate, type: "Water" })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.recipeButton} onPress={() => navigation.navigate("ScanFood")}>
                    <Ionicons name="scan" size={18} color="#f7e5c5" style={{ alignSelf: "center" }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("Chatbot")}>
                    <Ionicons name="chatbubble-outline" size={18} color="#f7e5c5" style={{ alignSelf: "center" }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.recipeButton} onPress={() => navigation.navigate("SocialFeed")}>
                    <Ionicons name="restaurant-outline" size={18} color="#f7e5c5" style={{ alignSelf: "center" }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default MainPage;