import React, { useEffect, useState } from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { getSavedConfigs, SavedConfig } from "../storage/savedConfigs";
import { useTheme } from "../theme";

// Genera resumen legible de cada configuración
const renderModuleSummary = (modules: any) => {
  const parts: string[] = [];

  if (modules.ekg) {
    let ekgLabel = "";
    switch (modules.ekg.mode) {
      case 1: ekgLabel = "Normal"; break;
      case 2: ekgLabel = "Bradicardia"; break;
      case 3: ekgLabel = "Taquicardia"; break;
      default: ekgLabel = `Desconocido (${modules.ekg.mode})`;
    }
    parts.push(`EKG / ${ekgLabel} / BPM ${modules.ekg.bpm} / Dur ${modules.ekg.duration}s`);
  }

  if (modules.pani) {
    if (modules.pani.mode === 1) {
      parts.push(`PANI / Presión / Sys ${modules.pani.hi} / Dia ${modules.pani.lo}`);
    } else if (modules.pani.mode === 2) {
      parts.push(`PANI / Frecuencia / BPM ${modules.pani.lo} / Dur ${modules.pani.hi}s`);
    } else {
      parts.push(`PANI / Modo desconocido (${modules.pani.mode})`);
    }
  }

  if (modules.spo) {
    if (modules.spo.action === 1) {
      parts.push(`SpO₂ / Saturación / ${modules.spo.b1}%`);
    } else if (modules.spo.action === 2) {
      parts.push(`SpO₂ / Frecuencia / BPM ${modules.spo.b1} / Dur ${modules.spo.b2}s`);
    } else {
      parts.push(`SpO₂ / Acción desconocida (${modules.spo.action})`);
    }
  }

  if (modules.sounds) {
    let soundLabel = "";
    switch (modules.sounds.sound) {
      case 1: soundLabel = "Respiración normal"; break;
      case 2: soundLabel = "Respiración obstruida"; break;
      case 3: soundLabel = "Ruido cardiaco normal"; break;
      case 4: soundLabel = "Ruido cardiaco anormal"; break;
      default: soundLabel = `Desconocido (${modules.sounds.sound})`;
    }
    parts.push(`Sonidos / ${soundLabel}`);
  }

  return parts.join("\n");
};

type ConfigSelectorModalProps = {
  visible: boolean;
  onSelect: (cfg: SavedConfig) => void;
  onClose: () => void;
};

export default function ConfigSelectorModal({
  visible,
  onSelect,
  onClose,
}: ConfigSelectorModalProps) {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const c = useTheme();

  useEffect(() => {
    if (visible) getSavedConfigs().then(setConfigs);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.bg}>
        <View style={[styles.box, {backgroundColor: c.card}]}>
          <Text style={[styles.title, {color: c.text}]}>Configuraciones guardadas</Text>
          <FlatList
            data={configs}
            keyExtractor={item => item.date.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.item, { backgroundColor: c.card }]} onPress={() => onSelect(item)}>
                <Text style={{color: c.text, fontWeight: "bold", fontSize: 15}}>
                  {item.name}
                </Text>
                <Text style={{color: c.gray, fontSize: 11, marginTop: 3, lineHeight: 15}}>
                  {renderModuleSummary(item.modules)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{color: c.text, textAlign: "center", marginTop: 20}}>No hay configuraciones guardadas.</Text>
            }
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{color: c.danger}}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#0009", justifyContent: "center", alignItems: "center" },
  box: { width: "90%", maxHeight: "85%", borderRadius: 14, padding: 18 },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 8 },
  item: { padding: 12, borderRadius: 8, marginBottom: 6 },
  closeBtn: { marginTop: 16, alignSelf: "center", padding: 10 },
});
