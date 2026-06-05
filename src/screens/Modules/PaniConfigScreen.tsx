import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Alert } from "react-native";
import { Select, Card, PrimaryButton } from "../../components";
import { useModules } from "../../context/ModulesContext";
import * as Prot from "../../ble/protocol";
import { useTheme } from "../../theme";

export default function PaniConfigScreen() {
  const { configPANI, setPaniConfig, play, pause, resume, stop } = useModules();
  const c = useTheme();
  const [mode, setMode] = useState<Prot.PaniPayload["mode"]>(0x01);
  const [lo, setLo] = useState("80");
  const [hi, setHi] = useState("120");

  // Utilidad para comandos BLE protegidos
  const safeBleCmd = (fn: () => Promise<any>) => async () => {
    try {
      await fn();
    } catch {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  const confirm = async () => {
    const payload = { mode, lo: +lo, hi: +hi };
    setPaniConfig(payload);         // Actualiza el estado en la app
    try {
      const ok = await configPANI(payload); // Envía por BLE
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
        source={require('../../../assets/pani.png')}
        style={styles.img}
      />

      <Card>
        <Select
          label="Simular"
          value={mode}
          onChange={setMode}
          options={[
            { label: "Presión", value: 0x01 },
            { label: "BPM", value: 0x02 },
          ]}
        />
        {/* Campo 1 */}
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: c.text }]}>
            {mode === 0x01 ? "Diastólica (mmHg)" : "BPM"}
          </Text>
          <TextInput
            style={[styles.input, { color: c.text, backgroundColor: c.card }]}
            placeholder={mode === 0x01 ? "Diastólica (mmHg)" : "BPM"}
            placeholderTextColor={c.gray}
            value={lo}
            onChangeText={setLo}
            keyboardType="numeric"
          />
        </View>
        {/* Campo 2 */}
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: c.text }]}>
            {mode === 0x01 ? "Sistólica (mmHg)" : "Duración (seg)"}
          </Text>
          <TextInput
            style={[styles.input, { color: c.text, backgroundColor: c.card }]}
            placeholder={mode === 0x01 ? "Sistólica (mmHg)" : "Duración (seg)"}
            placeholderTextColor={c.gray}
            value={hi}
            onChangeText={setHi}
            keyboardType="numeric"
          />
        </View>
        <PrimaryButton style={{ marginTop: 12 }} onPress={confirm}>
          Confirmar
        </PrimaryButton>
      </Card>

      {/* Botones de control individuales para PANI */}
      <View style={styles.controlArea}>
        <View style={styles.row}>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => play(Prot.ID.PANI))}>
            ▶ PLAY
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => pause(Prot.ID.PANI))}>
            II PAUSE
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => resume(Prot.ID.PANI))}>
            ⏯ RESUME
          </PrimaryButton>
        </View>
        <View style={styles.stopRow}>
          <PrimaryButton style={styles.stopBtn} onPress={safeBleCmd(() => stop(Prot.ID.PANI))}>
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