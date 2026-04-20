import { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Image, Alert,
    Modal, Linking, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import styles from '../styles/ScanFood';
import { setItem, getItem, removeItem } from '../storage';
import { API_URL } from '../env';

import { useLanguage } from '../i18n/LanguageContext';

const SCAN_TIMEOUT_MS = 15000;

type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const MEAL_CATEGORIES: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) {
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            const parts = url.split('/api/images/');
            if (parts.length > 1) return `${API_URL}/api/images/${parts[1]}`;
        }
        return url;
    }
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

export default function ScanFood() {
    const navigation = useNavigation<any>();
    const { t } = useLanguage();
    const [permission, requestPermission] = useCameraPermissions();
    const [permissionModalVisible, setPermissionModalVisible] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const cameraRef = useRef<CameraView>(null);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [allPhotos, setAllPhotos] = useState<any[]>([]);
    const [isLoadingGallery, setIsLoadingGallery] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [detections, setDetections] = useState<any[] | null>(null);
    const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
    const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
    const [mealCategory, setMealCategory] = useState<MealCategory>('Breakfast');
    const [selectedMatches, setSelectedMatches] = useState<Record<string, any>>({});
    const [addToLogModalVisible, setAddToLogModalVisible] = useState(false);
    const [portions, setPortions] = useState<Record<string, number>>({});
    const [isSavingLog, setIsSavingLog] = useState(false);
    const [manualSearchVisible, setManualSearchVisible] = useState(false);
    const [manualSearchTempId, setManualSearchTempId] = useState<string | null>(null);
    const [manualSearchQuery, setManualSearchQuery] = useState('');
    const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
    const [manualSearchLoading, setManualSearchLoading] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted) {
            setPermissionModalVisible(true);
        } else {
            setPermissionModalVisible(false);
        }
    }, [permission]);

    const getCategoryLabel = (cat: MealCategory): string => {
        const keys: Record<MealCategory, string> = {
            Breakfast: 'scan_cat_breakfast',
            Lunch: 'scan_cat_lunch',
            Dinner: 'scan_cat_dinner',
            Snack: 'scan_cat_snack',
        };
        return t(keys[cat] as any);
    };

    const handlePermissionButton = async () => {
        if (!permission) return;
        if (!permission.canAskAgain) {
            Linking.openSettings();
        } else {
            await requestPermission();
        }
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;
        if (photos.length >= 10) {
            Alert.alert(t('warning'), t('scan_limit'));
            return;
        }
        try {
            const data = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                exif: false,
            });
            if (data?.uri) {
                setPhotos(prev => [...prev, data.uri]);
                setDetections(null);
                setAnnotatedImage(null);
            }
        } catch {
            Alert.alert(t('error'), t('scan_take_photo_error'));
        }
    };

    const openGallery = async () => {
        setIsLoadingGallery(true);
        try {
            const token = await getItem('userToken');
            const userId = await getItem('userId');
            if (!userId || !token) return;

            const response = await fetch(`${API_URL}/api/scan/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok && data.success) setAllPhotos(data.photos);
        } catch {
            Alert.alert(t('error'), t('scan_gallery_error'));
        } finally {
            setIsLoadingGallery(false);
            setGalleryVisible(true);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const initDetectionState = (newDetections: any[]) => {
        const detectionsWithId = newDetections.map((det, idx) => ({
            ...det,
            tempId: (Date.now() + Math.random() + idx).toString()
        }));

        setDetections(detectionsWithId);
        const initPortions: Record<string, number> = {};
        const initMatches: Record<string, any> = {};

        detectionsWithId.forEach((det: any) => {
            initPortions[det.tempId] = 1.0;
            if (det.dbMatches?.length > 0) initMatches[det.tempId] = det.dbMatches[0];
        });

        setPortions(initPortions);
        setSelectedMatches(initMatches);
    };

    const handleScanFood = async () => {
        if (photos.length === 0) return;
        setIsCameraActive(false);
        setIsLoading(true);

        try {
            const token = await getItem('userToken');
            if (!token) {
                Alert.alert(t('error'), t('scan_session_error'));
                return;
            }

            const formData = new FormData();
            formData.append('mealCategory', mealCategory);

            if (photos.length === 1) {
                formData.append('image', {
                    uri: photos[0],
                    name: `scan_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);

                const response = await fetchWithTimeout(
                    `${API_URL}/api/scan/analyze`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    },
                    SCAN_TIMEOUT_MS
                );
                const data = await response.json();

                if (!response.ok) {
                    Alert.alert(t('error'), data.message || t('scan_analyze_error'));
                    return;
                }

                const dets = data.detections || [];
                initDetectionState(dets);
                if (data.annotated_image) setAnnotatedImage(data.annotated_image);
                if (data.photoRecord?.imageUrl) setScanImageUrl(getImageUrl(data.photoRecord.imageUrl));

                if (dets.length === 0) {
                    Alert.alert(t('warning'), t('scan_no_food_try'), [
                        { text: t('cancel') },
                        { text: t('scan_add_manually'), onPress: () => navigation.navigate('MainPage') },
                    ]);
                }

            } else {
                photos.forEach((uri, index) => {
                    formData.append('images', {
                        uri,
                        name: `scan_${Date.now()}_${index}.jpg`,
                        type: 'image/jpeg',
                    } as any);
                });

                const response = await fetchWithTimeout(
                    `${API_URL}/api/scan/analyze-batch`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    },
                    SCAN_TIMEOUT_MS
                );
                const data = await response.json();

                if (!response.ok) {
                    Alert.alert(t('error'), data.error || data.message || t('scan_batch_error'));
                    return;
                }

                const allDetections: any[] = (data.results ?? [])
                    .filter((res: any) => res.success && res.detections)
                    .flatMap((res: any) =>
                        res.detections.map((det: any) => ({
                            class: det.class || 'Unknown Item',
                            confidence: det.confidence,
                            dbMatches: det.dbMatches || [],
                        }))
                    );

                initDetectionState(allDetections);
                setAnnotatedImage(null);

                if (allDetections.length === 0) {
                    Alert.alert(t('warning'), t('scan_no_food_try'), [
                        { text: t('cancel') },
                        { text: t('scan_add_manually'), onPress: () => navigation.navigate('MainPage') },
                    ]);
                }
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                Alert.alert(t('error'), t('scan_timeout'), [
                    { text: t('cancel') },
                    { text: t('scan_add_manually'), onPress: () => navigation.navigate('MainPage') },
                ]);
            } else {
                Alert.alert(t('error'), t('scan_network_error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToLog = async () => {
        if (!detections || detections.length === 0) return;
        setIsSavingLog(true);

        try {
            const token = await getItem('userToken');
            if (!token) {
                Alert.alert(t('error'), t('scan_session_error'));
                return;
            }

            const dateStr = getLocalDateString(new Date());

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < detections.length; i++) {
                const item = detections[i];
                const selected = selectedMatches[item.tempId];
                if (!selected) continue;

                try {
                    const response = await fetch(`${API_URL}/api/food/add_to_meal`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            date: dateStr,
                            meal_category: mealCategory,
                            food_id: selected.food_id ?? undefined,
                            food_name: selected.food_name,
                            p_calorie: selected.p_calorie,
                            p_protein: selected.p_protein,
                            p_fat: selected.p_fat,
                            p_carb: selected.p_carb,
                            p_unit: selected.p_unit,
                            p_amount: selected.p_amount,
                            p_count: portions[item.tempId] ?? 1.0,
                            entry_method: 'scan',
                            scan_image_url: scanImageUrl,
                        }),
                    });
                    if (response.ok) {
                        successCount++;
                    } else {
                        const errBody = await response.json().catch(() => ({}));
                        console.error('[AddToLog] failed:', response.status, JSON.stringify(errBody));
                        failCount++;
                    }
                } catch (e) {
                    console.error('[AddToLog] fetch error:', e);
                    failCount++;
                }
            }

            setAddToLogModalVisible(false);

            if (successCount > 0 && failCount === 0) {
                Alert.alert(t('success'), `${successCount} ${t('scan_success')}`, [
                    { text: 'OK', onPress: () => navigation.navigate('MainPage') }
                ]);
            } else if (successCount > 0) {
                Alert.alert(t('scan_partial_success'), `${successCount} ${t('scan_partial')}, ${failCount} ${t('scan_failed')}`, [
                    { text: 'OK', onPress: () => navigation.navigate('MainPage') }
                ]);
            } else {
                Alert.alert(t('error'), t('scan_could_not_add'));
            }
        } catch {
            Alert.alert(t('error'), t('scan_connection_error'));
        } finally {
            setIsSavingLog(false);
        }
    };

    const selectedTotal = Object.keys(selectedMatches).reduce((sum, tempId) => {
        const match = selectedMatches[tempId];
        const portion = portions[tempId] ?? 1.0;
        return sum + ((match?.p_calorie || 0) * portion);
    }, 0);

    const openManualSearch = (tempId: string, initialQuery: string) => {
        setManualSearchTempId(tempId);
        setManualSearchQuery(initialQuery);
        setManualSearchResults([]);
        setManualSearchVisible(true);
    };

    const searchFoodsManually = async (query: string) => {
        setManualSearchQuery(query);
        if (!query.trim()) { setManualSearchResults([]); return; }
        setManualSearchLoading(true);
        try {
            const token = await getItem('userToken');
            const params = new URLSearchParams({ food_name: query });
            const res = await fetch(`${API_URL}/api/food/search_food?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setManualSearchResults(data.foods || []);
        } catch {
            setManualSearchResults([]);
        } finally {
            setManualSearchLoading(false);
        }
    };

    const selectManualResult = (food: any) => {
        if (!manualSearchTempId) return;
        setSelectedMatches(prev => ({ ...prev, [manualSearchTempId]: food }));
        setManualSearchVisible(false);
        setManualSearchQuery('');
        setManualSearchResults([]);
        setManualSearchTempId(null);
    };

    const resetAll = () => {
        setPhotos([]);
        setDetections(null);
        setAnnotatedImage(null);
        setScanImageUrl(null);
        setIsCameraActive(true);
        setSelectedMatches({});
        setPortions({});
    };

    const renderModals = () => (
        <>
            {/* Camera permission modal */}
            <Modal visible={permissionModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('scan_camera_permission')}</Text>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setPermissionModalVisible(false)}>
                                <Text style={styles.modalButtonText}>{t('close')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handlePermissionButton}>
                                <Text style={styles.modalButtonText}>{t('scan_allow')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Photo history modal */}
            <Modal visible={galleryVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#121212', paddingTop: 60 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{t('scan_scanned_photos')}</Text>
                        <TouchableOpacity onPress={() => setGalleryVisible(false)}>
                            <Text style={{ color: '#47dd7caf', fontSize: 18, fontWeight: '600' }}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5 }}>
                        {allPhotos.length === 0 && (
                            <Text style={{ color: '#888', textAlign: 'center', width: '100%', marginTop: 50 }}>
                                {t('scan_no_photos_yet')}
                            </Text>
                        )}
                        {allPhotos.map((item, index) => (
                            <View key={index} style={{ width: '33.33%', padding: 5 }}>
                                <Image
                                    source={{ uri: getImageUrl(item.imageUrl) as string }}
                                    style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
                                />
                                <View style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 5, borderRadius: 5 }}>
                                    <Text style={{ color: 'white', fontSize: 10 }}>{item.mealCategory}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Save to log confirmation modal */}
            <Modal
                visible={addToLogModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setAddToLogModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <View style={{ width: '85%', backgroundColor: '#1e1e1e', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#333' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 5 }}>
                            {t('scan_add_to_log')}
                        </Text>
                        <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                            {t('scan_do_you_want')}
                        </Text>

                        <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
                            {detections?.map((item: any) => {
                                const selected = selectedMatches[item.tempId];
                                const portion = portions[item.tempId] ?? 1.0;
                                const calculatedKcal = selected ? Math.round(selected.p_calorie * portion) : null;
                                return (
                                    <View key={item.tempId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                                        <Text style={{ color: 'white', fontSize: 15, textTransform: 'capitalize', flex: 1 }}>
                                            {selected ? selected.food_name : item.class} ({portion} {t('scan_portion').toLowerCase()})
                                        </Text>
                                        <Text style={{ color: '#fc8500', fontSize: 15, fontWeight: '600' }}>
                                            {calculatedKcal !== null ? `${calculatedKcal} kcal` : t('scan_not_selected')}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {detections && detections.length > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderTopColor: '#47dd7caf', marginBottom: 20 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>{t('total')}</Text>
                                <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 17 }}>
                                    {Math.round(selectedTotal)} kcal
                                </Text>
                            </View>
                        )}

                        <Text style={{ color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 15 }}>
                            {t('scan_meal')}: {getCategoryLabel(mealCategory)}
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' }}
                                onPress={() => setAddToLogModalVisible(false)}
                                disabled={isSavingLog}
                            >
                                <Text style={{ color: '#ccc', fontWeight: '600', fontSize: 15 }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#47dd7caf', alignItems: 'center', opacity: isSavingLog ? 0.6 : 1 }}
                                onPress={handleAddToLog}
                                disabled={isSavingLog}
                            >
                                {isSavingLog
                                    ? <ActivityIndicator color="white" size="small" />
                                    : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t('scan_yes_add')}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Manual food search modal */}
            <Modal
                visible={manualSearchVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setManualSearchVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View style={{ backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17, marginBottom: 12 }}>{t('scan_search_manually')}</Text>
                        <TextInput
                            value={manualSearchQuery}
                            onChangeText={searchFoodsManually}
                            placeholder={t('scan_search_placeholder')}
                            placeholderTextColor="#666"
                            autoFocus
                            style={{ backgroundColor: '#2a2a2a', color: 'white', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#444' }}
                        />
                        {manualSearchLoading && <ActivityIndicator color="#47dd7caf" style={{ marginBottom: 10 }} />}
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {manualSearchResults.map((food: any, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => selectManualResult(food)}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
                                >
                                    <Text style={{ color: 'white', fontSize: 15, flex: 1 }}>{food.food_name}</Text>
                                    <Text style={{ color: '#fc8500', fontSize: 13, marginRight: 10 }}>{food.p_calorie} kcal</Text>
                                    <Text style={{ color: '#47dd7caf', fontSize: 13, fontWeight: 'bold' }}>{t('scan_select')}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setManualSearchVisible(false)}
                            style={{ marginTop: 14, alignItems: 'center', paddingVertical: 12, backgroundColor: '#333', borderRadius: 10 }}
                        >
                            <Text style={{ color: '#ccc', fontWeight: '600' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );

    // ── Results screen ───────────────────────────────────────
    if (!isCameraActive && photos.length > 0) {
        return (
            <View style={styles.previewContainer}>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <Image source={{ uri: annotatedImage || photos[0] }} style={[styles.preview, { height: 400, borderRadius: 0 }]} />

                    {isLoading && (
                        <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                            <ActivityIndicator size="large" color="#47dd7caf" />
                            <Text style={{ color: 'white', marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>{t('scan_analyzing')}</Text>
                        </View>
                    )}

                    {detections && !isLoading && (
                        <View style={{ backgroundColor: '#1e1e1e', margin: 15, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, marginBottom: 20, textAlign: 'center' }}>{t('scan_result')}</Text>

                            {detections.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <Text style={{ color: '#ddd', textAlign: 'center', marginBottom: 16, fontSize: 15 }}>{t('scan_no_food_try')}</Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#47dd7caf', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 }}
                                        onPress={() => navigation.navigate('MainPage')}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t('scan_add_manually')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                detections.map((item, index) => (
                                    <View key={item.tempId || index} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#444', paddingBottom: 15 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>
                                                {t('scan_detected')}: {item.class.toUpperCase()}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setDetections(prev => prev ? prev.filter(d => d.tempId !== item.tempId) : []);
                                                    const newMatches = { ...selectedMatches };
                                                    delete newMatches[item.tempId];
                                                    setSelectedMatches(newMatches);
                                                    const newPortions = { ...portions };
                                                    delete newPortions[item.tempId];
                                                    setPortions(newPortions);
                                                }}
                                                style={{ backgroundColor: 'rgba(255,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                            >
                                                <Text style={{ color: '#ff4444', fontSize: 11, fontWeight: 'bold' }}>{t('scan_remove')}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {item.dbMatches?.length > 0 ? (
                                            <View>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                                    {item.dbMatches.map((match: any, mIdx: number) => (
                                                        <TouchableOpacity
                                                            key={mIdx}
                                                            onPress={() => setSelectedMatches(prev => ({ ...prev, [item.tempId]: match }))}
                                                            style={{
                                                                paddingHorizontal: 15,
                                                                paddingVertical: 8,
                                                                borderRadius: 25,
                                                                backgroundColor: selectedMatches[item.tempId]?.food_id === match.food_id ? '#fc8500' : '#333',
                                                                marginRight: 10,
                                                                borderWidth: 1,
                                                                borderColor: selectedMatches[item.tempId]?.food_id === match.food_id ? '#fff' : 'transparent',
                                                            }}
                                                        >
                                                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>{match.food_name}</Text>
                                                            <Text style={{ color: '#eee', fontSize: 11, textAlign: 'center' }}>{match.p_calorie} kcal</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>

                                                <TouchableOpacity
                                                    onPress={() => openManualSearch(item.tempId, item.class)}
                                                    style={{ marginTop: 8 }}
                                                >
                                                    <Text style={{ color: '#666', fontSize: 11, textDecorationLine: 'underline' }}>{t('scan_search_manually')}</Text>
                                                </TouchableOpacity>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#2a2a2a', padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                                                    <TouchableOpacity
                                                        onPress={() => setPortions(prev => ({ ...prev, [item.tempId]: Math.max(0.5, (prev[item.tempId] ?? 1) - 0.5) }))}
                                                        style={{ width: 35, height: 35, backgroundColor: '#444', borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>-</Text>
                                                    </TouchableOpacity>

                                                    <View style={{ marginHorizontal: 20, alignItems: 'center' }}>
                                                        <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 18 }}>{portions[item.tempId] ?? 1.0}</Text>
                                                        <Text style={{ color: '#888', fontSize: 11 }}>{t('scan_portion')}</Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => setPortions(prev => ({ ...prev, [item.tempId]: (prev[item.tempId] ?? 1) + 0.5 }))}
                                                        style={{ width: 35, height: 35, backgroundColor: '#444', borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>+</Text>
                                                    </TouchableOpacity>

                                                    {selectedMatches[item.tempId] && (
                                                        <View style={{ marginLeft: 25, borderLeftWidth: 1, borderLeftColor: '#444', paddingLeft: 20 }}>
                                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                                                {Math.round(selectedMatches[item.tempId].p_calorie * (portions[item.tempId] ?? 1.0))} kcal
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => openManualSearch(item.tempId, item.class)}
                                                style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#2a2a2a', borderRadius: 10, borderWidth: 1, borderColor: '#555', alignSelf: 'flex-start' }}
                                            >
                                                <Text style={{ color: '#aaa', fontSize: 12 }}>{t('scan_no_db_match')} — {t('scan_search_manually')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            )}

                            {detections.length > 0 && (
                                <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#444', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{t('total')}:</Text>
                                    <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 24 }}>
                                        {Math.round(selectedTotal)} kcal
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, isLoading && { opacity: 0.5 }]}
                        onPress={resetAll}
                        disabled={isLoading}
                    >
                        <Text style={styles.text}>{t('scan_retake')}</Text>
                    </TouchableOpacity>

                    {detections && detections.length > 0 && (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#fc8500' }]}
                            onPress={() => setAddToLogModalVisible(true)}
                        >
                            <Text style={styles.text}>{t('scan_save_log')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {renderModals()}
            </View>
        );
    }

    // ── Camera view ──────────────────────────────────────────
    return (
        <View style={styles.container}>
            {permission?.granted ? (
                <View style={StyleSheet.absoluteFillObject}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        ref={cameraRef}
                    />
                    {photos.length > 0 && (
                        <View style={styles.thumbnailContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                                {photos.map((uri, index) => (
                                    <View key={index} style={styles.thumbnailWrapper}>
                                        <Image source={{ uri }} style={styles.thumbnailImage} />
                                        <TouchableOpacity style={styles.deleteThumbnailBtn} onPress={() => removePhoto(index)}>
                                            <Text style={styles.deleteThumbnailText}>X</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.container, { backgroundColor: 'black' }]} />
            )}

            <View style={[styles.captureButtonContainer, photos.length > 0 && { bottom: 110 }]}>
                <View style={styles.galleryButtonWrapper}>
                    <TouchableOpacity
                        style={{ width: 55, height: 55, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#47dd7caf' }}
                        onPress={openGallery}
                        disabled={isLoadingGallery}
                    >
                        {isLoadingGallery
                            ? <ActivityIndicator color="#47dd7caf" size="small" />
                            : <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{t('scan_all_photos')}</Text>
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureInner} />
                </TouchableOpacity>
            </View>

            {photos.length > 0 && (
                <View style={styles.analyzeBatchContainer}>
                    <View style={styles.categoryContainer}>
                        {MEAL_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryButton, mealCategory === cat && styles.activeCategoryButton]}
                                onPress={() => setMealCategory(cat)}
                            >
                                <Text style={styles.categoryButtonText}>{getCategoryLabel(cat)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#47dd7caf', width: '90%' }]} onPress={handleScanFood}>
                        <Text style={styles.text}>{t('scan_analyze')} ({photos.length})</Text>
                    </TouchableOpacity>
                </View>
            )}

            {renderModals()}
        </View>
    );
}
