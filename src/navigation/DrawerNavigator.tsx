import React from "react";
import { createDrawerNavigator, DrawerToggleButton } from "@react-navigation/drawer";
import { View, TouchableOpacity, Text } from "react-native";
import { useRole } from "../context/RoleContext";
import { useTheme } from "../theme";

import TabsNavigator from "./TabsNavigator";
import SavedConfigsScreen from "../screens/SavedConfigsScreen";

const Drawer = createDrawerNavigator();



function LogoutButton() {
  const { logout } = useRole();
  return (
    <TouchableOpacity
      style={{
        marginRight: 25,
        marginBottom: -10,
        backgroundColor: "#F55",
        borderRadius: 14,
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}
      onPress={logout}
    >
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 24 }}>Cambiar rol</Text>
    </TouchableOpacity>
  );
}

export default function DrawerNavigator() {
  const c = useTheme();
  return (
    <Drawer.Navigator
  screenOptions={{
    drawerType: "slide",
    headerRight: () => <LogoutButton />,
    headerLeft: () => (
      <View style={{ marginLeft: 10 }}>
        <DrawerToggleButton tintColor={c.text} />
      </View>
    ),
    headerTitleStyle: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.text,
    },
    drawerLabelStyle: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.text,
    },
  }}
>


      <Drawer.Screen
        name="Home"
        component={TabsNavigator}
        options={{
          title: "Phantom-App",
          drawerLabelStyle: {
            fontSize: 18,    // Solo para este ítem
            fontWeight: "bold",
          },
        }}
      />
      <Drawer.Screen
        name="SavedConfigs"
        component={SavedConfigsScreen}
        options={{
          title: "Configuraciones Guardadas",
          drawerLabelStyle: {
            fontSize: 18,    // Solo para este ítem
            fontWeight: "bold",
          },
        }}
      />
    </Drawer.Navigator>
  );
}