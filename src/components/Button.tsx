// /src/components/Button.tsx
import React, { ReactNode } from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../theme";

export type ButtonProps = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Botón sólido primario */
export function PrimaryButton({ children, onPress, disabled, style }: ButtonProps) {
  const c = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: disabled ? c.gray : c.primary },
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: "#FFF" }]}>{children}</Text>
    </TouchableOpacity>
  );
}

/** Botón contorneado secundario */
export function SecondaryButton({ children, onPress, disabled, style }: ButtonProps) {
  const c = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: disabled ? c.gray : c.primary,
        },
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: disabled ? c.gray : c.primary }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:   { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  label:  { fontSize: 16, fontWeight: "600", textAlign: "center" },
});