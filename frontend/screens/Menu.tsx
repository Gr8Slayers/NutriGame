import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { IP_ADDRESS } from "@env";
import styles from '../styles/Menu';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export default function Menu() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // reduced to 5s
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (res.ok && data.success) {
                setProfile(data.data);
            } else {
                console.log("Menu profile fetch not successful:", data);
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.log('Menu: Profil isteği zaman aşımına uğradı');
                Alert.alert('Bağlantı Hatası', 'Profil bilgileri yüklenemedi (Zaman aşımı).');
            } else {
                console.log("Error fetching profile:", error);
                Alert.alert('Hata', 'Profil bilgileri yüklenirken bir sorun oluştu.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('rememberMeFlag');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
            });
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#47dd7caf" />
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
            </TouchableOpacity>

            {/* Header with Avatar */}
            <View style={styles.header}>

                <View style={styles.avatarContainer}>
                    <Image
                        source={getAvatarSource(profile?.avatar_url)}
                        style={styles.avatar}
                    />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{profile?.username || "User"}</Text>
                </View>
                {/* Streak */}
                <View style={styles.streakContainer}>
                    <View>
                        <Text style={styles.streakLabel}>Streak</Text>
                        <Text style={styles.streakValue}>{0 || 0}</Text>
                    </View>
                    <View style={styles.streakIconContainer}>
                        <LottieView
                            source={require('../assets/streak.json')}
                            autoPlay
                            loop
                            style={{ width: 40, height: 40 }}
                        />
                    </View>
                </View>
            </View>

            {/* Stats / Goal */}
            <View style={styles.goalContainer}>
                <View>
                    <Text style={styles.goalLabel}>Target Weight</Text>
                    <Text style={styles.goalValue}>{profile?.target_weight ? `${profile.target_weight} kg` : "Not Set"}</Text>
                </View>
                <View style={styles.goalIconContainer}>
                    <Ionicons name="trophy-outline" size={24} color="#f7e5c5" />
                </View>
            </View>



            {/* Menu Options */}
            <View style={styles.menuList}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ProfileSettingsMenu", profile || { username: '', email: '' })}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="person-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>Profile Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "Dietary preferences will be available soon!")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="nutrition-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>Daily Weight Entry</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "Notifications will be available soon!")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="notifications-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#e57373" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}
