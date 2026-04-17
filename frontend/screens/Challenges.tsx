import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/Challenges';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = `http://${IP_ADDRESS}:3000/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'Challenges'>;

const Challenges = ({ navigation }: Props) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'active' | 'invites'>('active');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/gamification/challenges`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.data.activeChallenges);
        setInvites(data.data.invites);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderActiveChallenge = ({ item }: { item: any }) => {
    // Backend'den gelecek anlık günlük veriler (Backend henüz güncellenmediyse hata vermemesi için varsayılan değerler 0 ve 100 olarak ayarlandı)
    const todayCurrent = item.todayCurrent || 0;
    const dailyGoal = item.goalValue || 100; // API'den goalValue dönüyor, onu kullanıyoruz
    const dailyProgressPercent = dailyGoal > 0 ? Math.min((todayCurrent / dailyGoal) * 100, 100) : 0;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ChallengeProgress', { challengeId: item.id })}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name={item.type === 'water' ? 'water' : 'walk'}
            size={24}
            color="#c8a96e"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>

          {/* 1. ANA BAR: Genel İlerleme (Gün Bazlı) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>General Progress</Text>
            <Text style={{ color: '#999', fontSize: 12 }}>{item.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
          </View>

          {/* 2. GÜNLÜK BAR: Anlık İlerleme (Hacim/Adım Bazlı) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
            <Text style={{ color: '#f7e5c5', fontSize: 12, fontWeight: '600' }}>
              Today's Progress ({todayCurrent} / {dailyGoal} {item.type === 'water' ? 'ml' : item.type === 'calorie' ? 'kcal' : item.type === 'step' || item.type === 'move' ? 'steps' : ''})
            </Text>
            <Text style={{ color: '#f7e5c5', fontSize: 12, fontWeight: 'bold' }}>
              {dailyProgressPercent.toFixed(0)}%
            </Text>
          </View>
          {/* İnce ve daha belirgin bir bar tasarımı */}
          <View style={[styles.progressBarBg, { height: 6, backgroundColor: '#333' }]}>
            <View style={[styles.progressBarFill, {
              width: `${dailyProgressPercent}%`,
              backgroundColor: '#4CAF50' // Günlük hedefin dolduğunu vurgulayan yeşil renk
            }]} />
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  const respondToInvite = async (challengeId: string, accept: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      await fetch(`${API_URL}/gamification/challenge/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ challengeId, accept }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const renderInvite = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.iconBox}>
        <Ionicons name="mail-unread" size={24} color="#c8a96e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.senderId })}>
          <Text style={[styles.itemSubtitle, { textDecorationLine: 'underline' }]}>
            From {item.senderUsername || `user #${item.senderId}`}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => respondToInvite(item.id, true)}>
          <Ionicons name="checkmark" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={() => respondToInvite(item.id, false)}>
          <Ionicons name="close" size={20} color="#f7e5c5" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('challenges_title')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateChallenge')}>
          <Ionicons name="add-circle" size={28} color="#c8a96e" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>{t('challenges_active')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invites' && styles.tabActive]}
          onPress={() => setActiveTab('invites')}
        >
          <Text style={[styles.tabText, activeTab === 'invites' && styles.tabTextActive]}>{t('challenges_pending')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'active' ? challenges : invites}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'active' ? renderActiveChallenge : renderInvite}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{activeTab === 'active' ? t('challenges_no_active') : t('challenges_no_pending')}</Text>}
      />
    </View>
  );
};

export default Challenges;