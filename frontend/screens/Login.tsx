import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'react-native';
import { RootStackParamList } from '../App';

import styles from '../styles/LoginStyle';

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [remember, setRemember] = useState(false);

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

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    console.log(JSON.stringify({ email, username, password }));

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', data.message);
        navigation.navigate('MainPage');
        const token = data.token || "No Token";
        await SecureStore.setItemAsync('userToken', token);
        if (remember) {
          await SecureStore.setItemAsync('rememberMeFlag', 'true');
        }
        else {
          await SecureStore.deleteItemAsync('rememberMeFlag');
        }
        //Alert.alert('Başarılı', `Giriş yapıldı! Token: ${data.token.substring(0, 20)}...`);
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
      <Leaf />
      <View style={styles.dataContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.logInTitle}>LOG IN</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              value={email || username}
              onChangeText={(text) => {
                if (text.includes("@")) {
                  setEmail(text);
                  setUserName("");
                } else {
                  setUserName(text);
                  setEmail("");
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Entering...' : 'Log In'}
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
    </View>
  );
}

export default Login;