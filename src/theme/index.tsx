import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

/* ---------- Paleta ---------- */
export type Palette = {
  background: string; card: string; text: string;
  primary: string; accent: string; success: string; danger: string; gray: string;
  mode: "light" | "dark"; 
};

const light: Palette = {
  background:"#FFFFFF", card:"#F3F4F6", text:"#000",
  primary:"#004B8D", accent:"#D17A00", success:"#34C759", danger:"#E74C3C", gray:"#8E8E93",
  mode: "light"
};
const dark:  Palette = {
  background:"#121212", card:"#1E1E1E", text:"#FFF",
  primary:"#5AA2FF", accent:"#FFA24D", success:"#30D158", danger:"#FF6159", gray:"#B5B5BD",
  mode: "dark"
};

/* ---------- Context ---------- */
const ThemeCtx = createContext<Palette>(light);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const palette = useColorScheme() === "dark" ? dark : light;
  return <ThemeCtx.Provider value={palette}>{children}</ThemeCtx.Provider>;
};

/* ---------- Hook ---------- */
export const useTheme = () => useContext(ThemeCtx);