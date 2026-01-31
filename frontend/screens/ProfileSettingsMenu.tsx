import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { IP_ADDRESS } from "@env";
import styles from '../styles/ProfileSettingsMenu';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { UserProfile } from '../types';

const API_URL = `http://${IP_ADDRESS}:3000`;

// Helper to resolve avatar paths
const getAvatarSource = (path: string | undefined) => {
    if (!path) return require('../assets/default_avatar.png');

    const cleanPath = path.trim();
    switch (cleanPath) {
        case "../assets/avatars/av1.png": return require('../assets/avatars/av1.png');
        case "../assets/avatars/av2.png": return require('../assets/avatars/av2.png');
        case "../assets/avatars/av3.png": return require('../assets/avatars/av3.png');
        case "../assets/avatars/av4.png": return require('../assets/avatars/av4.png');
        case "../assets/avatars/av5.png": return require('../assets/avatars/av5.png');
        case "../assets/avatars/av6.png": return require('../assets/avatars/av6.png');
        case "../assets/avatars/av7.png": return require('../assets/avatars/av7.png');
        case "../assets/avatars/av8.png": return require('../assets/avatars/av8.png');
        case "../assets/avatars/av9.png": return require('../assets/avatars/av9.png');
        case "../assets/avatars/av10.png": return require('../assets/avatars/av10.png');
        case "../assets/avatars/av11.png": return require('../assets/avatars/av11.png');
        case "../assets/avatars/avatar12.png": return require('../assets/avatars/avatar12.png');
        case "../assets/avatars/avatar13.png": return require('../assets/avatars/avatar13.png');
        case "../assets/avatars/avatar14.png": return require('../assets/avatars/avatar14.png');
        case "../assets/avatars/avatar15.png": return require('../assets/avatars/avatar15.png');
        case "../assets/avatars/avatar16.png": return require('../assets/avatars/avatar16.png');
        case "../assets/avatars/avatar17.png": return require('../assets/avatars/avatar17.png');
        case "../assets/avatars/avatar18.png": return require('../assets/avatars/avatar18.png');
        case "../assets/avatars/avatar19.png": return require('../assets/avatars/avatar19.png');
        case "../assets/avatars/avatar20.png": return require('../assets/avatars/avatar20.png');
        case "../assets/avatars/avatar21.png": return require('../assets/avatars/avatar21.png');
        case "../assets/avatars/avatar22.png": return require('../assets/avatars/avatar22.png');
        case "../assets/avatars/avatar23.png": return require('../assets/avatars/avatar23.png');
        case "../assets/avatars/avatar24.png": return require('../assets/avatars/avatar24.png');
        case "../assets/avatars/avatar25.png": return require('../assets/avatars/avatar25.png');
        case "../assets/avatars/avatar26.png": return require('../assets/avatars/avatar26.png');
        case "../assets/avatars/avatar27.png": return require('../assets/avatars/avatar27.png');
        case "../assets/avatars/avatar28.png": return require('../assets/avatars/avatar28.png');
        case "../assets/avatars/avatar29.png": return require('../assets/avatars/avatar29.png');
        case "../assets/avatars/avatar30.png": return require('../assets/avatars/avatar30.png');
        case "../assets/avatars/avatar31.png": return require('../assets/avatars/avatar31.png');
        case "../assets/avatars/avatar32.png": return require('../assets/avatars/avatar32.png');
        case "../assets/avatars/avatar33.png": return require('../assets/avatars/avatar33.png');
        case "../assets/avatars/avatar34.png": return require('../assets/avatars/avatar34.png');
        default: return require('../assets/default_avatar.png');
    }
};

export default function ProfileSettingsMenu() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'ProfileSettingsMenu'>>();
    const userData = route.params;
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) return;
            console.log(`${API_URL}/api/user/profile/delete`)

            const res = await fetch(`${API_URL}/api/user/profile/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('rememberMeFlag');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' as never }],
                });
            } else {
                console.error("Delete account error", res);
            }
        } catch (error) {
            console.error("Delete account error", error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={getAvatarSource(userData?.avatar_url)}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.userName}>{userData?.username || 'User'}</Text>
                <Text style={styles.userEmail}>{userData?.email || ''}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userData?.level || 0}</Text>
                    <Text style={styles.statLabel}>Badges</Text>
                </View>
                <View style={styles.statCard}>
                    {/* TODO: Get friends count from API */}
                    <Text style={styles.statValue}>{0 || 0}</Text>
                    <Text style={styles.statLabel}>Friends</Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('EditProfile', userData)}
                >
                    <Ionicons name="create-outline" size={24} color="#ffffff" />
                    <Text style={styles.menuItemText}>Edit Profile</Text>
                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setShowDeleteModal(true)}
                >
                    <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
                    <Text style={[styles.menuItemText, { color: '#ff4d4d' }]}>Delete Account</Text>
                </TouchableOpacity>
            </View>

            {/* Delete Account Modal */}
            <Modal
                visible={showDeleteModal}
                animationType="slide"
                transparent
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <LottieView
                            source={require('../assets/warning.json')}
                            autoPlay
                            loop
                            style={{ width: 40, height: 40 }}
                        />
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to delete your account? This action cannot be undone.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeleteAccount}
                            >
                                <Text style={styles.modalButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}