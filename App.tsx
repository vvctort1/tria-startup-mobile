import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './src/hooks/useAuth';
import { AuthProvider } from './src/contexts/AuthContext';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { QuestionarioScreen } from './src/screens/QuestionarioScreen';

function RootNavigation() {
  const { user, loading: authLoading, hasCompletedQuestionnaire } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // TODO: remover antes de produção
        await AsyncStorage.removeItem('@app_first_launch');

        const value = await AsyncStorage.getItem('@app_first_launch');
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error(error);
        setIsFirstLaunch(false); 
      } finally {
        setStorageLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  if (authLoading || storageLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <OnboardingScreen onFinish={() => setIsFirstLaunch(false)} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!hasCompletedQuestionnaire) {
    return <QuestionarioScreen />;
  }

  return <MenuScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar />
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}