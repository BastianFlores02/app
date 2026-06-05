import React from "react";
import {
  Canvas,
  Circle,
  useClockValue,
  useComputedValue,
} from "@shopify/react-native-skia";

export const BLEConnectedAnimation = () => {
  const clock = useClockValue();
  const interval = 1500;

  const pulse = useComputedValue(() => {
    const progress = (clock.current % interval) / interval;
    return 20 + Math.sin(progress * 2 * Math.PI) * 5; // oscila entre 15-25
  }, [clock]);

  return (
    <Canvas style={{ width: 300, height: 300 }}>
      <Circle cx={150} cy={150} r={pulse} color="#00C851" opacity={1} />
    </Canvas>
  );
};

export default BLEConnectedAnimation;