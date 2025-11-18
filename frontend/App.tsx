import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ekranlar
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import SignUpEnterData from './screens/SignUpEnterData';
import CreateAvatar from './screens/CreateAvatar';
import MainPage from './screens/MainPage';

// Navigation tipi
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  SignUpEnterData: undefined;
  CreateAvatar: undefined;
  MainPage: undefined;
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
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="SignUpEnterData" component={SignUpEnterData} />
          <Stack.Screen name="CreateAvatar" component={CreateAvatar} />

          <Stack.Screen name="MainPage" component={MainPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

