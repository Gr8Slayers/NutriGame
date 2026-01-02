import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import WaterWave from "../components/waterContainer";

import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`;

type Props = NativeStackScreenProps<RootStackParamList, 'AddWater'>;
export default function AddWater({ route, navigation }: Props) {

     const { selectedDate, type } = route.params;

     return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
               <WaterWave progress={0.5} maxCapacity={3000} />
          </View>
     );
}