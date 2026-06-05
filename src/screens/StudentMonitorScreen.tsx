import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useRole } from "../context/RoleContext";
import { Canvas, Path, Skia, Line } from "@shopify/react-native-skia";
import { getActiveConfig } from "../storage/activeConfig";

const { width } = Dimensions.get("window");
const CANVAS_WIDTH = width * 0.58;
const CANVAS_HEIGHT = 140;
const VISIBLE_SECONDS = 10;

function ekgWave(t: number, bpm: number, mode: number) {
  const freq = bpm / 60;
  let amp = mode === 0x02 ? 0.7 : mode === 0x03 ? 1.2 : 1;
  const cycle = 1 / freq;
  const pos = ((t % cycle) + cycle) % cycle;
  let y = 0;
  if (pos < 0.05 * cycle) y += -0.15 * amp;
  else if (pos < 0.08 * cycle) y += 1.3 * amp;
  else if (pos < 0.11 * cycle) y += -0.4 * amp;
  else if (pos > 0.25 * cycle && pos < 0.40 * cycle)
    y += 0.25 * amp * Math.sin(Math.PI * (pos - 0.25 * cycle) / (0.15 * cycle));
  else if (pos > 0.8 * cycle)
    y += 0.18 * amp * Math.sin(Math.PI * (pos - 0.8 * cycle) / (0.2 * cycle));
  return y;
}

