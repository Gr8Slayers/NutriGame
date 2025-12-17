import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button ,ScrollView,Alert,TouchableOpacity,FlatList,Image,KeyboardAvoidingView, Platform,Modal} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import styles from '../styles/AddMeal';
import CalorieCircle from '../components/calorieCircle';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';
import WaterWave from "../components/waterContainer";

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddWater'>;
export default function AddMeal({ route, navigation }: Props) {

     const { selectedDate ,type} = route.params;

     return (
                <WaterWave progress={0.5} />
        
       );
}