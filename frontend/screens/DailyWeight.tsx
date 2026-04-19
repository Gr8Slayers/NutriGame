import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, StyleSheet, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { API_URL } from '../env';
import * as SecureStore from 'expo-secure-store';
import { DailyProgress } from '../types';
import styles from '../styles/DailyWeight';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyWeight'>;

const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const C = {
    bg: '#473C33',
    header: '#ABC270',
    accent: '#ABC270',
    accentDim: 'rgba(171,194,112,0.14)',
    accentBorder: 'rgba(171,194,112,0.3)',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.1)',
    textPrimary: '#f7e5c5',
    textMuted: '#c8a96e',
    textDim: '#a0896e',
    textDark: '#333',
    barEmpty: 'rgba(255,255,255,0.06)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    white10: 'rgba(255,255,255,0.1)',
    white30: 'rgba(255,255,255,0.3)',
};



const DailyWeight: React.FC<Props> = ({ navigation }) => {
    const { t } = useLanguage();

    const MOOD_OPTIONS = [
        { label: t('terrible') || 'Terrible', emoji: '😫', value: 'terrible' },
        { label: t('bad') || 'Bad', emoji: '😕', value: 'bad' },
        { label: t('okay') || 'Okay', emoji: '😐', value: 'okay' },
        { label: t('good') || 'Good', emoji: '🙂', value: 'good' },
        { label: t('excellent') || 'Excellent', emoji: '🤩', value: 'excellent' },
    ];
    const DAYS_TR = [t('sun') || 'Sun', t('mon') || 'Mon', t('tue') || 'Tue', t('wed') || 'Wed', t('thu') || 'Thu', t('fri') || 'Fri', t('sat') || 'Sat'];
    const [progressData, setProgressData] = useState<DailyProgress[]>([]);
    const [todayWeight, setTodayWeight] = useState('');
    const [todayMood, setTodayMood] = useState('');
    const [todayMovement, setTodayMovement] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    const [targetWeight, setTargetWeight] = useState<number | null>(null);
    const [startWeight, setStartWeight] = useState<number | null>(null);
    const toastAnim = React.useRef(new Animated.Value(0)).current;

    const showToast = (msg: string) => {
        setToastMsg(msg);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(2200),
            Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const fetchProgressData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/progress/weekly`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json());
            if (res.success) setProgressData(res.data);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json());
            if (res.success && res.data) {
                setTargetWeight(res.data.target_weight);
                setStartWeight(res.data.weight);
            }
        } catch (e) { console.error(e); }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProgressData();
            fetchUserProfile();
        }, [fetchProgressData, fetchUserProfile])
    );

    // Pre-fill today's existing entry
    useEffect(() => {
        const todayStr = getLocalDateString(new Date());
        const todayEntry = progressData.find(d => {
            if (!d.date) return false;
            const dStr = typeof d.date === 'string' ? d.date.substring(0, 10) : getLocalDateString(new Date(d.date));
            return dStr === todayStr;
        });
        if (todayEntry) {
            if (todayEntry.currentWeight) setTodayWeight(String(todayEntry.currentWeight));
            if (todayEntry.mood) setTodayMood(todayEntry.mood);
            if (todayEntry.movement) setTodayMovement(String(todayEntry.movement));
        }
    }, [progressData]);

    const handleSave = async () => {
        if (!todayWeight && !todayMood && !todayMovement) return;
        setIsSubmitting(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const res = await fetch(`${API_URL}/api/progress/upsert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    date: getLocalDateString(new Date()),
                    currentWeight: todayWeight ? parseFloat(todayWeight) : undefined,
                    mood: todayMood || undefined,
                    movement: todayMovement ? parseInt(todayMovement) : undefined,
                }),
            }).then(r => r.json());

            if (res.success) {
                // Optimistic: update local state immediately
                const todayStr = getLocalDateString(new Date());
                setProgressData(prev => {
                    const idx = prev.findIndex(d =>
                        getLocalDateString(new Date(d.date)) === todayStr
                    );
                    const updated = {
                        ...prev[idx],
                        date: todayStr,
                        currentWeight: todayWeight ? parseFloat(todayWeight) : prev[idx]?.currentWeight,
                        mood: todayMood || prev[idx]?.mood,
                        movement: todayMovement ? parseInt(todayMovement) : prev[idx]?.movement,
                    };
                    if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = updated;
                        return copy;
                    }
                    return [...prev, updated];
                });
                showToast(t('success'));
            } else {
                showToast(t('error'));
            }
        } catch {
            showToast(t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Goal progress ───────────────────────────────────────
    const latestWeight = [...progressData]
        .reverse()
        .find(d => d.currentWeight != null)?.currentWeight ?? startWeight;

    let goalText = '';
    let progressPct = 0;

    if (latestWeight && targetWeight && startWeight) {
        const diff = latestWeight - targetWeight;
        const totalDiff = startWeight - targetWeight;

        if (Math.abs(diff) < 0.1) {
            goalText = 'You reached the goal!';
            progressPct = 100;
        } else if (totalDiff !== 0) {
            const isLosing = totalDiff > 0;
            if (isLosing) {
                goalText = diff > 0
                    ? `${diff.toFixed(1)} kg left`
                    : `You exceeded the goal by ${Math.abs(diff).toFixed(1)} kg!`;
                progressPct = Math.max(0, Math.min(100, ((totalDiff - diff) / totalDiff) * 100));
            } else {
                const toGain = targetWeight - startWeight;
                const gained = latestWeight - startWeight;
                goalText = diff < 0
                    ? `${Math.abs(diff).toFixed(1)} kg left`
                    : `You exceeded the goal by ${diff.toFixed(1)} kg!`;
                progressPct = Math.max(0, Math.min(100, (gained / toGain) * 100));
            }
        } else {
            goalText = 'Maintenance mode';
            progressPct = 100;
        }
    }

    // ─── 7-day chart ─────────────────────────────────────────
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const weights = progressData
        .map(d => d.currentWeight)
        .filter((w): w is number => w != null);
    const minW = weights.length ? Math.floor(Math.min(...weights)) - 2 : 50;
    const maxW = weights.length ? Math.ceil(Math.max(...weights)) + 2 : 100;
    const range = Math.max(maxW - minW, 1);

    const todayStr = getLocalDateString(new Date());
    const lastLogDate = [...progressData]
        .reverse()
        .find(d => d.currentWeight != null || d.mood != null);
    const lastLogStr = lastLogDate
        ? getLocalDateString(new Date(lastLogDate.date))
        : null;
    const hasToday = progressData.some(d => {
        if (!d.date) return false;
        const dStr = typeof d.date === 'string' ? d.date.substring(0, 10) : getLocalDateString(new Date(d.date));
        return dStr === todayStr;
    });

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={C.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('daily_weight_title')}</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Toast */}
            <Animated.View style={[styles.toast, {
                opacity: toastAnim,
                transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            }]}>
                <View style={styles.toastDot} />
                <Text style={styles.toastText}>{toastMsg}</Text>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hint */}
                {isLoading ? (
                    <View style={[styles.hintCard, { borderColor: 'transparent', backgroundColor: 'transparent' }]}>
                        <ActivityIndicator size="small" color={C.accent} />
                        <Text style={styles.hintText}>Loading...</Text>
                    </View>
                ) : !hasToday ? (
                    <View style={styles.hintCard}>
                        <Ionicons name="time-outline" size={14} color={C.accent} />
                        <Text style={styles.hintText}>{t('daily_weight_not_entered')}</Text>
                    </View>
                ) : (
                    <View style={[styles.hintCard, { backgroundColor: 'rgba(171,194,112,0.05)', borderColor: 'rgba(171,194,112,0.1)' }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={C.accent} />
                        <Text style={styles.hintText}>{t('daily_weight_already_entered')}</Text>
                    </View>
                )}

                {/* Hedef kartı */}
                {latestWeight && targetWeight && startWeight ? (
                    <View style={styles.card}>
                        <View style={styles.goalRow}>
                            <Text style={styles.cardLabel}>{t('weekly_summary_goal')}</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Text style={styles.goalVal}>Current <Text style={styles.goalValBold}>{latestWeight}kg</Text></Text>
                                <Text style={styles.goalVal}>Target <Text style={styles.goalValBold}>{targetWeight}kg</Text></Text>
                            </View>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
                        </View>
                        <Text style={styles.goalStatus}>{goalText} — %{Math.round(progressPct)} completed</Text>
                    </View>
                ) : null}

                {/* Ağırlık + chart */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>{t('daily_weight_input')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="örn. 72.5"
                            placeholderTextColor="rgba(255,255,255,0.22)"
                            keyboardType="numeric"
                            value={todayWeight}
                            onChangeText={setTodayWeight}
                            returnKeyType="done"
                        />
                        <View style={styles.unitPill}>
                            <Text style={styles.unitText}>kg</Text>
                        </View>
                    </View>

                    <Text style={[styles.cardLabel, { marginTop: 16 }]}>7-day trend</Text>
                    <View style={styles.chartRow}>
                        {last7.map((date, i) => {
                            const ds = getLocalDateString(date);
                            const day = progressData.find(d => {
                                if (!d.date) return false;
                                const dStr = typeof d.date === 'string' ? d.date.substring(0, 10) : getLocalDateString(new Date(d.date));
                                return dStr === ds;
                            });
                            const w = day?.currentWeight;
                            const h = w != null ? Math.max(((w - minW) / range) * 110, 6) : 0;
                            const isToday = ds === todayStr;
                            const moodEmoji = day?.mood ? MOOD_OPTIONS.find(m => m.value === day.mood)?.emoji : null;
                            return (
                                <View key={i} style={styles.barCol}>
                                    <Text style={styles.barWeight}>{w ? w.toFixed(1) : ''}</Text>
                                    <View style={[styles.barTrack, isToday && styles.barTrackToday]}>
                                        {w != null && <View style={[styles.barFill, { height: h }]} />}
                                    </View>
                                    <View style={{ height: 18, justifyContent: 'center' }}>
                                        {moodEmoji ? <Text style={styles.barMood}>{moodEmoji}</Text> : <Text style={styles.barMood}>–</Text>}
                                    </View>
                                    <Text style={[styles.barDay, isToday && styles.barDayToday]}>
                                        {isToday ? 'Today' : DAYS_TR[date.getDay()]}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Adım */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>{t('daily_weight_movement')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="e.g. 8500 steps"
                            placeholderTextColor="rgba(255,255,255,0.22)"
                            keyboardType="numeric"
                            value={todayMovement}
                            onChangeText={setTodayMovement}
                            returnKeyType="done"
                        />
                        <View style={[styles.unitPill]}>
                            <Ionicons name="walk-outline" size={18} color={C.accent} />
                        </View>
                    </View>
                </View>

                {/* Mood */}
                <View style={styles.card}>
                    <Text style={styles.chartTitle}>{t('daily_weight_mood')}</Text>
                    <View style={styles.moodRow}>
                        {MOOD_OPTIONS.map(m => (
                            <TouchableOpacity
                                key={m.value}
                                style={[styles.moodBtn, todayMood === m.value && styles.moodBtnActive]}
                                onPress={() => setTodayMood(m.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                                <Text style={[styles.moodLbl, todayMood === m.value && styles.moodLblActive]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Kaydet */}
                <TouchableOpacity
                    style={[styles.saveBtn, (!todayWeight && !todayMood && !todayMovement) && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isSubmitting || (!todayWeight && !todayMood && !todayMovement)}
                    activeOpacity={0.85}
                >
                    {isSubmitting
                        ? <ActivityIndicator color={C.textDark} />
                        : <Text style={styles.saveBtnText}>{t('daily_weight_save')} Daily Progress</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};



export default DailyWeight;