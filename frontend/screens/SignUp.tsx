import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from '../styles/SignUpStyle';
import { IP_ADDRESS } from '@env';

const ip= process.env.IP_ADDRESS;
const API_URL = `http://${ip}:3000`; 

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  SignUpEnterData: undefined;
  CreateAvatar: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

function SignUp({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<boolean>(false); 

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name}),
      });

      const data = await res.json();
      
      
      if (res.ok) {
        navigation.navigate('SignUpEnterData');
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
        <Text style={styles.title}>Create Account</Text>

      <View style={styles.inputContainer}>
                  <Text style = {styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputContainer}>
                      <Text style = {styles.label}>Email *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email *"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
              </View>
            <View style={styles.inputContainer}>
                  <Text style = {styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={false}
                />
                </View>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>
            {loading ? 'Continuing...' : 'Continue'}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} /> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.signUpLinkText}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default SignUp;
