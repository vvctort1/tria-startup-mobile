import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import { TriagemIAScreen } from './TriagemIAScreen';
import { VetsScreen } from './VetsScreen';
import { ConsultasScreen } from './ConsultasScreen';
import { VetProfileScreen } from './VetProfileScreen';
import { UserProfileScreen } from './UserProfileScreen'; 

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

export function MenuScreen() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="IA" component={TriagemIAScreen} />
        <Tab.Screen name="Veterinários" component={VetStackScreen} />
        <Tab.Screen name="Consultas" component={ConsultasScreen} />
        <Tab.Screen name="Perfil" component={UserProfileScreen} /> 
      </Tab.Navigator>
    </NavigationContainer>
  );
}