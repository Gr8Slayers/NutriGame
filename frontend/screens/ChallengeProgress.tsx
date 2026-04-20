import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { RootStackParamList } from '../App';
import styles from '../styles/ChallengeProgress';
import { API_URL } from '../env';
import { setItem, getItem, removeItem } from '../storage';
import BadgeAwardModal from '../components/BadgeAwardModal';
import { useLanguage } from '../i18n/LanguageContext';
import { Comment } from '../types';

const DEFAULT_AVATAR = require('../assets/default_avatar.png');

const getFeedImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface ChallengePost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string | null;
  imageUrl: string | null;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLikedByCurrentUser: boolean;
}

const BASE_URL = `${API_URL}/api`;

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeProgress'>;

interface DayHistoryItem {
  date: string;
  status: 'success' | 'fail' | 'today' | 'upcoming';
}

const ChallengeProgress: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const [challengeData, setChallengeData] = useState<any>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [todayCurrent, setTodayCurrent] = useState(0);
  const [dayHistory, setDayHistory] = useState<DayHistoryItem[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<any | null>(null);
  const [feedPosts, setFeedPosts] = useState<ChallengePost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [currentUsername, setCurrentUsername] = useState<string>('you');
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { challengeId } = route.params;
    setFeedLoading(true);
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/social/challenge_feed/${challengeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (res.success) setFeedPosts(res.data ?? []);
    } catch (e) {
      console.error('Challenge feed yüklenemedi:', e);
    } finally {
      setFeedLoading(false);
    }
  }, [route.params]);

  const toggleComments = useCallback(async (postId: string) => {
    const isOpening = !expandedComments.has(postId);
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    if (!isOpening) return;
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/social/comments/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCommentsByPost(prev => ({ ...prev, [postId]: data.data ?? [] }));
    } catch (e) {
      console.error('Yorumlar yüklenemedi:', e);
    }
  }, [expandedComments]);

  const handleSubmitComment = useCallback(async (postId: string) => {
    const text = (commentInputs[postId] ?? '').trim();
    if (!text) return;
    const userId = (await getItem('userId')) ?? 'me';
    const optimistic: Comment = {
      id: `local_${Date.now()}`,
      postId,
      userId,
      username: currentUsername,
      text,
      createdAt: new Date().toISOString(),
    };
    setCommentsByPost(prev => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), optimistic],
    }));
    setFeedPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p)
    );
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    try {
      const token = await getItem('userToken');
      await fetch(`${BASE_URL}/social/comment/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
    } catch (e) {
      console.error('Yorum hatası:', e);
    }
  }, [commentInputs, currentUsername]);

  const toggleLike = async (post: ChallengePost) => {
    setFeedPosts(prev => prev.map(p => p.id === post.id ? {
      ...p,
      isLikedByCurrentUser: !p.isLikedByCurrentUser,
      likesCount: p.isLikedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1,
    } : p));
    try {
      const token = await getItem('userToken');
      await fetch(`${BASE_URL}/social/like/${post.id}`, {
        method: post.isLikedByCurrentUser ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
    } catch (e) { console.error('Like hatası:', e); }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getItem('userId');
      setCurrentUserId(userId);
      const username = await getItem('username');
      if (username) setCurrentUsername(username);
    };
    fetchUserId();

    let pollId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      fetchProgress();
      fetchFeed();
      if (pollId) clearInterval(pollId);
      pollId = setInterval(() => {
        fetchProgress();
        fetchFeed();
      }, 10000);
    };

    const stopPolling = () => {
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    startPolling();
    const unsubFocus = navigation.addListener('focus', startPolling);
    const unsubBlur = navigation.addListener('blur', stopPolling);

    return () => {
      stopPolling();
      unsubFocus();
      unsubBlur();
    };
  }, [navigation, fetchFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProgress(), fetchFeed()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  const fetchProgress = async (): Promise<void> => {
    const { challengeId } = route.params;
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/gamification/challenge/progress?challengeId=${challengeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();

      if (res.success) {
        const d = res.data;
        setChallengeData(d);
        setCurrentProgress(d.progress);
        setTodayCurrent(d.todayCurrent || 0);
        setDayHistory(d.dayHistory || []);
        setIsLoading(false);
        if (d.progress >= 100) {
          setIsCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const claimReward = async (): Promise<void> => {
    const { challengeId } = route.params;
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/gamification/challenge/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId })
      });
      const res = await response.json();

      if (res.success) {
        if (res.earnedBadge) {
          setEarnedBadge(res.earnedBadge);
          setIsBadgeModalVisible(true);
        } else {
          Alert.alert(t('success'), 'Badge earned and points added!');
          navigation.goBack();
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), 'Reward could not be obtained.');
    }
  };

  const leaveChallenge = async (): Promise<void> => {
    const { challengeId } = route.params;
    Alert.alert(
      t('warning'),
      'Are you sure you want to leave this challenge?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getItem('userToken');
              const response = await fetch(`${BASE_URL}/gamification/challenge/${challengeId}/leave`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const res = await response.json();
              if (res.success) {
                navigation.goBack();
              } else {
                Alert.alert(t('error'), res.message || 'Could not leave challenge.');
              }
            } catch (e) {
              console.error(e);
              Alert.alert(t('error'), 'Connection error.');
            }
          },
        },
      ]
    );
  };

  const deleteChallenge = async (): Promise<void> => {
    const { challengeId } = route.params;

    Alert.alert(
      t('warning'),
      'Are you sure you want to remove this challenge? This action cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getItem('userToken');
              const response = await fetch(`${BASE_URL}/gamification/challenge/${challengeId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const res = await response.json();

              if (res.success) {
                Alert.alert(t('success'), 'Challenge removed successfully.');
                navigation.goBack();
              } else {
                Alert.alert(t('error'), res.message || 'Failed to remove challenge.');
              }
            } catch (e) {
              console.error(e);
              Alert.alert(t('error'), 'Connection error.');
            }
          }
        }
      ]
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getDate()} ${months[s.getMonth()]} — ${e.getDate()} ${months[e.getMonth()]}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  const goal = challengeData?.goalValue || 100;
  const todayPercent = Math.min(100, Math.round((todayCurrent / goal) * 100));
  const successfulDays = dayHistory.filter(h => h.status === 'success').length;
  const remaining = Math.max(0, goal - todayCurrent);
  const unit = challengeData?.type === 'water' ? 'ml' : challengeData?.type === 'calorie' ? 'kcal' : challengeData?.type === 'sugar' ? 'g' : 'steps';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('challenge_progress_title')}</Text>
        {challengeData && currentUserId === String(challengeData.creatorId) ? (
          <TouchableOpacity onPress={deleteChallenge}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        ) : challengeData ? (
          <TouchableOpacity onPress={leaveChallenge}>
            <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2ECC71"
            colors={["#2ECC71"]}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, marginRight: 10 }}>
              <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={challengeData?.type === 'water' ? 'water-outline' : 'flame-outline'} size={30} color="#2ECC71" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{challengeData?.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {formatDateRange(challengeData.startDate, challengeData.endDate)} · {challengeData.durationDays} day
                </Text>
              </View>
            </View>
            {todayCurrent >= goal ? (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                <Text style={styles.statusBadgeText}>{t('challenge_progress_today_completed')}</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#3b301a' }]}>
                <Ionicons name="time-outline" size={14} color="#F1C40F" />
                <Text style={[styles.statusBadgeText, { color: '#F1C40F' }]}>{t('challenge_progress_ongoing')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>{t('challenge_progress_general')} · {successfulDays} / {challengeData.durationDays} {t('challenge_progress_days_successful')}</Text>
          <View style={styles.progressRow}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${currentProgress}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPercent}>{currentProgress}%</Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#2C2C2C', marginVertical: 25 }} />

          <Text style={styles.sectionLabel}>{t('challenge_progress_today_status')}</Text>
          <View style={styles.todayStatusCard}>
            {challengeData?.type === 'sugar' ? (
              <View style={[styles.todayValues, { flex: 1, paddingVertical: 10 }]}>
                <Text style={styles.todayMainValue}>
                  {todayCurrent.toLocaleString('tr-TR')} {unit}
                </Text>
                <Text style={[styles.todayRemaining, { color: todayCurrent <= goal ? '#2ECC71' : '#FF6B6B', marginTop: 8 }]}>
                  {todayCurrent <= goal ? `Success! Under or equal to ${goal}${unit} limit` : `Failed! Over ${goal}${unit} limit`}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.todayValues}>
                  <Text style={styles.todayMainValue}>
                    {todayCurrent.toLocaleString('tr-TR')} <Text style={styles.todayGoalValue}>/ {goal.toLocaleString('tr-TR')} {unit}</Text>
                  </Text>
                  <Text style={styles.todayRemaining}>{t('challenge_progress_remaining')}: {remaining.toLocaleString('tr-TR')} {unit}</Text>
                </View>
                <View style={styles.circularContainer}>
                  <AnimatedCircularProgress
                    size={80}
                    width={8}
                    fill={todayPercent}
                    tintColor="#2ECC71"
                    backgroundColor="#2C2C2C"
                    lineCap="round"
                    rotation={0}
                  >
                    {() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{todayPercent}%</Text>
                      </View>
                    )}
                  </AnimatedCircularProgress>
                </View>
              </>
            )}
          </View>

          <Text style={styles.sectionLabel}>{t('challenge_progress_history')}</Text>
          <View style={styles.historyGrid}>
            {dayHistory.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.historyDot,
                  item.status === 'success' ? styles.dotSuccess :
                    item.status === 'today' ? styles.dotToday :
                      item.status === 'upcoming' ? styles.dotUpcoming :
                        styles.dotFail
                ]}
              />
            ))}
          </View>
          <View style={styles.historyLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.legendText}>{t('challenge_progress_success')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
              <Text style={styles.legendText}>{t('today')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1, borderColor: '#444' }]} />
              <Text style={styles.legendText}>{t('challenge_progress_unsuccess')}</Text>
            </View>
          </View>
        </View>

        {isCompleted && !challengeData.rewardClaimed && (
          <TouchableOpacity style={styles.rewardButton} onPress={claimReward}>
            <Ionicons name="trophy" size={20} color="#000" />
            <Text style={styles.rewardButtonText}>{t('challenge_progress_claim')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>{t('challenge_progress_desc')}</Text>
          <Text style={{ color: '#CCCCCC', fontSize: 14, lineHeight: 22 }}>
            {challengeData.description || t('challenge_progress_no_desc')}
          </Text>
        </View>

        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>{t('challenge_feed_title')}</Text>
            <TouchableOpacity
              style={styles.feedShareBtn}
              onPress={() => navigation.navigate('NewPost', { challengeId: route.params.challengeId })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#000" />
              <Text style={styles.feedShareBtnText}>{t('share_to_challenge')}</Text>
            </TouchableOpacity>
          </View>

          {feedLoading ? (
            <ActivityIndicator color="#2ECC71" style={{ marginVertical: 20 }} />
          ) : feedPosts.length === 0 ? (
            <Text style={styles.feedEmpty}>{t('no_challenge_posts')}</Text>
          ) : (
            feedPosts.map(post => (
              <View key={post.id} style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Image
                    source={post.userAvatar ? { uri: post.userAvatar.startsWith('http') ? post.userAvatar : `${API_URL}${post.userAvatar}` } : DEFAULT_AVATAR}
                    style={styles.feedAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedUsername}>{post.username}</Text>
                    <Text style={styles.feedTimestamp}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                {post.imageUrl ? (
                  <Image source={{ uri: getFeedImageUrl(post.imageUrl) as string }} style={styles.feedImage} />
                ) : null}
                {post.caption ? <Text style={styles.feedCaption}>{post.caption}</Text> : null}
                <View style={styles.feedFooter}>
                  <TouchableOpacity style={styles.feedActionBtn} onPress={() => toggleLike(post)} activeOpacity={0.7}>
                    <Ionicons
                      name={post.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
                      size={20}
                      color={post.isLikedByCurrentUser ? '#e55353' : '#888'}
                    />
                    <Text style={styles.feedActionCount}>{post.likesCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.feedActionBtn}
                    onPress={() => toggleComments(post.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={expandedComments.has(post.id) ? 'chatbubble' : 'chatbubble-outline'}
                      size={18}
                      color={expandedComments.has(post.id) ? '#2ECC71' : '#888'}
                    />
                    <Text style={styles.feedActionCount}>{post.commentsCount}</Text>
                  </TouchableOpacity>
                </View>

                {expandedComments.has(post.id) && (
                  <View style={styles.commentSection}>
                    {(commentsByPost[post.id] ?? []).length === 0 ? (
                      <Text style={styles.noCommentText}>{t('no_comments_yet')}</Text>
                    ) : (
                      (commentsByPost[post.id] ?? []).map(c => (
                        <View key={c.id} style={styles.commentRow}>
                          <Image
                            source={c.userAvatar ? { uri: c.userAvatar.startsWith('http') ? c.userAvatar : `${API_URL}${c.userAvatar}` } : DEFAULT_AVATAR}
                            style={styles.commentAvatar}
                          />
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
                        value={commentInputs[post.id] ?? ''}
                        onChangeText={text => setCommentInputs(prev => ({ ...prev, [post.id]: text }))}
                        placeholder={t('add_comment')}
                        placeholderTextColor="#666"
                        multiline
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          !(commentInputs[post.id] ?? '').trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={() => handleSubmitComment(post.id)}
                        disabled={!(commentInputs[post.id] ?? '').trim()}
                      >
                        <Ionicons name="send" size={16} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <BadgeAwardModal
        isVisible={isBadgeModalVisible}
        onClose={() => {
          setIsBadgeModalVisible(false);
          navigation.goBack();
        }}
        badge={earnedBadge}
      />
    </View>
  );
};

export default ChallengeProgress;
