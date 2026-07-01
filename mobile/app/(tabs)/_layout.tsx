import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { FontFamily } from '../../src/theme/typography';

type TabIconProps = { focused: boolean; label: string; emoji: string };

function TabIcon({ focused, label, emoji }: TabIconProps) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgNav,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.semiBold,
          fontSize: 10,
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Discover" emoji="🎵" />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Matches" emoji="❤️" />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Messages" emoji="💬" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
