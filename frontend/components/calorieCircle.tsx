import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

interface CalorieCircleProps {
  calories: number;
  goal: number;
}

export default function CalorieCircle({calories,goal}:CalorieCircleProps) {
  
  const fill = (calories / goal) * 100; 

  return (
    <View style={{ alignItems: 'center' ,justifyContent: 'center' }}>

      <AnimatedCircularProgress
        size={200}
        width={15}
        fill={fill}
        tintColor="#DB5B23"
        backgroundColor="#E6E6FA"
        rotation={0}
        lineCap="round"
      >
        {
          () => (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 32, fontWeight: "bold" }}>
                {calories}
              </Text>
              <Text style={{ fontSize: 16, color: "#666" }}>
                / {goal} kcal
              </Text>
            </View>
          )
        }
      </AnimatedCircularProgress>

    </View>
  );
}
