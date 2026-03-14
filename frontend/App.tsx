import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

// Ekranlar
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import SignUpEnterData from './screens/SignUpEnterData';
import CreateAvatar from './screens/CreateAvatar';
import MainPage from './screens/MainPage';
import AddMeal from './screens/AddMeal';
import AddWater from './screens/AddWater';
import Menu from './screens/Menu';
import Chatbot from './screens/Chatbot';
import ScanFood from './screens/ScanFood';
import ProfileSettingsMenu from './screens/ProfileSettingsMenu';
import EditProfile from './screens/EditProfile';
import SocialFeed from './screens/SocialFeed';
import NewPost from './screens/NewPost';
import FindFriends from './screens/FindFriends';
import Challenges from './screens/Challenges';
import CreateChallenge from './screens/CreateChallenge';
import ChallengeProgress from './screens/ChallengeProgress';
import { UserProfile, UpdatedMealParams } from './types';

// Navigation tipi
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  SignUpEnterData: {
    initialData: {
      username: string;
      email: string;
      password: string;
    }
  };
  CreateAvatar: {
    finalData: {
      username: string;
      email: string;
      password: string;
      age: number;
      gender: string;
      weight: number;
      height: number;
      reason_to_diet?: string;
      target_weight?: number;

    }
  };
  MainPage: UpdatedMealParams | undefined;
  AddMeal: { selectedDate: string, type: string };
  AddWater: { selectedDate: string, type: string };
  Menu: undefined;
  ProfileSettingsMenu: UserProfile;
  EditProfile: UserProfile;
  Chatbot: undefined;
  ScanFood: undefined;
  SocialFeed: undefined;
  NewPost: undefined;
  FindFriends: undefined;
  Challenges: undefined;
  CreateChallenge: undefined;
  ChallengeProgress: { challengeId: string };
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#47dd7caf',    // yeşil ton
    background: '#0a1812',   // koyu arka plan
    surface: '#14281d',      // menü arka planı
    onSurface: '#f7e5c5',    // metin rengi
  },
  roundness: 10,
};



const Stack = createNativeStackNavigator<RootStackParamList>();


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      let token: string | null = null;
      let rememberMeFlag: string | null = null;

      try {
        token = await SecureStore.getItemAsync('userToken');
        rememberMeFlag = await SecureStore.getItemAsync('rememberMeFlag');

        if (token && rememberMeFlag == 'true') {
          setIsAuthenticated(true);
        }

      }
      catch (error) {
        console.error("Cannot read token", error);
      }
      finally {
        setIsLoading(false);
      }
    };
    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="MainPage" component={MainPage} initialParams={undefined} />
              <Stack.Screen name="Chatbot" component={Chatbot} />
              <Stack.Screen name="ScanFood" component={ScanFood} />
              <Stack.Screen name="AddMeal" component={AddMeal} />
              <Stack.Screen name="AddWater" component={AddWater} />
              <Stack.Screen name="Menu" component={Menu} />
              <Stack.Screen name="ProfileSettingsMenu" component={ProfileSettingsMenu} />
              <Stack.Screen name="EditProfile" component={EditProfile} />
              <Stack.Screen name="SocialFeed" component={SocialFeed} />
              <Stack.Screen name="NewPost" component={NewPost} />
              <Stack.Screen name="FindFriends" component={FindFriends} />
              <Stack.Screen name="Challenges" component={Challenges} />
              <Stack.Screen name="CreateChallenge" component={CreateChallenge} />
              <Stack.Screen name="ChallengeProgress" component={ChallengeProgress} />
            </>
          ) : (

            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
              <Stack.Screen name="SignUpEnterData" component={SignUpEnterData} />
              <Stack.Screen name="CreateAvatar" component={CreateAvatar} />
              <Stack.Screen name="MainPage" component={MainPage} initialParams={undefined} />
              <Stack.Screen name="Chatbot" component={Chatbot} />
              <Stack.Screen name="ScanFood" component={ScanFood} />
              <Stack.Screen name="AddMeal" component={AddMeal} />
              <Stack.Screen name="AddWater" component={AddWater} />
              <Stack.Screen name="Menu" component={Menu} />
              <Stack.Screen name="ProfileSettingsMenu" component={ProfileSettingsMenu} />
              <Stack.Screen name="EditProfile" component={EditProfile} />
              <Stack.Screen name="SocialFeed" component={SocialFeed} />
              <Stack.Screen name="NewPost" component={NewPost} />
              <Stack.Screen name="FindFriends" component={FindFriends} />
              <Stack.Screen name="Challenges" component={Challenges} />
              <Stack.Screen name="CreateChallenge" component={CreateChallenge} />
              <Stack.Screen name="ChallengeProgress" component={ChallengeProgress} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}


