import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeal'>;

export default function AddMeal({ route, navigation }: Props) {


  const { selectedDate ,type} = route.params;// Sadece kahvaltıyı yaptığınız için şimdilik kalsın

  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");

  const handleSave = () => {
    
    navigation.navigate("MainPage", {
      updatedMeal: {
        date: selectedDate,
        type: type,
        mealName,
        calories: parseInt(calories) || 0, // Geçersiz girişi 0 yapalım
      },
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>
        {type} for {selectedDate}
      </Text>
      {/* ... diğer TextInput ve Button kodları ... */}
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}
