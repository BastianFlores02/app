import React, { createContext, useContext, ReactNode } from "react";
import useBLE, { BLEApi } from "../hooks/useBLE";

const BluetoothContext = createContext<BLEApi | null>(null);

export const BluetoothProvider = ({ children }: { children: ReactNode }) => {
  const ble = useBLE();
  return (
    <BluetoothContext.Provider value={ble}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const ctx = useContext(BluetoothContext);
  if (!ctx) throw new Error("useBluetooth must be inside provider");
  return ctx;
};