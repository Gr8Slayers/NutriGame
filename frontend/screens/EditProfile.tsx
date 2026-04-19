import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Image, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Asset } from 'expo-asset';
import { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { setItem, getItem, removeItem } from '../storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../env';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { UserProfile } from '../types';
import styles from '../styles/EditProfile';
import GoalDropdown from '../components/goalSelection';
import ActivityLevelDropdown from '../components/activityLevelSelection';
import { useLanguage } from '../i18n/LanguageContext';
import { createUploadFormData } from '../utils/uploadHelper';

// Helper to resolve avatar paths
const getAvatarSource = (path: string | undefined) => {
    if (!path) return require('../assets/default_avatar.png');
    if (path.startsWith('http')) return { uri: path };
    if (path.startsWith('/')) return { uri: `${API_URL}${path}` };

    const cleanPath = path.trim();
    switch (cleanPath) {
        case "../assets/avatars/av1.png": return require('../assets/avatars/av1.png');
        case "../assets/avatars/av2.png": return require('../assets/avatars/av2.png');
        case "../assets/avatars/av3.png": return require('../assets/avatars/av3.png');
        case "../assets/avatars/av4.png": return require('../assets/avatars/av4.png');
        case "../assets/avatars/av5.png": return require('../assets/avatars/av5.png');
        case "../assets/avatars/av6.png": return require('../assets/avatars/av6.png');
        case "../assets/avatars/av7.png": return require('../assets/avatars/av7.png');
        case "../assets/avatars/av8.png": return require('../assets/avatars/av8.png');
        case "../assets/avatars/av9.png": return require('../assets/avatars/av9.png');
        case "../assets/avatars/av10.png": return require('../assets/avatars/av10.png');
        case "../assets/avatars/av11.png": return require('../assets/avatars/av11.png');
        case "../assets/avatars/avatar12.png": return require('../assets/avatars/avatar12.png');
        case "../assets/avatars/avatar13.png": return require('../assets/avatars/avatar13.png');
        case "../assets/avatars/avatar14.png": return require('../assets/avatars/avatar14.png');
        case "../assets/avatars/avatar15.png": return require('../assets/avatars/avatar15.png');
        case "../assets/avatars/avatar16.png": return require('../assets/avatars/avatar16.png');
        case "../assets/avatars/avatar17.png": return require('../assets/avatars/avatar17.png');
        case "../assets/avatars/avatar18.png": return require('../assets/avatars/avatar18.png');
        case "../assets/avatars/avatar19.png": return require('../assets/avatars/avatar19.png');
        case "../assets/avatars/avatar20.png": return require('../assets/avatars/avatar20.png');
        case "../assets/avatars/avatar21.png": return require('../assets/avatars/avatar21.png');
        case "../assets/avatars/avatar22.png": return require('../assets/avatars/avatar22.png');
        case "../assets/avatars/avatar23.png": return require('../assets/avatars/avatar23.png');
        case "../assets/avatars/avatar24.png": return require('../assets/avatars/avatar24.png');
        case "../assets/avatars/avatar25.png": return require('../assets/avatars/avatar25.png');
        case "../assets/avatars/avatar26.png": return require('../assets/avatars/avatar26.png');
        case "../assets/avatars/avatar27.png": return require('../assets/avatars/avatar27.png');
        case "../assets/avatars/avatar28.png": return require('../assets/avatars/avatar28.png');
        case "../assets/avatars/avatar29.png": return require('../assets/avatars/avatar29.png');
        case "../assets/avatars/avatar30.png": return require('../assets/avatars/avatar30.png');
        case "../assets/avatars/avatar31.png": return require('../assets/avatars/avatar31.png');
        case "../assets/avatars/avatar32.png": return require('../assets/avatars/avatar32.png');
        case "../assets/avatars/avatar33.png": return require('../assets/avatars/avatar33.png');
        case "../assets/avatars/avatar34.png": return require('../assets/avatars/avatar34.png');
        default: return require('../assets/default_avatar.png');
    }
};

// Available avatars
const AVATARS = [
    "../assets/avatars/av1.png",
    "../assets/avatars/av2.png",
    "../assets/avatars/av3.png",
    "../assets/avatars/av4.png",
    "../assets/avatars/av5.png",
    "../assets/avatars/av6.png",
    "../assets/avatars/av7.png",
    "../assets/avatars/av8.png",
    "../assets/avatars/av9.png",
    "../assets/avatars/av10.png",
    "../assets/avatars/av11.png",
    "../assets/avatars/avatar12.png",
    "../assets/avatars/avatar13.png",
    "../assets/avatars/avatar14.png",
    "../assets/avatars/avatar15.png",
    "../assets/avatars/avatar16.png",
    "../assets/avatars/avatar17.png",
    "../assets/avatars/avatar18.png",
    "../assets/avatars/avatar19.png",
    "../assets/avatars/avatar20.png",
    "../assets/avatars/avatar21.png",
    "../assets/avatars/avatar22.png",
    "../assets/avatars/avatar23.png",
    "../assets/avatars/avatar24.png",
    "../assets/avatars/avatar25.png",
    "../assets/avatars/avatar26.png",
    "../assets/avatars/avatar27.png",
    "../assets/avatars/avatar28.png",
    "../assets/avatars/avatar29.png",
    "../assets/avatars/avatar30.png",
    "../assets/avatars/avatar31.png",
    "../assets/avatars/avatar32.png",
    "../assets/avatars/avatar33.png",
    "../assets/avatars/avatar34.png",
];

export default function EditProfile() {
    const { t } = useLanguage();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'EditProfile'>>();
    const userData = route.params;

    const [username, setUsername] = useState(userData.username || '');
    const [email, setEmail] = useState(userData.email || '');
    const [password, setPassword] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [height, setHeight] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(userData.avatar_url || '');
    const [reasonToDiet, setReasonToDiet] = useState(userData.reason_to_diet || 'Maintain Weight');
    const [activityLevel, setActivityLevel] = useState('Moderately Active'); // Assuming default or mapping if it was stored
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await getItem('userToken');
            if (!token) {
                Alert.alert(t('error') || 'Error', 'Please login again');
                return;
            }

            let finalAvatarUrl = selectedAvatar;

            // Eğer seçilen avatar hala yerel bir yolsa (veya değişmisse), DB'ye yükle
            if (selectedAvatar && !selectedAvatar.startsWith('http')) {
                const source = getAvatarSource(selectedAvatar);
                if (typeof source === 'number') {
                    const asset = Asset.fromModule(source);
                    await asset.downloadAsync();

                    const formData = await createUploadFormData(asset.localUri || asset.uri);
                    
                    const uploadRes = await fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData,
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        finalAvatarUrl = uploadData.imageUrl;
                    }
                }
            }

            const updateData: any = {
                username,
                email,
                avatar_url: finalAvatarUrl,
                reason_to_diet: reasonToDiet,
            };

            if (currentWeight) {
                updateData.weight = parseFloat(currentWeight);
            }
            if (height) {
                updateData.height = parseFloat(height);
            }

            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert(t('success') || 'Success', t('edit_profile_success') || 'Profile updated successfully!');
                navigation.goBack();
            } else {
                Alert.alert(t('error') || 'Error', data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert(t('error') || 'Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f7e5c5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('edit_profile_title') || 'Edit Profile'}</Text>
            </View>

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
                extraHeight={150}
                extraScrollHeight={150}
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
                enableAutomaticScroll={true}
                keyboardOpeningTime={0}
                viewIsInsideTabBar={true}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={getAvatarSource(selectedAvatar)}
                            style={styles.avatar}
                        />
                        <TouchableOpacity
                            style={styles.changeAvatarButton}
                            onPress={() => setShowAvatarModal(true)}
                        >
                            <Ionicons name="camera" size={20} color="#0a1812" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Username */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>{t('signup_username') || 'Username'}</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor="#5c544d"
                    />
                </View>

                {/* Email */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>{t('signup_email') || 'Email'}</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email"
                        placeholderTextColor="#5c544d"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>{t('signup_password') || 'Password'}</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        placeholderTextColor="#5c544d"
                        secureTextEntry
                    />
                </View>

                {/* Current Weight and Height */}
                <View style={styles.rowInputs}>
                    <View style={[styles.inputSection, styles.halfInput]}>
                        <Text style={styles.label}>{t('edit_profile_weight') || 'Current Weight (kg)'}</Text>
                        <TextInput
                            style={styles.input}
                            value={currentWeight}
                            onChangeText={setCurrentWeight}
                            placeholder="70"
                            placeholderTextColor="#5c544d"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.inputSection, styles.halfInput]}>
                        <Text style={styles.label}>{t('edit_profile_height') || 'Height (cm)'}</Text>
                        <TextInput
                            style={styles.input}
                            value={height}
                            onChangeText={setHeight}
                            placeholder="175"
                            placeholderTextColor="#5c544d"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Dietary Preference & Activity Level */}
                <View style={{ zIndex: 10 }}>
                    <GoalDropdown
                        value={reasonToDiet}
                        onChange={setReasonToDiet}
                        buttonStyle={styles.goalSelection}
                        buttonTextStyle={{ color: '#f7e5c5', fontSize: 16 }}
                        labelStyle={styles.label}
                        containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0, paddingHorizontal: 0, paddingVertical: 0 }}
                    />
                </View>

                <View style={{ zIndex: 9 }}>
                    <ActivityLevelDropdown
                        value={activityLevel}
                        onChange={setActivityLevel}
                        buttonStyle={styles.activitySelection}
                        buttonTextStyle={{ color: '#f7e5c5', fontSize: 16 }}
                        labelStyle={styles.label}
                        containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0, paddingHorizontal: 0, paddingVertical: 0 }}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? (t('loading') || 'Saving...') : (t('edit_profile_save') || 'Save Changes')}
                    </Text>
                </TouchableOpacity>
            </KeyboardAwareScrollView>

            {/* Avatar Selection Modal */}
            <Modal
                visible={showAvatarModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAvatarModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('select_below') || 'Choose Avatar'}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowAvatarModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#f7e5c5" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.avatarGrid}>
                                {AVATARS.map((avatar, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.avatarOption,
                                            selectedAvatar === avatar && styles.avatarOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedAvatar(avatar);
                                            setShowAvatarModal(false);
                                        }}
                                    >
                                        <Image
                                            source={getAvatarSource(avatar)}
                                            style={styles.avatarImage}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}