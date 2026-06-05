import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Card, PrimaryButton } from "../components";
import { useTheme } from "../theme";
import { useModules } from "../context/ModulesContext";

export default function DeviceSelectScreen() {
  const {
    devices,
    scanDevices,
    scanning,
    connectToDevice,
  } = useModules();

  const nav = useNavigation<any>();
  const c   = useTheme();

  /* Escanear cada vez que la pantalla entra en foco */
  useFocusEffect(
    useCallback(() => {
      scanDevices();
      return () => {};            // cleanup: nada
    }, [scanDevices])
  );

  const onConnect = async (id: string) => {
    try {
      await connectToDevice(id);
      nav.goBack();               // vuelve a ScanScreen
    } catch (err: any) {
      console.warn(err?.message ?? err);
    }
  };

  const renderItem = ({ item }: any) => (
    <Card style={styles.cardItem}>
      <PrimaryButton onPress={() => onConnect(item.id)}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
          {item.name || "HMSoft"}  {" (" + item.id.slice(-5) + ")"}
        </Text>
      </PrimaryButton>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text, fontSize: 24 }]}>Selecciona tu fantoma</Text>

      {scanning && (
        <View style={styles.scanRow}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.scanTxt, { color: c.primary, fontSize: 18 }]}> Buscando...</Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        renderItem={renderItem}
        ListEmptyComponent={
          !scanning ? (
            <Text style={[styles.empty, { color: c.gray, fontSize: 24 }]}>
              Ningún dispositivo encontrado.
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <Card>
        <PrimaryButton onPress={scanDevices} disabled={scanning}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
            {scanning ? "Buscando..." : "Reintentar"}
          </Text>
        </PrimaryButton>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  list: { gap: 10, paddingBottom: 20 },
  cardItem: { alignItems: "stretch" },
  empty: { textAlign: "center", marginTop: 20, fontSize: 14 },
  scanRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  scanTxt: { marginLeft: 6, fontSize: 13 },
});