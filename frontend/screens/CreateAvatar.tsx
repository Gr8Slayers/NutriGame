import { View, Image, TouchableOpacity, Alert, StyleSheet, Text, ScrollView, Button, ActivityIndicator, View as RNView, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useState, useEffect, useRef } from 'react';

import { Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';

import styles from '../styles/CreateAvatar';
import { API_URL } from '../env';
import { useLanguage } from '../i18n/LanguageContext';
import { createUploadFormData } from '../utils/uploadHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAvatar'>;

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

function CreateAvatar({ navigation, route }: Props) {
  const { t } = useLanguage();
  const { finalData } = route.params;
  const [name, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [greenAreaTop, setGreenAreaTop] = useState(0);
  const dataContainerRef = useRef<RNView>(null);

  const avatars = [
    { src: require('../assets/avatars/av1.png'), path: "../assets/avatars/av1.png" },
    { src: require('../assets/avatars/av2.png'), path: "../assets/avatars/av2.png" },
    { src: require('../assets/avatars/av3.png'), path: "../assets/avatars/av3.png" },
    { src: require('../assets/avatars/av4.png'), path: "../assets/avatars/av4.png" },
    { src: require('../assets/avatars/av5.png'), path: '../assets/avatars/av5.png' },
    { src: require('../assets/avatars/av6.png'), path: '../assets/avatars/av6.png' },
    { src: require('../assets/avatars/av7.png'), path: '../assets/avatars/av7.png' },
    { src: require('../assets/avatars/av8.png'), path: '../assets/avatars/av8.png' },
    { src: require('../assets/avatars/av9.png'), path: '../assets/avatars/av9.png' },
    { src: require('../assets/avatars/av10.png'), path: '../assets/avatars/av10.png' },
    { src: require('../assets/avatars/av11.png'), path: '../assets/avatars/av11.png' },
    { src: require('../assets/avatars/avatar12.png'), path: '../assets/avatars/avatar12.png' },
    { src: require('../assets/avatars/avatar13.png'), path: '../assets/avatars/avatar13.png' },
    { src: require('../assets/avatars/avatar14.png'), path: '../assets/avatars/avatar14.png' },
    { src: require('../assets/avatars/avatar15.png'), path: '../assets/avatars/avatar15.png' },
    { src: require('../assets/avatars/avatar16.png'), path: '../assets/avatars/avatar16.png' },
    { src: require('../assets/avatars/avatar17.png'), path: '../assets/avatars/avatar17.png' },
    { src: require('../assets/avatars/avatar18.png'), path: '../assets/avatars/avatar18.png' },
    { src: require('../assets/avatars/avatar19.png'), path: '../assets/avatars/avatar19.png' },
    { src: require('../assets/avatars/avatar20.png'), path: '../assets/avatars/avatar20.png' },
    { src: require('../assets/avatars/avatar21.png'), path: '../assets/avatars/avatar21.png' },
    { src: require('../assets/avatars/avatar22.png'), path: '../assets/avatars/avatar22.png' },
    { src: require('../assets/avatars/avatar23.png'), path: '../assets/avatars/avatar23.png' },
    { src: require('../assets/avatars/avatar24.png'), path: '../assets/avatars/avatar24.png' },
    { src: require('../assets/avatars/avatar25.png'), path: '../assets/avatars/avatar25.png' },
    { src: require('../assets/avatars/avatar26.png'), path: '../assets/avatars/avatar26.png' },
    { src: require('../assets/avatars/avatar27.png'), path: '../assets/avatars/avatar27.png' },
    { src: require('../assets/avatars/avatar28.png'), path: '../assets/avatars/avatar28.png' },
    { src: require('../assets/avatars/avatar29.png'), path: '../assets/avatars/avatar29.png' },
    { src: require('../assets/avatars/avatar30.png'), path: '../assets/avatars/avatar30.png' },
    { src: require('../assets/avatars/avatar31.png'), path: '../assets/avatars/avatar31.png' },
    { src: require('../assets/avatars/avatar32.png'), path: '../assets/avatars/avatar32.png' },
    { src: require('../assets/avatars/avatar33.png'), path: '../assets/avatars/avatar33.png' },
    { src: require('../assets/avatars/avatar34.png'), path: '../assets/avatars/avatar34.png' },
  ];

  const handleBackButton = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('SignUpEnterData', {
      initialData: {
        username: finalData.username,
        email: finalData.email,
        password: finalData.password,
      },
    });
  };



  const getUserName = async () => {

    setUserName(finalData.username);

  };

  const handleSelect = (avatarPath: any) => {
    console.log(avatarPath.path);
    setSelected(avatarPath.path);

  };
  const handleContinue = async () => {
    if (loading || !selected) {
      if (!selected) Alert.alert('Hata', 'Lütfen bir avatar seçin.');
      return;
    }
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      // 1. Seçilen avatarı veritabanına yükle
      const avatarObj = avatars.find(a => a.path === selected);
      if (!avatarObj) throw new Error('Avatar bulunamadı.');

      const asset = Asset.fromModule(avatarObj.src);
      try {
        await asset.downloadAsync();
      } catch (_) {
        // ignore — fall back to asset.uri below
      }
      let uri = asset.localUri ?? asset.uri;
      console.log('[signup] asset uri:', uri);
      if (!uri) throw new Error('Avatar URI alınamadı.');

      // On web expo-file-system is not available; asset.uri is already an https:// URL
      // which uploadHelper can fetch and convert to a Blob.
      if (
        Platform.OS !== 'web' &&
        !uri.startsWith('file://') &&
        !uri.startsWith('http://') &&
        !uri.startsWith('https://')
      ) {
        const dest = `${FileSystem.cacheDirectory}avatar-upload-${Date.now()}.png`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        uri = dest;
        console.log('[signup] copied to file uri:', uri);
      }

      const formData = await createUploadFormData(uri);
      console.log('[signup] formData ready, API_URL:', API_URL);

      console.log('[signup] POST /api/upload start');
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      console.log('[signup] /api/upload status:', uploadRes.status);

      if (!uploadRes.ok) {
        throw new Error('Avatar yüklenemedi.');
      }

      const uploadData = await uploadRes.json();
      const finalAvatarUrl = uploadData.imageUrl;
      console.log('[signup] uploaded avatar url:', finalAvatarUrl);

      // 2. Kayıt işlemini yap
      console.log('[signup] POST /api/auth/register start');
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...finalData,
          avatar_url: finalAvatarUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[signup] /api/auth/register status:', res.status);

      const data = await res.json();
      if (res.ok) {
        navigation.navigate("Login");
        Alert.alert('Başarılı', data.message);
      }
      else {
        Alert.alert('Hata', data.message || "Profil oluşturulamadı.");
      }

    }
    catch (error: any) {
      clearTimeout(timeoutId);
      console.log('[signup] FAILED name:', error?.name, 'message:', error?.message);
      console.error(error);
      if (error.name === 'AbortError') {
        Alert.alert('Bağlantı Hatası', 'Zaman aşımı oluştu. Lütfen bağlantınızı kontrol edin.');
      } else {
        Alert.alert('Hata', error.message || 'İşlem sırasında bir hata oluştu.');
      }
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserName();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
        <Image
          source={require("../assets/goback.png")}
          style={{ width: 25 }}
        />
      </TouchableOpacity>
      {greenAreaTop > 0 && <Leaf top={greenAreaTop} />}
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
          <Text style={styles.label}>{t('welcome')}, {name}! </Text>
          <Text style={styles.label}>{t('choose_avatar')}</Text>
          <View style={styles.grid}>
            {avatars.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(img)}
                style={[
                  styles.avatarContainer,
                  selected === img.path && styles.selected,
                ]}
              >
                <Image source={img.src} style={styles.avatar} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>
              {loading ? t('continuing') : t('save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

export default CreateAvatar;
