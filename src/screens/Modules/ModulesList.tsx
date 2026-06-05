import React, { useState } from "react";
import { View, StyleSheet, Text, Image, Alert, Modal, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Card, PrimaryButton } from "../../components";
import { useTheme } from "../../theme";
import { useModules } from "../../context/ModulesContext";
import * as Prot from "../../ble/protocol";
import { saveConfig, getSavedConfigs, SavedConfig } from "../../storage/savedConfigs";
import { startPingModules } from "../../hooks/usePingModules";
import { setActiveConfig, clearActiveConfig } from "../../storage/activeConfig";
import ConfigSelectorModal from "../ConfigSelectorModal";
import { useAutoBackOnDisconnect } from "../../hooks/useAutoBackOnDisconnect";
import { useBluetooth } from "../../context/BluetoothContext";

const MODULES = [
  { id: Prot.ID.EKG, label: "EKG", configScreen: "EkgConfig" },
  { id: Prot.ID.PANI, label: "PANI", configScreen: "PaniConfig" },
  { id: Prot.ID.SPO, label: "SpO₂", configScreen: "SpOConfig" },
  { id: Prot.ID.SOUNDS, label: "Sonidos", configScreen: "SoundsConfig" },
];

export default function ModulesList() {
  const {
    connected,
    modules,
    play, pause, resume, stop,
    ekgConfig,
    paniConfig,
    spoConfig,
    soundsConfig,
    setEkgConfig,
    setPaniConfig,
    setSpoConfig,
    setSoundsConfig,
    configEKG,  // <-- AGREGADO
    configPANI,
    configSPO,
    configSOUNDS,
    ping,
    isBusy,
    pingPaused
  } = useModules();
  useAutoBackOnDisconnect(connected);

  const nav = useNavigation<any>();
  useFocusEffect(
  React.useCallback(() => {
    const route = nav.getState()?.routes?.find((r: any) => r.name === "ModulesList");
    const selected = route?.params?.selected;

    if (selected) {
      setPendingConfig(selected);
      nav.setParams({ selected: null }); // Limpia después de usar
    }
  }, [nav])
);

  const c   = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [cfgName, setCfgName] = useState("");
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<SavedConfig | null>(null);
  const { resetAll } = useBluetooth();



  // ---- UTILIDAD PARA RENDERIZAR CONFIGURACIÓN ACTUAL ----
function renderConfigSummary(id: number, config: any) {
  if (!modules[id])
    return <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">No disponible</Text>;
  if (!config)
    return <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">Sin configuración</Text>;

  switch (id) {
    case Prot.ID.EKG:
      const ekgModes: Record<number, string> = { 1: "Normal", 2: "Bradicardia", 3: "Taquicardia" };
      return (
        <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
          {`Modo: ${ekgModes[config.mode] ?? config.mode ?? "-"}, BPM: ${config.bpm ?? "-"}, Dur: ${config.duration ?? "-"}s`}
        </Text>
      );
    case Prot.ID.PANI:
      if (config.mode === 0x01)
        return (
          <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
            {`Presión: Sys ${config.hi ?? "-"} / Dia ${config.lo ?? "-"}`}
          </Text>
        );
      if (config.mode === 0x02)
        return (
          <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
            {`Frecuencia: BPM ${config.lo ?? "-"}, Dur: ${config.hi ?? "-"}s`}
          </Text>
        );
      return <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">Sin configuración</Text>;
    case Prot.ID.SPO:
      if (config.action === 1)
        return (
          <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
            {`Saturación: ${config.b1 ?? "-"}%, Dur: ${config.dur ?? "-"}s`}
          </Text>
        );
      if (config.action === 2)
        return (
          <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
            {`Frecuencia: BPM ${config.b1 ?? "-"}, Dur: ${config.dur ?? "-"}s`}
          </Text>
        );
      return <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">Sin configuración</Text>;
    case Prot.ID.SOUNDS:
      const soundNames: Record<number, string> = {
        1: "Respiración Normal",
        2: "Respiración obstruida",
        3: "Ruido cardiaco normal",
        4: "Ruido cardiaco anormal",
      };
      return (
        <Text style={[styles.stateText, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">
          {`Sonido: ${soundNames[config.sound] ?? config.sound ?? "-"}, Dur: ${config.dur ?? "-"}s`}
        </Text>
      );
    default:
      return null;
  }
}
  // --- FILA HORIZONTAL DE BOTONES CENTRALIZADA ---
  function ModuleLine({ id, label, configScreen }: any) {
    const config = (
      id === Prot.ID.EKG    ? ekgConfig :
      id === Prot.ID.PANI   ? paniConfig :
      id === Prot.ID.SPO    ? spoConfig :
      id === Prot.ID.SOUNDS ? soundsConfig : null
    );
    return (
      <Card style={[styles.moduleCard, config && { backgroundColor: c.mode === "dark" ? "#2e7d32" : "#e8f5e9", borderColor: "#66bb6a", borderWidth: 2 },]}>
        <View style={styles.moduleRowCompact}>
          <PrimaryButton
            style={[
              styles.moduleBtnCompact,
              !modules[id] && styles.disabledBtn,
              { backgroundColor: c.primary }
            ]}
            onPress={() => nav.navigate(configScreen)}
            disabled={!modules[id]}
          >
            <Text style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              textAlign: 'center'
            }}>
              {label}
            </Text>
          </PrimaryButton>
          <PrimaryButton
            style={[
              styles.controlBtnCompact,
              styles.sameHeightGeneralBtn,
              !modules[id] && styles.disabledBtn,
              { backgroundColor: c.primary }
            ]}
            onPress={() => play(id)}
            disabled={!modules[id]}
          >
            ▶
          </PrimaryButton>
          <PrimaryButton
            style={[
              styles.controlBtnCompact,
              styles.sameHeightGeneralBtn,
              !modules[id] && styles.disabledBtn,
              { backgroundColor: c.primary }
            ]}
            onPress={() => pause(id)}
            disabled={!modules[id]}
          >
            II
          </PrimaryButton>
          <View style={styles.moduleConfigSummaryCompact}>
            {renderConfigSummary(id, config)}
          </View>
        </View>
      </Card>
    );
  }

  useFocusEffect(
    React.useCallback(() => {
      if (!connected) return;
      const stop = startPingModules(
        ping, isBusy, pingPaused,
        MODULES.map(m => m.id), connected
      );
      return stop;
    }, [connected])
  );

  const onSaveConfig = () => {
    if (!ekgConfig && !paniConfig && !spoConfig && !soundsConfig) {
      Alert.alert("Sin módulos", "Primero configure al menos un módulo.");
      return;
    }
    setModalVisible(true);
  };

  const confirmSave = async () => {
  const name = cfgName.trim();
  if (!name) {
    Alert.alert("Falta nombre", "Por favor ingrese un nombre para la configuración.");
    return;
  }

  const existing = await getSavedConfigs();
  const duplicate = existing.find(cfg => cfg.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    Alert.alert("Nombre duplicado", "Ya existe una configuración con ese nombre. Por favor elija otro.");
    return;
  }

  const toSave: SavedConfig = {
    name,
    date: Date.now(),
    modules: {},
  };
  if (ekgConfig) toSave.modules.ekg = ekgConfig;
  if (paniConfig) toSave.modules.pani = paniConfig;
  if (spoConfig)    toSave.modules.spo    = spoConfig;
  if (soundsConfig) toSave.modules.sounds = soundsConfig;
  await saveConfig(toSave);
  setModalVisible(false);
  setCfgName("");
  Alert.alert("¡Guardado!", "Configuración guardada correctamente.");
};


  const onSendToStudents = async () => {
    if (!ekgConfig && !paniConfig && !spoConfig && !soundsConfig) {
      Alert.alert("Sin módulos", "Primero configure al menos un módulo.");
      return;
    }
    await setActiveConfig({
      ekg: ekgConfig ?? undefined,
      pani: paniConfig ?? undefined,
      spo:    spoConfig    ?? undefined,
      sounds: soundsConfig ?? undefined,
    });
    Alert.alert("¡Configuración enviada!", "Los estudiantes verán la nueva configuración.");
  };

  const clearConfigs = async () => {
    setEkgConfig && setEkgConfig(null);
    setPaniConfig && setPaniConfig(null);
    setSpoConfig && setSpoConfig(null);
    setSoundsConfig && setSoundsConfig(null);
    await clearActiveConfig();
    try {
      await resetAll();
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar RESET por Bluetooth.");
    }
    Alert.alert("Limpieza exitosa", "Se limpiaron todas las configuraciones temporales.");
  };

  // ------ APLICAR CONFIGURACIÓN GUARDADA Y ENVIAR BLE ------
  const handleAcceptConfig = async () => {
    if (!pendingConfig) return;
    try {
      // EKG
      if (pendingConfig.modules.ekg) {
        setEkgConfig({ ...pendingConfig.modules.ekg, mode: pendingConfig.modules.ekg.mode as 1 | 2 | 3 });
        await configEKG({ ...pendingConfig.modules.ekg, mode: pendingConfig.modules.ekg.mode as 1 | 2 | 3 });
      } else {
        setEkgConfig(null);
      }
      // PANI
      if (pendingConfig.modules.pani) {
        setPaniConfig({ ...pendingConfig.modules.pani, mode: pendingConfig.modules.pani.mode as 1 | 2 });
        await configPANI({ ...pendingConfig.modules.pani, mode: pendingConfig.modules.pani.mode as 1 | 2 });
      } else {
        setPaniConfig(null);
      }
      // SPO
      if (pendingConfig.modules.spo) {
        setSpoConfig({ ...pendingConfig.modules.spo, action: pendingConfig.modules.spo.action as 1 | 2 });
        await configSPO({ ...pendingConfig.modules.spo, action: pendingConfig.modules.spo.action as 1 | 2 });
      } else {
        setSpoConfig(null);
      }
      // SOUNDS
      if (pendingConfig.modules.sounds) {
        setSoundsConfig({ ...pendingConfig.modules.sounds, sound: pendingConfig.modules.sounds.sound as 1 | 2 | 3 | 4 });
        await configSOUNDS({ ...pendingConfig.modules.sounds, sound: pendingConfig.modules.sounds.sound as 1 | 2 | 3 | 4 });
      } else {
        setSoundsConfig(null);
      }
      setPendingConfig(null);
      Alert.alert("Configuración aplicada", "La configuración seleccionada ha sido aplicada.");
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar la configuración al hardware.");
      setPendingConfig(null);
    }
  };

  if (!connected) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Card><Text style={{ color: c.danger }}>Gateway no conectado</Text></Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.background }]}>
      <Image
        source={require('../../../assets/module.png')}
        style={styles.img}
      />

      {MODULES.map((mod) => (
        <ModuleLine key={mod.id} {...mod} />
      ))}

      <Text style={[styles.hint, { color: c.gray }]}>
        • Configure uno o varios módulos. {"\n"}
        • Al ingresar a la configuración de algún módulo, no olvide seleccionar "Confirmar".
      </Text>

      {/* --- BOTONES GENERALES DEL MISMO TAMAÑO Y COLOR --- */}
      <Card style={styles.cardCenter}>
        <View style={styles.generalControlRow}>
          <PrimaryButton style={[styles.generalBtn, { backgroundColor: c.primary }]} onPress={() => play(Prot.ID.BROAD)}>
            ▶ general
          </PrimaryButton>
          <PrimaryButton style={[styles.generalBtn, { backgroundColor: c.primary }]} onPress={() => pause(Prot.ID.BROAD)}>
            II general
          </PrimaryButton>
          <PrimaryButton style={[styles.generalBtn, { backgroundColor: c.primary }]} onPress={() => resume(Prot.ID.BROAD)}>
            ⏯ general
          </PrimaryButton>
          <PrimaryButton style={[styles.generalBtn, { backgroundColor: c.primary }]} onPress={() => stop(Prot.ID.BROAD)}>
            ■  general
          </PrimaryButton>
        </View>
        <Text style={[styles.hint, { color: c.gray, textAlign: "center" }]}>
          Utilice los controles generales para simular todos juntos.
        </Text>
      </Card>

      {/* --- MATRIZ DE BOTONES INFERIOR 2x2 CENTRADA --- */}
      <Card style={styles.cardBottom}>
        <View style={styles.matrixRowCenter}>
          <PrimaryButton style={[styles.matrixBtn, { backgroundColor: c.primary }]} onPress={() => setShowSavedConfigs(true)}>
            Configuraciones guardadas
          </PrimaryButton>
          <PrimaryButton style={[styles.matrixBtn, { backgroundColor: c.primary }]} onPress={onSaveConfig}>
            Guardar configuración actual
          </PrimaryButton>
        </View>
        <View style={styles.matrixRowCenter}>
          <PrimaryButton style={[styles.matrixBtn, { backgroundColor: c.primary }]} onPress={onSendToStudents}>
            Enviar a estudiantes
          </PrimaryButton>
          <PrimaryButton style={[styles.matrixBtn, styles.cleanBtn]} onPress={clearConfigs}>
            Limpiar configuración
          </PrimaryButton>
        </View>
      </Card>

      <Text style={[styles.hint, { color: c.gray }]}>
        • Si desea compartir la configuración actual con los estudiantes, seleccione "Enviar a estudiantes". {"\n"}
        • Si desea guardar la configuración actual, seleccione "Guardar configuración actual".{"\n"}
        • Si desea ver las configuraciones guardadas, y posteriormente utilizar alguna, seleccione "Configuraciones guardadas".{"\n"}
        • Si desea realizar una nueva configuración, seleccione "Limpiar configuración". Esta acción limpiará los comandos actuales seleccionados y limpiará la UI de los estudiantes.
      </Text>

      {/* MODAL: CONFIRMACIÓN DE SELECCIÓN DE CONFIGURACIÓN */}
      <Modal visible={!!pendingConfig} animationType="fade" transparent>
        <View style={styles.confirmBg}>
          <View style={[styles.confirmBox, {backgroundColor: c.card}]}>
            <Text style={[styles.confirmTitle, {color: c.primary}]}>
              ¿Está seguro de seleccionar esta configuración?
            </Text>
            <Text style={{color: c.text, marginBottom: 16, textAlign:"center"}}>
              {pendingConfig?.name}
            </Text>
            <View style={{flexDirection:"row", justifyContent:"center", gap:18}}>
              <TouchableOpacity
                style={[styles.confirmBtn, {backgroundColor: c.primary}]}
                onPress={handleAcceptConfig}
              >
                <Text style={{color:"#fff", fontWeight:"bold"}}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, {backgroundColor: c.danger}]}
                onPress={() => {
                  setPendingConfig(null);
                  setShowSavedConfigs(true);
                }}
              >
                <Text style={{color:"#fff", fontWeight:"bold"}}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: LISTA DE CONFIGURACIONES GUARDADAS */}
      <ConfigSelectorModal
        visible={showSavedConfigs}
        onSelect={cfg => {
          setShowSavedConfigs(false);
          setPendingConfig(cfg);  // → abre confirmación
        }}
        onClose={() => setShowSavedConfigs(false)}
      />

      {/* MODAL: GUARDAR CONFIGURACIÓN */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Guardar configuración</Text>
            <TextInput
              placeholder="Nombre (ej: Paciente normal)"
              style={[styles.modalInput, { color: c.text, backgroundColor: c.card }]}
              placeholderTextColor={c.gray}
              value={cfgName}
              onChangeText={setCfgName}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => { setModalVisible(false); setCfgName(""); }}>
                <Text style={[styles.cancelBtn, { color: c.danger }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSave}>
                <Text style={[styles.saveBtnTxt, { color: c.primary }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 13, padding: 12 },
  img: {
    width: 195,
    height: 195,
    alignSelf: "center",
    marginBottom: 10,
    resizeMode: "contain",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { marginTop: 7, fontSize: 12 },

  cardCenter: { marginTop: 7 },
  controlArea: {
    marginTop: 5,
    paddingHorizontal: 2,
  },

  // --- GENERAL CONTROLS EN UNA SOLA FILA ---
  generalControlRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  generalBtn: {
    flex: 1,
    minWidth: 110,
    maxWidth: 140,
    paddingVertical: 13,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- MATRIZ DE BOTONES ABAJO 2x2 CENTRADA ---
  cardBottom: {
    marginTop: 13,
    gap: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  matrixRowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 8,
    width: "100%",
  },
  matrixBtn: {
    flex: 1,
    minWidth: 180,
    maxWidth: 200,
    paddingVertical: 13,
    borderRadius: 10,
    marginHorizontal: 6,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  cleanBtn: {
    backgroundColor: "#E44",
  },

  saveBtnTxt: { fontWeight: "bold" },

  modalBg: { flex: 1, backgroundColor: '#0009', justifyContent: "center", alignItems: "center" },
  modalBox: { minWidth: 240, borderRadius: 13, padding: 13, gap: 8 },
  modalTitle: { fontWeight: "bold", fontSize: 17, marginBottom: 6 },
  modalInput: { borderWidth: 1, borderRadius: 7, padding: 8, marginTop: 7 },
  modalBtnRow: { flexDirection: "row", justifyContent: "flex-end", gap: 15, marginTop: 8 },
  cancelBtn: { fontSize: 15, fontWeight: "bold" },
  disabledBtn: { opacity: 0.6 },

  // --- MODULOS ARRIBA ---
  moduleCard: {
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",             // Centra la fila dentro del Card
  },
  moduleRowCompact: {
    flexDirection: "row",
    justifyContent: "center",         // Centra los botones horizontalmente
    alignItems: "center",
    minHeight: 46,
    gap: 14,                          // Espacio entre botones
    paddingHorizontal: 2,
    width: "auto",
    alignSelf: "center",              // Centra la fila en el Card
  },
  moduleBtnCompact: {
    backgroundColor: "#3486eb",
    borderRadius: 7,
    minWidth: 90,
    minHeight: 38,
    maxWidth: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 13,
    elevation: 1.5,
    shadowColor: "#0008",
    shadowOpacity: 0.09,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  controlBtnCompact: {
    borderRadius: 7,
    minWidth: 46,
    minHeight: 38,
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  sameHeightGeneralBtn: {
    paddingVertical: 13,
    minHeight: 50,
  },
  moduleConfigSummaryCompact: {
    width: 300,                 // Ancho fijo para evitar desplazamientos
    maxWidth: 300,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 0,
    alignSelf: "center",
  },

  stateText: {
    fontSize: 16,
    fontStyle: "italic",
    flexWrap: "wrap",
    lineHeight: 20,
  },

  // --- MODAL DE CONFIRMACIÓN ---
  confirmBg: {
    flex: 1,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmBox: {
    minWidth: 250,
    borderRadius: 15,
    padding: 22,
    gap: 12,
    maxWidth: "85%",
    alignItems: "center",
  },
  confirmTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  confirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    marginTop: 2,
  },
moduleCardConfigured: {
  backgroundColor: "#e8f5e9",  // verde claro (se ve bien en modo claro/oscuro)
  borderColor: "#66bb6a",
  borderWidth: 2,
},

});