import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button ,ScrollView,Alert,TouchableOpacity,FlatList,Image,KeyboardAvoidingView, Platform,Modal} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import styles from '../styles/AddMeal';
import CalorieCircle from '../components/calorieCircle';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeal'>;
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  portion: string;
}
const mockFoodData = [
  { id: '1', name: 'Boiled Egg', calories: 155, portion: '1 large' },
  { id: '2', name: 'Chicken Breast', calories: 165, portion: '100g' },
  { id: '3', name: 'Oatmeal', calories: 150, portion: '1 cup' },
  { id: '4', name: 'Banana', calories: 105, portion: '1 medium' },
  { id: '5', name: 'Apple', calories: 95, portion: '1 medium' },
  { id: '6', name: 'Rice (White)', calories: 130, portion: '100g' },
  { id: '7', name: 'Avocado', calories: 160, portion: '100g' },
];

export default function AddMeal({ route, navigation }: Props) {


  const { selectedDate ,type} = route.params;

  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [searchText, setSearchText] = useState('');
  const [foodList, setFoodList] = useState([]);
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState(mockFoodData);
  const totalCalories = selectedItems.reduce((sum, item) => sum + item.calories, 0);

  //databaseden food verileri request edilir.
  const getFood = async () => {
    try {
          const res = await fetch(`${API_URL}/api/foods`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await res.json();

          if (res.ok) {
            Alert.alert('Success', data.message);
            setFoodList(data);
          } else {
            Alert.alert('Hata', data.message || 'veriler alınamadı');
            setFoodList([]);
          }
        } catch (error) {
          console.error(error);
          Alert.alert('Hata', 'Sunucuya bağlanılamadı. IP adresinizi kontrol edin.');
        }
  };

  //Search yapıldıkça liste filtrelenir.
  const handleSearch = (text:string) =>{
    setSearchText(text);
    if(text){
      const data = mockFoodData.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase():''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData)>-1;

      });
      setFilteredData(data);

    }
    else{
      setFilteredData(mockFoodData);
    }
  };

  //seçilen yemekler backende send edilir.
  const handleAddItem = async (item: FoodItem) => {
    /* try {
     
          const res = await fetch(`${API_URL}/api/meals/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: selectedDate,
              type: type,
              name: item.name,
              calories: item.calories,
              portion: item.portion,
            }),
          });
    
          const data = await res.json();
    
          if (res.ok) {
            //setSelectedItems([...selectedItems, data]);
            setSelectedItems([...selectedItems, item]);
            Alert.alert("Added", `${data.name} added to list.`);
          } else {
            Alert.alert('Hata', data.message || 'cannot add to list');
          }
        } catch (error) {
          console.error(error);
          Alert.alert('Hata', 'Sunucuya bağlanılamadı. IP adresinizi kontrol edin.');
        } 
          */
        setSelectedItems([...selectedItems, item]);
        Alert.alert("Added",` added to list.`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.foodItem}>
      <View>
        <Text style={styles.foodName}>{item.name}</Text>
        
        <View style={styles.calContainer}>
        <Text style={styles.foodPortion}>{item.portion}</Text>
        <Text style={styles.foodCal}>{item.calories}</Text>
        <Text style={styles.calLabel}>kcal</Text>
        </View>
      </View>
      
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(item)}>
        <Ionicons name="add" style={styles.plus} />
        </TouchableOpacity>
      
    </View>
  );

  const handleBackButton = () => {
  navigation.goBack();
   }

    const handleMenuButton = () => {
      //TO-DO
    }
    //remove food from selected and send this to backend
  const handleRemoveItem = async (indexToRemove: number, itemToRemove: FoodItem) => {
    if (!itemToRemove.id) {
      const newList = selectedItems.filter((_, index) => index !== indexToRemove);
      setSelectedItems(newList);
      return;
    }
    try{
        const res = await fetch(`${API_URL}/api/meals/delete`, {
        method: 'DELETE',
        body: JSON.stringify({itemToRemove}),
      });
      if(res.ok){
        const newList = selectedItems.filter((_, index) => index !== indexToRemove);
        setSelectedItems(newList);
      }
      else{
        Alert.alert("Hata", "Silinemedi");
      }
    }
    catch(e){
      console.error(e);
      Alert.alert("Hata", "Sunucu hatası.");
    }
    
  };

  return (
    <View style={styles.container}>
    <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
              <Ionicons name="arrow-back" size={20} color="#5c544d" style={styles.backButton} />
             </TouchableOpacity>
       <TouchableOpacity style={styles.menuButton} onPress={handleMenuButton}>
              <Ionicons name="menu" size={20} color="#5c544d" style={styles.menuButton} />
             </TouchableOpacity>
            <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Android'de bazen azıcık pay gerekir
                          >
           
                <View style={styles.mainChart}>
          <Text style={styles.title}>{type}</Text>
          <Text style={styles.calenderSubtitle}>Today's Date: {selectedDate}</Text>
          <CalorieCircle calories={totalCalories} goal={2000} />
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
                    <TouchableOpacity style={styles.scanButton}>
                      <Ionicons name="scan" size={20} style={styles.scanButtonIcon} />
                      <Text style={styles.scanButtonText}>Scan</Text>
                    </TouchableOpacity>
                </View>
                
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No food found matching "{searchText}"</Text>
                    }
                  />
                

                </KeyboardAvoidingView>
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
                                  <Text style={styles.modalItemName}>{item.name}</Text>
                                  <Text style={styles.modalItemCal}>{item.portion} - {item.calories} kcal</Text>
                              </View>
                              <TouchableOpacity onPress={() => handleRemoveItem(index,item)}>
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
                </View>
  );
}
