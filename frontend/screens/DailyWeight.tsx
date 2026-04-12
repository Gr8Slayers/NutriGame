import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/DailyWeight';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { DailyProgress } from '../types';

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'DailyWeight'>;

const MOOD_OPTIONS = [
    { label: 'Terrible', emoji: '😫', value: 'terrible' },
    { label: 'Bad', emoji: '😕', value: 'bad' },
    { label: 'Okay', emoji: '😐', value: 'okay' },
    { label: 'Good', emoji: '🙂', value: 'good' },
    { label: 'Excellent', emoji: '🤩', value: 'excellent' },
];



const DailyWeight: React.FC<Props> = ({ navigation }) => {
    const [progressData, setProgressData] = useState<DailyProgress[]>([]);
    const [todayWeight, setTodayWeight] = useState<string>('');
    const [todayMood, setTodayMood] = useState<string>('');
    const [todayMovement, setTodayMovement] = useState<string>('');
    const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

    const [targetWeight, setTargetWeight] = useState<number | null>(null);
    const [startWeight, setStartWeight] = useState<number | null>(null);

    const fetchProgressData = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/progress/weekly`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();
            if (res.success) {
                setProgressData(res.data);
            }
        } catch (error) {
            console.error('Error fetching daily progress:', error);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const res = await response.json();
            if (res.success && res.data) {
                setTargetWeight(res.data.target_weight);
                setStartWeight(res.data.weight);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }, []);

    useEffect(() => {
        fetchProgressData();
        fetchUserProfile();
    }, [fetchProgressData, fetchUserProfile]);

    const handleSaveProgress = async () => {
        if (!todayWeight && !todayMood) return;
        setIsSubmittingWeight(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const todayStr = new Date().toISOString().split('T')[0];
            const response = await fetch(`${API_URL}/api/progress/upsert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: todayStr,
                    currentWeight: todayWeight ? parseFloat(todayWeight) : undefined,
                    mood: todayMood || undefined,
                    movement: todayMovement ? parseInt(todayMovement) : undefined
                })
            });
            const res = await response.json();
            if (res.success) {
                fetchProgressData();
                setTodayWeight('');
                setTodayMood('');
                setTodayMovement('');
            } else {
                console.error("Failed to add progress:", res.message);
            }
        } catch (error) {
            console.error("Error adding progress:", error);
        } finally {
            setIsSubmittingWeight(false);
        }
    }

    const renderWeightChart = () => {
        const weights = progressData.filter(d => d.currentWeight !== null && d.currentWeight !== undefined).map(d => d.currentWeight!);
        const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights)) - 2 : 50;
        const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights)) + 2 : 100;
        const range = Math.max(maxWeight - minWeight, 1);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date;
        });

        return (
            <View style={styles.barChartContainer}>
                {last7Days.map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = progressData.find(d => {
                        const dStr = new Date(d.date).toISOString().split('T')[0];
                        return dStr === dateStr;
                    });
                    const weight = dayData?.currentWeight;

                    let height = 0;
                    if (weight !== undefined && weight !== null) {
                        height = ((weight - minWeight) / range) * 150;
                    }

                    const dayLabel = date.toLocaleDateString('en-EN', { weekday: 'short' });

                    return (
                        <View key={index} style={styles.barContainer}>
                            <View style={styles.barBackground}>
                                {weight !== undefined && weight !== null ? (
                                    <View style={[styles.barFill, { backgroundColor: '#4ecdc4', height: Math.max(height, 5) }]} />
                                ) : (
                                    <View style={[styles.barFill, { backgroundColor: 'transparent', height: 0 }]} />
                                )}
                            </View>
                            <Text style={[styles.dayText, { fontSize: 10, marginTop: 2, marginBottom: 2, color: weight ? '#fc8500' : 'transparent' }]}>
                                {weight ? weight : '-'}
                            </Text>
                            <Text style={styles.dayText}>{dayLabel}</Text>
                            <View style={{ marginTop: 5, minHeight: 25, justifyContent: 'center', alignItems: 'center' }}>
                                {dayData?.mood ? (
                                    <Text style={{ fontSize: 18 }}>
                                        {MOOD_OPTIONS.find(m => m.value === dayData?.mood)?.emoji}
                                    </Text>
                                ) : (
                                    <Ionicons name="remove" size={18} color="#ccc" />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const latestWeightLog = [...progressData].reverse().find(d => d.currentWeight !== null && d.currentWeight !== undefined);
    const currentWeightDisplay = latestWeightLog ? latestWeightLog.currentWeight : startWeight;

    let goalText = "";
    let progressPercentage = 0;

    if (currentWeightDisplay && targetWeight && startWeight) {
        const diff = currentWeightDisplay - targetWeight;
        if (Math.abs(diff) < 0.1) {
            goalText = "Goal Reached! 🏆";
            progressPercentage = 100;
        } else {
            const totalDiff = startWeight - targetWeight;
            if (totalDiff > 0) { // Losing weight goal
                goalText = diff > 0 ? `${diff.toFixed(1)} kg left to your goal!` : `You have surpassed your goal by ${Math.abs(diff).toFixed(1)} kg!`;
                progressPercentage = Math.max(0, Math.min(100, ((totalDiff - diff) / totalDiff) * 100));
            } else if (totalDiff < 0) { // Gaining weight goal
                goalText = diff < 0 ? `${Math.abs(diff).toFixed(1)} kg left to your goal!` : `You have surpassed your goal by ${diff.toFixed(1)} kg!`;
                const toGain = targetWeight - startWeight;
                const gained = currentWeightDisplay - startWeight;
                progressPercentage = Math.max(0, Math.min(100, (gained / toGain) * 100));
            } else {
                goalText = "Maintenance Mode";
                progressPercentage = 100;
            }
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Weight and Mood</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {targetWeight && startWeight && currentWeightDisplay ? (
                    <View style={[styles.chartCard, { width: '95%', padding: 15, marginBottom: 5 }]}>
                        <Text style={{ color: '#f7e5c5', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Goal Approach</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ color: '#a0896e' }}>Current: {currentWeightDisplay}kg</Text>
                            <Text style={{ color: '#a0896e' }}>Target: {targetWeight}kg</Text>
                        </View>
                        <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${progressPercentage}%`, backgroundColor: '#4ecdc4', borderRadius: 5 }} />
                        </View>
                        <Text style={{ color: '#c8a96e', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{goalText}</Text>
                    </View>
                ) : null}

                <View style={[styles.chartCard, { width: '95%', marginTop: 10 }]}>
                    <Text style={styles.chartTitle}>Movement / Steps</Text>
                    <TextInput
                        style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, width: '100%' }}
                        placeholder="Enter movement (e.g. 5000 steps)"
                        keyboardType="numeric"
                        value={todayMovement}
                        onChangeText={setTodayMovement}
                    />
                </View>

                <View style={[styles.chartCard, { width: '95%' }]}>
                    <Text style={styles.chartTitle}>Weight Input & Trend (7 Days)</Text>
                    <View style={{ width: '100%', gap: 50 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25, justifyContent: 'space-between', width: '100%' }}>
                            <TextInput
                                style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, alignSelf: 'center' }}
                                placeholder="Enter today's weight (e.g. 70.5)"
                                keyboardType="numeric"
                                value={todayWeight}
                                onChangeText={setTodayWeight}
                            />
                        </View>

                        {progressData.length > 0 && progressData.some(d => d.currentWeight !== null && d.currentWeight !== undefined) ? renderWeightChart() : (
                            <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#a0896e' }}>No weight data logged yet for this week.</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={{ marginBottom: 10, fontWeight: 'bold', color: '#f7e5c5', fontSize: 16 }}>How do you feel today?</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '95%' }}>
                    {MOOD_OPTIONS.map((m) => (
                        <TouchableOpacity
                            key={m.value}
                            onPress={() => setTodayMood(m.value)}
                            style={{
                                paddingVertical: 12,
                                borderRadius: 12,
                                backgroundColor: todayMood === m.value ? 'rgba(252, 133, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                borderWidth: 1,
                                borderColor: todayMood === m.value ? '#fc8500' : 'rgba(255, 255, 255, 0.1)',
                                alignItems: 'center',
                                flex: 1,
                                marginHorizontal: 4
                            }}
                        >
                            <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={{ backgroundColor: '#fc8500', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 40, width: '95%' }}
                    onPress={handleSaveProgress}
                    disabled={isSubmittingWeight}
                >
                    {isSubmittingWeight ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Save Daily Progress</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
export default DailyWeight;

