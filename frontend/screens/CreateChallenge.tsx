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
  endDate: string;
  duration: number;
  currentUserId: string;
  selectedUsers: Array<{ id: string; username: string }>;
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
      duration: 7,
      endDate: this.calculateEndDate(7),
      currentUserId: '',
      selectedUsers: [],
      isSubmitting: false
    };
  }

  async componentDidMount() {
    const userId = await SecureStore.getItemAsync('userId');
    if (userId) {
      this.setState({ currentUserId: userId });
    }
  }

  private calculateEndDate = (days: number): string => {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  private setDuration = (days: number): void => {
    this.setState({ 
      duration: days,
      endDate: this.calculateEndDate(days)
    });
  }

  private handleCreate = async (): Promise<void> => {
    const { title, type, selectedUsers, endDate } = this.state;
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const targetUserIds = selectedUsers.map(u => Number(u.id));

    this.setState({ isSubmitting: true });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/gamification/challenge/create`, {
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
          description: this.state.description, 
          goalValue: this.state.goalValue ? Number(this.state.goalValue) : undefined 
        })
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

  private handleSelfChallenge = (): void => {
    // This button can now be a toggle or just a way to clarify they are already in.
    // For now, I'll keep the button just as an indicator or if they want to add themselves specifically?
    // Actually, backend automatically adds creator.
    Alert.alert('Note', 'As the creator, you are automatically included in this challenge!');
  }

  private selectTargetUser = (): void => {
    this.props.navigation.navigate('FindFriends', {
      selectMode: true,
      onSelectUser: (userId: string, username: string) => {
        const alreadyIn = this.state.selectedUsers.some(u => u.id === userId);
        if (alreadyIn) {
          Alert.alert('Info', 'User already added');
          return;
        }
        if (userId === this.state.currentUserId) {
          Alert.alert('Info', 'You are already included as the creator');
          return;
        }

        this.setState({ 
          selectedUsers: [...this.state.selectedUsers, { id: userId, username }]
        });
      }
    });
  }

  private removeUser = (userId: string): void => {
    this.setState({
        selectedUsers: this.state.selectedUsers.filter(u => u.id !== userId)
    });
  }

  render() {
    const { title, type, selectedUsers, endDate, isSubmitting } = this.state;

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

          <Text style={styles.label}>Participants</Text>
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
                    <TouchableOpacity onPress={() => this.removeUser(user.id)}>
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
             ))}
          </View>

          <TouchableOpacity style={styles.inviteButton} onPress={this.selectTargetUser}>
             <Ionicons name="person-add" size={20} color="#c8a96e" />
             <Text style={styles.inviteButtonText}>Add Friend to Challenge</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Duration (Days)</Text>
          <View style={styles.typeRow}>
            {[1, 3, 7, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.typeButton, this.state.duration === d && styles.typeButtonActive]}
                onPress={() => this.setDuration(d)}
              >
                <Text style={[styles.typeButtonText, this.state.duration === d && styles.typeButtonTextActive]}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>End Date</Text>
          <View style={styles.inputDisabled}>
             <Text style={{ color: '#f7e5c5' }}>{endDate} ({this.state.duration} Days Duration)</Text>
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
