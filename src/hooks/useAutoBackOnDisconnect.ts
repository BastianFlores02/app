import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export function useAutoBackOnDisconnect(connected: boolean) {
  const nav = useNavigation();
  useEffect(() => {
    if (!connected) {
      nav.reset({
        index: 0,
        routes: [{ name: "ScanScreen" as never }],
      });
    }
  }, [connected]);
}
