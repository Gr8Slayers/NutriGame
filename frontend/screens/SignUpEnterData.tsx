import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button,Image, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import { Menu} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';

import styles from '../styles/SignUpEnterData';
import GenderSelector from '../components/genderSelection'
import GoalDropdown from '../components/goalSelection'
import { RootStackParamList } from '../App';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`; 

type Props = NativeStackScreenProps<RootStackParamList, 'SignUpEnterData'>;
function SignUpEnterData({ navigation, route }: Props) {

  const { initialData } = route.params;
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [target_weight, setTargetWeight] = useState('');
  
  
  const [loading, setLoading] = useState<boolean>(false); 
  const handleBackButton = () => {
  navigation.goBack();
}

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
  
  const handleSignUpData = async () => {
      if (loading) return;
      setLoading(true);
  
      if(!age || !gender || !weight || !height || !goal){
        Alert.alert("Hata","Please Enter All Infos.");
        setLoading(false);
        return;
      }
      const secondData = {
        ...initialData,
        age: parseInt(age),
        gender,
        weight: parseFloat(weight),
        height: parseFloat(height),
        reason_to_diet: goal,
        target_weight: 0,

      }
      navigation.navigate('CreateAvatar', {finalData:secondData});
      setLoading(false);
        };
        
 
return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Image 
            source={require("../assets/goback.png")}
            style={{width:25}}
        />
        </TouchableOpacity>
      <Leaf />
        <View style={styles.dataContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputContainer}>
            <Text style = {styles.label}>Age *</Text>
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
    </View>
  );
}

export default SignUpEnterData;