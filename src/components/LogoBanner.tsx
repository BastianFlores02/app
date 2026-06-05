// src/components/LogoBanner.tsx
import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';

type Props = { style?: StyleProp<ImageStyle> };

export default function LogoBanner({ style }: Props) {
  return (
    <Image
      source={require('../../assets/PhantomAppLogo.png')}
      style={[styles.logo, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 256, height: 256, alignSelf: 'center', marginBottom: 10 } as ImageStyle,
});