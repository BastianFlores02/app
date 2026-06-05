// ScanScreen.tsx
import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Card, PrimaryButton, LogoBanner } from "../components";
import { useTheme } from "../theme";
import { useModules } from "../context/ModulesContext";
import { useNavigation } from "@react-navigation/native";

export default function ScanScreen() {
  const { connected, disconnect } = useModules();
  const c = useTheme();
  const nav = useNavigation();

  const onScan = () => {
    // @ts-ignore
    nav.navigate("DeviceSelect");
  };

  const onDisconnect = () => {
    disconnect();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LogoBanner style={[styles.logo, { width: 300, height: 300 }]} />

      <View style={styles.centeredArea}>

        <Card style={styles.cardCenter}>
          {connected ? (
            <View style={styles.centerContent}>
              <Text style={[styles.ok, { color: c.success }]}>
                Fantoma enlazado
              </Text>
              <PrimaryButton style={styles.mt} onPress={onDisconnect}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
                  Desenlazar dispositivo
                </Text>
              </PrimaryButton>
            </View>
          ) : (
            <>
              <Text style={{ color: c.text, marginBottom: 8, textAlign: "center", fontSize: 18 }}>
                Presiona “Buscar dispositivos” y selecciona tu fantoma (HMSoft).
              </Text>
              <PrimaryButton onPress={onScan}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
                  Buscar dispositivo
                </Text>
              </PrimaryButton>
            </>
          )}
        </Card>

        <Text style={[styles.notice, { color: c.gray }]}>
          Una vez enlazado, utiliza la barra de navegación inferior o lateral para acceder a los módulos y funciones de Phantom App.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "flex-start" },
  logo: {
    marginTop: 100,
    marginBottom: 0,
    alignSelf: "center",
  },
  centeredArea: { flex: 1, justifyContent: "flex-start", marginTop: 50 },
  cardCenter: { alignItems: "center", justifyContent: "center" },
  centerContent: { alignItems: "center", justifyContent: "center" },
  mt: { marginTop: 10, fontSize: 20 },
  ok: { fontSize: 25, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  notice: { fontSize: 18, marginBottom: 14, textAlign: "center" },
  // NUEVO: estilo para la descripción del modo
  modeDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});