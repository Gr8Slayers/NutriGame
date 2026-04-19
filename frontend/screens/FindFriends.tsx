import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../env';
import { PublicUser } from '../types';
import styles from '../styles/FindFriends';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'FindFriends'>;

export default function FindFriends({ navigation, route }: Props) {
    const selectMode = route.params?.selectMode ?? false;
    const onSelectUser = route.params?.onSelectUser;
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchUsers = useCallback(async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) {
            setResults([]);
            setSearched(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(
                `${API_URL}/api/user/search?query=${encodeURIComponent(trimmed)}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                const users: PublicUser[] = Array.isArray(data)
                    ? data
                    : data.data ?? [];
                setResults(users);
            } else {
                setResults([]);
            }
        } catch (e) {
            console.error('FindFriends arama hatası:', e);
            setResults([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    }, []);

    const handleChangeText = useCallback(
        (text: string) => {
            setQuery(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => searchUsers(text), 400);
        },
        [searchUsers]
    );

    const handleFollowToggle = useCallback(async (user: PublicUser) => {
        // Optimistic update
        setResults(prev =>
            prev.map(u =>
                u.id === user.id
                    ? { ...u, isFollowing: !u.isFollowing }
                    : u
            )
        );
        try {
            const token = await SecureStore.getItemAsync('userToken');
            await fetch(`${API_URL}/api/social/follow/${user.id}`, {
                method: user.isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (e) {
            console.error('Follow hatası:', e);
            // Revert on error
            setResults(prev =>
                prev.map(u =>
                    u.id === user.id
                        ? { ...u, isFollowing: user.isFollowing }
                        : u
                )
            );
        }
    }, []);

    const handleSelectUser = useCallback((item: PublicUser) => {
        if (onSelectUser) {
            onSelectUser(item.id, item.username);
        }
        navigation.goBack();
    }, [onSelectUser, navigation]);

    const renderUser = useCallback(
        ({ item }: { item: PublicUser }) => (
            <View style={styles.userCard}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => !selectMode && navigation.navigate('UserProfile', { userId: item.id })}
                    activeOpacity={selectMode ? 1 : 0.7}
                >
                    <View style={styles.avatarContainer}>
                        {item.avatarUrl ? (
                            <Image
                                source={{ uri: item.avatarUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={22} color="#c8a96e" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.username} numberOfLines={1}>
                        {item.username}
                    </Text>
                </TouchableOpacity>
                {selectMode ? (
                    <TouchableOpacity
                        style={styles.followButton}
                        onPress={() => handleSelectUser(item)}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.followButtonText}>Select</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            item.isFollowing && styles.followingButton,
                        ]}
                        onPress={() => handleFollowToggle(item)}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={[
                                styles.followButtonText,
                                item.isFollowing && styles.followingButtonText,
                            ]}
                        >
                            {item.isFollowing ? t('find_friends_unfollow') : t('find_friends_follow')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        ),
        [handleFollowToggle, handleSelectUser, selectMode, navigation]
    );

    const ListEmpty = () => {
        if (loading) return null;
        if (!searched)
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={56} color="#5a4a3a" />
                    <Text style={styles.emptyText}>{t('find_friends_title')}</Text>
                    <Text style={styles.emptySubText}>
                        Search by username to discover people
                    </Text>
                </View>
            );
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#5a4a3a" />
                <Text style={styles.emptySubText}>{t('find_friends_no_results')} "{query}"</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('find_friends_title')}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search bar */}
            <View style={styles.searchBarContainer}>
                <Ionicons
                    name="search"
                    size={18}
                    color="#8a7060"
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('find_friends_placeholder')}
                    placeholderTextColor="#6b5440"
                    value={query}
                    onChangeText={handleChangeText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            setQuery('');
                            setResults([]);
                            setSearched(false);
                        }}
                    >
                        <Ionicons name="close-circle" size={18} color="#6b5440" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && (
                <ActivityIndicator
                    style={styles.loader}
                    size="small"
                    color="#c8a96e"
                />
            )}

            <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={renderUser}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
