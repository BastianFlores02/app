import React from "react";
import {
  Canvas,
  Circle,
  useClockValue,
  useComputedValue,
} from "@shopify/react-native-skia";

export const BLEScanningAnimation = () => {
  const clock = useClockValue();
  const interval = 2000;

  const scale = useComputedValue(() => {
    return ((clock.current % interval) / interval) * 120;
  }, [clock]);

  const opacity = useComputedValue(() => {
    return 0.8 - (clock.current % interval) / interval;
  }, [clock]);

  const scale2 = useComputedValue(() => {
    return (((clock.current + 1000) % interval) / interval) * 120;
  }, [clock]);

  const opacity2 = useComputedValue(() => {
    return 0.8 - ((clock.current + 1000) % interval) / interval;
  }, [clock]);

  return (
    <Canvas style={{ width: 300, height: 300 }}>
      <Circle cx={150} cy={150} r={scale} color="#0080FF" opacity={opacity} />
      <Circle cx={150} cy={150} r={scale2} color="#0080FF" opacity={opacity2} />
      <Circle cx={150} cy={150} r={20} color="#0080FF" opacity={1} />
    </Canvas>
  );
};

export default BLEScanningAnimation;