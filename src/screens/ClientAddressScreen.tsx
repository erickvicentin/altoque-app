import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";

export default function ClientAddressScreen({ route, navigation }: any) {
  const { user, onUpdateUser } = route.params || {};
  const [addresses, setAddresses] = useState<any[]>(user?.addresses || []);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal States
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<any>(null); // null if adding new
  const [alias, setAlias] = useState<string>("");
  const [addressLine, setAddressLine] = useState<string>("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/addresses");
      setAddresses(response.data);
      onUpdateUser({ ...user, addresses: response.data });
    } catch (error) {
      console.log("Error fetching addresses:", error);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setAlias("");
    setAddressLine("");
    setModalVisible(true);
  };

  const handleOpenEdit = (address: any) => {
    setEditingAddress(address);
    setAlias(address.alias);
    setAddressLine(address.address_line);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!alias.trim() || !addressLine.trim()) {
      Alert.alert("Campos requeridos", "Por favor completa el nombre y la dirección.");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingAddress) {
        // Edit existing
        response = await api.put(`/addresses/${editingAddress.id}`, {
          address_line: addressLine.trim(),
          alias: alias.trim(),
        });
      } else {
        // Create new
        response = await api.post("/addresses", {
          address_line: addressLine.trim(),
          alias: alias.trim(),
        });
      }

      const updatedList = response.data.addresses;
      setAddresses(updatedList);
      onUpdateUser({ ...user, addresses: updatedList });
      setModalVisible(false);
      Alert.alert("Éxito", response.data.message);
    } catch (error: any) {
      console.log(error);
      const errorMsg = error.response?.data?.message || "No se pudo guardar la dirección.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAddress) return;

    Alert.alert(
      "Eliminar domicilio",
      `¿Estás seguro que querés eliminar "${editingAddress.alias}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.delete(`/addresses/${editingAddress.id}`);
              const updatedList = response.data.addresses;
              setAddresses(updatedList);
              onUpdateUser({ ...user, addresses: updatedList });
              setModalVisible(false);
              Alert.alert("Éxito", "Domicilio eliminado correctamente");
            } catch (error: any) {
              console.log(error);
              Alert.alert("Error", "No se pudo eliminar el domicilio.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSetPrincipal = async () => {
    if (!editingAddress) return;

    setLoading(true);
    try {
      const response = await api.post(`/addresses/${editingAddress.id}/principal`);
      const updatedList = response.data.addresses;
      setAddresses(updatedList);
      onUpdateUser({ ...user, addresses: updatedList });
      setModalVisible(false);
      Alert.alert("Éxito", "Domicilio marcado como principal");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "No se pudo marcar como principal.");
    } finally {
      setLoading(false);
    }
  };

  const principalAddress = addresses.find((addr) => addr.is_default);
  const otherAddresses = addresses.filter((addr) => !addr.is_default);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00694c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar domicilio</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Dirección Principal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Dirección principal</Text>
          <View style={styles.addressGroup}>
            {principalAddress ? (
              <TouchableOpacity
                style={styles.addressCard}
                onPress={() => handleOpenEdit(principalAddress)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="location-on"
                  size={24}
                  color="#6d7a73"
                  style={styles.cardIcon}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardAlias}>{principalAddress.alias}</Text>
                  <Text style={styles.cardDetails}>{principalAddress.address_line}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#bccac1" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.emptyText}>No tenés una dirección principal configurada.</Text>
            )}
          </View>
        </View>

        {/* Otras Direcciones Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Otras direcciones</Text>
          <View style={styles.addressGroup}>
            {otherAddresses.length > 0 ? (
              otherAddresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={styles.addressCard}
                  onPress={() => handleOpenEdit(addr)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="location-on"
                    size={24}
                    color="#6d7a73"
                    style={styles.cardIconOutline}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardAlias}>{addr.alias}</Text>
                    <Text style={styles.cardDetails}>{addr.address_line}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#bccac1" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No tenés otras direcciones agregadas.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Pinned Bottom Add Button */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd} activeOpacity={0.8}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Agregar nuevo domicilio</Text>
        </TouchableOpacity>
      </View>

      {/* --- ADD/EDIT MODAL --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingAddress ? "Editar domicilio" : "Agregar nuevo domicilio"}
            </Text>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre / Etiqueta (Ej: Casa, Trabajo)</Text>
                <TextInput
                  style={styles.input}
                  value={alias}
                  onChangeText={setAlias}
                  placeholder="Ej: Trabajo"
                  placeholderTextColor="#bccac1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección completa</Text>
                <TextInput
                  style={styles.input}
                  value={addressLine}
                  onChangeText={setAddressLine}
                  placeholder="Ej: Av. Moreno 1224"
                  placeholderTextColor="#bccac1"
                />
              </View>
            </KeyboardAvoidingView>

            {/* Extra Options for Editing */}
            {editingAddress && !editingAddress.is_default && (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleSetPrincipal}
                activeOpacity={0.7}
              >
                <MaterialIcons name="star" size={20} color="#00694c" />
                <Text style={styles.optionText}>Marcar como principal</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              {/* Delete Button (If Editing) */}
              {editingAddress && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={loading}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf8",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e9e7",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 110, // Space for floating add button
  },
  section: {
    marginBottom: 32,
    width: "100%",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181c1c",
    marginBottom: 12,
  },
  addressGroup: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#bccac1",
  },
  cardIcon: {
    marginRight: 16,
  },
  cardIconOutline: {
    marginRight: 16,
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardAlias: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181c1c",
  },
  cardDetails: {
    fontSize: 13,
    color: "#3d4943",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#3d4943",
    fontStyle: "italic",
    padding: 16,
    textAlign: "center",
  },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    maxWidth: 600,
    height: 56,
    backgroundColor: "#181c1c",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(24, 28, 28, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181c1c",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
    width: "100%",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3d4943",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#181c1c",
    backgroundColor: "#f7faf8",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3d4943",
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ba1a1a",
  },
  saveButton: {
    backgroundColor: "#00694c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
