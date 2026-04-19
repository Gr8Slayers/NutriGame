import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/CreateChallenge';
import { API_URL } from '../env';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../i18n/LanguageContext';

const BASE_URL = `${API_URL}/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChallenge'>;

const CreateChallenge: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('sugar');
  const [goalValue, setGoalValue] = useState('');
  const [duration, setDuration] = useState(7);
  const [endDate, setEndDate] = useState(calculateEndDate(7));
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; username: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      if (userId) {
        setCurrentUserId(userId);
      }
    };
    fetchUserId();
  }, []);

  function calculateEndDate(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const handleSetDuration = (days: number): void => {
    setDuration(days);
    setEndDate(calculateEndDate(days));
  };

  const handleCreate = async (): Promise<void> => {
    if (!title) {
      Alert.alert(t('error') || 'Error', 'Please enter a title');
      return;
    }

    const targetUserIds = selectedUsers.map(u => Number(u.id));

    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/gamification/challenge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          type,
          targetUserIds: targetUserIds,
          endDate,
          description,
          goalValue: goalValue ? Number(goalValue) : undefined
        })
      });
      const res = await response.json();

      if (res.success) {
        Alert.alert(t('success') || 'Success', res.message || 'Challenge created successfully');
        navigation.goBack();
      } else {
        Alert.alert(t('error') || 'Error', res.message || 'Failed to create challenge');
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('error') || 'Error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTargetUser = (): void => {
    navigation.navigate('FindFriends', {
      selectMode: true,
      onSelectUser: (userId: string, username: string) => {
        const alreadyIn = selectedUsers.some(u => u.id === userId);
        if (alreadyIn) {
          Alert.alert('Info', 'User already added');
          return;
        }
        if (userId === currentUserId) {
          Alert.alert('Info', 'You are already included as the creator');
          return;
        }

        setSelectedUsers(prev => [...prev, { id: userId, username }]);
      }
    });
  };

  const removeUser = (userId: string): void => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('create_challenge_title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('create_challenge_name')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. No Sugar Challenge"
          placeholderTextColor="#6b5440"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>{t('challenge_progress_desc') || 'Description'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Avoid sugar for 7 days"
          placeholderTextColor="#6b5440"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>
          {type === 'sugar' ? 'Sugar Limit (optional, 0 = No Sugar)' : t('create_challenge_goal')}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={type === 'sugar' ? "e.g. 0" : "e.g. 2000 (ml for water, kcal for calorie)"}
          placeholderTextColor="#6b5440"
          value={goalValue}
          onChangeText={setGoalValue}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('create_challenge_type')}</Text>
        <View style={styles.typeRow}>
          {['sugar', 'water', 'calorie', 'step'].map((tVal) => (
            <TouchableOpacity
              key={tVal}
              style={[styles.typeButton, type === tVal && styles.typeButtonActive]}
              onPress={() => setType(tVal)}
            >
              <Text style={[styles.typeButtonText, type === tVal && styles.typeButtonTextActive]}>
                {tVal.charAt(0).toUpperCase() + tVal.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('create_challenge_invite')}</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d3528', padding: 12, borderRadius: 12, marginBottom: 8 }}>
            <Ionicons name="person" size={20} color="#c8a96e" />
            <Text style={{ color: '#f7e5c5', marginLeft: 12, fontWeight: 'bold' }}>You (Creator)</Text>
          </View>
          {selectedUsers.map(user => (
            <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#14281d', padding: 12, borderRadius: 12, marginBottom: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="person-outline" size={20} color="#a0896e" />
                <Text style={{ color: '#f7e5c5', marginLeft: 12 }}>{user.username}</Text>
              </View>
              <TouchableOpacity onPress={() => removeUser(user.id)}>
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.inviteButton} onPress={selectTargetUser}>
          <Ionicons name="person-add" size={20} color="#c8a96e" />
          <Text style={styles.inviteButtonText}>{t('create_challenge_invite')}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('create_challenge_days')}</Text>
        <View style={styles.typeRow}>
          {[1, 3, 7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.typeButton, duration === d && styles.typeButtonActive]}
              onPress={() => handleSetDuration(d)}
            >
              <Text style={[styles.typeButtonText, duration === d && styles.typeButtonTextActive]}>
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>End Date</Text>
        <View style={styles.inputDisabled}>
          <Text style={{ color: '#f7e5c5' }}>{endDate} ({duration} Days Duration)</Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.createButtonText}>{t('create_challenge_button')}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default CreateChallenge;
