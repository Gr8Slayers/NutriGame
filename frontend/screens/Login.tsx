import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'react-native';
import { RootStackParamList } from '../App';

import styles from '../styles/LoginStyle';

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

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

function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [remember, setRemember] = useState(false);



  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye sınırı

    try {
      console.log(`${API_URL}/api/auth/login`);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', data.message);

        const token = data.token || "No Token";
        await SecureStore.setItemAsync('userToken', token);
        if (data.user?.id) {
          await SecureStore.setItemAsync('userId', String(data.user.id));
        }

        if (remember) {
          await SecureStore.setItemAsync('rememberMeFlag', 'true');
        } else {
          await SecureStore.deleteItemAsync('rememberMeFlag');
        }

        navigation.navigate('MainPage');
      } else {
        Alert.alert('Hata', data.message || 'Giriş yapılamadı');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        Alert.alert('Bağlantı Hatası', 'Sunucu yanıt vermedi (Zaman aşımı). Lütfen IP adresinizi ve internetinizi kontrol edin.');
      } else {
        Alert.alert('Hata', 'Sunucuya bağlanılamadı. Backend kapalı veya ağ hatası var.');
      }
      console.error("Login Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Leaf />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Android'de bazen azıcık pay gerekir
      >

        <View style={styles.dataContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

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
      </KeyboardAvoidingView>
    </View>
  );
}

export default Login;