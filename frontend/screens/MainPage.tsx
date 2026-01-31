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

    const slideAnim = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);
    const [mealsData, setMealsData] = useState<MealsData>({});//boş obje

    const [calorie, setCalorie] = useState<number>(0);
    const [carb, setCarb] = useState<number>(0);
    const [protein, setProtein] = useState<number>(0);
    const [fat, setFat] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);


    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        setCalorie(0);
        setProtein(0);
        setCarb(0);
        setFat(0);
    };


    const formattedDate = selectedDate.toISOString().split("T")[0]; // "YYYY-MM-DD" formatı
    const fetchDailyData = async () => {
        const token = await SecureStore.getItemAsync('userToken');

        const params = new URLSearchParams({
            date: formattedDate,
            meal_category: "OVERALL"
        }).toString();
        const url = `${API_URL}/api/food/get_meal_total?${params}`
        console.log(url);
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

            })

            const data = await res.json();
            const params = data.data;
            console.log(data);
            if (res.ok && params != 0) {


                setCalorie(params.t_calorie);
                setCarb(params.t_carb);
                setFat(params.t_fat);
                setProtein(params.t_protein);
            }
            else {
                setCalorie(0);
                setCarb(0);
                setFat(0);
                setProtein(0);
            }
        }
        catch (error) {
            console.log("Veri çekme hatası:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDailyData();
        }, [selectedDate]) //date değiştikçe çalışsın
    );
    const dailyGoal = 2000; // Hedef kaloriniz



    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
                <Ionicons name="menu" size={20} color="#5c544d" style={styles.menuButton} />
            </TouchableOpacity>

            <Animated.View
                style={[
                    styles.mainChart,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >

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
                        <View
                            style={styles.dateContent}
                        >
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
                    <Image
                        source={require("../assets/breakfast.png")}
                        style={styles.iconContainer}
                        resizeMode="contain"
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
                        resizeMode="contain"
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
                        resizeMode="contain"
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
                        resizeMode="contain"
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
                <View style={styles.addMealCard}>
                    <Image
                        source={require("../assets/water.png")}
                        style={styles.iconContainer}
                        resizeMode="contain"
                    />
                    <View style={styles.labelContainer}>
                        <Text style={styles.mealTitle}>Add Water</Text>
                        <Text style={styles.subtitle}>Recommended: 2L </Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}
                        onPress={() => navigation.navigate("AddWater", {
                            selectedDate: formattedDate,
                            type: "Water",
                        })}>
                        <Text style={styles.plus}>+</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.recipeButton} onPress={() => navigation.navigate("ScanFood")}>
                    <Image
                        source={require("../assets/spoon.png")}
                        style={{ width: 70, height: 70 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("Chatbot")}>
                    <Image
                        source={require("../assets/plate.png")}
                        style={{ width: 100, height: 100 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.recipeButton}   >
                    <Image
                        source={require("../assets/fork.png")}
                        style={{ width: 70, height: 70 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}


export default MainPage;