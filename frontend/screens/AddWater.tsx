import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../App';
import WaterWave from "../components/waterContainer";
import styles from '../styles/AddWater';
import { WaterPortion, AddedEntry, SavedLog } from '../types';
import { IP_ADDRESS } from "@env";
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddWater'>;



const waterPortions: WaterPortion[] = [
     { id: '1', name: 'Cup', amount: 250, iconName: 'cup', iconColor: '#0277BD' },
     { id: '2', name: 'Small Bottle', amount: 330, iconName: 'bottle-soda-classic-outline', iconColor: '#0277BD' },
     { id: '3', name: 'Large Bottle', amount: 500, iconName: 'water-outline', iconColor: '#0277BD' },
     { id: '4', name: 'Liter', amount: 1000, iconName: 'water-plus-outline', iconColor: '#0277BD' },
];

export default function AddWater({ route, navigation }: Props) {
     const { selectedDate, type } = route.params;
     const { t } = useLanguage();
     const [currentWater, setCurrentWater] = useState<number>(0);
     const [savedLogs, setSavedLogs] = useState<SavedLog[]>([]);
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
                    setSavedLogs(data.data.logs || []);
               } else {
                    setCurrentWater(0);
                    setSavedLogs([]);
               }
          } catch (error) {
               console.log("Error fetching water data:", error);
               setCurrentWater(0);
               setSavedLogs([]);
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
               Alert.alert(t('warning'), t('future_date_warning'));
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

     const handleDeleteSaved = async (logId: number, amount: number) => {
          Alert.alert(
               t('delete'),
               `${amount} ml will be deleted. Are you sure?`,
               [
                    { text: t('cancel'), style: 'cancel' },
                    {
                         text: t('delete'), style: 'destructive', onPress: async () => {
                              try {
                                   const token = await SecureStore.getItemAsync('userToken');
                                   const res = await fetch(`${API_URL}/api/food/delete_from_water`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ water_log_id: logId })
                                   });
                                   if (res.ok) {
                                        fetchWaterData();
                                   } else {
                                        const d = await res.json();
                                        Alert.alert(t('error'), d.message || 'Delete failed.');
                                   }
                              } catch (e) {
                                   Alert.alert(t('error'), 'Connection error.');
                              }
                         }
                    }
               ]
          );
     };

     const handleSave = async () => {
          if (addedAmount === 0) {
               Alert.alert(t('warning'), t('addwater_please_add'));
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
                         entries: addedEntries.map(e => ({ name: e.name, amount: e.amount }))
                    })
               });

               const data = await res.json();
               if (res.ok) {
                    Alert.alert(t('success'), `${addedAmount} ${t('addwater_added_success')}`, [
                         {
                              text: t('ok'),
                              onPress: () => {
                                   setAddedEntries([]);
                                   fetchWaterData();
                                   navigation.goBack();
                              }
                         }
                    ]);
               } else {
                    Alert.alert(t('error'), data.message || 'Error adding water.');
               }
          } catch (error) {
               console.log("Error adding water:", error);
               Alert.alert(t('error'), 'Connection error.');
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
                    <Text style={styles.headerTitle}>{t('addwater_header')}</Text>
                    <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
                         <Ionicons name="menu" size={24} color="#333" style={styles.menuButton} />
                    </TouchableOpacity>
                    <View style={styles.placeholder} />

               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Date Display */}
                    <Text style={styles.dateText}>{t('today')}: {selectedDate}</Text>
                    {/* Water Container */}
                    <View style={styles.waterContainer}>
                         <WaterWave progress={progress} maxCapacity={maxCapacity} />
                    </View>

                    {/* Current Amount Display */}
                    <View style={styles.currentAmount}>
                         <Text style={styles.currentAmountText}>{t('addwater_total_consumed')}</Text>
                         <Text style={styles.currentAmountValue}>
                              {totalWater} / {maxCapacity} ml
                         </Text>
                         {addedAmount > 0 && (
                              <Text style={{ color: '#4CAF50', fontSize: 14, marginTop: 5 }}>
                                   +{addedAmount} {t('addwater_will_be_added')}
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
                                   {totalWater === 0 ? t('addwater_select_below') : `${t('addwater_show_detail')} (${totalWater})`}
                              </Text>
                              {totalWater > 0 && (
                                   <Ionicons name="chevron-up" size={16} color="#473C33" />
                              )}
                         </TouchableOpacity>
                    </View>

                    {/* Portion Selection */}
                    <View style={styles.portionContainer}>
                         <Text style={styles.sectionTitle}>{t('addwater_select_quantity')}</Text>
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
                         <Text style={styles.saveButtonText}>{t('save')}</Text>
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
                                        <Text style={styles.modalTitle}>{t('addwater_selected_amounts')}</Text>
                                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                                             <Ionicons name="close" size={24} color="#473C33" />
                                        </TouchableOpacity>
                                   </View>

                                   <ScrollView style={styles.modalScroll}>
                                        {/* Kayıtlı (backend'de olan) */}
                                        {savedLogs.map((log) => (
                                             <View key={log.water_log_id} style={styles.modalItem}>
                                                  <View>
                                                       <Text style={styles.modalItemName}>{log.portion_name}</Text>
                                                       <Text style={styles.modalItemCal}>{log.amount} ml</Text>
                                                  </View>
                                                  <TouchableOpacity
                                                       onPress={() => handleDeleteSaved(log.water_log_id, log.amount)}
                                                  >
                                                       <Ionicons name="trash-outline" size={20} color="#e57373" />
                                                  </TouchableOpacity>
                                             </View>
                                        ))}

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
                                             <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 20 }}>{t('addwater_no_record')}</Text>
                                        )}
                                   </ScrollView>

                                   <View style={styles.modalFooter}>
                                        <Text style={styles.modalTotalText}>{t('total')}: {totalWater} ml</Text>
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
