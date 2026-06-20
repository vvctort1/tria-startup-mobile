import { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing, typography } from '../theme';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Triagem Inteligente',
    subtitle: 'Descreva os sintomas do seu pet e receba uma avaliação preliminar com IA antes da consulta.',
    accent: colors.accent,
    image: require('../../assets/onb_1.png'),
  },
  {
    id: '2',
    title: 'Visão Computacional',
    subtitle: 'Envie fotos e nossos algoritmos auxiliam na identificação de alterações visíveis na pele, olhos e postura.',
    accent: colors.greenDark,
    image: require('../../assets/onb_4.png'),
  },
  {
    id: '3',
    title: 'Veterinários Especializados',
    subtitle: 'Conecte-se com profissionais verificados e agende consultas com quem realmente entende do seu animal.',
    accent: colors.primary,
    image: require('../../assets/onb_2.png'),
  },
  {
    id: '4',
    title: 'Comece Agora',
    subtitle: 'Crie seu perfil, cadastre seu pet e tenha cuidado veterinário de qualidade na palma da mão.',
    accent: colors.accent,
    image: require('../../assets/onb_3.png'),
  },
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
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/LogoTria1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.slideImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, isLast && styles.btnAccent]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, isLast && styles.btnTextAccent]}>
            {isLast ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  logoRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,

  },
  slide: {
    width,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  slideImage: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
    gap: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.border,
  },
  btn: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  btnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  btnTextAccent: {
    color: colors.white,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
