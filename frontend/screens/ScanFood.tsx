import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Modal, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import styles from '../styles/ScanFood';

export default function ScanFood() {

    const [permission, requestPermission] = useCameraPermissions();
    const [permissionModalVisible, setPermissionModalVisible] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

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
        if (cameraRef.current) {
            try {
                const data = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    base64: false,
                    exif: false,
                });

                if (data?.uri) {
                    setPhoto(data.uri);
                    console.log("Fotoğraf çekildi:", data.uri);
                }
            } catch (error) {
                Alert.alert("Hata", "Fotoğraf çekilemedi.");
            }
        }
    };

    // Fotoğraf çekildikten sonraki önizleme ekranı
    if (photo) {
        return (
            <View style={styles.previewContainer}>
                <Image source={{ uri: photo }} style={styles.preview} />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => setPhoto(null)}>
                        <Text style={styles.text}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#47dd7caf' }]} onPress={() => Alert.alert("Gönderiliyor", "Backend'e gönderilecek...")}>
                        <Text style={styles.text}>Scan Food</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Kamera Görünümü
    return (
        <View style={styles.container}>

            {permission?.granted ? (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    ref={cameraRef}
                />
            ) : (
                <View style={[styles.container, { backgroundColor: 'black' }]} />
            )}

            <View style={styles.captureButtonContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureInner} />
                </TouchableOpacity>
            </View>
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
        </View>
    );
}