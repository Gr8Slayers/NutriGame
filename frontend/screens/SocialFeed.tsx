import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/SocialFeed';
import { Ionicons } from '@expo/vector-icons';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { Post, Comment } from '../types';

const API_URL = `http://${IP_ADDRESS}:3000`;


type Props = NativeStackScreenProps<RootStackParamList, 'SocialFeed'>;

function SocialFeed({ navigation }: Props) {
    const [feedData, setFeedData] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    const fetchFeed = useCallback(async (): Promise<void> => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const url = `${API_URL}/api/social/get_feed`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const rawText = await res.text();
            if (!res.ok) {
                console.error('Sunucu hatası:', res.status);
                return;
            }
            let data: any;
            try { data = JSON.parse(rawText); } catch {
                console.error('JSON parse hatası:', rawText.slice(0, 200));
                return;
            }
            const recipePosts: Post[] = (Array.isArray(data) ? data : data.data ?? [])
                .filter((p: Post) => p.isRecipe === true);
            setFeedData(recipePosts);
        } catch (error) {
            console.error('Ağ hatası:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchFeed(); }, [fetchFeed]));

    const handleRefresh = useCallback(() => { setRefreshing(true); fetchFeed(); }, [fetchFeed]);

    const toggleExpand = useCallback((postId: string) => {
        setExpandedPosts(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });
    }, []);

    const toggleComments = useCallback(async (postId: string) => {
        const isOpening = !expandedComments.has(postId);

        setExpandedComments(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });

        // Açılıyorsa ve yorumlar henüz yüklenmemişse backend'den çek
        if (!isOpening || commentsByPost[postId]) return;

        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/social/comments/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setCommentsByPost(prev => ({ ...prev, [postId]: data.data ?? [] }));
        } catch (e) {
            console.error('Yorumlar yüklenemedi:', e);
        }
    }, [expandedComments, commentsByPost]);

    const handleLike = useCallback(async (post: Post) => {
        const token = await SecureStore.getItemAsync('userToken');
        try {
            await fetch(`${API_URL}/api/social/like/${post.id}`, {
                method: post.isLikedByCurrentUser ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
        } catch (e) { console.error('Beğeni hatası:', e); }
        setFeedData(prev =>
            prev.map(p => p.id === post.id
                ? {
                    ...p,
                    isLikedByCurrentUser: !p.isLikedByCurrentUser,
                    likesCount: p.isLikedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1,
                }
                : p
            )
        );
    }, []);

    const handleSubmitComment = useCallback(async (postId: string) => {
        const text = (commentInputs[postId] ?? '').trim();
        if (!text) return;

        const newComment: Comment = {
            id: `local_${Date.now()}`,
            postId,
            userId: 'me',
            username: 'you',
            text,
            createdAt: new Date().toISOString(),
        };

        const token = await SecureStore.getItemAsync('userToken');
        try {
            await fetch(`${API_URL}/api/social/comment/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text }),
            });
        } catch (e) { console.error('Yorum hatası:', e); }

        setCommentsByPost(prev => ({
            ...prev,
            [postId]: [...(prev[postId] ?? []), newComment],
        }));
        setFeedData(prev =>
            prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p)
        );
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }, [commentInputs]);

    const handleNewPost = () => {
        navigation.navigate('NewPost');
    };

    const renderPost = ({ item: post }: { item: Post }) => {
        const isExpanded = expandedPosts.has(post.id);
        const commentsOpen = expandedComments.has(post.id);
        const recipe = post.recipeDetails;
        const comments = commentsByPost[post.id] ?? [];
        const inputText = commentInputs[post.id] ?? '';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        {post.userAvatar
                            ? <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                            : <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={20} color="#c8a96e" />
                            </View>
                        }
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.username}>{post.username}</Text>
                        <Text style={styles.timestamp}>
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </Text>
                    </View>
                    <View style={styles.recipeBadge}>
                        <Ionicons name="restaurant-outline" size={12} color="#fff" />
                        <Text style={styles.recipeBadgeText}>Recipe</Text>
                    </View>
                </View>

                {/* Görsel */}
                {post.imageUrl
                    ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                    : null
                }

                {recipe && (
                    <View style={styles.recipeHeader}>
                        <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        <View style={styles.calorieBadge}>
                            <Ionicons name="flame-outline" size={14} color="#e87c3e" />
                            <Text style={styles.calorieText}>{recipe.calories} kcal</Text>
                        </View>
                    </View>
                )}

                {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

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

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post)} activeOpacity={0.7}>
                        <Ionicons
                            name={post.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
                            size={22}
                            color={post.isLikedByCurrentUser ? '#e55353' : '#a0896e'}
                        />
                        <Text style={styles.actionCount}>{post.likesCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleComments(post.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={commentsOpen ? 'chatbubble' : 'chatbubble-outline'}
                            size={20}
                            color={commentsOpen ? '#c8a96e' : '#a0896e'}
                        />
                        <Text style={styles.actionCount}>{post.commentsCount}</Text>
                    </TouchableOpacity>
                </View>

                {commentsOpen && (
                    <View style={styles.commentSection}>
                        {comments.length === 0 ? (
                            <Text style={styles.noCommentText}>No comments yet. Be the first!</Text>
                        ) : (
                            comments.map(c => (
                                <View key={c.id} style={styles.commentRow}>
                                    {c.userAvatar
                                        ? <Image source={{ uri: c.userAvatar }} style={styles.commentAvatar} />
                                        : <View style={styles.commentAvatarPlaceholder}>
                                            <Ionicons name="person" size={12} color="#c8a96e" />
                                        </View>
                                    }
                                    <View style={styles.commentBubble}>
                                        <Text style={styles.commentUsername}>{c.username}</Text>
                                        <Text style={styles.commentText}>{c.text}</Text>
                                    </View>
                                </View>
                            ))
                        )}

                        <View style={styles.commentInputRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment..."
                                placeholderTextColor="#6b5440"
                                value={inputText}
                                onChangeText={t => setCommentInputs(prev => ({ ...prev, [post.id]: t }))}
                                onSubmitEditing={() => handleSubmitComment(post.id)}
                                returnKeyType="send"
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                                onPress={() => handleSubmitComment(post.id)}
                                disabled={!inputText.trim()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="send" size={18} color={inputText.trim() ? '#c8a96e' : '#4d3826'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Feed</Text>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
                    <Ionicons name="menu" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#c8a96e" />
                </View>
            ) : feedData.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="restaurant-outline" size={56} color="#5a4a3a" />
                    <Text style={styles.emptyText}>No Feed</Text>
                    <Text style={styles.emptySubText}>Share your first recipe!</Text>
                </View>
            ) : (
                <FlatList
                    data={feedData}
                    keyExtractor={item => item.id}
                    renderItem={renderPost}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#c8a96e"
                            colors={['#c8a96e']}
                        />
                    }
                />
            )}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.newPostButton} onPress={handleNewPost}>
                    <Ionicons name="add" size={24} color="#333" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView >
    );
}

export default SocialFeed;