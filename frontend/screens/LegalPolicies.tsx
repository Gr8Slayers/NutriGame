import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

export default function LegalPolicies() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { t } = useLanguage();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('legal_policies_title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.container}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#f7e5c5" style={{ marginRight: 10 }} />
                    <Text style={styles.infoText}>{t('legal_policies_info')}</Text>
                </View>

                <View style={styles.menuItems}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DocumentViewer', { documentType: 'kvkk' })}
                    >
                        <Ionicons name="document-text-outline" size={24} color="#47dd7caf" />
                        <Text style={styles.menuItemText}>{t('kvkk_title')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DocumentViewer', { documentType: 'tos' })}
                    >
                        <Ionicons name="shield-checkmark-outline" size={24} color="#47dd7caf" />
                        <Text style={styles.menuItemText}>{t('tos_title')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DocumentViewer', { documentType: 'consent' })}
                    >
                        <Ionicons name="heart-half-outline" size={24} color="#47dd7caf" />
                        <Text style={styles.menuItemText}>{t('consent_title')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    container: {
        flex: 1,
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#14281d',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
    },
    infoText: {
        color: '#f7e5c5',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    menuItems: {
        gap: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#14281d',
        padding: 15,
        borderRadius: 10,
    },
    menuItemText: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 15,
    },
});
