import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { getSavedConfigs, deleteConfig, SavedConfig } from "../storage/savedConfigs";
import { useModules } from "../context/ModulesContext";
import * as Prot from "../ble/protocol";

export default function SavedConfigsScreen() {
  const c = useTheme();
  const nav = useNavigation<any>();

  const {
    play,
  } = useModules();

  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [modListCache, setModListCache] = useState<{ id: number; label: string }[]>([]);

  const loadConfigs = async () => {
    setConfigs(await getSavedConfigs());
  };

  useFocusEffect(
    React.useCallback(() => {
      loadConfigs();
    }, [])
  );

  const renderModuleSummary = (modules: any) => {
    const parts: string[] = [];

    if (modules.ekg) {
      const label = ["Normal", "Bradicardia", "Taquicardia"][modules.ekg.mode - 1] || `Desconocido (${modules.ekg.mode})`;
      parts.push(`EKG / ${label} / BPM ${modules.ekg.bpm} / Dur ${modules.ekg.duration}s`);
    }
    if (modules.pani) {
      if (modules.pani.mode === 1) parts.push(`PANI / Presión / Sys ${modules.pani.hi} / Dia ${modules.pani.lo}`);
      else if (modules.pani.mode === 2) parts.push(`PANI / Frecuencia / BPM ${modules.pani.lo} / Dur ${modules.pani.hi}s`);
    }
    if (modules.spo) {
      if (modules.spo.action === 1) parts.push(`SpO₂ / Saturación / ${modules.spo.b1}%`);
      else if (modules.spo.action === 2) parts.push(`SpO₂ / Frecuencia / BPM ${modules.spo.b1} / Dur ${modules.spo.b2}s`);
    }
    if (modules.sounds) {
      const label = ["", "Respiración normal", "Respiración obstruida", "Ruido cardiaco normal", "Ruido cardiaco anormal"][modules.sounds.sound] || `Desconocido (${modules.sounds.sound})`;
      parts.push(`Sonidos / ${label}`);
    }

    return parts.join("\n");
  };

  const onDelete = (cfg: SavedConfig) => {
    Alert.alert("¿Eliminar?", `¿Eliminar "${cfg.name}"?`, [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteConfig(cfg.date);
          await loadConfigs();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SavedConfig }) => (
    <View style={[styles.item, { backgroundColor: c.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { color: c.text }]}>{item.name}</Text>
        <Text style={{ fontSize: 16, color: c.gray, marginBottom: 2 }}>
          Módulos: {["ekg", "pani", "spo", "sounds"].filter(k => (item.modules as any)[k]).join(", ")}
        </Text>
        <Text style={styles.summaryText}>{renderModuleSummary(item.modules)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          nav.navigate("ModulesList", { selected: item });
        }}
        style={styles.itemBtn}
      >
        <Text style={{ color: c.primary, fontSize: 18 }}>Cargar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item)} style={styles.itemBtn}>
        <Text style={{ color: c.danger, fontSize: 18 }}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Text style={{ color: c.primary, fontWeight: "bold", fontSize: 20 }}>⬅ Volver</Text>
      </TouchableOpacity>

      <FlatList
        data={configs}
        keyExtractor={(item) => item.date.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <Text style={[styles.text, { color: c.text }]}>
            No hay configuraciones guardadas.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  text: { fontSize: 16, textAlign: "center", marginTop: 40 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  itemName: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  itemBtn: { marginLeft: 10, padding: 6 },
  summaryText: { color: "#555", fontSize: 14, fontStyle: "italic", marginTop: 1, marginBottom: 1 },
  backBtn: {
    marginTop: 14,
    marginLeft: 16,
    marginBottom: 8,
  },
});