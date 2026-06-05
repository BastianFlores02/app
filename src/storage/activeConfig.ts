// src/storage/activeConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Prot from "../ble/protocol";

export type ActiveConfig = {
  ekg?: Prot.EkgPayload;
  pani?: Prot.PaniPayload;
  spo?: Prot.SpoPayload;
  sounds?: Prot.SoundsPayload;
};

const KEY = "activeConfig";

// Guardar config activa
export async function setActiveConfig(cfg: ActiveConfig) {
  await AsyncStorage.setItem(KEY, JSON.stringify(cfg));
}

// Leer config activa
export async function getActiveConfig(): Promise<ActiveConfig | null> {
  const data = await AsyncStorage.getItem(KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Limpiar config activa
export async function clearActiveConfig() {
  await AsyncStorage.removeItem(KEY);
}