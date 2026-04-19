import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { RootStackParamList } from '../App';
import styles from '../styles/ChallengeProgress';
import { API_URL } from '../env';
import * as SecureStore from '../storage';
import BadgeAwardModal from '../components/BadgeAwardModal';
import { useLanguage } from '../i18n/LanguageContext';

const BASE_URL = `${API_URL}/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeProgress'>;

interface DayHistoryItem {
  date: string;
  status: 'success' | 'fail' | 'today' | 'upcoming';
}

const ChallengeProgress: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const [challengeData, setChallengeData] = useState<any>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [todayCurrent, setTodayCurrent] = useState(0);
  const [dayHistory, setDayHistory] = useState<DayHistoryItem[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      setCurrentUserId(userId);
    };
    fetchUserId();

    fetchProgress();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProgress();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  const fetchProgress = async (): Promise<void> => {
    const { challengeId } = route.params;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/gamification/challenge/progress?challengeId=${challengeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();

      if (res.success) {
        const d = res.data;
        setChallengeData(d);
        setCurrentProgress(d.progress);
        setTodayCurrent(d.todayCurrent || 0);
        setDayHistory(d.dayHistory || []);
        setIsLoading(false);
        if (d.progress >= 100) {
          setIsCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const claimReward = async (): Promise<void> => {
    const { challengeId } = route.params;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${BASE_URL}/gamification/challenge/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId })
      });
      const res = await response.json();

      if (res.success) {
        if (res.earnedBadge) {
          setEarnedBadge(res.earnedBadge);
          setIsBadgeModalVisible(true);
        } else {
          Alert.alert(t('success'), 'Badge earned and points added!');
          navigation.goBack();
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), 'Reward could not be obtained.');
    }
  };

  const deleteChallenge = async (): Promise<void> => {
    const { challengeId } = route.params;

    Alert.alert(
      t('warning'),
      'Are you sure you want to remove this challenge? This action cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              const response = await fetch(`${BASE_URL}/gamification/challenge/${challengeId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const res = await response.json();

              if (res.success) {
                Alert.alert(t('success'), 'Challenge removed successfully.');
                navigation.goBack();
              } else {
                Alert.alert(t('error'), res.message || 'Failed to remove challenge.');
              }
            } catch (e) {
              console.error(e);
              Alert.alert(t('error'), 'Connection error.');
            }
          }
        }
      ]
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getDate()} ${months[s.getMonth()]} — ${e.getDate()} ${months[e.getMonth()]}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  const goal = challengeData?.goalValue || 100;
  const todayPercent = Math.min(100, Math.round((todayCurrent / goal) * 100));
  const successfulDays = dayHistory.filter(h => h.status === 'success').length;
  const remaining = Math.max(0, goal - todayCurrent);
  const unit = challengeData?.type === 'water' ? 'ml' : challengeData?.type === 'calorie' ? 'kcal' : challengeData?.type === 'sugar' ? 'g' : 'steps';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('challenge_progress_title')}</Text>
        {challengeData && currentUserId === String(challengeData.creatorId) && (
          <TouchableOpacity onPress={deleteChallenge}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, marginRight: 10 }}>
              <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={challengeData?.type === 'water' ? 'water-outline' : 'flame-outline'} size={30} color="#2ECC71" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{challengeData?.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {formatDateRange(challengeData.startDate, challengeData.endDate)} · {challengeData.durationDays} day
                </Text>
              </View>
            </View>
            {todayCurrent >= goal ? (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                <Text style={styles.statusBadgeText}>{t('challenge_progress_today_completed')}</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#3b301a' }]}>
                <Ionicons name="time-outline" size={14} color="#F1C40F" />
                <Text style={[styles.statusBadgeText, { color: '#F1C40F' }]}>{t('challenge_progress_ongoing')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>{t('challenge_progress_general')} · {successfulDays} / {challengeData.durationDays} {t('challenge_progress_days_successful')}</Text>
          <View style={styles.progressRow}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${currentProgress}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPercent}>{currentProgress}%</Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#2C2C2C', marginVertical: 25 }} />

          <Text style={styles.sectionLabel}>{t('challenge_progress_today_status')}</Text>
          <View style={styles.todayStatusCard}>
            {challengeData?.type === 'sugar' ? (
              <View style={[styles.todayValues, { flex: 1, paddingVertical: 10 }]}>
                <Text style={styles.todayMainValue}>
                  {todayCurrent.toLocaleString('tr-TR')} {unit}
                </Text>
                <Text style={[styles.todayRemaining, { color: todayCurrent <= goal ? '#2ECC71' : '#FF6B6B', marginTop: 8 }]}>
                  {todayCurrent <= goal ? `Success! Under or equal to ${goal}${unit} limit` : `Failed! Over ${goal}${unit} limit`}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.todayValues}>
                  <Text style={styles.todayMainValue}>
                    {todayCurrent.toLocaleString('tr-TR')} <Text style={styles.todayGoalValue}>/ {goal.toLocaleString('tr-TR')} {unit}</Text>
                  </Text>
                  <Text style={styles.todayRemaining}>{t('challenge_progress_remaining')}: {remaining.toLocaleString('tr-TR')} {unit}</Text>
                </View>
                <View style={styles.circularContainer}>
                  <AnimatedCircularProgress
                    size={80}
                    width={8}
                    fill={todayPercent}
                    tintColor="#2ECC71"
                    backgroundColor="#2C2C2C"
                    lineCap="round"
                    rotation={0}
                  >
                    {() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{todayPercent}%</Text>
                      </View>
                    )}
                  </AnimatedCircularProgress>
                </View>
              </>
            )}
          </View>

          <Text style={styles.sectionLabel}>{t('challenge_progress_history')}</Text>
          <View style={styles.historyGrid}>
            {dayHistory.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.historyDot,
                  item.status === 'success' ? styles.dotSuccess :
                    item.status === 'today' ? styles.dotToday :
                      item.status === 'upcoming' ? styles.dotUpcoming :
                        styles.dotFail
                ]}
              />
            ))}
          </View>
          <View style={styles.historyLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.legendText}>{t('challenge_progress_success')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
              <Text style={styles.legendText}>{t('today')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1, borderColor: '#444' }]} />
              <Text style={styles.legendText}>{t('challenge_progress_unsuccess')}</Text>
            </View>
          </View>
        </View>

        {isCompleted && !challengeData.rewardClaimed && (
          <TouchableOpacity style={styles.rewardButton} onPress={claimReward}>
            <Ionicons name="trophy" size={20} color="#000" />
            <Text style={styles.rewardButtonText}>{t('challenge_progress_claim')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('challenge_progress_desc')}</Text>
          <Text style={{ color: '#CCCCCC', fontSize: 14, lineHeight: 22 }}>
            {challengeData.description || t('challenge_progress_no_desc')}
          </Text>
        </View>
      </ScrollView>

      <BadgeAwardModal
        isVisible={isBadgeModalVisible}
        onClose={() => {
          setIsBadgeModalVisible(false);
          navigation.goBack();
        }}
        badge={earnedBadge}
      />
    </View>
  );
};

export default ChallengeProgress;
