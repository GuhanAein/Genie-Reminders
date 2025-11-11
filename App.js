import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Alert, View, Text, StyleSheet } from 'react-native';
import ChatScreen from './screens/ChatScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import { hasGeminiKey, saveGeminiKey } from './lib/secureKey';
import { requestNotificationPermission } from './utils/notification';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const keyExists = await hasGeminiKey();
      
      if (!keyExists) {
        const defaultKey = 'AIzaSyC_8rNxxxxxxxxxxxxxxxxxxx';
        await saveGeminiKey(defaultKey);
        Alert.alert(
          '🧞 Welcome to Genie!',
          'Your AI reminder assistant is ready. Start chatting to create reminders!',
          [{ text: 'Let\'s Go!' }]
        );
      }

      await requestNotificationPermission();
      setIsReady(true);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            height: 85,
            paddingTop: 8,
            paddingBottom: 25,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -4,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: '#1C1C1E',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 28,
          },
        }}
      >
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'Genie',
            tabBarLabel: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Text style={styles.iconText}>💬</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: 'Reminders',
            tabBarLabel: 'Calendar',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Text style={styles.iconText}>📅</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Text style={styles.iconText}>⚙️</Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  iconContainerActive: {
    backgroundColor: '#E8F4FF',
  },
  iconText: {
    fontSize: 22,
  },
});
