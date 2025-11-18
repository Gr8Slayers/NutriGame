import React, { useState } from 'react';
import { 
  View, Image,Text, TextInput, Button, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import { Menu} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/MainPage';
import CalorieCircle from '../components/calorieCircle';
import { IP_ADDRESS } from "@env";


const API_URL = `http://${IP_ADDRESS}:3000`; 

type Props = NativeStackScreenProps<RootStackParamList, 'MainPage'>;
function MainPage({ navigation }: Props) {
    const [breakfast, setBreakfast] = useState('');
    const [snack, setSnack] = useState('');
    const [lunch, setLunch] = useState('');
    const [dinner, setDinner] = useState('');
    //const [extra, setExtra] = useState('');
    const [calorie, setCalorie] = useState('');
    const [carb, setCarb] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');

    const totalCalories = 500;
    const dailyGoal = 2000;


return (
    <View style={styles.container}>
       <View style={styles.mainChart}> 
        <CalorieCircle calories={totalCalories} goal={dailyGoal} />
       </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.addMealCard}>
                 <Image 
                    source={require("../assets/breakfast.png")}
                    style={styles.iconContainer} 
                />
                <View style={styles.labelContainer}>
                <Text style={styles.mealTitle}>Add Breakfast</Text>
                <Text style={styles.subtitle}>Recommended: 830-1170 kcal</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
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
                <TouchableOpacity style={styles.addButton}>
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
                <TouchableOpacity style={styles.addButton}>
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
                <TouchableOpacity style={styles.addButton} onPress={() => setBreakfastAdded(true)}>
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