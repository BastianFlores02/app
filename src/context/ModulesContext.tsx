import React, { createContext, useContext } from "react";
import { BLEApi } from "../hooks/useBLE";
import { useBluetooth } from "./BluetoothContext";

const Ctx = createContext<BLEApi>(null as any);

export const ModulesProvider = ({ children }: { children: React.ReactNode }) => {
  const ble = useBluetooth();
  return <Ctx.Provider value={ble}>{children}</Ctx.Provider>;
};

export const useModules = () => useContext(Ctx);