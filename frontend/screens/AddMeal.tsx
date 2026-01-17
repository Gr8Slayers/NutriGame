import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, Modal, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import styles from '../styles/AddMeal';
import CalorieCircle from '../components/calorieCircle';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';
import * as SecureStore from 'expo-secure-store';

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeal'>;

interface FoodItem {
  meal_log_id: string;
  food_id: string;
  food_name: string;
  p_calorie: number;
  p_protein: number;
  p_carb: number;
  p_fat: number;
  p_amount: number;
  p_unit: string;
  calories?: number;
  portion?: string;
  portionValue?: number;
}


export default function AddMeal({ route, navigation }: Props) {

  //yemek kalorisi hesaplama fonksiyonu
  const calculateCalories = (baseCalories: number, baseAmount: number, selectedAmount: number): number => {
    if (!baseAmount || baseAmount === 0) return 0;
    return Math.round((baseCalories * selectedAmount) / baseAmount);
  };
  const slideAnim = useRef(new Animated.Value(-300)).current;


  const { selectedDate, type } = route.params;
  const [searchText, setSearchText] = useState('');
  const [portionModalVisibility, setportionModalVisible] = useState(false);
  const [stepperValue, setStepperValue] = useState(1.0); // Stepper değeri
  const [selectedMeal, setSelectedMeal] = useState<FoodItem | null>(null); // geçici seçilen yemek tutulur.
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false); // detay gösterimi modal
  const [filteredData, setFilteredData] = useState([]);
  const totalCalories = selectedItems.reduce((sum, item) => sum + (item.calories || 0), 0); //seçilen yemeklerin toplam kalorisi
  const protein = selectedItems.reduce((sum, item) => sum + (item.p_protein || 0), 0); //seçilen yemeklerin toplam protein
  const carb = selectedItems.reduce((sum, item) => sum + (item.p_carb || 0), 0); //seçilen yemeklerin toplam karbonhidrat
  const fat = selectedItems.reduce((sum, item) => sum + (item.p_fat || 0), 0); //seçilen yemeklerin toplam yağ
  const [dailyGoal, setDailyGoal] = useState(2000);//sonra hesaplanacak

  useFocusEffect(
    useCallback(() => {
      fetchDailyData();
    }, [selectedDate]) //date değiştikçe çalışsın
  );

  const fetchDailyData = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        meal_category: type
      }).toString();
      const url = `${API_URL}/api/food/get_meal_log?${params}`
      console.log(url);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await res.json();
      console.log(data);
      if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
        const fetchedItems = data.data.map((item: any) => ({
          meal_log_id: item.meal_log_id,
          food_id: item.food_id,
          food_name: item.food_name,
          p_calorie: item.t_calorie,
          p_protein: item.t_protein,
          p_carb: item.t_carb,
          p_fat: item.t_fat,
          p_amount: item.t_amount,
          p_unit: item.p_unit,
          calories: item.t_calorie,
          portion: `${item.p_count} Portion (${item.t_amount}${item.p_unit})`,
          portionValue: item.p_count
        }));
        setSelectedItems(fetchedItems);
      } else {
        setSelectedItems([]);
      }
    } catch (error) {
      console.error("Error fetching daily data:", error);
    }
  };

  //databaseden food verileri request edilir.
  const getFood = async () => {
    const token = await SecureStore.getItemAsync('userToken');

    const searchParams = new URLSearchParams({
      food_name: searchText
    }).toString();
    const url = `${API_URL}/api/food/search_food?${searchParams}`;
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
      const foodResults = data.data;
      console.log(data);
      if (res.ok && foodResults) {
        setFilteredData(foodResults);
      } else {
        setFilteredData([]);
      }
    } catch (error) {
      console.log("Veri çekme hatası:", error);
    }
  };


  //Search yapıldıkça liste filtrelenir.
  const handleSearch = (text: string) => {
    setSearchText(text);
    getFood();
  };

  //seçilen yemekler eklenecek porsiyon seçimi açılacak.
  const handleAddItem = async (item: FoodItem) => {
    setSelectedMeal(item);
    setStepperValue(1.0); // Reset stepper
    setportionModalVisible(true);
  };

  const handleAddWithStepper = () => {
    if (!selectedMeal) return;

    const baseAmount = selectedMeal.p_amount || 100;
    const unit = selectedMeal.p_unit || 'g';
    const totalWeight = stepperValue * baseAmount; //kulanıcı kaç porsiyuon yedigine göre hesaplanır.

    const calculatedCalories = calculateCalories(selectedMeal.p_calorie, selectedMeal.p_amount, totalWeight);

    const newItemToAdd = {
      ...selectedMeal,
      portion: `${stepperValue} Portion (${totalWeight}${unit})`, //yeni porsiyon bilgisi
      portionValue: stepperValue,
      calories: calculatedCalories //yeni kalori bilgisi
    };
    const newList = [...selectedItems, newItemToAdd];
    setSelectedItems(newList);
    handleAddMeal(newList);
    setportionModalVisible(false);
    setSelectedMeal(null);

  };

  //seçilen yemekler backende send edilir.
  //tarih konusunda bir sorun var ben o tarihe save etmek isterken bir önceki güne save ediyor??????
  const handleAddMeal = async (items?: FoodItem[]) => {
    const token = await SecureStore.getItemAsync('userToken');
    const itemsToSend = items || selectedItems;

    try {
      const promises = itemsToSend.map(item => {
        const url = `${API_URL}/api/food/add_to_meal`;
        console.log(url);
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            meal_category: type,
            food_id: item.food_id,
            p_count: item.portionValue || 1,
          })
        });
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {

      } else {
        Alert.alert("Hata", "Bazı yemekler eklenemedi.");
      }
    } catch (error) {
      console.error("Error adding meals:", error);
      Alert.alert("Hata", "Yemek ekleme hatası");
    }
  }


  //remove food from selected and send this to backend
  const handleRemoveItem = async (indexToRemove: number, itemToRemove: FoodItem) => {
    if (!itemToRemove.meal_log_id) {
      const newList = selectedItems.filter((_, index) => index !== indexToRemove);
      setSelectedItems(newList);
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('userToken');
      console.log(`${API_URL}/api/food/delete_from_meal`);
      const res = await fetch(`${API_URL}/api/food/delete_from_meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meal_log_id: itemToRemove.meal_log_id }),
      });
      if (res.ok) {
        const newList = selectedItems.filter((_, index) => index !== indexToRemove);
        setSelectedItems(newList);
      }
      else {
        Alert.alert("Hata", "Silinemedi");
      }
    }
    catch (e) {
      console.error(e);
      Alert.alert("Hata", "Sunucu hatası.");
    }

  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.foodItem}>
      <View>
        <Text style={styles.foodName}>{item.food_name}</Text>

        <View style={styles.calContainer}>
          <Text style={styles.foodPortion}>{item.p_amount} {item.p_unit}</Text>
          <Text style={styles.foodCal}>{item.p_calorie}</Text>
          <Text style={styles.calLabel}>kcal</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(item)}>
        <Ionicons name="add" style={styles.plus} />
      </TouchableOpacity>

    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#473C33' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#5c544d" style={styles.backButton} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
            <Ionicons name="menu" size={20} color="#5c544d" style={styles.menuButton} />
          </TouchableOpacity>


          <View style={styles.mainChart}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{type}</Text>
              <Text style={styles.calenderSubtitle}>Today's Date: {selectedDate}</Text>
            </View>
            <Animated.View
              style={[
                { transform: [{ translateY: slideAnim }], marginTop: 180 }
              ]}
            >

              <CalorieCircle
                key={selectedDate}
                calories={totalCalories}
                goal={dailyGoal}
                protein={protein}
                carb={carb}
                fat={fat}
              />
            </Animated.View>
            <TouchableOpacity
              style={styles.showDetailButton}
              onPress={() => setModalVisible(true)}
              disabled={selectedItems.length === 0}
            >

              <Ionicons name="bulb" size={16} color="#473C33" shake />
              <Text style={styles.showDetailText}>
                {selectedItems.length === 0 ? "Select food below" : `Show Detail (${selectedItems.length})`}
              </Text>
              {selectedItems.length > 0 && (
                <Ionicons name="chevron-up" size={16} color="#473C33" />
              )}
            </TouchableOpacity>

          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#5c544d" style={styles.searchIcon} />
              <TextInput
                style={styles.input}
                placeholder="Search food"
                placeholderTextColor="#5c544d"
                value={searchText}
                onChangeText={handleSearch}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate("ScanFood")}>
              <Ionicons name="scan" size={20} style={styles.scanButtonIcon} />
              <Text style={styles.scanButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{searchText.length > 0 ? `No food found matching "${searchText}"` : 'No food found'}</Text>
            }
          />


          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >

            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selected Foods</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#473C33" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {selectedItems.map((item, index) => (
                    <View key={index} style={styles.modalItem}>
                      <View>
                        <Text style={styles.modalItemName}>{item.food_name}</Text>
                        <Text style={styles.modalItemCal}>{item.portionValue} - {item.p_calorie} kcal</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveItem(index, item)}>
                        <Ionicons name="trash-outline" size={20} color="#e57373" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Text style={styles.modalTotalText}>Total: {totalCalories} kcal</Text>
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

          <Modal
            animationType="fade"
            transparent={true}
            visible={portionModalVisibility}
            onRequestClose={() => setportionModalVisible(false)}
          >

            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Portion</Text>
                  <TouchableOpacity onPress={() => setportionModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#473C33" />
                  </TouchableOpacity>
                </View>

                <View style={styles.stepperContainer}>
                  <Text style={styles.portionInfoText}>
                    Base: {selectedMeal?.p_amount} {selectedMeal?.p_unit}
                  </Text>

                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setStepperValue(prev => Math.max(0.5, prev - 0.5))}
                    >
                      <Ionicons name="remove" size={30} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.stepperValueText}>{stepperValue}</Text>

                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setStepperValue(prev => prev + 0.5)}
                    >
                      <Ionicons name="add" size={30} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.summaryText}>
                    Total: {(stepperValue * (selectedMeal?.p_amount || 0))} {selectedMeal?.p_unit} | {calculateCalories(selectedMeal?.p_calorie || 0, selectedMeal?.p_amount || 1, stepperValue * (selectedMeal?.p_amount || 0))} kcal
                  </Text>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleAddWithStepper}
                  >
                    <Text style={styles.modalSaveText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}
