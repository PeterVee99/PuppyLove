import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/AppContext';

import ExploreScreen from '../screens/ExploreScreen';
import WalkDetailScreen from '../screens/WalkDetailScreen';
import MyWalksScreen from '../screens/MyWalksScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ConversationScreen from '../screens/ConversationScreen';
import CreateWalkScreen from '../screens/CreateWalkScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const ExploreStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    </ExploreStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="MessagesMain" component={MessagesScreen} />
      <MessagesStack.Screen name="Conversation" component={ConversationScreen} />
    </MessagesStack.Navigator>
  );
}

const TAB_ICONS = {
  Explore: ['search', 'search-outline'],
  'My Walks': ['calendar', 'calendar-outline'],
  Messages: ['chatbubbles', 'chatbubbles-outline'],
  Create: ['add-circle', 'add-circle-outline'],
  Profile: ['person', 'person-outline'],
};

export default function AppNavigator() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="My Walks" component={MyWalksScreen} />
      <Tab.Screen name="Messages" component={MessagesNavigator} />
      <Tab.Screen name="Create" component={CreateWalkScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
