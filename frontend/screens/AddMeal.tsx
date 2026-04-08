import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Modal, Animated } from 'react-native';
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
  const totalCalories = selectedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
  const protein = selectedItems.reduce((sum, item) => sum + (item.p_protein || 0), 0);
  const carb = selectedItems.reduce((sum, item) => sum + (item.p_carb || 0), 0);
  const fat = selectedItems.reduce((sum, item) => sum + (item.p_fat || 0), 0);

  // Actual saved totals fetched from backend for this meal (shown in circle)
  const [savedCalories, setSavedCalories] = useState(0);
  const [savedProtein, setSavedProtein] = useState(0);
  const [savedCarb, setSavedCarb] = useState(0);
  const [savedFat, setSavedFat] = useState(0);
  const [mealGoal, setMealGoal] = useState(500); // personalized meal goal

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim().length > 0) {
        getFood();
      } else {
        setFilteredData([]);
      }
    }, 800);


    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  // Fetch meal log items (for the list)
  const fetchDailyData = useCallback(async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const params = new URLSearchParams({ date: selectedDate, meal_category: type }).toString();
      const res = await fetch(`${API_URL}/api/food/get_meal_log?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
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
      console.error('Error fetching meal log:', error);
    }
  }, [selectedDate, type]);

  // Fetch actual saved totals for the circle (from MealTotals table)
  const fetchMealTotal = useCallback(async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const params = new URLSearchParams({ date: selectedDate, meal_category: type }).toString();
      const res = await fetch(`${API_URL}/api/food/get_meal_total?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data && data.data !== 0) {
        setSavedCalories(data.data.t_calorie ?? 0);
        setSavedProtein(data.data.t_protein ?? 0);
        setSavedCarb(data.data.t_carb ?? 0);
        setSavedFat(data.data.t_fat ?? 0);
      } else {
        setSavedCalories(0); setSavedProtein(0); setSavedCarb(0); setSavedFat(0);
      }
    } catch (error) {
      console.error('Error fetching meal total:', error);
    }
  }, [selectedDate, type]);

  // Fetch personalized daily targets to get this meal's goal
  const fetchMealGoal = useCallback(async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const res = await fetch(`${API_URL}/api/user/daily_targets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const t = data.data;
        const typeLower = type.toLowerCase();
        if (typeLower === 'breakfast') setMealGoal(t.breakfast);
        else if (typeLower === 'lunch') setMealGoal(t.lunch);
        else if (typeLower === 'dinner') setMealGoal(t.dinner);
        else if (typeLower === 'snack') setMealGoal(t.snack);
      }
    } catch (error) {
      console.error('Error fetching meal goal:', error);
    }
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      fetchDailyData();
      fetchMealTotal();
      fetchMealGoal();
    }, [fetchDailyData, fetchMealTotal, fetchMealGoal])
  );

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
  };

  //seçilen yemekler eklenecek porsiyon seçimi açılacak.
  const handleAddItem = async (item: FoodItem) => {
    setSelectedMeal(item);
    setStepperValue(1.0); // Reset stepper
    setportionModalVisible(true);
  };

  const handleAddWithStepper = () => {
    if (!selectedMeal) return;

    // Future date check
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (selectedDate > todayStr) {
      Alert.alert("Uyarı", "Gelecek tarihlere kayıt ekleyemezsiniz.");
      return;
    }

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
    handleStreakUpdate();
    setportionModalVisible(false);
    setSelectedMeal(null);

  };

  //seçilen yemekler backende send edilir.
  const handleAddMeal = async (items?: FoodItem[]) => {
    const token = await SecureStore.getItemAsync('userToken');
    const itemsToSend = items || selectedItems;
    if (itemsToSend.length === 0) return;

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
            date: selectedDate,
            meal_category: type,
            food_id: item.food_id,
            p_count: item.portionValue || 1,
            food_name: item.food_name,
            p_calorie: item.p_calorie,
            p_protein: item.p_protein,
            p_fat: item.p_fat,
            p_carb: item.p_carb,
            p_unit: item.p_unit,
            p_amount: item.p_amount,
          })
        });
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        fetchMealTotal(); // refresh the circle immediately

        await handleStreakUpdate();

      } else {
        Alert.alert("Hata", "Bazı yemekler eklenemedi.");
      }
    } catch (error) {
      console.error("Error adding meals:", error);
      Alert.alert("Hata", "Yemek ekleme hatası");
    }
  }

  const handleStreakUpdate = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    const url = `${API_URL}/api/gamification/streak/update`;
    console.log(url);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          meal_category: type,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log('Streak updated successfully');
      } else {
        console.log('Streak update failed', data);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
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
        fetchMealTotal();
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
      <View style={{ flex: 1 }}>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add {type}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
          <Ionicons name="menu" size={24} color="#333" style={styles.menuButton} />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>



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
                key={selectedDate + type}
                calories={savedCalories}
                goal={mealGoal}
                protein={savedProtein}
                carb={savedCarb}
                fat={savedFat}
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

          <View style={styles.listContent}>
            {filteredData.length > 0 ? (
              filteredData.map((item: any, index: number) => (
                <View key={`${item.food_name}_${index}`}>
                  {renderItem({ item })}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{searchText.length > 0 ? `No food found matching "${searchText}"` : 'No food found'}</Text>
            )}
          </View>


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
