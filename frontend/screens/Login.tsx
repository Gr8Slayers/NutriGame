import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';

import styles from '../styles/LoginStyle';


const ip= process.env.IP_ADDRESS;
const API_URL = `http://${ip}:3000`; 

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false); 
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Başarılı', `Giriş yapıldı! Token: ${data.token.substring(0, 20)}...`);
      } else {
        Alert.alert('Hata', data.message || 'Giriş yapılamadı');
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
        <View style={styles.circle3}/>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.logInTitle}>Log In</Text>

            <View style={styles.inputContainer}>
                    <Text style = {styles.label}>Email *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
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
            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Entering...' : 'LOG IN'}
                </Text>
          </TouchableOpacity>
          <View style={styles.rememberContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, remember && styles.checkboxChecked]} 
              onPress={() => setRemember(!remember)}
            >
              {remember && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.rememberText}>Remember Me</Text>
          </View>
          
             <View style={styles.divider} /> 
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>Don't have an account? <Text style={styles.signUpLinkText}>Sign Up</Text></Text>
            </TouchableOpacity>
          </ScrollView>
      </View>
  );
}

export default Login;
