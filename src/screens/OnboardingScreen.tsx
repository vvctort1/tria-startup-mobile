import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  { id: '1', title: '🐾 Bem-vindo à Startup', desc: 'O futuro da telemedicina veterinária.' },
  { id: '2', title: 'IA a Favor da Vida', desc: 'Descreva o que o seu pet está sentindo.' },
  { id: '3', title: 'Visão Computacional', desc: 'Nossos algoritmos ajudam a identificar anomalias.' },
  { id: '4', title: 'Veterinários Especializados', desc: 'Conecte-se com veterinários por vídeo.' },
  { id: '5', title: 'Vamos Começar?', desc: 'Crie seu perfil e cadastre seu pet.' },
];

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('@app_first_launch', 'false');
      onFinish();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 10 }}>{item.title}</Text>
            <Text style={{ textAlign: 'center' }}>{item.desc}</Text>
          </View>
        )}
      />

      <TouchableOpacity onPress={handleNext} style={{ padding: 20 }}>
        <Text style={{ fontWeight: 'bold' }}>
          {currentIndex === ONBOARDING_DATA.length - 1 ? 'Começar' : 'Próximo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  slide: { 
    width: width, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
});