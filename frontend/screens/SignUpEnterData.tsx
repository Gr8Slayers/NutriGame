import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import { Menu} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from '../styles/SignUpEnterData';
import GenderSelector from '../components/genderSelection'
import GoalDropdown from '../components/goalSelection'
import { RootStackParamList } from '../App';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`; 

type Props = NativeStackScreenProps<RootStackParamList, 'SignUpEnterData'>;

function SignUpEnterData({ navigation }: Props) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  
  
  const [loading, setLoading] = useState<boolean>(false); 
  
  const handleSignUpData = async () => {
      if (loading) return;
      setLoading(true);
  
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ age, gender, weight,height}),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          navigation.navigate('CreateAvatar');
        } else {
          Alert.alert('Hata', data.message || 'Kayıt yapılamadı');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Hata', 'Sunucuya bağlanılamadı. IP adresinizi kontrol edin.');
      } finally {
        setLoading(false);
      }
    };
 
return (
    <View style={styles.container}>
       <View style={styles.circle1}/>
          <View style={styles.circle2}/>
            <View style={styles.circle3}></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputContainer}>
            <Text style = {styles.label}>Age *</Text>
            <TextInput 
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
            />
       </View>
       <GenderSelector value={gender} onChange={setGender} />

        <View style={styles.inputContainer}>
            <Text style = {styles.label}>Weight *</Text>
            <TextInput 
            style={styles.input}
                placeholder="Weight (kg)"
                value={weight}
                keyboardType="numeric"
                onChangeText={setWeight}
            />
            </View>
          <View style={styles.inputContainer}>
            <Text style = {styles.label}>Height *</Text>  
            <TextInput 
            style={styles.input}
                placeholder="Height (cm)"
                value={height}
                keyboardType="numeric"
                onChangeText={setHeight}
       />
       </View>
       <GoalDropdown value={goal} onChange={setGoal} />
       <TouchableOpacity style={styles.button} onPress={handleSignUpData}>
                 <Text style={styles.buttonText}>
                   {loading ? 'Continuing...' : 'Continue'}
                 </Text>
               </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default SignUpEnterData;