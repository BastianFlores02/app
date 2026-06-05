import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Alert } from "react-native";
import { Select, Card, PrimaryButton } from "../../components";
import { useModules } from "../../context/ModulesContext";
import * as Prot from "../../ble/protocol";
import { useTheme } from "../../theme";

export default function EkgConfigScreen() {
  const { configEKG, setEkgConfig, play, pause, resume, stop } = useModules();
  const c = useTheme();

  const [mode, setMode] = useState<Prot.EkgPayload["mode"]>(0x01);
  const [bpm, setBpm] = useState("60");
  const [dur, setDur] = useState("300");

  // Utilidad para comandos BLE protegidos
  const safeBleCmd = (fn: () => Promise<any>) => async () => {
    try {
      await fn();
    } catch {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  const confirm = async () => {
    const modeNum = Number(mode) as Prot.EkgPayload["mode"];
    const payload = {
      mode: modeNum,
      bpm: +bpm,
      duration: +dur,
    };
    setEkgConfig(payload); // sigue actualizando el estado
    try {
      const ok = await configEKG(payload); // ENVÍA EL DATO POR BLE
      if (ok) Alert.alert("Confirmación exitosa", "Configuración enviada correctamente.");
      else Alert.alert("Error", "Error al enviar la configuración. Verifique la conexión.");
    } catch {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Imagen en la parte superior */}
      <Image
        source={require('../../../assets/ekg.png')}
        style={styles.img}
      />

      <Card>
        <Select
          label="Tipo de señal"
          value={mode}
          onChange={(v: any) => setMode(Number(v) as any)}
          options={[
            { label: "Normal", value: 0x01 },
            { label: "Bradicardia", value: 0x02 },
            { label: "Taquicardia", value: 0x03 },
          ]}
        />
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: c.text }]}>BPM (10-300)</Text>
          <TextInput
            style={[styles.input, { color: c.text, backgroundColor: c.card }]}
            placeholder="BPM (10-300)"
            placeholderTextColor={c.gray}
            value={bpm}
            onChangeText={setBpm}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: c.text }]}>Duración (seg)</Text>
          <TextInput
            style={[styles.input, { color: c.text, backgroundColor: c.card }]}
            placeholder="Duración (seg)"
            placeholderTextColor={c.gray}
            value={dur}
            onChangeText={setDur}
            keyboardType="numeric"
          />
        </View>
        <PrimaryButton style={{ marginTop: 12 }} onPress={confirm}>
          Confirmar
        </PrimaryButton>
      </Card>

      {/* Botones de control individuales */}
      <View style={styles.controlArea}>
        <View style={styles.row}>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => play(Prot.ID.EKG))}>
            ▶ PLAY
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => pause(Prot.ID.EKG))}>
            II PAUSE
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => resume(Prot.ID.EKG))}>
            ⏯ RESUME
          </PrimaryButton>
        </View>
        <View style={styles.stopRow}>
          <PrimaryButton style={styles.stopBtn} onPress={safeBleCmd(() => stop(Prot.ID.EKG))}>
            ■ STOP
          </PrimaryButton>
        </View>
      </View>

      {/* Aviso para guardar configuración */}
      <View style={styles.saveHint}>
        <Text style={{ fontSize: 12, color: c.gray, textAlign: "left" }}>
          • Si desea guardar esta configuración, primero seleccione "Confirmar", luego vuelva a la ventana "Módulos" y seleccione "Guardar configuración actual".{"\n"}
          • Si desea guardar varias configuraciones de módulos juntas, primero configure uno por uno cada módulo, seleccionando "Confirmar" en cada uno de ellos, y después seleccione "Guardar configuración actual".
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "flex-start" },
  img: {
    width: 256,
    height: 256,
    alignSelf: "center",
    marginBottom: 14,
    resizeMode: "contain",
  },
  inputWrap: { marginTop: 12 },
  inputLabel: { fontSize: 13, marginBottom: 2 },
  input: { borderBottomWidth: 1, padding: 4, borderRadius: 8 },
  controlArea: {
    marginTop: 32,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: 2,
  },
  stopRow: {
    marginTop: 18,
    alignItems: "center",
  },
  stopBtn: {
    minWidth: 120,
    paddingHorizontal: 30,
  },
  saveHint: {
    marginTop: 30,
    padding: 12,
  },
});
