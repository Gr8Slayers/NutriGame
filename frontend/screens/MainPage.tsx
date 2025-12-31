import React, { useState,useCallback,useRef } from 'react';
import {
    View, Image, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView,Animated
} from 'react-native';
import { useRoute,useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';
import { Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../App';
import styles from '../styles/MainPage';
import CalorieCircle from '../components/calorieCircle';
import { Ionicons } from '@expo/vector-icons';
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

      const slideAnim = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);
    const [mealsData, setMealsData] = useState<MealsData>({});//boş obje

    const [calorie, setCalorie] = useState('');
    const [carb, setCarb] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };


    const formattedDate = selectedDate.toISOString().split("T")[0]; // "YYYY-MM-DD" formatı
    const fetchDailyData = async () => {
        try{
            const res = await fetch(`${API_URL}/api/meals?date=${formattedDate}`)
            const data = await res.json();
            if (res.ok) {
                setMealsData(prev => ({ ...prev, [formattedDate]: data }));
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
    const todayMeals = mealsData[formattedDate] || {};
    const totalCalories = Object.values(todayMeals).reduce((sum, meal: any) => sum + meal.calories, 0);
    const dailyGoal = 2000; // Hedef kaloriniz

    const handleMenuButton = () => {
        console.log("menü açılacak.");
     }


    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.menuButton} onPress={handleMenuButton}>
              <Ionicons name="menu" size={20} color="#5c544d" style={styles.menuButton} />
             </TouchableOpacity>

            <Animated.View
                style={[
                    styles.mainChart, 
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <CalorieCircle calories={totalCalories} goal={dailyGoal} />
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
                                <Ionicons name="calendar-outline" size={18} color="#f7e5c5" style={{marginRight: 6}} />
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
                <TouchableOpacity style={styles.recipeButton}>
                    <Image
                        source={require("../assets/spoon.png")}
                        style={{ width: 70, height: 70 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatButton}>
                    <Image
                        source={require("../assets/plate.png")}
                        style={{ width: 100, height: 100 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.recipeButton}>
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