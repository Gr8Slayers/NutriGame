import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { setItem, getItem, removeItem } from '../storage';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { API_URL } from '../env';

import styles from '../styles/ProfileSettingsMenu';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { UserProfile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

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
    const { t } = useLanguage();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'ProfileSettingsMenu'>>();
    const [userData, setUserData] = useState(route.params);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listModalVisible, setListModalVisible] = useState(false);
    const [listModalTitle, setListModalTitle] = useState('');
    const [listModalUsers, setListModalUsers] = useState<{ id: string; username: string; avatarUrl: string | null }[]>([]);
    const [listModalLoading, setListModalLoading] = useState(false);

    const fetchLatestProfile = useCallback(async () => {
        try {
            const token = await getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) return;

            const data = await res.json();
            if (data.success && data.data) {
                setUserData(data.data);
            }
        } catch (error) {
            console.error('Fetch latest profile error', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void fetchLatestProfile();
        }, [fetchLatestProfile])
    );

    const fetchUserList = async (type: 'followers' | 'following') => {
        const userId = userData?.id;
        if (!userId) return;
        setListModalTitle(type === 'followers' ? (t('profile_followers') || 'Followers') : (t('profile_following') || 'Following'));
        setListModalUsers([]);
        setListModalVisible(true);
        setListModalLoading(true);
        try {
            const token = await getItem('userToken');
            const res = await fetch(`${API_URL}/api/social/${type}/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setListModalUsers(data.data);
        } catch (e) {
            console.error(`Fetch ${type} error:`, e);
        } finally {
            setListModalLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const token = await getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/api/user/profile`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                await removeItem('userToken');
                await removeItem('rememberMeFlag');
                setShowDeleteModal(false);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'SignUp' as never }],
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
                    <Text style={styles.statValue}>{userData?.badgeCount || 0}</Text>
                    <Text style={styles.statLabel}>{t('profile_badges') || 'Badges'}</Text>
                </View>
                <TouchableOpacity style={styles.statCard} onPress={() => fetchUserList('followers')}>
                    <Text style={styles.statValue}>{userData?.followerCount || 0}</Text>
                    <Text style={styles.statLabel}>{t('profile_followers') || 'Followers'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => fetchUserList('following')}>
                    <Text style={styles.statValue}>{userData?.followingCount || 0}</Text>
                    <Text style={styles.statLabel}>{t('profile_following') || 'Following'}</Text>
                </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('LegalPolicies' as never)}
                >
                    <Ionicons name="document-text-outline" size={24} color="#ffffff" />
                    <Text style={styles.menuItemText}>{t('legal_policies_title')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('EditProfile', userData)}
                >
                    <Ionicons name="create-outline" size={24} color="#ffffff" />
                    <Text style={styles.menuItemText}>{t('edit_profile_title') || 'Edit Profile'}</Text>
                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setShowDeleteModal(true)}
                >
                    <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
                    <Text style={[styles.menuItemText, { color: '#ff4d4d' }]}>{t('delete_account') || 'Delete Account'}</Text>
                </TouchableOpacity>
            </View>

            {/* Followers / Following List Modal */}
            <Modal
                visible={listModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setListModalVisible(false)}
            >
                <View style={styles.listModalOverlay}>
                    <View style={styles.listModalSheet}>
                        <View style={styles.listModalHeader}>
                            <Text style={styles.listModalTitle}>{listModalTitle}</Text>
                            <TouchableOpacity onPress={() => setListModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#f7e5c5" />
                            </TouchableOpacity>
                        </View>
                        {listModalLoading ? (
                            <ActivityIndicator size="large" color="#47dd7c" style={{ marginVertical: 24 }} />
                        ) : (
                            <FlatList
                                data={listModalUsers}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.userListItem}
                                        onPress={() => {
                                            setListModalVisible(false);
                                            navigation.navigate('UserProfile', { userId: item.id });
                                        }}
                                    >
                                        <Image source={getAvatarSource(item.avatarUrl ?? undefined)} style={styles.userListAvatar} />
                                        <Text style={styles.userListName}>{item.username}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.emptyListText}>Henüz kimse yok</Text>}
                            />
                        )}
                    </View>
                </View>
            </Modal>

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
                        <Text style={styles.modalTitle}>{t('delete_account') || 'Delete Account'}</Text>
                        <Text style={styles.modalMessage}>
                            {t('delete_account_msg') || 'Are you sure you want to delete your account? This action cannot be undone.'}
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.modalButtonText}>{t('cancel') || 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeleteAccount}
                            >
                                <Text style={styles.modalButtonText}>{t('delete') || 'Delete'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
