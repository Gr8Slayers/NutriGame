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

interface UpdatedMealParams {
  updatedMeal: {
    date: string;
    type: string;
    mealName: string;
    calories: number;
  };
}
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
          setIsAuthenticated(false);
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
              <Stack.Screen name="AddMeal" component={AddMeal} />
              <Stack.Screen name="Menu" component={Menu} />
            </>
          ) : (

            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
              <Stack.Screen name="SignUpEnterData" component={SignUpEnterData} />
              <Stack.Screen name="CreateAvatar" component={CreateAvatar} />
              <Stack.Screen name="MainPage" component={MainPage} initialParams={undefined} />
              <Stack.Screen name="AddMeal" component={AddMeal} />
              <Stack.Screen name="AddWater" component={AddWater} />
              <Stack.Screen name="Menu" component={Menu} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}


