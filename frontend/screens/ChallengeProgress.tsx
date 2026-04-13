import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { RootStackParamList } from '../App';
import styles from '../styles/ChallengeProgress';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import BadgeAwardModal from '../components/BadgeAwardModal';

const API_URL = `http://${IP_ADDRESS}:3000/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeProgress'>;

interface DayHistoryItem {
  date: string;
  status: 'success' | 'fail' | 'today' | 'upcoming';
}

interface State {
  challengeData: any;
  currentProgress: number;
  todayCurrent: number;
  dayHistory: DayHistoryItem[];
  isCompleted: boolean;
  isLoading: boolean;
  currentUserId: string | null;
  isBadgeModalVisible: boolean;
  earnedBadge: any | null;
}

class ChallengeProgress extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      challengeData: null,
      currentProgress: 0,
      todayCurrent: 0,
      dayHistory: [],
      isCompleted: false,
      isLoading: true,
      currentUserId: null,
      isBadgeModalVisible: false,
      earnedBadge: null
    };
  }

  private focusUnsubscribe: any;

  async componentDidMount() {
    const userId = await SecureStore.getItemAsync('userId');
    this.setState({ currentUserId: userId });
    this.fetchProgress();
    // Ekran her odağa geldiğinde verileri yenile (örn. geri gelindiğinde)
    this.focusUnsubscribe = this.props.navigation.addListener('focus', () => {
      this.fetchProgress();
    });
  }

  componentWillUnmount() {
    if (this.focusUnsubscribe) {
      this.focusUnsubscribe();
    }
  }

  private fetchProgress = async (): Promise<void> => {
    const { challengeId } = this.props.route.params;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/gamification/challenge/progress?challengeId=${challengeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();

      if (res.success) {
        const d = res.data;
        this.setState({
          challengeData: d,
          currentProgress: d.progress,
          todayCurrent: d.todayCurrent || 0,
          dayHistory: d.dayHistory || [],
          isLoading: false
        }, () => {
          if (this.state.currentProgress >= 100) {
            this.setState({ isCompleted: true });
          }
        });
      }
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false });
    }
  }

  private claimReward = async (): Promise<void> => {
    const { challengeId } = this.props.route.params;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/gamification/challenge/complete`, {
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
          this.setState({
            earnedBadge: res.earnedBadge,
            isBadgeModalVisible: true
          });
        } else {
          Alert.alert('Success!', 'Badge earned and points added!');
          this.props.navigation.goBack();
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Reward could not be obtained.');
    }
  }

  private deleteChallenge = async (): Promise<void> => {
    const { challengeId } = this.props.route.params;

    Alert.alert(
      'Remove Challenge',
      'Are you sure you want to remove this challenge? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              const response = await fetch(`${API_URL}/gamification/challenge/${challengeId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const res = await response.json();

              if (res.success) {
                Alert.alert('Success!', 'Challenge removed successfully.');
                this.props.navigation.goBack();
              } else {
                Alert.alert('Error', res.message || 'Failed to remove challenge.');
              }
            } catch (e) {
              console.error(e);
              Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
            }
          }
        }
      ]
    );
  }

  private formatDateRange = (start: string, end: string) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getDate()} ${months[s.getMonth()]} — ${e.getDate()} ${months[e.getMonth()]}`;
  }

  render() {
    const { challengeData, currentProgress, todayCurrent, dayHistory, isCompleted, isLoading, currentUserId } = this.state;

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
    const unit = challengeData?.type === 'water' ? 'ml' : challengeData?.type === 'calorie' ? 'kcal' : 'steps';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenge Progress</Text>
          {challengeData && currentUserId === String(challengeData.creatorId) && (
            <TouchableOpacity onPress={this.deleteChallenge}>
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
                    {this.formatDateRange(challengeData.startDate, challengeData.endDate)} · {challengeData.durationDays} day
                  </Text>
                </View>
              </View>
              {todayCurrent >= goal ? (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                  <Text style={styles.statusBadgeText}>Today completed</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#3b301a' }]}>
                  <Ionicons name="time-outline" size={14} color="#F1C40F" />
                  <Text style={[styles.statusBadgeText, { color: '#F1C40F' }]}>Ongoing</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionLabel}>GENERAL PROGRESS · {successfulDays} / {challengeData.durationDays} days successful</Text>
            <View style={styles.progressRow}>
              <View style={{ flex: 1, marginRight: 15 }}>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${currentProgress}%` }]} />
                </View>
              </View>
              <Text style={styles.progressPercent}>{currentProgress}%</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#2C2C2C', marginVertical: 25 }} />

            <Text style={styles.sectionLabel}>TODAY'S STATUS</Text>
            <View style={styles.todayStatusCard}>
              <View style={styles.todayValues}>
                <Text style={styles.todayMainValue}>
                  {todayCurrent.toLocaleString('tr-TR')} <Text style={styles.todayGoalValue}>/ {goal.toLocaleString('tr-TR')} {unit}</Text>
                </Text>
                <Text style={styles.todayRemaining}>Remaining: {remaining.toLocaleString('tr-TR')} {unit}</Text>
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
            </View>

            <Text style={styles.sectionLabel}>DAY HISTORY</Text>
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
                <Text style={styles.legendText}>Success</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderWidth: 1, borderColor: '#444' }]} />
                <Text style={styles.legendText}>Unsuccess</Text>
              </View>
            </View>
          </View>

          {isCompleted && !challengeData.rewardClaimed && (
            <TouchableOpacity style={styles.rewardButton} onPress={this.claimReward}>
              <Ionicons name="trophy" size={20} color="#000" />
              <Text style={styles.rewardButtonText}>Claim Reward & Get Badge</Text>
            </TouchableOpacity>
          )}

          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Description</Text>
            <Text style={{ color: '#CCCCCC', fontSize: 14, lineHeight: 22 }}>
              {challengeData.description || 'There is no description for this challenge.'}
            </Text>
          </View>
        </ScrollView>

        <BadgeAwardModal
          isVisible={this.state.isBadgeModalVisible}
          onClose={() => {
            this.setState({ isBadgeModalVisible: false });
            this.props.navigation.goBack();
          }}
          badge={this.state.earnedBadge}
        />
      </View>
    );
  }
}

export default ChallengeProgress;
