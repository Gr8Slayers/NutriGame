import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ProgressBarAndroid, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Challenge } from '../types';
import styles from '../styles/ChallengeProgress';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';

const API_URL = `http://${IP_ADDRESS}:3000/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeProgress'>;

interface State {
  challengeData: Challenge | null;
  currentProgress: number; // 0 to 1
  isCompleted: boolean;
  isLoading: boolean;
}

class ChallengeProgress extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      challengeData: null,
      currentProgress: 0,
      isCompleted: false,
      isLoading: true
    };
  }

  componentDidMount() {
    this.fetchProgress();
  }

  private fetchProgress = async (): Promise<void> => {
    const { challengeId } = this.props.route.params;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/gamification/challenge/progress?challengeId=${challengeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();

      if (res.success) {
        const progressData = res.data;
        
        // Use basic fallback if challenge data is not fully populated yet
        const challenge: Challenge = {
          id: challengeId,
          title: progressData.title || (challengeId === '1' ? 'Water Streak' : 'Challenge'),
          description: progressData.description || 'Challenge detail fetched from server.',
          type: progressData.type || 'sugar',
          goalValue: progressData.goalValue || 100,
          currentProgress: progressData.progress,
          unit: '%',
          durationDays: progressData.durationDays || 7,
          startDate: progressData.startDate || new Date().toISOString(),
          endDate: progressData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          creatorId: progressData.creatorId || 'user',
          isGroupChallenge: true
        };

        this.setState({
          challengeData: challenge,
          currentProgress: progressData.progress / 100,
          isLoading: false
        }, () => {
          this.checkCompletion();
        });
      }
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false });
    }
  }

  private checkCompletion = async (): Promise<void> => {
    if (this.state.currentProgress >= 1 && !this.state.isCompleted) {
      this.setState({ isCompleted: true });
      Alert.alert('Congratulations!', 'You have reached 100% progress!');
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
        Alert.alert('🏆 Badge Earned!', 'Challenge Winner badge and +50 bonus points awarded!');
        this.props.navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not claim reward.');
    }
  }

  render() {
    const { challengeData, currentProgress, isCompleted, isLoading } = this.state;

    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#c8a96e" />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenge Progress</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{challengeData?.title}</Text>
          <Text style={styles.description}>{challengeData?.description}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Current Progress</Text>
              <Text style={styles.progressValue}>{Math.round(currentProgress * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${currentProgress * 100}%` }]} />
            </View>
          </View>

          {isCompleted ? (
            <TouchableOpacity style={styles.rewardButton} onPress={this.claimReward}>
              <Ionicons name="trophy" size={20} color="#000" />
              <Text style={styles.rewardButtonText}>Claim Rewards & Badge</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#a0896e" />
              <Text style={styles.infoText}>Keep going! You're doing great.</Text>
            </View>
          )}

          <View style={styles.detailsList}>
            {challengeData?.description ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailText}>{challengeData.description}</Text>
              </View>
            ) : null}
            {challengeData?.goalValue ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Goal</Text>
                <Text style={styles.detailText}>{challengeData.goalValue} {challengeData?.type === 'water' ? 'ml' : challengeData?.type === 'calorie' ? 'kcal' : ''}</Text>
              </View>
            ) : null}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailText}>{challengeData?.type.toUpperCase()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailText}>{challengeData?.durationDays} Days</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default ChallengeProgress;
