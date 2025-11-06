import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView 
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import styles from '../styles/SignUpStyle';

const ip= process.env.IP_ADDRESS;
const API_URL = `http://${ip}:3000`; 

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

function SignUp({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState<boolean>(false); 

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, age, height, weight }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Lütfen giriş yapın.');
        navigation.navigate('Login');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Hesap Oluştur</Text>

        <TextInput
          style={styles.input}
          placeholder="İsim (Opsiyonel)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email (Zorunlu)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre (Zorunlu)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={false}
        />

        <Text style={styles.subtitle}>Diyet Bilgileri</Text>

        <TextInput
          style={styles.input}
          placeholder="Yaş (Zorunlu)"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Boy (cm olarak) (Zorunlu)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Kilo (kg olarak) (Zorunlu)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Button
          title={loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          onPress={handleSignUp}
          disabled={loading} 
        />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default SignUp;
