import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import ScanScreen from "../screens/ScanScreen";
import DeviceSelectScreen from "../screens/DeviceSelectScreen";
import ModulesList from "../screens/Modules/ModulesList";
import EkgConfigScreen from "../screens/Modules/EkgConfigScreen";
import PaniConfigScreen from "../screens/Modules/PaniConfigScreen";
import SpOConfigScreen from "../screens/Modules/SpOConfigScreen";
import SoundsConfigScreen from "../screens/Modules/SoundsConfigScreen";

import { useTheme } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ScanStack() {
  const c = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 28,
          fontWeight: "bold",
          color: c.text,
        },
        headerStyle: {
          backgroundColor: c.background,
        },
      }}
    >
      <Stack.Screen
        name="ScanScreen"
        component={ScanScreen}
        options={{ title: "Conexión" }}
      />
      <Stack.Screen
        name="DeviceSelect"
        component={DeviceSelectScreen}
        options={{ title: "Seleccionar Dispositivo" }}
      />
    </Stack.Navigator>
  );
}

function ModulesStack() {
  const c = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          fontSize: 32,
          fontWeight: "bold",
          color: c.text,
        },
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: c.background,
        },
      }}
    >
      <Stack.Screen
        name="ModulesList"
        component={ModulesList}
        options={{ title: "Módulos" }}
      />
      <Stack.Screen
        name="EkgConfig"
        component={EkgConfigScreen}
        options={{ title: "Configuración EKG" }}
      />
      <Stack.Screen
        name="PaniConfig"
        component={PaniConfigScreen}
        options={{ title: "Configuración PANI" }}
      />
      <Stack.Screen
        name="SpOConfig"
        component={SpOConfigScreen}
        options={{ title: "Configuración SpO₂" }}
      />
      <Stack.Screen
        name="SoundsConfig"
        component={SoundsConfigScreen}
        options={{ title: "Configuración Sonidos" }}
      />
    </Stack.Navigator>
  );
}

export default function TabsNavigator() {
  const c = useTheme();
  const TAB_BAR_HEIGHT = 80;
  const ICON_SIZE = 40;
  const LABEL_FONT_SIZE = 17;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.gray,
        tabBarStyle: {
          backgroundColor: c.card,
          height: TAB_BAR_HEIGHT,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: LABEL_FONT_SIZE,
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Scan"
        component={ScanStack}
        options={{
          title: "Conexión",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bluetooth" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Modules"
        component={ModulesStack}
        options={{
          title: "Módulos",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="cube-outline"
              size={ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}