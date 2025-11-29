import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, Alert,StyleSheet, Text, ScrollView ,Button} from 'react-native';

import { Menu} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';

import styles from '../styles/CreateAvatar';
import { IP_ADDRESS } from "@env";

const API_URL = `http://${IP_ADDRESS}:3000`; 


type Props = NativeStackScreenProps<RootStackParamList, 'CreateAvatar'>;

function CreateAvatar({ navigation, route }: Props) {
    const { finalData } = route.params;
    const[name,setUserName]=useState<string | null>(null);
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

         const handleBackButton = () => {
  navigation.goBack();
}

        const Leaf = () => {
            return (
              <View style={styles.leafContainer}>
                {/* Sağdaki koyu yeşil büyük yaprak */}
                <View style={styles.leaf1} />
                {/* Soldaki açık yeşil küçük yaprak */}
                <View style={styles.leaf2} />
              </View>
            );
          };

        const getUserName = async () => {
          
          setUserName(finalData.username); 
            
        };

         const handleSelect = (avatarPath: any) => {
            
            setSelected(avatarPath);
           
          };
          const handleContinue = async () => {
          if (loading) return;
            setLoading(true);

            try{
              console.log(`${API_URL}/api/auth/register`)
              const res = await fetch(`${API_URL}/api/auth/register`,{
                method:'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...finalData,
                  selected,
                }),
              });
              const data = await res.json();
              console.log(data);
              if(res.ok){
               navigation.navigate("Login");
               Alert.alert('Success',data.message);
              }
              else{
                Alert.alert('Error',data.message || "Cannot create profile");
              }
               
            }
            catch(error){

            }
            finally{
              setLoading(false);
            }

    
  };

  useEffect(() => {
    getUserName();
  }, []);

    return (
       <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
                  <Image 
                    source={require("../assets/goback.png")}
                    style={{width:25}}
                />
                </TouchableOpacity>
        <Leaf />
        <View style={styles.dataContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Hello, {name}! </Text>
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
                         {loading ? 'Saving...' : 'Save'}
                       </Text>
                     </TouchableOpacity>
      </ScrollView>
    </View>
    </View>
    );
}

export default CreateAvatar;