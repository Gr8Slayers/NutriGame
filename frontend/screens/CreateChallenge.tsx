import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/CreateChallenge';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';

const API_URL = `http://${IP_ADDRESS}:3000/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChallenge'>;

interface State {
  title: string;
  description: string;
  type: string;
  goalValue: string;
  targetUserID: string;
  targetUsername: string;
  endDate: string;
  isSubmitting: boolean;
}

class CreateChallenge extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      title: '',
      description: '',
      type: 'sugar',
      goalValue: '',
      targetUserID: '',
      targetUsername: '',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isSubmitting: false
    };
  }

  private handleCreate = async (): Promise<void> => {
    const { title, type, targetUserID, endDate } = this.state;
    if (!title || !targetUserID) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    this.setState({ isSubmitting: true });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/gamification/challenge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, type, targetUserId: targetUserID, endDate, description: this.state.description, goalValue: this.state.goalValue ? Number(this.state.goalValue) : undefined })
      });
      const res = await response.json();

      if (res.success) {
        Alert.alert('Success', res.message || 'Challenge created successfully');
        this.props.navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Failed to create challenge');
        this.setState({ isSubmitting: false });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Network error');
      this.setState({ isSubmitting: false });
    }
  }

  private selectTargetUser = (): void => {
    this.props.navigation.navigate('FindFriends', {
      selectMode: true,
      onSelectUser: (userId: string, username: string) => {
        this.setState({ targetUserID: userId, targetUsername: username });
      }
    });
  }

  render() {
    const { title, type, targetUserID, targetUsername, endDate, isSubmitting } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Challenge</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Challenge Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. No Sugar Challenge"
            placeholderTextColor="#6b5440"
            value={title}
            onChangeText={(t) => this.setState({ title: t })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Avoid sugar for 7 days"
            placeholderTextColor="#6b5440"
            value={this.state.description}
            onChangeText={(t) => this.setState({ description: t })}
          />

          <Text style={styles.label}>Goal Value</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2000 (ml for water, kcal for calorie)"
            placeholderTextColor="#6b5440"
            value={this.state.goalValue}
            onChangeText={(t) => this.setState({ goalValue: t })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.typeRow}>
            {['sugar', 'water', 'calorie', 'step'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, type === t && styles.typeButtonActive]}
                onPress={() => this.setState({ type: t })}
              >
                <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Invite Friend</Text>
          <TouchableOpacity style={styles.inviteButton} onPress={this.selectTargetUser}>
             <Ionicons name="person-add" size={20} color="#c8a96e" />
             <Text style={styles.inviteButtonText}>
                {targetUsername ? `Selected: ${targetUsername}` : 'Select Friend'}
             </Text>
          </TouchableOpacity>

          <Text style={styles.label}>End Date</Text>
          <View style={styles.inputDisabled}>
             <Text style={{ color: '#f7e5c5' }}>{endDate} (7 Days Duration)</Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, isSubmitting && { opacity: 0.7 }]}
            onPress={this.handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.createButtonText}>Create Challenge</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

export default CreateChallenge;
