import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";

// Import screens
import HomeScreen from "./src/screens/homeScreen";
import MovieDetailsScreen from "./src/screens/movieDetailsScreen";
//import SearchScreen from './src/screens/
//import FavoritesScreen from './screens/FavoritesScreen';
//import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from "./src/screens/logginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";

// Create an authentication context
import { createContext } from "react";
export const AuthContext = createContext();

import { initializeDatabase, getAllUsers } from "./database/database";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack navigator for the home tab
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#1e1e1e",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: "CineApp" }}
    />
    <Stack.Screen
      name="MovieDetails"
      component={MovieDetailsScreen}
      options={({ route }) => ({
        title: route.params?.title || "Detalhes do Filme",
      })}
    />
  </Stack.Navigator>
);

// Stack navigator for the search tab
const SearchStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#1e1e1e",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
  >
    <Stack.Screen
      name="Search"
      component={SearchScreen}
      options={{ title: "Pesquisar" }}
    />
    <Stack.Screen
      name="MovieDetails"
      component={MovieDetailsScreen}
      options={({ route }) => ({
        title: route.params?.title || "Detalhes do Filme",
      })}
    />
  </Stack.Navigator>
);

// Stack navigator for the favorites tab
const FavoritesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#1e1e1e",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
  >
    <Stack.Screen
      name="Favorites"
      component={FavoritesScreen}
      options={{ title: "Meus Favoritos" }}
    />
    <Stack.Screen
      name="MovieDetails"
      component={MovieDetailsScreen}
      options={({ route }) => ({
        title: route.params?.title || "Detalhes do Filme",
      })}
    />
  </Stack.Navigator>
);

// Stack navigator for the profile tab
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#1e1e1e",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
  >
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "Meu Perfil" }}
    />
  </Stack.Navigator>
);

// Stack navigator for authentication
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#1e1e1e",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
  >
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: "Criar Conta" }}
    />
  </Stack.Navigator>
);

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === "HomeStack") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "SearchStack") {
          iconName = focused ? "search" : "search-outline";
        } else if (route.name === "FavoritesStack") {
          iconName = focused ? "heart" : "heart-outline";
        } else if (route.name === "ProfileStack") {
          iconName = focused ? "person" : "person-outline";
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#1e90ff",
      tabBarInactiveTintColor: "#888",
      tabBarStyle: {
        backgroundColor: "#1e1e1e",
        borderTopColor: "#333",
        paddingTop: 5,
        height: 60,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="HomeStack"
      component={HomeStack}
      options={{ title: "Início" }}
    />
    <Tab.Screen
      name="SearchStack"
      component={SearchStack}
      options={{ title: "Buscar" }}
    />
    <Tab.Screen
      name="FavoritesStack"
      component={FavoritesStack}
      options={{ title: "Favoritos" }}
    />
    <Tab.Screen
      name="ProfileStack"
      component={ProfileStack}
      options={{ title: "Perfil" }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Database connection

  // Auth context value
  const authContext = {
    signIn: async (token) => {
      setUserToken(token);
    },
    signOut: async () => {
      setUserToken(null);
    },
    signUp: async (token) => {
      setUserToken(token);
    },
  };

  useEffect(() => {
    // Initialize database
    const setupDatabase = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error("Erro ao inicializar banco de dados:", error);
      }
    };

    setupDatabase().then(() => {
      if (dbInitialized) {
        setIsLoading(false);
      }
    });
  }, [dbInitialized]);

  if (isLoading || !dbInitialized) {
    return null; // Or a splash screen component
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <StatusBar style="light" />
          {userToken ? <TabNavigator /> : <AuthStack />}
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
