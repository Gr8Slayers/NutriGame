import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Alert,
    Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { IP_ADDRESS } from '@env';
import styles from '../styles/UserProfile';
import { BadgeImages } from '../constants/BadgeImages';

const API_URL = `http://${IP_ADDRESS}:3000`;
const DEFAULT_AVATAR = require('../assets/default_avatar.png');

const getAvatarSource = (path: string | null | undefined) => {
    if (!path) return DEFAULT_AVATAR;
    if (path.startsWith('http')) return { uri: path };
    if (path.startsWith('/')) return { uri: `${API_URL}${path}` };

    // Legacy support for fixed asset paths
    switch (path.trim()) {
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
        default: return DEFAULT_AVATAR;
    }
}

const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            const parts = url.split('/api/images/');
            if (parts.length > 1) {
                return `${API_URL}/api/images/${parts[1]}`;
            }
        }
        return url;
    }
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};



type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

interface ProfileData {
    id: string;
    username: string;
    avatarUrl: string | null;
    streak: {
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
    };
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    postCount: number;
    badges: Array<{
        id: string;
        name: string;
        description: string;
        iconName: string;
        earnedAt: string;
    }>;
}

interface RecipePost {
    id: string;
    caption: string;
    imageUrl: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isRecipe: boolean;
    recipeDetails?: {
        title: string;
        calories: number;
        ingredients: string;
        instructions: string;
        preparationTime?: number;
    };
    userId: string;
    username: string;
    userAvatar: string | null;
}

interface UserListItem {
    id: string;
    username: string;
    avatarUrl: string | null;
}

