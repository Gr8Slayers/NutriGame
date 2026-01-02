import React from 'react';
import { View, Text, StyleSheet, Easing } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

interface CalorieCircleProps {
  calories: number;
  goal: number;
  protein: number;
  carb: number;
  fat: number;
}

export default function CalorieCircle({ calories, goal, protein, carb, fat }: CalorieCircleProps) {
  const safeGoal = goal > 0 ? goal : 1;
  const fill = Math.min((calories / safeGoal) * 100, 100);
  //oran hesapları hedef kaloriye göre hesaplanmalı
  const proteinGoal = (safeGoal * 0.30) / 4;
  const carbGoal = (safeGoal * 0.50) / 4;
  const fatGoal = (safeGoal * 0.20) / 9;

  const renderMacroTube = (value: number, max: number, color: string, label: string) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <View style={styles.macroItem}>
        <View style={styles.tubeContainer}>
          <View style={[styles.tubeFill, { height: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.macroInfo}>
          <Text style={[styles.macroValue, { color: color }]}>{Math.round(value)}g</Text>
          <Text style={styles.macroLabel}>{label}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <AnimatedCircularProgress
          size={200}
          width={15}
          fill={fill}
          tintColor="#fc8500"
          backgroundColor="#F0F0F0"
          rotation={0}
          lineCap="round"
          arcSweepAngle={360}
          duration={500}
          easing={Easing.out(Easing.ease)}
        >
          {() => (
            <View style={styles.innerCircle}>
              <Text style={styles.caloriesText}>{Math.round(calories)}</Text>
              <Text style={styles.goalText}>/ {goal} kcal</Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>

      <View style={styles.macrosContainer}>
        {renderMacroTube(protein, proteinGoal, '#4CAF50', 'Protein')}
        {renderMacroTube(carb, carbGoal, '#2196F3', 'Carbs')}
        {renderMacroTube(fat, fatGoal, '#FFC107', 'Fat')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: '90%',
    alignSelf: 'center',
  },
  circleContainer: {
    marginBottom: 10,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#333',
    letterSpacing: -1,
  },
  goalText: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
    marginTop: 5,
    paddingTop: 15,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
  },
  tubeContainer: {
    width: 8,
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginRight: 8,
  },
  tubeFill: {
    width: '100%',
    borderRadius: 4,
  },
  macroInfo: {
    justifyContent: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});
