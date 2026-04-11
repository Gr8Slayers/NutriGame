import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/Challenges';
import { IP_ADDRESS } from "@env";


import * as SecureStore from 'expo-secure-store';

const API_URL = `http://${IP_ADDRESS}:3000/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'Challenges'>;

const Challenges = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'active' | 'invites'>('active');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchData();
  }, []);

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

  const renderActiveChallenge = ({ item }: { item: any }) => (
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
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
        </View>
      </View>
      <Text style={styles.progressValue}>{item.progress}%</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.itemTitle}>{item.title}</Text>
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
        <Text style={styles.headerTitle}>Challenges</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateChallenge')}>
          <Ionicons name="add-circle" size={28} color="#c8a96e" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invites' && styles.tabActive]}
          onPress={() => setActiveTab('invites')}
        >
          <Text style={[styles.tabText, activeTab === 'invites' && styles.tabTextActive]}>Invites</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'active' ? challenges : invites}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'active' ? renderActiveChallenge : renderInvite}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nothing here yet!</Text>}
      />
    </View>
  );
};

export default Challenges;
