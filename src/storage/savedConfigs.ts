// src/storage/savedConfigs.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Prot from "../ble/protocol";  

const STORAGE_KEY = "PHANTOM_SAVED_CONFIGS";

export type SavedConfig = {
  name: string;
  date: number;
  modules: {
    ekg?: { mode: number; bpm: number; duration: number };
    pani?: { mode: number; lo: number; hi: number };
    spo?: Prot.SpoPayload;
    sounds?: Prot.SoundsPayload;
  };
};

export async function getSavedConfigs(): Promise<SavedConfig[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveConfig(cfg: SavedConfig) {
  const list = await getSavedConfigs();
  list.unshift(cfg); // agrega al inicio
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function deleteConfig(date: number) {
  const list = await getSavedConfigs();
  const newList = list.filter(cfg => cfg.date !== date);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
}