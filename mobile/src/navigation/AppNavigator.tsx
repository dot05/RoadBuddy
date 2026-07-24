import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ForgotPasswordResetScreen from '../screens/auth/ForgotPasswordResetScreen';

// Main Screens
import ExploreScreen from '../screens/dashboard/ExploreScreen';
import TripPlannerScreen from '../screens/dashboard/TripPlannerScreen';
import TransportSearchScreen from '../screens/marketplace/TransportSearchScreen';
import HotelSearchScreen from '../screens/marketplace/HotelSearchScreen';
import GarageScreen from '../screens/garage/GarageScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import JournalScreen from '../screens/journal/JournalScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RestaurantListScreen from '../screens/food/RestaurantListScreen';
import RestaurantMenuScreen from '../screens/food/RestaurantMenuScreen';
import MyOrdersScreen from '../screens/food/MyOrdersScreen';

// ─── Type definitions ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { email: string };
  ForgotPassword: { email?: string };
  ForgotPasswordReset: { email: string };
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  TripPlanner: undefined;
  TransportSearch: { origin?: string; destination?: string; date?: string };
  HotelSearch: { city?: string; checkIn?: string; checkOut?: string };
  RestaurantList: { city?: string };
  RestaurantMenu: { restaurantId: number; restaurantName: string };
  MyOrders: undefined;
};

export type MainTabParamList = {
  Explore: undefined;
  Garage: undefined;
  Bookings: undefined;
  Community: undefined;
  Journals: undefined;
  Profile: undefined;
};

// ─── Stack / Tab creators ────────────────────────────────────────────────────

const AuthStack = createStackNavigator<AuthStackParamList>();
const ExploreStack = createStackNavigator<ExploreStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab Icon helper ─────────────────────────────────────────────────────────

const tabIcons: Record<string, string> = {
  Explore: '🗺️',
  Garage: '🚗',
  Bookings: '🎟️',
  Community: '🌐',
  Journals: '📓',
  Profile: '👤',
};

const headerOpts = {
  headerStyle: { backgroundColor: '#ffffff' } as const,
  headerTitleStyle: { fontWeight: 'bold' as const, color: '#1e293b' },
  headerTintColor: '#10b981',
};

// ─── Navigators ──────────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ForgotPasswordReset" component={ForgotPasswordResetScreen} />
    </AuthStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen
        name="ExploreHome"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="TripPlanner"
        component={TripPlannerScreen}
        options={{ title: 'Plan a Trip', ...headerOpts }}
      />
      <ExploreStack.Screen
        name="TransportSearch"
        component={TransportSearchScreen}
        options={{ title: 'Search Transport', ...headerOpts }}
      />
      <ExploreStack.Screen
        name="HotelSearch"
        component={HotelSearchScreen}
        options={{ title: 'Find Hotels', ...headerOpts }}
      />
      <ExploreStack.Screen
        name="RestaurantList"
        component={RestaurantListScreen}
        options={{ title: 'Restaurants', ...headerOpts }}
      />
      <ExploreStack.Screen
        name="RestaurantMenu"
        component={RestaurantMenuScreen}
        options={({ route }) => ({ title: route.params.restaurantName, ...headerOpts })}
      />
      <ExploreStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'My Orders', ...headerOpts }}
      />
    </ExploreStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{tabIcons[route.name] || '📱'}</Text>,
        headerShown: route.name !== 'Explore',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: 'bold', color: '#1e293b' },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreNavigator} options={{ title: 'Explore' }} />
      <Tab.Screen name="Garage" component={GarageScreen} options={{ title: 'Garage' }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Bookings' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <Tab.Screen name="Journals" component={JournalScreen} options={{ title: 'Journals' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
