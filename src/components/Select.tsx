import React from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";

type Item = { label: string; value: any };
type Props = {
  label: string;
  value: any;
  onChange: (v: any) => void;
  options: Item[];
};

export default function Select({ label, value, onChange, options }: Props) {
  const [open, setOpen] = React.useState(false);
  const current = options.find(o => o.value === value)?.label ?? "—";
  const c = useTheme(); // Tema dinámico

  return (
    <>
      <Pressable
        style={[styles.input, { borderBottomColor: c.gray }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        <View style={styles.row}>
          <Text style={{ color: c.text }}>{current}</Text>
          <Ionicons name="chevron-down" size={18} color={c.text} />
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: c.card }]}>
            <FlatList
              data={options}
              keyExtractor={i => String(i.value)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: c.text }}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderBottomWidth: 1, paddingVertical: 6, marginTop: 12 },
  label: { fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backdrop: { flex: 1, backgroundColor: "#0004", justifyContent: "flex-end" },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "60%",
  },
  item: { paddingVertical: 14 },
});