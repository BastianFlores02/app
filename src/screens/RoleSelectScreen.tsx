import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../theme";
import { StackNavigationProp } from "@react-navigation/stack";

type Props = {
  navigation: StackNavigationProp<any, any>;
};

export default function RoleSelectScreen({ navigation }: Props) {
  const c = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.welcome, { color: c.primary }]}>
        Bienvenido a Phantom App!
      </Text>
      <Text style={[styles.title, { color: c.text }]}>Para empezar, seleccione su rol</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: c.primary }]}
        onPress={() => navigation.navigate("Pin")}
      >
        <Text style={styles.btnText}>Docente</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: c.primary }]}
        onPress={() => navigation.replace("StudentMonitor")}
      >
        <Text style={styles.btnText}>Estudiante</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  welcome: { fontSize: 32, fontWeight: "800", marginBottom: 18, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 36 },
  btn: { minWidth: 220, padding: 16, borderRadius: 14, marginTop: 10, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 20, fontWeight: "600" },
});