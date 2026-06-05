import "react-native-reanimated";
import React from "react";
import { useColorScheme } from "react-native";
import {
  NavigationContainer,
  DarkTheme as NavDark,
  DefaultTheme as NavDefault,
  Theme as NavTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Buffer } from "buffer";
global.Buffer = Buffer;           // <-- hace visible Buffer para Hermes

import { BluetoothProvider } from "./src/context/BluetoothContext";
import { ModulesProvider }   from "./src/context/ModulesContext";
import { ThemeProvider, useTheme } from "./src/theme";
// NUEVO:
import { RoleProvider, useRole } from "./src/context/RoleContext";
import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import PinScreen from "./src/screens/PinScreen";
import StudentMonitorScreen from "./src/screens/StudentMonitorScreen";
import DrawerNavigator from "./src/navigation/DrawerNavigator";

const Stack = createStackNavigator();

/* ------------ Navegación principal multirol ------------ */
function MainNavigator() {
  const { role } = useRole();

  if (!role) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        <Stack.Screen name="Pin" component={PinScreen} />
        <Stack.Screen name="StudentMonitor" component={StudentMonitorScreen} />
      </Stack.Navigator>
    );
  }

  if (role === "docente") {
    return <DrawerNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentMonitor" component={StudentMonitorScreen} />
    </Stack.Navigator>
  );
}

/* ------------ App con contextos y tema ------------ */
export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <BluetoothProvider>
          <ModulesProvider>
            <NavigationContainer
              theme={
                // respeta el theme base
                useColorScheme() === "dark"
                  ? {
                      ...NavDark,
                      colors: {
                        ...NavDark.colors,
                        // Si tienes custom colors los puedes mapear aquí
                      },
                    }
                  : {
                      ...NavDefault,
                      colors: {
                        ...NavDefault.colors,
                        // Si tienes custom colors los puedes mapear aquí
                      },
                    }
              }
            >
              <MainNavigator />
            </NavigationContainer>
          </ModulesProvider>
        </BluetoothProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}