import React from "react";
import {
  Canvas,
  Circle,
  useClockValue,
  useComputedValue,
} from "@shopify/react-native-skia";

export const BLEErrorAnimation = () => {
  const clock = useClockValue();
  const interval = 600;

  const opacity = useComputedValue(() => {
    return (clock.current % interval) < interval / 2 ? 1 : 0.3;
  }, [clock]);

  return (
    <Canvas style={{ width: 300, height: 300 }}>
      <Circle cx={150} cy={150} r={25} color="#FFD600" opacity={opacity} />
    </Canvas>
  );
};

export default BLEErrorAnimation;