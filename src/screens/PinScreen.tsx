import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "../theme";
import { useRole } from "../context/RoleContext";
import { StackNavigationProp } from "@react-navigation/stack";

type Props = {
  navigation: StackNavigationProp<any, any>;
};

const DOCENTE_PIN = "0000";

export default function PinScreen({ navigation }: Props) {
  const [pin, setPin] = useState("");
  const c = useTheme();
  const { setRole, logout } = useRole();

  const handleConfirm = () => {
    if (pin === DOCENTE_PIN) {
      setRole("docente");
    } else {
      Alert.alert("PIN incorrecto", "Por favor, intente nuevamente.");
    }
  };

  const handleLogout = () => {
    logout();
    setPin(""); // Limpia el campo de PIN por si acaso
    navigation.reset({
      index: 0,
      routes: [{ name: "RoleSelect" as never }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: c.danger }]}
        onPress={handleLogout}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Cambiar rol</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: c.text }]}>Ingrese el PIN docente</Text>
      {/* AVISO */}
      <Text style={[styles.notice, { color: c.gray }]}>
        Solo docentes autorizados pueden ingresar.
      </Text>
      <TextInput
        style={[styles.input, { color: c.text, backgroundColor: c.card }]}
        placeholder="****"
        placeholderTextColor={c.gray}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
      />
      <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary }]} onPress={handleConfirm}>
        <Text style={styles.btnText}>Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
  notice: { fontSize: 14, marginBottom: 14, textAlign: "center" },
  input: { fontSize: 22, borderWidth: 1, borderRadius: 8, padding: 10, minWidth: 120, marginBottom: 18, textAlign: "center" },
  btn: { minWidth: 140, padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  logoutBtn: {
    position: "absolute",
    top: 44,
    right: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    zIndex: 99,
    elevation: 2,
  },
});