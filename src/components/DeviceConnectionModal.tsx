import React, { FC } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Device } from "react-native-ble-plx";

import { useTheme } from "../theme";
import  Card      from "./Card";          // uso directo del componente

type Props = {
  visible: boolean;
  devices: Device[];
  onSelect: (d: Device) => void;
  onClose: () => void;
};

const DeviceConnectionModal: FC<Props> = ({ visible, devices, onSelect, onClose }) => {
  const c = useTheme();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={{ width: "90%" }}>
          <Text style={[styles.title, { color: c.text }]}>Selecciona un dispositivo</Text>
          <FlatList
            data={devices}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => onSelect(item)}
              >
                <Text style={{ color: c.text }}>{item.name ?? "N/D"}</Text>
                <Text style={{ color: c.gray, fontSize: 12 }}>{item.id}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: c.gray, textAlign: "center", marginTop: 10 }}>
                (Sin dispositivos)
              </Text>
            }
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: c.accent }}>Cerrar</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </Modal>
  );
};

export default DeviceConnectionModal;

const styles = StyleSheet.create({
  overlay:  { flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#0006" },
  title:    { fontSize:18,fontWeight:"600",marginBottom:12 },
  item:     { paddingVertical:12,borderBottomWidth:0.5,borderColor:"#ccc" },
  closeBtn: { marginTop:12, alignSelf:"flex-end" },
});
