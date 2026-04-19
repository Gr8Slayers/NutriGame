import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from '../storage';
import { API_URL } from '../env';
import { useLanguage } from '../i18n/LanguageContext';

export default function Notifications() {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const res = await fetch(`${API_URL}/api/user/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                }
            } catch (err) {
                console.error("Error fetching notifications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
                </TouchableOpacity>
                <Text style={styles.title}>{t('notifications_title')}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#47dd7caf" />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={64} color="#f7e5c5aa" />
                    <Text style={styles.emptyText}>{t('notifications_empty')}</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.notificationCard}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="notifications" size={24} color="#FBE577" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.notificationTitle}>{item.title}</Text>
                                <Text style={styles.notificationMessage}>{item.message}</Text>
                                <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1812',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#14281d',
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f7e5c5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#f7e5c5aa',
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#14281d',
    },
    iconContainer: {
        marginRight: 15,
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#47dd7caf',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#f7e5c5',
        marginBottom: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#f7e5c5aa',
        alignSelf: 'flex-end',
    }
});
