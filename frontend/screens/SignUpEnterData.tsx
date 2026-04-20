import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Button, Image, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, View as RNView
} from 'react-native';
import { Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';
import styles from '../styles/SignUpEnterData';
import GenderSelector from '../components/genderSelection'
import GoalDropdown from '../components/goalSelection'
import ActivityLevelDropdown from '../components/activityLevelSelection'
import { RootStackParamList } from '../App';
import { API_URL } from '../env';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUpEnterData'>;
const Leaf = ({ top }: { top: number }) => {
  return (
    <View style={[styles.leafContainer, { top: top - 100 }]}>
      {/* Sağdaki koyu yeşil büyük yaprak */}
      <View style={styles.leaf1} />
      {/* Soldaki açık yeşil küçük yaprak */}
      <View style={styles.leaf2} />
    </View>
  );
};
function SignUpEnterData({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { initialData } = route.params;
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState('');
  const [height_box, setHeightBox] = useState('');
  const [goal, setGoal] = useState('');
  const [target_weight, setTargetWeight] = useState('');
  const [activity_level, setActivityLevel] = useState('');
  const [goal_duration_months, setGoalDurationMonths] = useState('');
  const [greenAreaTop, setGreenAreaTop] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const dataContainerRef = useRef<RNView>(null);
  const handleBackButton = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('SignUp');
  };



  const handleSignUpData = async () => {
    if (loading) return;
    setLoading(true);

    if (!age || !gender || !weight || !height_box || !goal || !activity_level) {
      Alert.alert(t('error') || "Missing Info", t('missing_info') || "Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Goal duration validation: must be between 1 and 24 months if provided
    if (goal_duration_months) {
      const months = parseInt(goal_duration_months);
      if (isNaN(months) || months < 1 || months > 24) {
        Alert.alert(
          t('error') || "Invalid Duration",
          t('invalid_duration') || "Please enter a realistic goal duration between 1 and 24 months."
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
      height: parseFloat(height_box),
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
      {greenAreaTop > 0 && <Leaf top={greenAreaTop} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View 
          ref={dataContainerRef}
          style={styles.dataContainer} 
          onLayout={() => {
            dataContainerRef.current?.measureInWindow((x, y) => {
              setGreenAreaTop(y);
            });
          }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('edit_profile_age') || 'Age'} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('edit_profile_age') || 'Age'}
                value={age}
                keyboardType="numeric"
                onChangeText={setAge}
              />
            </View>
            <GenderSelector value={gender} onChange={setGender} />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('edit_profile_weight') || 'Weight'} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('edit_profile_weight') || 'Weight (kg)'}
                value={weight}
                keyboardType="numeric"
                onChangeText={setWeight}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('edit_profile_height') || 'Height'} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('edit_profile_height') || 'Height (cm)'}
                value={height_box}
                keyboardType="numeric"
                onChangeText={setHeightBox}
              />
            </View>
            <GoalDropdown value={goal} onChange={setGoal} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('target_weight_opt') || 'Target Weight (optional)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('target_weight_placeholder') || 'Target weight (kg) - leave blank to skip'}
                value={target_weight}
                keyboardType="numeric"
                onChangeText={setTargetWeight}
              />
            </View>
            <ActivityLevelDropdown value={activity_level} onChange={setActivityLevel} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('goal_duration_opt') || 'Goal Duration (optional)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('goal_duration_placeholder') || 'How many months to reach your goal? (1–24)'}
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
                {loading ? (t('continuing') || 'Continuing...') : (t('continue') || 'Continue')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default SignUpEnterData;
