import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { setItem, getItem, removeItem } from '../storage';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { API_URL } from '../env';
import styles from '../styles/Menu';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserProfile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

// Helper to resolve avatar paths
const getAvatarSource = (path: string | undefined) => {
    if (!path) return require('../assets/default_avatar.png');
    if (path.startsWith('http')) return { uri: path };
    if (path.startsWith('/')) return { uri: `${API_URL}${path}` };

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
    const { t, language, setLanguage } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [streakValue, setStreakValue] = useState<number>(0);

    const fetchProfileAndStreak = useCallback(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
            const token = await getItem('userToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const [profileRes, streakRes] = await Promise.all([
                fetch(`${API_URL}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                }),
                fetch(`${API_URL}/api/gamification/streak`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                })
            ]);

            const profileData = await profileRes.json();
            const streakData = await streakRes.json();

            if (profileRes.ok && profileData.success) {
                setProfile(profileData.data);
            }

            if (streakRes.ok && streakData.success) {
                setStreakValue(streakData.data.currentStreak);
            }

            clearTimeout(timeoutId);
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.log("İstek zaman aşımına uğradı.");
            } else {
                console.log("Veri çekme hatası:", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfileAndStreak();
        }, [fetchProfileAndStreak])
    );

    const handleLogout = async () => {
        try {
            const token = await getItem('userToken');
            if (token) {
                // Push token'ı backend'den temizle; hata olursa yine de logout yap
                fetch(`${API_URL}/api/user/push-token`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ expoPushToken: null }),
                }).catch(() => {});
            }
            await removeItem('userToken');
            await removeItem('rememberMeFlag');
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
                        <Text style={styles.streakLabel}>{t('menu_streak')}</Text>
                        <Text style={styles.streakValue}>{streakValue || 0}</Text>
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
                    <Text style={styles.goalLabel}>{t('menu_target_weight')}</Text>
                    <Text style={styles.goalValue}>{profile?.target_weight ? `${profile.target_weight} kg` : t('menu_not_set')}</Text>
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
                    <Text style={styles.menuText}>{t('menu_profile_settings')}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Challenges")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="trophy-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>{t('menu_challenges')}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("DailyWeight")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="nutrition-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>{t('menu_daily_weight')}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("WeeklySummary")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="pie-chart-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>{t('menu_weekly_summary')}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Notifications")}>
                    <View style={styles.menuIconBox}>
                        <Ionicons name="notifications-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>{t('menu_notifications')}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#5c544d" />
                </TouchableOpacity>

                {/* Language Toggle */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                >
                    <View style={styles.menuIconBox}>
                        <Ionicons name="globe-outline" size={20} color="#47dd7caf" />
                    </View>
                    <Text style={styles.menuText}>{t('menu_language')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[{ fontSize: 13, fontWeight: '700' }, language === 'en' ? { color: '#47dd7caf' } : { color: '#5c544d' }]}>EN</Text>
                        <Text style={{ color: '#5c544d', fontSize: 13 }}>/</Text>
                        <Text style={[{ fontSize: 13, fontWeight: '700' }, language === 'tr' ? { color: '#47dd7caf' } : { color: '#5c544d' }]}>TR</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#e57373" />
                <Text style={styles.logoutText}>{t('menu_logout')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
