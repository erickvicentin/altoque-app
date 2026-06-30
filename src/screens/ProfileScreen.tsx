import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";

interface ProfileScreenProps {
  user: any;
  onUpdateUser: (user: any) => void;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onUpdateUser, onLogout }: ProfileScreenProps) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  // Modales
  const [personalDataModalVisible, setPersonalDataModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // Selector states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateVal, setDateVal] = useState<Date>(new Date());

  // Form states
  const [name, setName] = useState(user.name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [birthDate, setBirthDate] = useState(user.birth_date || "");
  const [gender, setGender] = useState(user.gender || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [address, setAddress] = useState(
    user.role === "client"
      ? user.address?.address_line || ""
      : user.professional_profile?.shop_address || ""
  );

  // Date formatting helpers
  const getDisplayDate = (dateStr: string) => {
    if (!dateStr) return "No especificada";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDateVal(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setBirthDate(`${year}-${month}-${day}`);
    }
  };

  const handleUpdate = async (fieldsToUpdate: any) => {
    setLoading(true);
    try {
      const payload = {
        name: fieldsToUpdate.name ?? user.name,
        last_name: fieldsToUpdate.last_name ?? user.last_name,
        email: fieldsToUpdate.email ?? user.email,
        birth_date: fieldsToUpdate.birth_date ?? user.birth_date,
        gender: fieldsToUpdate.gender ?? user.gender,
        phone: fieldsToUpdate.phone ?? user.phone,
        address_line: user.role === "client" 
          ? (fieldsToUpdate.address_line ?? (user.addresses && user.addresses.length > 0 ? (user.addresses.find((addr: any) => addr.is_default)?.address_line || user.addresses[0].address_line) : undefined)) 
          : undefined,
        shop_address: user.role === "professional" ? (fieldsToUpdate.shop_address ?? user.professional_profile?.shop_address) : undefined,
      };

      const response = await api.put("/profile", payload);
      onUpdateUser(response.data.user);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error: any) {
      console.log(error);
      const errorMsg =
        error.response?.data?.message ||
        "No se pudo guardar la información en el servidor. Se aplicó localmente.";
      Alert.alert("Error de guardado", errorMsg);

      // Fallback local en caso de que el backend falle o no esté disponible
      const fallbackUser = {
        ...user,
        ...fieldsToUpdate,
        address: user.role === "client" ? { ...user.address, address_line: fieldsToUpdate.address_line ?? user.address?.address_line } : undefined,
        professional_profile: user.role === "professional" ? { ...user.professional_profile, shop_address: fieldsToUpdate.shop_address ?? user.professional_profile?.shop_address } : undefined,
      };
      onUpdateUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const savePersonalData = () => {
    if (!name || !lastName) {
      Alert.alert("Error", "Nombre y Apellido son requeridos");
      return;
    }

    if (birthDate) {
      const selected = new Date(birthDate + "T12:00:00");
      const minDate = new Date("1925-01-01T12:00:00");
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - 18);

      if (selected < minDate) {
        Alert.alert("Fecha Inválida", "La fecha de nacimiento no puede ser anterior a 1925.");
        return;
      }
      if (selected > maxDate) {
        Alert.alert("Edad mínima requerida", "Debes tener al menos 18 años.");
        return;
      }
    }

    handleUpdate({ name, last_name: lastName, birth_date: birthDate, gender });
    setPersonalDataModalVisible(false);
  };

  const savePhone = () => {
    handleUpdate({ phone });
    setPhoneModalVisible(false);
  };

  const saveEmail = () => {
    if (!email) {
      Alert.alert("Error", "El email es requerido");
      return;
    }
    handleUpdate({ email });
    setEmailModalVisible(false);
  };

  const saveAddress = () => {
    if (user.role === "client") {
      handleUpdate({ address_line: address });
    } else {
      handleUpdate({ shop_address: address });
    }
    setAddressModalVisible(false);
  };

  const selectGender = (selectedGender: string) => {
    setGender(selectedGender);
  };

  const openPersonalDataModal = () => {
    setName(user.name || "");
    setLastName(user.last_name || "");
    setBirthDate(user.birth_date || "");
    setGender(user.gender || "");

    if (user.birth_date) {
      setDateVal(new Date(user.birth_date + "T12:00:00"));
    } else {
      setDateVal(new Date(new Date().setFullYear(new Date().getFullYear() - 18)));
    }

    setDropdownOpen(false);
    setShowDatePicker(false);
    setPersonalDataModalVisible(true);
  };

  const openPhoneModal = () => {
    navigation.navigate("EditPhone", { user, onUpdateUser });
  };

  const openEmailModal = () => {
    setEmail(user.email || "");
    setEmailModalVisible(true);
  };

  const openAddressModal = () => {
    if (user.role === "professional") {
      navigation.navigate("ProfessionalAddress", { user, onUpdateUser });
    } else {
      navigation.navigate("ClientAddress", { user, onUpdateUser });
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarWrapper, styles.avatarPlaceholder]}>
          <MaterialIcons name="person" size={80} color="#00694c" />
        </View>
        <TouchableOpacity style={styles.uploadBadge} activeOpacity={0.7}>
          <MaterialIcons name="arrow-upward" size={18} color="#00694c" />
        </TouchableOpacity>
      </View>

      {/* Settings Rows Container */}
      <View style={styles.settingsCard}>
        {/* Row 1: Datos personales */}
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={openPersonalDataModal}
          activeOpacity={0.7}
        >
          <MaterialIcons name="person" size={24} color="#3d4943" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Mis datos personales</Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {user.name} {user.last_name || ""} • {getDisplayDate(user.birth_date)} • {user.gender || "No especificado"}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
        </TouchableOpacity>

        {/* Row 2: Celular */}
        <View style={styles.settingsRow}>
          <MaterialIcons name="phone" size={24} color="#3d4943" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Número de celular</Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {user.phone || "+543625223344"}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openPhoneModal}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: E-mail */}
        <View style={styles.settingsRow}>
          <MaterialIcons name="mail" size={24} color="#3d4943" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>E-mail</Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert("Información Importante", "El email no se puede editar. Para cambiarlo contacta a soporte.")}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsRow}
          onPress={openAddressModal}
          activeOpacity={0.7}
        >
          <MaterialIcons name="location-on" size={24} color="#3d4943" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>
              {user.role === "client" ? "Mi domicilio" : "Ubicación de mi negocio"}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {user.role === "client"
                ? (user.addresses && user.addresses.length > 0
                  ? (user.addresses.find((addr: any) => addr.is_default)?.address_line || user.addresses[0].address_line)
                  : "No especificado")
                : (user.professional_profile?.shop_address || "Dirección de atención deshabilitada.")}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
        </TouchableOpacity>
      </View>

      {/* Logout button row */}
      <TouchableOpacity style={styles.logoutRow} onPress={onLogout} activeOpacity={0.7}>
        <MaterialIcons name="exit-to-app" size={24} color="#ed0f0fff" style={styles.rowIcon} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00694c" />
        </View>
      )}

      {/* --- MODAL DATOS PERSONALES --- */}
      <Modal
        visible={personalDataModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPersonalDataModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Datos Personales</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                placeholderTextColor="#bccac1"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
                placeholderTextColor="#bccac1"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
              <TouchableOpacity
                style={styles.inputPressable}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.inputPressableText}>
                  {getDisplayDate(birthDate)}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color="#3d4943" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateVal}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date(1925, 0, 1)}
                  maximumDate={
                    new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  }
                  onChange={onDateChange}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Género</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownSelectorText}>
                  {gender || "Seleccionar género"}
                </Text>
                <MaterialIcons
                  name={dropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color="#3d4943"
                />
              </TouchableOpacity>
              {dropdownOpen && (
                <View style={styles.dropdownOptions}>
                  {["Hombre", "Mujer", "Otro", "Prefiero no decirlo"].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setGender(opt);
                        setDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setPersonalDataModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={savePersonalData}>
                <Text style={styles.modalSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL CELULAR --- */}
      <Modal
        visible={phoneModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Número de celular</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Celular</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+543625223344"
                placeholderTextColor="#bccac1"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setPhoneModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={savePhone}>
                <Text style={styles.modalSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL E-MAIL --- */}
      <Modal
        visible={emailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>E-mail</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="test@prueba.com"
                placeholderTextColor="#bccac1"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveEmail}>
                <Text style={styles.modalSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL UBICACIÓN / DOMICILIO --- */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {user.role === "client" ? "Domicilio" : "Ubicación del negocio"}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Av. Sarmiento 1562"
                placeholderTextColor="#bccac1"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveAddress}>
                <Text style={styles.modalSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  container: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 120, // Space for BottomNavBar
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    marginTop: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  avatarSection: {
    position: "relative",
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  avatarWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e6e9e7",
    borderWidth: 1,
    borderColor: "#bccac1",
  },
  avatarPlaceholder: {
    backgroundColor: "#ebefed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: "#f7faf8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#bccac1",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  settingsCard: {
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
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 68,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#bccac1",
  },
  rowIcon: {
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#3d4943",
    marginTop: 2,
  },
  editButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
  },
  logoutRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ed0f0fff",
    marginLeft: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(247, 250, 248, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
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
  genderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },
  genderChipActive: {
    borderColor: "#00694c",
    backgroundColor: "#adedd8",
  },
  genderChipText: {
    fontSize: 14,
    color: "#3d4943",
  },
  genderChipTextActive: {
    color: "#002019",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3d4943",
  },
  modalSaveButton: {
    backgroundColor: "#00694c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  inputPressable: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7faf8",
  },
  inputPressableText: {
    fontSize: 16,
    color: "#181c1c",
  },
  dropdownSelector: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7faf8",
  },
  dropdownSelectorText: {
    fontSize: 16,
    color: "#181c1c",
  },
  dropdownOptions: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f2",
  },
  dropdownOptionText: {
    fontSize: 15,
    color: "#181c1c",
  },
});
