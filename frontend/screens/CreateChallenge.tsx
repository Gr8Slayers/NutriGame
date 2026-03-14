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
  type: string;
  targetUserID: string;
  endDate: string;
  isSubmitting: boolean;
}

class CreateChallenge extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      title: '',
      type: 'sugar',
      targetUserID: '',
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
        body: JSON.stringify({ title, type, targetUserId: targetUserID, endDate })
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
     // Navigate to a friend selection screen or use a search
     // For now, clear it to remove mock logic
     Alert.alert('Select Friend', 'Please search for a friend to invite.');
     this.props.navigation.navigate('FindFriends');
  }

  render() {
    const { title, type, targetUserID, endDate, isSubmitting } = this.state;

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
                {targetUserID ? `Selected: ${targetUserID}` : 'Select Friend A or B'}
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
