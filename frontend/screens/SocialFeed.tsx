import React, { useState, useCallback, useRef } from 'react';
import {
    View, Image, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/SocialFeed';
import { Ionicons } from '@expo/vector-icons';
import { IP_ADDRESS } from "@env";
import * as SecureStore from 'expo-secure-store';
import { Post } from '../types';


const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'SocialFeed'>;

function SocialFeed({ navigation }: Props) {
    const route = useRoute();
    const [feedData, setFeedData] = useState<Post[]>([]);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchFeed = useCallback(async (): Promise<void> => {
        const token = await SecureStore.getItemAsync('userToken');
        const url = `${API_URL}/api/social/get_feed`;
        console.log(url);
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await res.json();
            const params = data.data;
            console.log(data);
            if (res.ok && params != 0) {
                setFeedData(data);
            }
        } catch (error) {
            console.error("Feed yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFeed();
        }, [fetchFeed])
    );

    const handleRefresh = useCallback(() => {
        setRefresh(true);
        fetchFeed();
    }, [fetchFeed]);

    const navigateToCreatePost = (): void => {
        console.log("Create Post sayfasına yönlendiriliyor...");
        // navigation.navigate('CreatePost');
    };

    const renderPost = (post: Post) => {
        return (
            <View style={styles.post}>
                <Text>{post.content}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text>SocialFeed</Text>
        </View>
    );
}

export default SocialFeed;