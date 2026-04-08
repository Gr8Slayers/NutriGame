import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Modal, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import styles from '../styles/ScanFood';
import * as SecureStore from 'expo-secure-store';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

export default function ScanFood() {

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
    const [totalCalories, setTotalCalories] = useState<number | null>(null);
    const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
    const [mealCategory, setMealCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
    const [addToLogModalVisible, setAddToLogModalVisible] = useState(false);
    const [isSavingLog, setIsSavingLog] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted) {
            setPermissionModalVisible(true);
        } else {
            setPermissionModalVisible(false);
        }
    }, [permission]);

    const handlePermissionButton = async () => {
        if (!permission) return;

        if (!permission.canAskAgain) {
            Linking.openSettings();
        } else {
            await requestPermission();
        }
    };

    // Fotoğraf Çekme Fonksiyonu
    const takePicture = async () => {
        if (cameraRef.current && photos.length < 10) {
            try {
                const data = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    base64: false,
                    exif: false,
                });

                if (data?.uri) {
                    setPhotos(prev => [...prev, data.uri]);
                    // Reset previous AI results
                    setDetections(null);
                    setTotalCalories(null);
                    setAnnotatedImage(null);
                    console.log("Fotoğraf çekildi:", data.uri);
                }
            } catch (error) {
                Alert.alert("Hata", "Fotoğraf çekilemedi.");
            }
        } else if (photos.length >= 10) {
            Alert.alert("Limit", "En fazla 10 fotoğraf çekebilirsiniz.");
        }
    };

    const openGallery = async () => {
        setIsLoadingGallery(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userId = await SecureStore.getItemAsync('userId');

            if (!userId || !token) return;

            const response = await fetch(`${API_URL}/api/scan/history/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAllPhotos(data.photos);
            }
        } catch (error) {
            console.error("Galeri yüklenirken hata:", error);
            Alert.alert("Hata", "Geçmiş fotoğraflar yüklenemedi.");
        } finally {
            setIsLoadingGallery(false);
            setGalleryVisible(true);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleScanFood = async () => {
        if (photos.length === 0) return;
        setIsCameraActive(false);
        setIsLoading(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert("Error", "Authentication token not found.");
                setIsLoading(false);
                return;
            }

            const formData = new FormData();

            if (photos.length === 1) {
                // RN requires this specific format for image upload
                formData.append('image', {
                    uri: photos[0],
                    name: `scan_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);

                formData.append('mealCategory', mealCategory);

                const response = await fetch(`${API_URL}/api/scan/analyze`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    Alert.alert("Error", data.message || "Failed to analyze image.");
                    setIsLoading(false);
                    return;
                }

                setDetections(data.detections || []);
                setTotalCalories(data.totalCalories || 0);
                if (data.annotated_image) {
                    setAnnotatedImage(data.annotated_image);
                }
            } else {
                photos.forEach((uri, index) => {
                    formData.append('images', {
                        uri: uri,
                        name: `scan_${Date.now()}_${index}.jpg`,
                        type: 'image/jpeg',
                    } as any);
                });

                formData.append('mealCategory', mealCategory);

                const response = await fetch(`${API_URL}/api/scan/analyze-batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    Alert.alert("Error", data.error || data.message || "Failed to analyze batch.");
                    setIsLoading(false);
                    return;
                }

                let allDetections: any[] = [];
                let hasAnnotated = false;

                if (data.results && Array.isArray(data.results)) {
                    data.results.forEach((res: any) => {
                        if (res.success && res.detections) {
                            res.detections.forEach((det: any) => {
                                allDetections.push({
                                    class: det.class_name || det.class || 'Unknown Item',
                                    estimatedCalories: det.estimatedCalories || 0,
                                    confidence: det.confidence,
                                });
                            });
                        }
                    });
                }

                setDetections(allDetections);
                setTotalCalories(null); // No aggregated calories provided out-of-the-box by YOLO endpoint
                setAnnotatedImage(null); // No composite annotated image
            }
        } catch (error) {
            console.error("Scan error:", error);
            Alert.alert("Network Error", "Failed to connect to the server. Is it running?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToLog = async () => {
        if (!detections || detections.length === 0) return;
        setIsSavingLog(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert("Hata", "Oturum bulunamadı.");
                setIsSavingLog(false);
                return;
            }

            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            let successCount = 0;
            let failCount = 0;

            for (const item of detections) {
                const calories = item.estimatedCalories || 0;
                if (calories <= 0) continue;

                try {
                    const response = await fetch(`${API_URL}/api/food/add_to_meal`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            date: dateStr,
                            meal_category: mealCategory,
                            source: 'off',
                            food_name: item.class || 'Scanned Food',
                            p_calorie: calories,
                            p_protein: 0,
                            p_fat: 0,
                            p_carb: 0,
                            p_count: 1,
                            p_unit: 'porsiyon',
                            p_amount: 1
                        })
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
            }

            setAddToLogModalVisible(false);

            if (successCount > 0 && failCount === 0) {
                Alert.alert("Başarılı ✅", `${successCount} yiyecek günlük loguna eklendi.`);
            } else if (successCount > 0 && failCount > 0) {
                Alert.alert("Kısmen Başarılı", `${successCount} yiyecek eklendi, ${failCount} tanesi eklenemedi.`);
            } else {
                Alert.alert("Hata", "Yiyecekler loga eklenemedi.");
            }
        } catch (error) {
            console.error("Add to log error:", error);
            Alert.alert("Hata", "Bir bağlantı hatası oluştu.");
        } finally {
            setIsSavingLog(false);
        }
    };

    // Fotoğraf çekildikten veya değerlendirildikten sonraki sonuç ekranı
    if (!isCameraActive && photos.length > 0) {
        return (
            <View style={styles.previewContainer}>
                {/* Gösterim için ilk resmi ya da açıklamalı resmi kullan */}
                <Image source={{ uri: annotatedImage || photos[0] }} style={styles.preview} />

                {isLoading && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <ActivityIndicator size="large" color="#47dd7caf" />
                        <Text style={{ color: 'white', marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>Analyzing Food...</Text>
                        <Text style={{ color: '#ddd', marginTop: 5, fontSize: 13 }}>This may take up to 30 seconds for batches.</Text>
                    </View>
                )}

                {detections && !isLoading && (
                    <View style={{ position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, marginBottom: 15, textAlign: 'center' }}>Analysis Result</Text>
                        <ScrollView style={{ maxHeight: 180 }}>
                            {detections.length === 0 ? (
                                <Text style={{ color: '#ddd', textAlign: 'center', marginVertical: 10 }}>No recognizable food items found.</Text>
                            ) : (
                                detections.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <Text style={{ color: 'white', textTransform: 'capitalize', fontSize: 16 }}>{item.class}</Text>
                                        <Text style={{ color: '#fc8500', fontSize: 16 }}>{item.estimatedCalories ? `${item.estimatedCalories} kcal` : (item.confidence ? `${Math.round(item.confidence * 100)}% conf` : '')}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        {totalCalories != null && totalCalories > 0 && (
                            <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#555', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Total Estimated:</Text>
                                <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 18 }}>{totalCalories} kcal</Text>
                            </View>
                        )}
                    </View>
                )}


                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, isLoading && { opacity: 0.5 }]}
                        onPress={() => { setPhotos([]); setDetections(null); setTotalCalories(null); setAnnotatedImage(null); setIsCameraActive(true); }}
                        disabled={isLoading}
                    >
                        <Text style={styles.text}>Retake All</Text>
                    </TouchableOpacity>

                    {detections && detections.length > 0 && (
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#fc8500' }]} onPress={() => setAddToLogModalVisible(true)}>
                            <Text style={styles.text}>Save Log</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // Kamera Görünümü
    return (
        <View style={styles.container}>

            {permission?.granted ? (
                <View style={StyleSheet.absoluteFillObject}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        ref={cameraRef}
                    />

                    {/* Thumbnail list overlay if photos exist */}
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
                        style={{
                            width: 55,
                            height: 55,
                            borderRadius: 12,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#47dd7caf'
                        }}
                        onPress={openGallery}
                        disabled={isLoadingGallery}
                    >
                        {isLoadingGallery ? (
                            <ActivityIndicator color="#47dd7caf" size="small" />
                        ) : (
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>All Photos</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureInner} />
                </TouchableOpacity>
            </View>


            {photos.length > 0 && (
                <View style={styles.analyzeBatchContainer}>
                    <View style={styles.categoryContainer}>
                        {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryButton, mealCategory === cat && styles.activeCategoryButton]}
                                onPress={() => setMealCategory(cat)}
                            >
                                <Text style={styles.categoryButtonText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#47dd7caf', width: '90%' }]} onPress={handleScanFood}>
                        <Text style={styles.text}>Analyze ({photos.length})</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal visible={permissionModalVisible} animationType="fade" transparent={true} >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Need Camera Permission</Text>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setPermissionModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handlePermissionButton}>
                                <Text style={styles.modalButtonText}>Allow</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={galleryVisible}
                animationType="slide"
                transparent={false}
            >
                <View style={{ flex: 1, backgroundColor: '#121212', paddingTop: 60 }}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>Scanned Photos</Text>
                        <TouchableOpacity onPress={() => setGalleryVisible(false)}>
                            <Text style={{ color: '#47dd7caf', fontSize: 18, fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5 }}>
                        {allPhotos.length === 0 && (
                            <Text style={{ color: '#888', textAlign: 'center', width: '100%', marginTop: 50 }}>
                                You haven't saved any food photos yet.
                            </Text>
                        )}

                        {allPhotos.map((item, index) => (
                            <View key={index} style={{ width: '33.33%', padding: 5 }}>
                                <Image
                                    source={{ uri: `${API_URL}${item.imageUrl}` }}
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

            {/* Add to Daily Log Confirmation Modal */}
            <Modal
                visible={addToLogModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setAddToLogModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <View style={{ width: '85%', backgroundColor: '#1e1e1e', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#333' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 5 }}>Günlüğe Ekle</Text>
                        <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Bu yiyecekleri günlük kalori loguna eklemek ister misiniz?</Text>

                        <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
                            {detections && detections.map((item: any, index: number) => (
                                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                                    <Text style={{ color: 'white', fontSize: 15, textTransform: 'capitalize', flex: 1 }}>{item.class}</Text>
                                    <Text style={{ color: '#fc8500', fontSize: 15, fontWeight: '600' }}>{item.estimatedCalories ? `${item.estimatedCalories} kcal` : '—'}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Total */}
                        {detections && detections.length > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderTopColor: '#47dd7caf', marginBottom: 20 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>Toplam</Text>
                                <Text style={{ color: '#47dd7caf', fontWeight: 'bold', fontSize: 17 }}>
                                    {detections.reduce((sum: number, d: any) => sum + (d.estimatedCalories || 0), 0)} kcal
                                </Text>
                            </View>
                        )}

                        <Text style={{ color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 15 }}>Öğün: {mealCategory}</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' }}
                                onPress={() => setAddToLogModalVisible(false)}
                                disabled={isSavingLog}
                            >
                                <Text style={{ color: '#ccc', fontWeight: '600', fontSize: 15 }}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#47dd7caf', alignItems: 'center', opacity: isSavingLog ? 0.6 : 1 }}
                                onPress={handleAddToLog}
                                disabled={isSavingLog}
                            >
                                {isSavingLog ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Evet, Ekle ✅</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}