import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, ScrollView ,Button} from 'react-native';

import { Menu} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';

import styles from '../styles/CreateAvatar';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`; 


type Props = NativeStackScreenProps<RootStackParamList, 'CreateAvatar'>;

function CreateAvatar({ navigation }: Props) {
    const [avatar,setAvatar]=useState('');
      const [loading, setLoading] = useState<boolean>(false); 
  const [selected, setSelected] = useState<string | null>(null);
    const avatars = [
        require('../assets/avatars/av1.png'),
        require('../assets/avatars/av2.png'),
        require('../assets/avatars/av3.png'),
        require('../assets/avatars/av4.png'),
        require('../assets/avatars/av5.png'),
        require('../assets/avatars/av6.png'),
        require('../assets/avatars/av7.png'),
        require('../assets/avatars/av8.png'),
        require('../assets/avatars/av9.png'),
        require('../assets/avatars/av10.png'),
        require('../assets/avatars/av11.png'),
        ];

         const handleSelect = (avatarPath: any) => {
        setSelected(avatarPath);
          };
          const handleContinue = () => {
    if (!selected) return;
    
  };
    return (
       <View style={styles.container}>
       <View style={styles.circle1}/>
          <View style={styles.circle2}/>
            <View style={styles.circle3}></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Choose Your Avatar</Text>
      <View style={styles.grid}>
        {avatars.map((img, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleSelect(img)}
            style={[
              styles.avatarContainer,
              selected === img && styles.selected,
            ]}
          >
            <Image source={img} style={styles.avatar} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
                       <Text style={styles.buttonText}>
                         {loading ? 'Continuing...' : 'Continue'}
                       </Text>
                     </TouchableOpacity>
      </ScrollView>
    </View>
    );
}

export default CreateAvatar;