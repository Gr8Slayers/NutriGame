import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button,Image, Alert, TouchableOpacity, ScrollView,KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import styles from '../styles/SignUpStyle';
import { IP_ADDRESS } from "@env";
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = `http://${IP_ADDRESS}:3000`; 

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
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

function SignUp({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useLanguage();

 

const handleBackButton = () => {
  navigation.goBack();
}

  const handleSignUp = async () => {
    if (loading) return;
    if(!name || !email || !password){
      Alert.alert(t('error'), 'Please fill all fields.');
      setLoading(false);
      return;
    }
    if (!kvkkAccepted) {
      Alert.alert(t('error'), t('kvkk_error'));
      setLoading(false);
      return;
    }
    if (!tosAccepted) {
      Alert.alert(t('error'), t('tos_error'));
      setLoading(false);
      return;
    }
    if (!consentAccepted) {
      Alert.alert(t('error'), t('consent_error'));
      setLoading(false);
      return;
    }
    const initialData = {
      username: name,
      email: email,
      password: password,
    };
    navigation.navigate('SignUpEnterData',{initialData});
     
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Image 
            source={require("../assets/goback.png")}
            style={{width:25}}
        />
        </TouchableOpacity>
      <Leaf />
      <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Android'de bazen azıcık pay gerekir
          >
      <View style={styles.dataContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>{t('signup_title')}</Text>

      <View style={styles.inputContainer}>
              <Text style = {styles.label}>{t('signup_username')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup_username')}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputContainer}>
                      <Text style = {styles.label}>{t('signup_email')} *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('signup_email')}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
              </View>
            <View style={styles.inputContainer}>
                  <Text style = {styles.label}>{t('signup_password')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('signup_password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                />
                </View>

            <View style={styles.checkboxContainer}>
                <TouchableOpacity onPress={() => setKvkkAccepted(!kvkkAccepted)}>
                    <Ionicons 
                        name={kvkkAccepted ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={kvkkAccepted ? "#Db5B23" : "#463C33"} 
                    />
                </TouchableOpacity>
                <Text style={styles.checkboxText}>
                    {t('kvkk_accept_text')} <Text style={styles.kvkkLink} onPress={() => navigation.navigate('DocumentViewer', { documentType: 'kvkk' })}>{t('kvkk_title')}</Text>
                </Text>
            </View>

            <View style={[styles.checkboxContainer, { marginTop: -10 }]}>
                <TouchableOpacity onPress={() => setTosAccepted(!tosAccepted)}>
                    <Ionicons 
                        name={tosAccepted ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={tosAccepted ? "#Db5B23" : "#463C33"} 
                    />
                </TouchableOpacity>
                <Text style={styles.checkboxText}>
                    {t('tos_accept_text')} <Text style={styles.kvkkLink} onPress={() => navigation.navigate('DocumentViewer', { documentType: 'tos' })}>{t('tos_title')}</Text>
                </Text>
            </View>

            <View style={[styles.checkboxContainer, { marginTop: -10 }]}>
                <TouchableOpacity onPress={() => setConsentAccepted(!consentAccepted)}>
                    <Ionicons 
                        name={consentAccepted ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={consentAccepted ? "#Db5B23" : "#463C33"} 
                    />
                </TouchableOpacity>
                <Text style={styles.checkboxText}>
                    {t('consent_accept_text')} <Text style={styles.kvkkLink} onPress={() => navigation.navigate('DocumentViewer', { documentType: 'consent' })}>{t('consent_title')}</Text>
                </Text>
            </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>
            {loading ? t('loading') : t('signup_next')}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} /> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>{t('signup_have_account')} <Text style={styles.signUpLinkText}>{t('signup_login')}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
    </View>
  );
}

export default SignUp;
