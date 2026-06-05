// @types/expo-slider.d.ts
declare module "expo-slider" {
  import * as React from "react";
  import {
    Slider as RNCSlider,
    SliderProps as RNCSliderProps,
  } from "@react-native-community/slider";

  export const Slider: React.ComponentType<RNCSliderProps>;
}
