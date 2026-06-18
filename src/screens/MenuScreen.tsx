import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TriagemIAScreen } from './TriagemIAScreen';
import { VetsScreen } from './VetsScreen';
import { ConsultasScreen } from './ConsultasScreen';
import { VetProfileScreen } from './VetProfileScreen';
import { UserProfileScreen } from './UserProfileScreen';
import { colors, radius } from '../theme';

const Tab = createBottomTabNavigator();
const VetStack = createNativeStackNavigator();

function VetStackScreen() {
  return (
    <VetStack.Navigator screenOptions={{ headerShown: false }}>
      <VetStack.Screen name="VetsList" component={VetsScreen} />
      <VetStack.Screen name="VetProfile" component={VetProfileScreen} />
    </VetStack.Navigator>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  IA: { active: 'pulse', inactive: 'pulse-outline' },
  Veterinários: { active: 'medkit', inactive: 'medkit-outline' },
  Consultas: { active: 'calendar', inactive: 'calendar-outline' },
  Perfil: { active: 'person', inactive: 'person-outline' },
};

export function MenuScreen() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return (
              <View style={focused ? styles.activeIconWrapper : undefined}>
                <Ionicons name={iconName} size={22} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="IA" component={TriagemIAScreen} />
        <Tab.Screen name="Veterinários" component={VetStackScreen} />
        <Tab.Screen name="Consultas" component={ConsultasScreen} />
        <Tab.Screen name="Perfil" component={UserProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeIconWrapper: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.sm,
    padding: 4,
  },
});
