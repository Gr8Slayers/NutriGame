import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, View as RNView
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setItem, getItem, removeItem } from '../storage';
import { RootStackParamList } from '../App';
import styles from '../styles/LoginStyle';
import { API_URL } from '../env';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

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
function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [remember, setRemember] = useState(false);
  const [greenAreaTop, setGreenAreaTop] = useState(0);
  const { t } = useLanguage();
  const dataContainerRef = useRef<RNView>(null);

  const handleLogin = async () => {
    // ... handles login logic
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
        const token = data.token || "No Token";
        await setItem('userToken', token);
        if (data.user?.id) {
          await setItem('userId', String(data.user.id));
        }

        if (remember) {
          await setItem('rememberMeFlag', 'true');
        } else {
          await removeItem('rememberMeFlag');
        }

        navigation.navigate('MainPage');
      } else {
        Alert.alert(t('error'), data.message || t('login_connection_error'));
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        Alert.alert(t('error'), t('login_timeout_error'));
      } else {
        Alert.alert(t('error'), t('login_connection_error'));
      }
      console.error("Login Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
              setGreenAreaTop(y);  // Ekrana göre mutlak Y pozisyonu
            });
          }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.logInTitle}>{t('login_title')}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login_email_or_username')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login_email_placeholder')}
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
              <Text style={styles.label}>{t('login_password')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login_password_placeholder')}
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
                {loading ? t('login_button_loading') : t('login_button')}
              </Text>
            </TouchableOpacity>
            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={[styles.checkbox, remember && styles.checkboxChecked]}
                onPress={() => setRemember(!remember)}
              >
                {remember && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.rememberText}>{t('login_remember_me')}</Text>
            </View>

            <View style={styles.divider} />
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>{t('login_no_account')} <Text style={styles.signUpLinkText}>{t('login_sign_up')}</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default Login;