import 'intl';
import 'intl/locale-data/jsonp/pt-BR';

import React from 'react';
import { StatusBar } from 'react-native';
import AppLoading from 'expo-app-loading';
import { ThemeProvider } from 'styled-components/native';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';

import theme from './global/styles/theme';

import { Routes } from './routes';
// import { AppRoutes } from './routes/app.routes';

import { AuthProvider, useAuth } from './hooks/auth';

export default function App() {

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold
  })

  const { userStorageLoading } = useAuth()

  if (!fontsLoaded || userStorageLoading) {
    return <AppLoading />
  }

  return (
    <ThemeProvider theme={theme}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* <AppRoutes /> */}
        <AuthProvider>
          <Routes />
        </AuthProvider>
    </ThemeProvider>
  );
}