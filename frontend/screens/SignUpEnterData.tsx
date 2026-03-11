import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Image, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';

import styles from '../styles/SignUpEnterData';
import GenderSelector from '../components/genderSelection'
import GoalDropdown from '../components/goalSelection'
import ActivityLevelDropdown from '../components/activityLevelSelection'
import { RootStackParamList } from '../App';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'SignUpEnterData'>;
const Leaf = () => {
  return (
    <View style={styles.leafContainer}>
      {/* Sağdaki koyu yeşil büyük yaprak */}
      <View style={styles.leaf1} />
      {/* Soldaki açık yeşil küçük yaprak */}
      <View style={styles.leaf2} />
    </View>
  );
};
function SignUpEnterData({ navigation, route }: Props) {

  const { initialData } = route.params;
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [target_weight, setTargetWeight] = useState('');
  const [activity_level, setActivityLevel] = useState('');
  const [goal_duration_months, setGoalDurationMonths] = useState('');


  const [loading, setLoading] = useState<boolean>(false);
  const handleBackButton = () => {
    navigation.goBack();
  }



  const handleSignUpData = async () => {
    if (loading) return;
    setLoading(true);

    if (!age || !gender || !weight || !height || !goal || !activity_level) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Goal duration validation: must be between 1 and 24 months if provided
    if (goal_duration_months) {
      const months = parseInt(goal_duration_months);
      if (isNaN(months) || months < 1 || months > 24) {
        Alert.alert(
          "Invalid Duration",
          "Please enter a realistic goal duration between 1 and 24 months."
        );
        setLoading(false);
        return;
      }
    }
    const secondData = {
      ...initialData,
      age: parseInt(age),
      gender,
      weight: parseFloat(weight),
      height: parseFloat(height),
      reason_to_diet: goal,
      target_weight: target_weight ? parseFloat(target_weight) : 0,
      activity_level,
      goal_duration_months: goal_duration_months ? parseInt(goal_duration_months) : null,
    }
    navigation.navigate('CreateAvatar', { finalData: secondData });
    setLoading(false);
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
        <Image
          source={require("../assets/goback.png")}
          style={{ width: 25 }}
        />
      </TouchableOpacity>
      <Leaf />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Android'de bazen azıcık pay gerekir
      >
        <View style={styles.dataContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                keyboardType="numeric"
                onChangeText={setAge}
              />
            </View>
            <GenderSelector value={gender} onChange={setGender} />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight *</Text>
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                value={weight}
                keyboardType="numeric"
                onChangeText={setWeight}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height *</Text>
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                value={height}
                keyboardType="numeric"
                onChangeText={setHeight}
              />
            </View>
            <GoalDropdown value={goal} onChange={setGoal} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Target Weight (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Target weight (kg) - leave blank to skip"
                value={target_weight}
                keyboardType="numeric"
                onChangeText={setTargetWeight}
              />
            </View>
            <ActivityLevelDropdown value={activity_level} onChange={setActivityLevel} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Goal Duration (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="How many months to reach your goal? (1–24)"
                value={goal_duration_months}
                keyboardType="numeric"
                maxLength={2}
                onChangeText={(text) => {
                  // Only allow digits
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setGoalDurationMonths(cleaned);
                }}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSignUpData}>
              <Text style={styles.buttonText}>
                {loading ? 'Continuing...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default SignUpEnterData;