export default function StudentMonitorScreen() {
  const { logout } = useRole();
  const c = useTheme();
  const navigation = useNavigation();

  const [activeCfg, setActiveCfg] = useState<{ ekg?: any; pani?: any; spo?: any; sounds?: any } | null>(null);
  const [time, setTime] = useState(() => Date.now() / 1000);
  const [loggingOut, setLoggingOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const cargar = async () => {
        const cfg = await getActiveConfig();
        if (isActive) setActiveCfg(cfg);
      };
      cargar();
      intervalRef.current = setInterval(() => setTime(Date.now() / 1000), 100);
      return () => {
        isActive = false;
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now() / 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showECG = !!activeCfg?.ekg;
  const showPANI = !!activeCfg?.pani;
  const showSPO = !!activeCfg?.spo;
  const showSOUNDS = !!activeCfg?.sounds;

  const mode = showECG ? activeCfg!.ekg.mode : 0x01;
  const bpm = showECG ? activeCfg!.ekg.bpm : 75;
  const dur = showECG ? activeCfg!.ekg.duration : 300;
  const ekgLabel = showECG ? (mode === 0x01 ? "Normal" : mode === 0x02 ? "Bradicardia" : "Taquicardia") : "Sin señal";
  const paniSys = showPANI ? activeCfg!.pani.hi : "--";
  const paniDia = showPANI ? activeCfg!.pani.lo : "--";
  const spoAction = showSPO ? activeCfg!.spo.action : undefined;
  const spoLabel = showSPO ? (spoAction === 1 ? "Saturación" : spoAction === 2 ? "Frecuencia" : "--") : "No config";
  const spoValue = showSPO ? (spoAction === 1 ? `${activeCfg!.spo.b1}%` : `${activeCfg!.spo.b1 ?? "--"}`) : "--";
  const soundTypeNum: 1 | 2 | 3 | 4 | undefined = showSOUNDS ? activeCfg!.sounds.sound : undefined;
  const soundsLabel = showSOUNDS ? ({ 1: "Resp. normal", 2: "Resp. obstruida", 3: "Ruido cardiaco normal", 4: "Ruido cardiaco anormal" }[soundTypeNum as 1 | 2 | 3 | 4] || "Otro sonido") : "No config";

  const N = 200;
  const p = Skia.Path.Make();
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * CANVAS_WIDTH;
    let y;
    if (showECG) {
      const tVal = time - VISIBLE_SECONDS + (i / (N - 1)) * VISIBLE_SECONDS;
      const yVal = ekgWave(tVal, bpm, mode);
      y = CANVAS_HEIGHT / 2 - yVal * CANVAS_HEIGHT * 0.38;
    } else {
      y = CANVAS_HEIGHT / 2;
    }
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }

  const gridLines = [];
  const majorStepX = CANVAS_WIDTH / 5;
  const minorStepX = majorStepX / 5;
  const majorStepY = CANVAS_HEIGHT / 4;
  const minorStepY = majorStepY / 5;
  for (let x = 0; x <= CANVAS_WIDTH; x += minorStepX) {
    gridLines.push(
      <Line
        key={`v${x}`}
        p1={{ x, y: 0 }}
        p2={{ x, y: CANVAS_HEIGHT }}
        color={x % majorStepX === 0 ? "#44f8" : "#bbb5"}
        strokeWidth={x % majorStepX === 0 ? 1.3 : 0.7}
      />
    );
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += minorStepY) {
    gridLines.push(
      <Line
        key={`h${y}`}
        p1={{ x: 0, y }}
        p2={{ x: CANVAS_WIDTH, y }}
        color={y % majorStepY === 0 ? "#44f8" : "#bbb5"}
        strokeWidth={y % majorStepY === 0 ? 1.3 : 0.7}
      />
    );
  }

  const handleLogout = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigation.reset({ index: 0, routes: [{ name: "RoleSelect" as never }] });
      setLoggingOut(false);
    }, 150);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TouchableOpacity style={[styles.logoutBtn, loggingOut && { backgroundColor: "#ccc" }]} onPress={handleLogout} activeOpacity={0.5} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "bold" }}>Cambiar rol</Text>}
      </TouchableOpacity>

      <Text style={[styles.title, { color: c.primary }]}>Monitor Multiparámetro</Text>

      <Text style={{ color: c.text, fontSize: 18, paddingHorizontal: 24, textAlign: "center", marginBottom: 8 }}>
        Esta es la vista del estudiante. Solo puedes visualizar los parámetros simulados enviados por el docente.
      </Text>

      {/* ECG */}
      <View style={[styles.ecgBlock, { backgroundColor: c.card }]}>
        <Text style={[styles.blockLabel, { color: "#39f" }]}>ECG ({ekgLabel})</Text>
        <View style={styles.ecgWaveRow}>
          <Canvas style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: "#000" }}>
            {gridLines}
            <Path path={p} color="#39f" style="stroke" strokeWidth={3} />
          </Canvas>
          <View style={styles.bpmBlock}>
            <Text style={[styles.bpmValue, { color: "#39f" }]}>{showECG ? bpm : "--"}</Text>
            <Text style={[styles.bpmUnit, { color: "#39f" }]}>BPM</Text>
          </View>
        </View>
      </View>

      {/* PANI */}
      <View style={[styles.paniBlock, { backgroundColor: c.card }]}>
        <Text style={[styles.blockLabel, { color: "#f66" }]}>PANI</Text>
        <Text style={[styles.paniValue, { color: "#f66" }]}>{showPANI ? `${paniSys}/${paniDia}` : "--/--"}</Text>
        <Text style={[styles.paniUnit, { color: "#f66" }]}>mmHg</Text>
      </View>

      {/* SpO₂ */}
      <View style={[styles.spoBlock, { backgroundColor: c.card }]}>
        <Text style={[styles.blockLabel, { color: "#090" }]}>SpO₂</Text>
        <Text style={[styles.spoValue, { color: "#090" }]}>{showSPO ? spoValue : "--"}</Text>
        <Text style={[styles.spoUnit, { color: "#090" }]}>{spoLabel}</Text>
      </View>

      {/* Sounds */}
      <View style={[styles.soundsBlock, { backgroundColor: c.card }]}>
        <Text style={[styles.blockLabel, { color: "#F96" }]}>Sonidos</Text>
        <Text style={[styles.soundsValue, { color: "#F96" }]}>{showSOUNDS ? soundsLabel : "--"}</Text>
      </View>

      {/* Configuración actual */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.text }]}>Configuración EKG actual</Text>
        {showECG ? (
          <Text style={{ color: c.text, textAlign: "center",  fontSize: 18 }}>
            Tipo: {ekgLabel}{"\n"}
            Frecuencia: {bpm} BPM{"\n"}
            Duración de simulación: {dur} s
          </Text>
        ) : (
          <Text style={{ color: c.gray, textAlign: "center", fontSize: 18 }}>
            Esperando configuración del docente...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecgBlock: { width: "70%", backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", marginBottom: 7, borderWidth: 1, borderColor: "#39f6",overflow: "hidden",},
  ecgWaveRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  bpmBlock: { justifyContent: "center", alignItems: "center", marginLeft: 16, minWidth: 65 },
  bpmValue: { fontSize: 36, fontWeight: "bold" },
  bpmUnit: { fontSize: 18, fontWeight: "500", marginTop: -4 },
  blockLabel: { fontSize: 17, fontWeight: "700", marginBottom: 2, letterSpacing: 1 },
  paniBlock: { width: "70%", backgroundColor: "#fff", borderRadius: 12, alignItems: "center", padding: 10, borderWidth: 1, borderColor: "#f666", marginBottom: 12 },
  paniValue: { fontSize: 30, fontWeight: "bold" },
  paniUnit: { fontSize: 17, fontWeight: "500" },
  spoBlock: { width: "70%", backgroundColor: "#fff", borderRadius: 12, alignItems: "center", padding: 10, borderWidth: 1, borderColor: "#0906", marginBottom: 12 },
  spoValue: { fontSize: 30, fontWeight: "bold" },
  spoUnit: { fontSize: 17, fontWeight: "500" },
  soundsBlock: { width: "70%", backgroundColor: "#fff", borderRadius: 12, alignItems: "center", padding: 10, borderWidth: 1, borderColor: "#F966", marginBottom: 12 },
  soundsValue: { fontSize: 24, fontWeight: "bold" },
  card: { width: "70%", backgroundColor: "#fff2", padding: 13, borderRadius: 12, marginBottom: 8, alignItems: "center" },
  label: { fontSize: 19, fontWeight: "600", marginBottom: 4 },
  container: { flex: 1, alignItems: "center", paddingTop: 58, gap: 8 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  logoutBtn: {
    position: "absolute",
    top: 44,
    right: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f55",
    zIndex: 9999,
    elevation: 10,
    minWidth: 125,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 2,
  },
});