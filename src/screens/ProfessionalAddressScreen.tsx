import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";

export default function ProfessionalAddressScreen({ route, navigation }: any) {
  const { user, onUpdateUser } = route.params || {};
  const profile = user?.professional_profile || {};

  // Screen states
  const [hasPhysicalShop, setHasPhysicalShop] = useState<boolean>(
    profile.has_physical_shop === 1 || profile.has_physical_shop === true
  );
  const [shopAddress, setShopAddress] = useState<string>(profile.shop_address || "");
  const [loading, setLoading] = useState<boolean>(false);

  // Modal states
  const [slotsModalVisible, setSlotsModalVisible] = useState<boolean>(false);
  const [openTime1, setOpenTime1] = useState<string>(profile.open_time_1 || "08:00");
  const [closeTime1, setCloseTime1] = useState<string>(profile.close_time_1 || "12:00");
  const [hasSecondRange, setHasSecondRange] = useState<boolean>(
    profile.has_second_range === 1 || profile.has_second_range === true
  );
  const [openTime2, setOpenTime2] = useState<string>(profile.open_time_2 || "15:30");
  const [closeTime2, setCloseTime2] = useState<string>(profile.close_time_2 || "21:00");

  // Temporary modal states
  const [tempOpenTime1, setTempOpenTime1] = useState<string>("");
  const [tempCloseTime1, setTempCloseTime1] = useState<string>("");
  const [tempHasSecondRange, setTempHasSecondRange] = useState<boolean>(false);
  const [tempOpenTime2, setTempOpenTime2] = useState<string>("");
  const [tempCloseTime2, setTempCloseTime2] = useState<string>("");

  const openSlotsModal = () => {
    setTempOpenTime1(openTime1);
    setTempCloseTime1(closeTime1);
    setTempHasSecondRange(hasSecondRange);
    setTempOpenTime2(openTime2);
    setTempCloseTime2(closeTime2);
    setSlotsModalVisible(true);
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time.trim());
  };

  const formatTimeInput = (text: string): string => {
    // Remove non-numeric characters except colon
    let cleaned = text.replace(/[^0-9:]/g, "");
    
    // Auto insert colon
    if (cleaned.length === 2 && !cleaned.includes(":")) {
      cleaned = cleaned + ":";
    } else if (cleaned.length === 3 && cleaned[2] !== ":") {
      cleaned = cleaned.slice(0, 2) + ":" + cleaned[2];
    }
    
    return cleaned.slice(0, 5);
  };

  const saveSlotsLocally = () => {
    if (!validateTime(tempOpenTime1) || !validateTime(tempCloseTime1)) {
      Alert.alert("Formato Inválido", "El primer rango de horarios debe estar en formato HH:MM (ej. 08:00 o 12:30)");
      return;
    }

    if (tempHasSecondRange) {
      if (!validateTime(tempOpenTime2) || !validateTime(tempCloseTime2)) {
        Alert.alert("Formato Inválido", "El segundo rango de horarios debe estar en formato HH:MM (ej. 15:30 o 21:00)");
        return;
      }
    }

    setOpenTime1(tempOpenTime1.trim());
    setCloseTime1(tempCloseTime1.trim());
    setHasSecondRange(tempHasSecondRange);
    setOpenTime2(tempOpenTime2.trim());
    setCloseTime2(tempCloseTime2.trim());
    setSlotsModalVisible(false);
  };

  const handleSave = async () => {
    if (hasPhysicalShop && !shopAddress.trim()) {
      Alert.alert("Campo Requerido", "Por favor, ingresá la dirección de tu negocio.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        has_physical_shop: hasPhysicalShop,
        shop_address: hasPhysicalShop ? shopAddress.trim() : null,
        open_time_1: openTime1,
        close_time_1: closeTime1,
        has_second_range: hasSecondRange,
        open_time_2: openTime2,
        close_time_2: closeTime2,
      };

      const response = await api.put("/profile", payload);
      onUpdateUser(response.data.user);
      Alert.alert("Éxito", "Domicilio y horarios actualizados correctamente");
      navigation.goBack();
    } catch (error: any) {
      console.log(error);
      const errorMsg =
        error.response?.data?.message ||
        "No se pudo guardar en el servidor. Se guardó localmente.";
      Alert.alert("Error al guardar", errorMsg);

      // Fallback local
      const updatedUser = {
        ...user,
        professional_profile: {
          ...profile,
          has_physical_shop: hasPhysicalShop,
          shop_address: hasPhysicalShop ? shopAddress.trim() : null,
          open_time_1: openTime1,
          close_time_1: closeTime1,
          has_second_range: hasSecondRange,
          open_time_2: openTime2,
          close_time_2: closeTime2,
        },
      };
      onUpdateUser(updatedUser);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          {/* Toggle Domicilio de atención */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Activar domicilio de atención</Text>
            <TouchableOpacity
              style={[
                styles.switchContainer,
                hasPhysicalShop ? styles.switchActiveBg : styles.switchInactiveBg,
              ]}
              onPress={() => setHasPhysicalShop(!hasPhysicalShop)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchThumb,
                  hasPhysicalShop ? styles.switchThumbActive : styles.switchThumbInactive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Conditional Input Section */}
          {hasPhysicalShop && (
            <View style={styles.contextualSection}>
              <Text style={styles.inputSubtitle}>Ingresá el domicilio de tu negocio.</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={shopAddress}
                  onChangeText={setShopAddress}
                  placeholder="Av. Sarmiento 1562"
                  placeholderTextColor="#3d4943"
                />
              </View>

              {/* Hours Configuration Row */}
              <Text style={[styles.inputSubtitle, { marginTop: 16 }]}>Horarios de atención.</Text>
              <TouchableOpacity
                style={styles.hoursCard}
                onPress={openSlotsModal}
                activeOpacity={0.7}
              >
                <MaterialIcons name="schedule" size={24} color="#3d4943" style={styles.hoursIcon} />
                <View style={styles.hoursContent}>
                  <Text style={styles.hoursTitle}>Horarios de atención</Text>
                  <Text style={styles.hoursSubtitle}>
                    {openTime1} - {closeTime1}
                    {hasSecondRange ? ` / ${openTime2} - ${closeTime2}` : ""}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Pinned Bottom Button */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* --- MODAL HORARIOS DE ATENCIÓN --- */}
      <Modal
        visible={slotsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSlotsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setSlotsModalVisible(false)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#00694c" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Configurá tus horarios</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Modal Content */}
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Podés ofrecer hasta dos rangos de horarios.
              </Text>

              {/* First Range Inputs */}
              <View style={styles.timeRangeRow}>
                <View style={styles.timeInputCol}>
                  <Text style={styles.timeLabel}>Apertura</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInput}
                      value={tempOpenTime1}
                      onChangeText={(text) => setTempOpenTime1(formatTimeInput(text))}
                      placeholder="08:00"
                      placeholderTextColor="#bccac1"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>

                <View style={styles.timeInputCol}>
                  <Text style={styles.timeLabel}>Cierre</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInput}
                      value={tempCloseTime1}
                      onChangeText={(text) => setTempCloseTime1(formatTimeInput(text))}
                      placeholder="12:00"
                      placeholderTextColor="#bccac1"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Second Range Toggle */}
              <View style={styles.secondRangeToggleRow}>
                <Text style={styles.secondRangeLabel}>Segundo rango (opcional)</Text>
                <TouchableOpacity
                  style={[
                    styles.smallSwitchContainer,
                    tempHasSecondRange ? styles.switchActiveBg : styles.switchInactiveBg,
                  ]}
                  onPress={() => setTempHasSecondRange(!tempHasSecondRange)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.smallSwitchThumb,
                      tempHasSecondRange ? styles.smallSwitchThumbActive : styles.smallSwitchThumbInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Second Range Inputs */}
              {tempHasSecondRange && (
                <View style={styles.timeRangeRow}>
                  <View style={styles.timeInputCol}>
                    <Text style={styles.timeLabel}>Apertura</Text>
                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={styles.timeInput}
                        value={tempOpenTime2}
                        onChangeText={(text) => setTempOpenTime2(formatTimeInput(text))}
                        placeholder="15:30"
                        placeholderTextColor="#bccac1"
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                  </View>

                  <View style={styles.timeInputCol}>
                    <Text style={styles.timeLabel}>Cierre</Text>
                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={styles.timeInput}
                        value={tempCloseTime2}
                        onChangeText={(text) => setTempCloseTime2(formatTimeInput(text))}
                        placeholder="21:00"
                        placeholderTextColor="#bccac1"
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveSlotsLocally}>
                <Text style={styles.modalSaveBtnText}>Guardar</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#bccac1",
  },
  toggleText: {
    fontSize: 16,
    color: "#181c1c",
  },
  switchContainer: {
    width: 48,
    height: 24,
    borderRadius: 999,
    padding: 2,
    justifyContent: "center",
  },
  switchActiveBg: {
    backgroundColor: "#00694c",
  },
  switchInactiveBg: {
    backgroundColor: "#d7dbd9",
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  switchThumbInactive: {
    alignSelf: "flex-start",
  },
  contextualSection: {
    marginTop: 24,
    width: "100%",
  },
  inputSubtitle: {
    fontSize: 14,
    color: "#3d4943",
    marginBottom: 12,
  },
  inputContainer: {
    width: "100%",
  },
  textInput: {
    width: "100%",
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#181c1c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hoursCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  hoursIcon: {
    marginRight: 16,
  },
  hoursContent: {
    flex: 1,
    justifyContent: "center",
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#181c1c",
  },
  hoursSubtitle: {
    fontSize: 14,
    color: "#3d4943",
    marginTop: 4,
  },
  bottomArea: {
    padding: 24,
    backgroundColor: "#f7faf8",
    borderTopWidth: 1,
    borderTopColor: "#e6e9e7",
  },
  saveButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#00694c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Modal Horarios
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bccac1",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e3e1",
    position: "relative",
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    flex: 1,
    textAlign: "center",
  },
  modalContent: {
    padding: 24,
    gap: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#3d4943",
    textAlign: "center",
    marginBottom: 8,
  },
  timeRangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    width: "100%",
  },
  timeInputCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
    marginBottom: 8,
  },
  timeInputContainer: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  timeInput: {
    width: "100%",
    height: "100%",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "400",
    color: "#181c1c",
    textAlign: "center",
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e3e1",
    marginVertical: 4,
  },
  secondRangeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondRangeLabel: {
    fontSize: 14,
    color: "#181c1c",
  },
  smallSwitchContainer: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  smallSwitchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  smallSwitchThumbActive: {
    alignSelf: "flex-end",
  },
  smallSwitchThumbInactive: {
    alignSelf: "flex-start",
  },
  modalFooter: {
    padding: 24,
    paddingTop: 0,
  },
  modalSaveBtn: {
    width: "100%",
    height: 52,
    backgroundColor: "#00694c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
