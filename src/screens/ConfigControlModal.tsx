import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SavedConfig } from "../storage/savedConfigs";
import { setActiveConfig } from "../storage/activeConfig";
import { useModules } from "../context/ModulesContext";
import * as Prot from "../ble/protocol";
import { useTheme } from "../theme";

type ConfigControlModalProps = {
  visible: boolean;
  config: SavedConfig | null;
  onClose: () => void;
  onBack?: () => void; // <-- nueva prop opcional
};

export default function ConfigControlModal({
  visible,
  config,
  onClose,
  onBack,
}: ConfigControlModalProps) {
  const c = useTheme();
  const {
    configEKG, configPANI, configSPO, configSOUNDS,
    play, pause, resume, stop,
    setEkgConfig, setPaniConfig, setSpoConfig, setSoundsConfig,
  } = useModules();

  React.useEffect(() => {
    if (!visible || !config) return;
    if (config.modules.ekg) {
      configEKG({
        ...config.modules.ekg,
        mode: config.modules.ekg.mode as 1 | 2 | 3,
      });
      setEkgConfig({
        ...config.modules.ekg,
        mode: config.modules.ekg.mode as 1 | 2 | 3,
      });
    }
    if (config.modules.pani) {
      configPANI({
        ...config.modules.pani,
        mode: config.modules.pani.mode as 1 | 2,
      });
      setPaniConfig({
        ...config.modules.pani,
        mode: config.modules.pani.mode as 1 | 2,
      });
    }
    if (config.modules.spo) {
      configSPO({ ...config.modules.spo, action: config.modules.spo.action as 1 | 2 });
      setSpoConfig({ ...config.modules.spo, action: config.modules.spo.action as 1 | 2 });
    }
    if (config.modules.sounds) {
      configSOUNDS({ ...config.modules.sounds, sound: config.modules.sounds.sound as 1 | 2 | 3 | 4 });
      setSoundsConfig({ ...config.modules.sounds, sound: config.modules.sounds.sound as 1 | 2 | 3 | 4 });
    }
    // eslint-disable-next-line
  }, [visible]);

  if (!config) return null;

  const modEKG = !!config.modules.ekg;
  const modPANI = !!config.modules.pani;
  const modSPO = !!config.modules.spo;
  const modSOUNDS = !!config.modules.sounds;
  const mods = [];
  if (modEKG) mods.push("EKG");
  if (modPANI) mods.push("PANI");
  if (modSPO) mods.push("SpO₂");
  if (modSOUNDS) mods.push("Sonidos");

  // Utilidad para todos los botones
  const safeBleCmd = (fn: () => Promise<any>) => async () => {
    try {
      await fn();
    } catch (e) {
      Alert.alert("Error", "No hay dispositivo BLE conectado.");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.bg}>
        <View style={[styles.box, {backgroundColor: c.card}]}>
          <Text style={[styles.title, {color: c.primary}]}>¡Usted ha seleccionado {config.name}!</Text>
          <Text style={{color: c.text, marginBottom: 8}}>
            Módulos: {mods.join(", ")}
          </Text>
          {/* Individual controls */}
          {modEKG && (
            <View style={styles.ctrlRow}>
              <Text style={[styles.label, {color: c.text}]}>EKG:</Text>
              <TouchableOpacity onPress={safeBleCmd(() => play(Prot.ID.EKG))} style={styles.ctrlBtn}><Text>PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => pause(Prot.ID.EKG))} style={styles.ctrlBtn}><Text>PAUSE</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => resume(Prot.ID.EKG))} style={styles.ctrlBtn}><Text>RESUME</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => stop(Prot.ID.EKG))} style={styles.ctrlBtn}><Text>STOP</Text></TouchableOpacity>
            </View>
          )}
          {modPANI && (
            <View style={styles.ctrlRow}>
              <Text style={[styles.label, {color: c.text}]}>PANI:</Text>
              <TouchableOpacity onPress={safeBleCmd(() => play(Prot.ID.PANI))} style={styles.ctrlBtn}><Text>PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => pause(Prot.ID.PANI))} style={styles.ctrlBtn}><Text>PAUSE</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => resume(Prot.ID.PANI))} style={styles.ctrlBtn}><Text>RESUME</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => stop(Prot.ID.PANI))} style={styles.ctrlBtn}><Text>STOP</Text></TouchableOpacity>
            </View>
          )}
          {modSPO && (
            <View style={styles.ctrlRow}>
              <Text style={[styles.label, {color: c.text}]}>SpO₂:</Text>
              <TouchableOpacity onPress={safeBleCmd(() => play(Prot.ID.SPO))} style={styles.ctrlBtn}><Text>PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => pause(Prot.ID.SPO))} style={styles.ctrlBtn}><Text>PAUSE</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => resume(Prot.ID.SPO))} style={styles.ctrlBtn}><Text>RESUME</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => stop(Prot.ID.SPO))} style={styles.ctrlBtn}><Text>STOP</Text></TouchableOpacity>
            </View>
          )}
          {modSOUNDS && (
            <View style={styles.ctrlRow}>
              <Text style={[styles.label, {color: c.text}]}>Sonidos:</Text>
              <TouchableOpacity onPress={safeBleCmd(() => play(Prot.ID.SOUNDS))} style={styles.ctrlBtn}><Text>PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => pause(Prot.ID.SOUNDS))} style={styles.ctrlBtn}><Text>PAUSE</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => resume(Prot.ID.SOUNDS))} style={styles.ctrlBtn}><Text>RESUME</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => stop(Prot.ID.SOUNDS))} style={styles.ctrlBtn}><Text>STOP</Text></TouchableOpacity>
            </View>
          )}
          {/* General controls: si hay más de uno */}
          {(mods.length > 1) && (
            <View style={styles.ctrlRow}>
              <Text style={[styles.label, {color: c.text}]}>Todos:</Text>
              <TouchableOpacity onPress={safeBleCmd(() => play(Prot.ID.BROAD))} style={styles.ctrlBtn}><Text>PLAY</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => pause(Prot.ID.BROAD))} style={styles.ctrlBtn}><Text>PAUSE</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => resume(Prot.ID.BROAD))} style={styles.ctrlBtn}><Text>RESUME</Text></TouchableOpacity>
              <TouchableOpacity onPress={safeBleCmd(() => stop(Prot.ID.BROAD))} style={styles.ctrlBtn}><Text>STOP</Text></TouchableOpacity>
            </View>
          )}
          {/* Botón de mandar a estudiantes */}
          <TouchableOpacity
            style={[styles.ctrlBtn, {alignSelf:"center", marginTop: 18, backgroundColor: c.primary}]}
            onPress={async () => {
              try {
                await setActiveConfig({
                  ekg: config.modules.ekg ? { ...config.modules.ekg, mode: config.modules.ekg.mode as 1 | 2 | 3 } : undefined,
                  pani: config.modules.pani ? { ...config.modules.pani, mode: config.modules.pani.mode as 1 | 2 } : undefined,
                  spo: config.modules.spo ? { ...config.modules.spo, action: config.modules.spo.action as 1 | 2 } : undefined,
                  sounds: config.modules.sounds ? { ...config.modules.sounds, sound: config.modules.sounds.sound as 1 | 2 | 3 | 4 } : undefined,
                });
                Alert.alert("Configuración enviada", "Los estudiantes verán la nueva configuración.");
                onClose();
              } catch {
                Alert.alert("Error", "No hay dispositivo BLE conectado.");
              }
            }}>
            <Text style={{color:"#fff"}}>Enviar a estudiantes</Text>
          </TouchableOpacity>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
                <Text style={{color: c.primary}}>Volver</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{color: c.danger}}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex:1, backgroundColor:'#000A', justifyContent:"center", alignItems:"center" },
  box: { minWidth:300, borderRadius:16, padding:18, gap:8, maxWidth:"90%" },
  title: { fontWeight:"bold", fontSize:18, marginBottom:4, textAlign:"center" },
  label: { width:70, fontWeight:"bold", fontSize:14 },
  ctrlRow: { flexDirection:"row", alignItems:"center", marginBottom:6, gap:4 },
  ctrlBtn: { backgroundColor: "#EEE", paddingVertical:6, paddingHorizontal:12, borderRadius:8, marginLeft:2 },
  closeBtn: { alignSelf:"center", marginTop:18, padding:10 },
});