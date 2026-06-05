import React from "react";
import {
  Canvas,
  Circle,
  useClockValue,
  useComputedValue,
} from "@shopify/react-native-skia";

export const BLEDisconnectedAnimation = () => {
  const clock = useClockValue();
  const interval = 1000;

  const size = useComputedValue(() => {
    return 30 + ((clock.current % interval) / interval) * 40;
  }, [clock]);

  const opacity = useComputedValue(() => {
    return 1 - (clock.current % interval) / interval;
  }, [clock]);

  return (
    <Canvas style={{ width: 300, height: 300 }}>
      <Circle cx={150} cy={150} r={size} color="#FF3B30" opacity={opacity} />
    </Canvas>
  );
};

export default BLEDisconnectedAnimation;
