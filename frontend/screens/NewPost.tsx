import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import styles from '../styles/NewPost';
import { Ionicons } from '@expo/vector-icons';
import { setItem, getItem, removeItem } from '../storage';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../env';
import { useLanguage } from '../i18n/LanguageContext';
import { createUploadFormData } from '../utils/uploadHelper';
type Props = NativeStackScreenProps<RootStackParamList, 'NewPost'>;

function NewPost({ navigation, route }: Props) {
    const { t } = useLanguage();
    const challengeId = route.params?.challengeId;
    const isChallengePost = !!challengeId;

    const [caption, setCaption] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');
    const [calories, setCalories] = useState('');
    const [prepTime, setPrepTime] = useState('');

    const [submitting, setSubmitting] = useState(false);

    const pickImage = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('permission_needed'), t('gallery_permission_msg'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    }, []);

    const isValid = isChallengePost
        ? (caption.trim().length > 0 || !!imageUri)
        : (title.trim().length > 0 &&
            ingredients.trim().length > 0 &&
            instructions.trim().length > 0 &&
            !isNaN(Number(calories)) &&
            Number(calories) > 0);

    const handleSubmit = useCallback(async () => {
        if (!isValid) return;
        setSubmitting(true);

        try {
            const token = await getItem('userToken');

            // Resim varsa önce backend'e yükle, public URL al
            let uploadedImageUrl: string | undefined;
            if (imageUri) {
                const formData = await createUploadFormData(imageUri);
                
                const uploadRes = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedImageUrl = uploadData.imageUrl;
                }
            }

            const body: any = isChallengePost
                ? {
                    caption,
                    isRecipe: false,
                    imageUrl: uploadedImageUrl,
                    challengeId,
                }
                : {
                    caption,
                    isRecipe: true,
                    imageUrl: uploadedImageUrl,
                    recipeDetails: {
                        title: title.trim(),
                        ingredients: ingredients.trim(),
                        instructions: instructions.trim(),
                        calories: Number(calories),
                        preparationTime: prepTime ? Number(prepTime) : undefined,
                    },
                };

            const res = await fetch(`${API_URL}/api/social/create_post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                Alert.alert(
                    t('success'),
                    isChallengePost ? t('challenge_post_shared') : t('recipe_shared'),
                    [{ text: t('ok'), onPress: () => navigation.goBack() }],
                );
            } else {
                const err = await res.text();
                console.error('Post hatası:', err);
                Alert.alert(t('error'), t('post_share_error'));
            }
        } catch (e) {
            console.error('Post hatası:', e);
            Alert.alert(t('error'), t('something_went_wrong'));
        } finally {
            setSubmitting(false);
        }
    }, [isValid, caption, imageUri, title, ingredients, instructions, calories, prepTime, navigation, isChallengePost, challengeId, t]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isChallengePost ? t('new_challenge_post') : t('new_recipe_post')}</Text>
                    <TouchableOpacity
                        style={[styles.shareButton, !isValid && styles.shareButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isValid || submitting}
                        activeOpacity={0.7}
                    >
                        {submitting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.shareButtonText}>{t('new_post_share')}</Text>
                        }
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Fotoğraf */}
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {imageUri ? (
                            <>
                                <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="camera" size={24} color="#fff" />
                                    <Text style={styles.imageOverlayText}>{t('change_photo')}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#6b5440" />
                                <Text style={styles.imagePlaceholderText}>{t('add_photo')}</Text>
                                <Text style={styles.imagePlaceholderSub}>{t('optional_label')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>{t('caption_label')}</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            placeholder={t('recipe_caption_placeholder')}
                            placeholderTextColor="#6b5440"
                            value={caption}
                            onChangeText={setCaption}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {!isChallengePost && (
                    <>
                    <View style={styles.sectionDivider}>
                        <Ionicons name="restaurant-outline" size={16} color="#c8a96e" />
                        <Text style={styles.sectionDividerText}>{t('recipe_details_label')}</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>{t('recipe_title_label')} <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('recipe_title_placeholder')}
                            placeholderTextColor="#6b5440"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.rowGroup}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>{t('calories_label')} <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWithUnit}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="0"
                                    placeholderTextColor="#6b5440"
                                    value={calories}
                                    onChangeText={setCalories}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.unitLabel}>kcal</Text>
                            </View>
                        </View>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>{t('prep_time')}</Text>
                            <View style={styles.inputWithUnit}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="0"
                                    placeholderTextColor="#6b5440"
                                    value={prepTime}
                                    onChangeText={setPrepTime}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.unitLabel}>min</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>{t('ingredients')} <Text style={styles.required}>*</Text></Text>
                        <Text style={styles.fieldHint}>{t('ingredient_hint')}</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline, styles.inputTall]}
                            placeholder={"1 cup quinoa\n1 cucumber\n100g feta cheese\n..."}
                            placeholderTextColor="#6b5440"
                            value={ingredients}
                            onChangeText={setIngredients}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>{t('instructions')} <Text style={styles.required}>*</Text></Text>
                        <Text style={styles.fieldHint}>{t('instruction_hint')}</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline, styles.inputTall]}
                            placeholder={"1. Cook quinoa with 2x water for 15 min.\n2. Chop all vegetables.\n3. Mix together..."}
                            placeholderTextColor="#6b5440"
                            value={instructions}
                            onChangeText={setInstructions}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>
                    </>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, (!isValid || submitting) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isValid || submitting}
                        activeOpacity={0.8}
                    >
                        {submitting
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="share-social-outline" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>{isChallengePost ? t('share_post') : t('new_post_recipe')}</Text>
                            </>
                        }
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

export default NewPost;
