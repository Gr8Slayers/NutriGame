import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { RootStackParamList } from '../App';
import WaterWave from "../components/waterContainer";
import styles from '../styles/AddWater';

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddWater'>;

interface WaterPortion {
     id: string;
     name: string;
     amount: number;
     iconName: string;
     iconColor: string;
}

interface AddedEntry {
     key: string;
     name: string;
     amount: number;
}

const waterPortions: WaterPortion[] = [
     { id: '1', name: 'Cup', amount: 250, iconName: 'cup', iconColor: '#0277BD' },
     { id: '2', name: 'Small Bottle', amount: 330, iconName: 'bottle-soda-classic-outline', iconColor: '#0277BD' },
     { id: '3', name: 'Large Bottle', amount: 500, iconName: 'water-outline', iconColor: '#0277BD' },
     { id: '4', name: 'Liter', amount: 1000, iconName: 'water-plus-outline', iconColor: '#0277BD' },
];

export default function AddWater({ route, navigation }: Props) {
     const { selectedDate, type } = route.params;
     const [currentWater, setCurrentWater] = useState<number>(0);
     const [addedEntries, setAddedEntries] = useState<AddedEntry[]>([]);
     const [modalVisible, setModalVisible] = useState(false);
     const [waterGoal, setWaterGoal] = useState<number>(0);
     const maxCapacity = waterGoal > 0 ? waterGoal : 3000;

     const addedAmount = addedEntries.reduce((sum, e) => sum + e.amount, 0);

     // Fetch current water intake for the selected date
     const fetchWaterData = useCallback(async () => {
          try {
               const token = await SecureStore.getItemAsync('userToken');
               const params = new URLSearchParams({ date: selectedDate }).toString();
               const url = `${API_URL}/api/food/get_water_total?${params}`;

               const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                    },
               });

               const data = await res.json();
               if (res.ok && data.data) {
                    setCurrentWater(data.data.t_amount || 0);
               } else {
                    setCurrentWater(0);
               }
          } catch (error) {
               console.log("Error fetching water data:", error);
               setCurrentWater(0);
          }
     }, [selectedDate]);

     const fetchWaterGoal = useCallback(async () => {
          const token = await SecureStore.getItemAsync('userToken');
          try {
               const res = await fetch(`${API_URL}/api/user/daily_targets`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               });
               const data = await res.json();
               if (res.ok && data.success) {
                    const t = data.data;
                    if (t && t.water_ml) {
                         setWaterGoal(t.water_ml);
                    }
               }
          } catch (error) {
               console.error('Error fetching water goal:', error);
          }
     }, []);

     useFocusEffect(
          useCallback(() => {
               fetchWaterData();
               setAddedEntries([]);
               fetchWaterGoal();
          }, [fetchWaterData, fetchWaterGoal])
     );

     const handlePortionPress = (portion: WaterPortion) => {
          // Future date check
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          if (selectedDate > todayStr) {
               Alert.alert("Uyarı", "Gelecek tarihlere kayıt ekleyemezsiniz.");
               return;
          }

          const entry: AddedEntry = {
               key: `${portion.id}-${Date.now()}`,
               name: portion.name,
               amount: portion.amount,
          };
          setAddedEntries(prev => [...prev, entry]);
     };

     const handleRemoveEntry = (key: string) => {
          setAddedEntries(prev => prev.filter(e => e.key !== key));
     };

     const handleDeleteSaved = async () => {
          try {
               const token = await SecureStore.getItemAsync('userToken');
               const params = new URLSearchParams({ date: selectedDate }).toString();
               const totalRes = await fetch(`${API_URL}/api/food/get_water_total?${params}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
               });
               const totalData = await totalRes.json();
               if (!totalRes.ok || !totalData.data) {
                    Alert.alert('Hata', 'Su kaydı bulunamadı.');
                    return;
               }
               const { water_log_id, t_amount } = totalData.data;
               const res = await fetch(`${API_URL}/api/food/delete_from_water`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ water_log_id, water_amount: t_amount })
               });
               if (res.ok) {
                    setCurrentWater(0);
               } else {
                    const d = await res.json();
                    Alert.alert('Hata', d.message || 'Silme başarısız.');
               }
          } catch (e) {
               Alert.alert('Hata', 'Bağlantı hatası.');
          }
     };

     const handleSave = async () => {
          if (addedAmount === 0) {
               Alert.alert('Uyarı', 'Lütfen su miktarı ekleyin.');
               return;
          }

          try {
               const token = await SecureStore.getItemAsync('userToken');
               const url = `${API_URL}/api/food/add_to_water`;

               const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                         date: selectedDate,
                         water_amount: addedAmount
                    })
               });

               const data = await res.json();
               if (res.ok) {
                    Alert.alert('Başarılı', `${addedAmount} ml su eklendi!`, [
                         {
                              text: 'Tamam',
                              onPress: () => navigation.goBack()
                         }
                    ]);
               } else {
                    Alert.alert('Hata', data.message || 'Su eklenirken bir hata oluştu.');
               }
          } catch (error) {
               console.log("Error adding water:", error);
               Alert.alert('Hata', 'Bağlantı hatası oluştu.');
          }
     };

     const totalWater = currentWater + addedAmount;
     const progress = Math.min(totalWater / maxCapacity, 1);

     return (
          <View style={styles.container}>
               {/* Header */}
               <View style={styles.header}>
                    <TouchableOpacity
                         style={styles.backButton}
                         onPress={() => navigation.goBack()}
                    >
                         <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Water</Text>
                    <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
                         <Ionicons name="menu" size={24} color="#333" style={styles.menuButton} />
                    </TouchableOpacity>
                    <View style={styles.placeholder} />

               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Date Display */}
                    <Text style={styles.dateText}>Today's Date: {selectedDate}</Text>
                    {/* Water Container */}
                    <View style={styles.waterContainer}>
                         <WaterWave progress={progress} maxCapacity={maxCapacity} />
                    </View>

                    {/* Current Amount Display */}
                    <View style={styles.currentAmount}>
                         <Text style={styles.currentAmountText}>Total Consumed Water</Text>
                         <Text style={styles.currentAmountValue}>
                              {totalWater} / {maxCapacity} ml
                         </Text>
                         {addedAmount > 0 && (
                              <Text style={{ color: '#4CAF50', fontSize: 14, marginTop: 5 }}>
                                   +{addedAmount} ml eklenecek
                              </Text>
                         )}


                    </View>
                    <View style={styles.showDetailButtonContainer}>
                         <TouchableOpacity
                              style={styles.showDetailButton}
                              onPress={() => setModalVisible(true)}
                              disabled={totalWater === 0}
                         >
                              <Ionicons name="bulb" size={16} color="#473C33" shake />
                              <Text style={styles.showDetailText}>
                                   {totalWater === 0 ? "Select below" : `Show Detail (${totalWater})`}
                              </Text>
                              {totalWater > 0 && (
                                   <Ionicons name="chevron-up" size={16} color="#473C33" />
                              )}
                         </TouchableOpacity>
                    </View>

                    {/* Portion Selection */}
                    <View style={styles.portionContainer}>
                         <Text style={styles.sectionTitle}>Select Quantity</Text>
                         <View style={styles.portionGrid}>
                              {waterPortions.map((portion) => (
                                   <TouchableOpacity
                                        key={portion.id}
                                        style={styles.portionButton}
                                        onPress={() => handlePortionPress(portion)}
                                        activeOpacity={0.7}
                                   >
                                        <MaterialCommunityIcons name={portion.iconName} size={40} color={portion.iconColor} />
                                        <Text style={styles.portionName}>{portion.name}</Text>
                                        <Text style={styles.portionAmount}>{portion.amount} ml</Text>
                                   </TouchableOpacity>
                              ))}
                         </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                         style={[
                              styles.saveButton,
                              addedAmount === 0 && styles.saveButtonDisabled
                         ]}
                         onPress={handleSave}
                         disabled={addedAmount === 0}
                    >
                         <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>

                    <Modal
                         animationType="fade"
                         transparent={true}
                         visible={modalVisible}
                         onRequestClose={() => setModalVisible(false)}
                    >

                         <View style={styles.modalOverlay}>
                              <View style={styles.modalContent}>
                                   <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Selected Amounts</Text>
                                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                                             <Ionicons name="close" size={24} color="#473C33" />
                                        </TouchableOpacity>
                                   </View>

                                   <ScrollView style={styles.modalScroll}>
                                        {/* Kayıtlı (backend'de olan) */}
                                        {currentWater > 0 && (
                                             <View style={styles.modalItem}>
                                                  <View>
                                                       <Text style={styles.modalItemCal}>{currentWater} ml</Text>
                                                  </View>
                                                  <TouchableOpacity
                                                       onPress={() =>
                                                            Alert.alert(
                                                                 'Sil',
                                                                 `Kayıtlı ${currentWater} ml silinsin mi?`,
                                                                 [
                                                                      { text: 'İptal', style: 'cancel' },
                                                                      { text: 'Sil', style: 'destructive', onPress: handleDeleteSaved }
                                                                 ]
                                                            )
                                                       }
                                                  >
                                                       <Ionicons name="trash-outline" size={20} color="#e57373" />
                                                  </TouchableOpacity>
                                             </View>
                                        )}

                                        {/* Eklenecek (henüz kaydedilmemiş) */}
                                        {addedEntries.map((item, index) => (
                                             <View key={index} style={styles.modalItem}>
                                                  <View>
                                                       <Text style={styles.modalItemName}>{item.name}</Text>
                                                       <Text style={styles.modalItemCal}>{item.amount} ml</Text>
                                                  </View>
                                                  <TouchableOpacity onPress={() => handleRemoveEntry(item.key)}>
                                                       <Ionicons name="trash-outline" size={20} color="#e57373" />
                                                  </TouchableOpacity>
                                             </View>
                                        ))}

                                        {currentWater === 0 && addedEntries.length === 0 && (
                                             <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 20 }}>Kayıt yok</Text>
                                        )}
                                   </ScrollView>

                                   <View style={styles.modalFooter}>
                                        <Text style={styles.modalTotalText}>Total: {totalWater} ml</Text>
                                        <TouchableOpacity
                                             style={styles.modalSaveButton}
                                             onPress={() => setModalVisible(false)} // Sadece kapatır, kaydetme işini ana ekrandaki Save yapar
                                        >
                                             <Text style={styles.modalSaveText}>OK</Text>
                                        </TouchableOpacity>
                                   </View>
                              </View>
                         </View>
                    </Modal>
               </ScrollView>

          </View>
     );
}
