import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/WeeklySummary';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { WeeklySummary as WeeklySummaryData, DailyProgress } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklySummary'>;



const WeeklySummary: React.FC<Props> = ({ navigation }) => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<WeeklySummaryData[]>([]);
    const [averages, setAverages] = useState({ calorie: 0, protein: 0, fat: 0, carb: 0 });
    const [progressData, setProgressData] = useState<DailyProgress[]>([]);
    const [todayWeight, setTodayWeight] = useState<string>('');
    const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

    const fetchWeeklyData = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/food/get_weekly_summary`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();
            if (res.success) {
                const data: WeeklySummaryData[] = res.data;
                setWeeklyData(data);
                calculateAverages(data);
            }
        } catch (error) {
            console.error('Error fetching weekly summary:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);



    const calculateAverages = (data: WeeklySummaryData[]) => {
        if (data.length === 0) return;

        const totals = data.reduce((acc, curr) => ({
            calorie: acc.calorie + curr.t_calorie,
            protein: acc.protein + curr.t_protein,
            fat: acc.fat + curr.t_fat,
            carb: acc.carb + curr.t_carb
        }), { calorie: 0, protein: 0, fat: 0, carb: 0 });

        const count = data.length;
        setAverages({
            calorie: Math.round(totals.calorie / count),
            protein: Math.round(totals.protein / count),
            fat: Math.round(totals.fat / count),
            carb: Math.round(totals.carb / count)
        });
    };

    useEffect(() => {
        fetchWeeklyData();
    }, [fetchWeeklyData]);

    const renderBarChart = () => {
        const maxCal = Math.max(...weeklyData.map(d => d.t_calorie), 2000);

        // Fill in missing days if needed (last 7 days logic)
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
                    const dayData = weeklyData.find(d => d.date.startsWith(dateStr));
                    const calories = dayData?.t_calorie || 0;
                    const height = (calories / maxCal) * 150;
                    const dayLabel = date.toLocaleDateString('en-EN', { weekday: 'short' });

                    return (
                        <View key={index} style={styles.barContainer}>
                            <View style={styles.barBackground}>
                                <View style={[styles.barFill, { height: Math.max(height, 5) }]} />
                            </View>
                            <Text style={styles.dayText}>{dayLabel}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };



    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#fc8500" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('weekly_summary_title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Calorie Intake (7 Days)</Text>
                    {weeklyData.length > 0 ? renderBarChart() : (
                        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#a0896e' }}>{t('weekly_summary_no_data')}</Text>
                        </View>
                    )}
                </View>


                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg {t('weekly_summary_protein')}</Text>
                        <Text style={styles.statValue}>{averages.protein}<Text style={styles.statUnit}>g</Text></Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg {t('weekly_summary_carb')}</Text>
                        <Text style={styles.statValue}>{averages.carb}<Text style={styles.statUnit}>g</Text></Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg {t('weekly_summary_fat')}</Text>
                        <Text style={styles.statValue}>{averages.fat}<Text style={styles.statUnit}>g</Text></Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Active Days</Text>
                        <Text style={styles.statValue}>{weeklyData.length}<Text style={styles.statUnit}>/7</Text></Text>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryTitle}>Weekly Daily Average</Text>
                        <Text style={styles.summaryValue}>{averages.calorie} kcal</Text>
                    </View>
                    <View style={styles.summaryIcon}>
                        <Ionicons name="flame" size={32} color="#fc8500" />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default WeeklySummary;
