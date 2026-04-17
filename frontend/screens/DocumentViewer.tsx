import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

// Import document contents
import { kvkk_tr, kvkk_en } from '../documents/kvkk';
import { tos_tr, tos_en } from '../documents/tos';
import { consent_tr, consent_en } from '../documents/consent';

export default function DocumentViewer() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'DocumentViewer'>>();
    const { documentType } = route.params;
    const { t, language } = useLanguage();

    let title = '';
    let content = '';

    if (documentType === 'kvkk') {
        title = t('kvkk_title');
        content = language === 'tr' ? kvkk_tr : kvkk_en;
    } else if (documentType === 'tos') {
        title = t('tos_title');
        content = language === 'tr' ? tos_tr : tos_en;
    } else if (documentType === 'consent') {
        title = t('consent_title');
        content = language === 'tr' ? consent_tr : consent_en;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.text}>{content}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a1812',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#14281d',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#47dd7caf',
        marginBottom: 20,
        textAlign: 'center',
    },
    text: {
        fontSize: 14,
        color: '#f7e5c5',
        lineHeight: 22,
    },
});
