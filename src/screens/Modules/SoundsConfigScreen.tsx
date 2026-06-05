import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Alert } from "react-native";
import { Select, Card, PrimaryButton } from "../../components";
import { useModules } from "../../context/ModulesContext";
import * as Prot from "../../ble/protocol";
import { useTheme } from "../../theme";

export default function SoundsConfigScreen() {
  const { configSOUNDS, setSoundsConfig, play, pause, resume, stop } = useModules();
  const c = useTheme();

  // B0: sonido (1-4)
  const [sound, setSound] = useState<1 | 2 | 3 | 4>(1);
  const [duration, setDuration] = useState("10"); // en segundos

  // Utilidad para comandos BLE protegidos
  const safeBleCmd = (fn: () => Promise<any>) => async () => {
    try {
      await fn();
    } catch {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  const confirm = async () => {
    let valid = true;
    let parsedDuration = +duration;
    if (parsedDuration < 1 || parsedDuration > 3600) valid = false; // 1s a 1h

    if (!valid) {
      alert("Revisa los parámetros. El tiempo está fuera de rango (1-3600 seg).");
      return;
    }

    // Calcular los bytes low y high para la duración
    const durLow = parsedDuration & 0xFF;
    const durHigh = (parsedDuration >> 8) & 0xFF;

    const payload = {
      sound: sound as 1 | 2 | 3 | 4,
      b1: 0,
      b2: 0,
      b3: durLow,
      b4: durHigh,
      dur: parsedDuration,
    };
    setSoundsConfig(payload);
    try {
      const ok = await configSOUNDS(payload);
      if (ok) Alert.alert("Confirmación exitosa", "Configuración enviada correctamente.");
      else Alert.alert("Error", "Error al enviar la configuración. Verifique la conexión.");
    } catch {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Image
        source={require('../../../assets/sounds.png')}
        style={styles.img}
      />

      <Card>
        <Select
          label="Sonido"
          value={sound}
          onChange={(v: any) => setSound(Number(v) as 1 | 2 | 3 | 4)}
          options={[
            { label: "Respiración normal", value: 1 },
            { label: "Respiración obstruida", value: 2 },
            { label: "Ruido cardiaco normal", value: 3 },
            { label: "Ruido cardiaco anormal", value: 4 },
          ]}
        />
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: c.text }]}>Duración (seg)</Text>
          <TextInput
            style={[styles.input, { color: c.text, backgroundColor: c.card }]}
            placeholder="Duración en segundos"
            placeholderTextColor={c.gray}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </View>
        <PrimaryButton style={{ marginTop: 12 }} onPress={confirm}>
          Confirmar
        </PrimaryButton>
      </Card>

      <View style={styles.controlArea}>
        <View style={styles.row}>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => play(Prot.ID.SOUNDS))}>
            ▶ PLAY
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => pause(Prot.ID.SOUNDS))}>
            II PAUSE
          </PrimaryButton>
          <PrimaryButton style={styles.controlBtn} onPress={safeBleCmd(() => resume(Prot.ID.SOUNDS))}>
            ⏯ RESUME
          </PrimaryButton>
        </View>
        <View style={styles.stopRow}>
          <PrimaryButton style={styles.stopBtn} onPress={safeBleCmd(() => stop(Prot.ID.SOUNDS))}>
            ■ STOP
          </PrimaryButton>
        </View>
      </View>

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