export default function UserProfile({ navigation, route }: Props) {
    const { userId } = route.params;
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<RecipePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState<UserListItem[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    const toggleExpand = (postId: string) => {
        setExpandedPosts(prev => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    const fetchProfile = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const myId = await SecureStore.getItemAsync('userId');
            setCurrentUserId(myId);

            const res = await fetch(`${API_URL}/api/user/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
            }
        } catch (e) {
            console.error('Profile fetch error:', e);
        }
    }, [userId]);

    const fetchPosts = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/social/posts/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const recipePosts = (data.data || []).filter((p: RecipePost) => p.isRecipe);
                setPosts(recipePosts);
            }
        } catch (e) {
            console.error('Posts fetch error:', e);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            Promise.all([fetchProfile(), fetchPosts()]).finally(() => setLoading(false));
        }, [fetchProfile, fetchPosts])
    );

    const handleFollowToggle = async () => {
        if (!profile || followLoading) return;
        setFollowLoading(true);

        // Optimistic update
        setProfile(prev => prev ? {
            ...prev,
            isFollowing: !prev.isFollowing,
            followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1,
        } : null);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            await fetch(`${API_URL}/api/social/follow/${userId}`, {
                method: profile.isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (e) {
            // Revert on error
            setProfile(prev => prev ? {
                ...prev,
                isFollowing: !prev.isFollowing,
                followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1,
            } : null);
            console.error('Follow error:', e);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleDeletePost = (postId: string) => {
        Alert.alert('Are you sure?', 'Do you really want to delete this post?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await SecureStore.getItemAsync('userToken');
                        const res = await fetch(`${API_URL}/api/social/post/${postId}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                            setPosts(prev => prev.filter(p => p.id !== postId));
                            setProfile(prev => prev ? { ...prev, postCount: prev.postCount - 1 } : null);
                        } else {
                            Alert.alert('Error', 'Could not delete post.');
                        }
                    } catch (e) {
                        Alert.alert('Error', 'Something went wrong.');
                    }
                }
            }
        ]);
    };

    const fetchUserList = async (type: 'followers' | 'following') => {
        setModalTitle(type === 'followers' ? 'Followers' : 'Following');
        setModalUsers([]);
        setIsModalVisible(true);
        setModalLoading(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/social/${type}/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setModalUsers(data.data);
            }
        } catch (error) {
            console.error(`Fetch ${type} error:`, error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleUserClick = (targetId: string) => {
        setIsModalVisible(false);
        if (targetId === String(userId)) return;
        navigation.push('UserProfile', { userId: targetId });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#c8a96e" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centered}>
                    <Text style={{ color: '#a0896e', fontSize: 16 }}>User not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header: Avatar + Username + Follow */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarLargePlaceholder}>
                        <Image source={getAvatarSource(profile.avatarUrl)} style={styles.avatarLarge} />
                    </View>
                    <Text style={styles.username}>{profile.username}</Text>
                    {currentUserId !== String(userId) && (
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                profile.isFollowing && styles.unfollowButton,
                            ]}
                            onPress={handleFollowToggle}
                            disabled={followLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.followButtonText,
                                profile.isFollowing && styles.unfollowButtonText,
                            ]}>
                                {profile.isFollowing ? 'Unfollow' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statItem} onPress={() => fetchUserList('followers')}>
                        <Text style={styles.statValue}>{profile.followerCount}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => fetchUserList('following')}>
                        <Text style={styles.statValue}>{profile.followingCount}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile.postCount}</Text>
                        <Text style={styles.statLabel}>Recipes</Text>
                    </View>
                </View>

                {/* Streak Card */}
                <View style={styles.streakCard}>
                    <View style={styles.streakHeader}>
                        <Ionicons name="flame" size={22} color="#e87c3e" />
                        <Text style={styles.streakTitle}>Streak</Text>
                    </View>
                    <View style={styles.streakStatsRow}>
                        <View style={styles.streakStatItem}>
                            <Text style={styles.streakStatValue}>{profile.streak.currentStreak}</Text>
                            <Text style={styles.streakStatLabel}>Current</Text>
                        </View>
                        <View style={styles.streakStatItem}>
                            <Text style={styles.streakStatValue}>{profile.streak.longestStreak}</Text>
                            <Text style={styles.streakStatLabel}>Longest</Text>
                        </View>
                        <View style={styles.streakStatItem}>
                            <Text style={styles.streakStatValue}>{profile.streak.totalPoints}</Text>
                            <Text style={styles.streakStatLabel}>Points</Text>
                        </View>
                    </View>
                </View>

                {/* Badges */}
                <View style={styles.badgesSection}>
                    <Text style={styles.sectionTitle}>Badges</Text>
                    {profile.badges.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                            {profile.badges.map(badge => (
                                <View key={badge.id} style={styles.badgeItem}>
                                    <View style={styles.badgeIcon}>
                                        {BadgeImages[badge.iconName] ? (
                                            <Image 
                                                source={BadgeImages[badge.iconName]} 
                                                style={{ width: 30, height: 30, resizeMode: 'contain' }} 
                                            />
                                        ) : (
                                            <Ionicons name={badge.iconName as any} size={22} color="#c8a96e" />
                                        )}
                                    </View>
                                    <Text style={styles.badgeName} numberOfLines={2}>{badge.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.noBadgesText}>No badges earned yet</Text>
                    )}
                </View>

                {/* Recipe Posts */}
                <View style={styles.postsSection}>
                    <Text style={styles.sectionTitle}>Recipes</Text>
                    {posts.length > 0 ? (
                        posts.map(post => {
                            const isExpanded = expandedPosts.has(post.id);
                            const recipe = post.recipeDetails;

                            return (
                                <View key={post.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>

                                            <View style={styles.userInfo}>
                                                <Text style={styles.timestamp}>
                                                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                    })}
                                                </Text>
                                            </View>
                                        </View>

                                        {currentUserId === String(userId) ? (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#ff4444',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 12,
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }}
                                                onPress={() => handleDeletePost(post.id)}
                                            >
                                                <Ionicons name="trash-outline" size={12} color="#fff" />
                                                <Text style={{ color: '#fff', fontSize: 10, marginLeft: 2, fontWeight: 'bold' }}>Remove</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.recipeBadge}>
                                                <Ionicons name="restaurant-outline" size={12} color="#fff" />
                                                <Text style={styles.recipeBadgeText}>Recipe</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Post Image */}
                                    {post.imageUrl && (
                                        <Image
                                            source={{ uri: getImageUrl(post.imageUrl) as string }}
                                            style={styles.postImage}
                                        />
                                    )}

                                    {/* Recipe Header */}
                                    {recipe && (
                                        <View style={styles.recipeHeader}>
                                            <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                            <View style={styles.calorieBadge}>
                                                <Ionicons name="flame-outline" size={14} color="#e87c3e" />
                                                <Text style={styles.calorieText}>{recipe.calories} kcal</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Caption */}
                                    {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

                                    {/* Expand Button */}
                                    {recipe && (
                                        <TouchableOpacity
                                            style={styles.expandButton}
                                            onPress={() => toggleExpand(post.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.expandButtonText}>{isExpanded ? 'Hide Recipe' : 'Show Recipe'}</Text>
                                            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#c8a96e" />
                                        </TouchableOpacity>
                                    )}

                                    {/* Recipe Details */}
                                    {isExpanded && recipe && (
                                        <View style={styles.recipeDetails}>
                                            {recipe.preparationTime != null && (
                                                <View style={styles.prepTimeRow}>
                                                    <Ionicons name="time-outline" size={14} color="#a0896e" />
                                                    <Text style={styles.prepTimeText}>Prep Time: {recipe.preparationTime} min</Text>
                                                </View>
                                            )}
                                            <Text style={styles.sectionLabel}>Ingredients</Text>
                                            <Text style={styles.sectionContent}>{recipe.ingredients}</Text>
                                            <Text style={styles.sectionLabel}>Instructions</Text>
                                            <Text style={styles.sectionContent}>{recipe.instructions}</Text>
                                        </View>
                                    )}

                                    {/* Card Footer (Likes/Comments - View only/Stats) */}
                                    <View style={styles.cardFooter}>
                                        <View style={styles.actionButton}>
                                            <Ionicons name="heart" size={18} color="#e55353" />
                                            <Text style={styles.actionCount}>{post.likesCount}</Text>
                                        </View>
                                        <View style={styles.actionButton}>
                                            <Ionicons name="chatbubble-outline" size={18} color="#a0896e" />
                                            <Text style={styles.actionCount}>{post.commentsCount}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.noPostsContainer}>
                            <Ionicons name="restaurant-outline" size={40} color="#5a4a3a" />
                            <Text style={styles.noPostsText}>No recipes yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Followers/Following Modal */}
            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#f7e5c5" />
                            </TouchableOpacity>
                        </View>

                        {modalLoading ? (
                            <ActivityIndicator size="large" color="#c8a96e" style={{ marginVertical: 20 }} />
                        ) : (
                            <FlatList
                                data={modalUsers}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.modalList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.userListItem}
                                        onPress={() => handleUserClick(item.id)}
                                    >
                                        <Image source={getAvatarSource(item.avatarUrl)} style={styles.modalAvatar} />
                                        <Text style={styles.modalUsername}>{item.username}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyModalText}>No users found</Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
