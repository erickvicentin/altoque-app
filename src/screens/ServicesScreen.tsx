import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";

interface Service {
  id: number;
  professional_profile_id: number;
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface ServicesScreenProps {
  user: any;
  navigation: any;
  setActiveTab: (tab: string) => void;
  onUpdateUser: (user: any) => void;
}

export default function ServicesScreen({ user, navigation, setActiveTab, onUpdateUser }: ServicesScreenProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // States para el modal de Días de Atención
  const [daysModalVisible, setDaysModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [savingDays, setSavingDays] = useState(false);

  const ALL_WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // Cargar servicios al montar
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      setServices(response.data);
    } catch (error: any) {
      console.log("Error fetching services:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  // Toggle de activación/desactivación
  const handleToggleService = async (service: Service) => {
    const updatedActive = !service.is_active;

    // Actualización optimista de la UI
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, is_active: updatedActive } : s))
    );

    try {
      await api.put(`/services/${service.id}`, {
        is_active: updatedActive,
      });
    } catch (error: any) {
      console.log("Error updating service status:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del servicio");
      // Revertir en caso de error
      fetchServices();
    }
  };

  // Formateador de duración (ej. 60 -> "1 h", 45 -> "45 m", 90 -> "1.5 h")
  const formatDuration = (mins: number) => {
    if (mins < 60) {
      return `${mins} m`;
    }
    const hours = mins / 60;
    if (mins % 60 === 0) {
      return `${hours} h`;
    }
    return `${hours.toFixed(1).replace(".", ".")} h`;
  };

  // Formateador de precio (ej. 15000 -> "$15.000")
  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return "$0";
    
    // Formato manual con punto de miles para Español (Argentina)
    const roundedPrice = Math.round(numericPrice);
    return `$${roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  // Formateador de días de atención
  const formatWorkingDays = () => {
    const days = user.professional_profile?.working_days || [];
    if (!days || days.length === 0) {
      return "Sin días de atención configurados";
    }

    // 1. Filtrar y ordenar cronológicamente de Lunes a Domingo
    const sortedDays = days
      .filter((d: string) => ALL_WEEKDAYS.includes(d))
      .sort((a: string, b: string) => ALL_WEEKDAYS.indexOf(a) - ALL_WEEKDAYS.indexOf(b));

    if (sortedDays.length === 0) {
      return "Sin días de atención configurados";
    }

    if (sortedDays.length === 7) {
      return "Todos los días";
    }

    // 2. Verificar si son consecutivos para mostrar rango (ej. Lunes a Viernes)
    const indices = sortedDays.map((d: string) => ALL_WEEKDAYS.indexOf(d));
    let isConsecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] - indices[i - 1] !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive && sortedDays.length >= 3) {
      return `${sortedDays[0]} a ${sortedDays[sortedDays.length - 1]}`;
    }

    if (sortedDays.length === 1) {
      return sortedDays[0];
    }

    // 3. Si no son consecutivos o son solo 2 días, listarlos: "Lunes y Martes" o "Lunes, Martes y Jueves"
    const lastDay = sortedDays[sortedDays.length - 1];
    const otherDays = sortedDays.slice(0, -1).join(", ");
    return `${otherDays} y ${lastDay}`;
  };

  const handleEditDays = async () => {
    try {
      const response = await api.get("/profile");
      const freshUser = response.data.user;
      onUpdateUser(freshUser);
      setSelectedDays(freshUser.professional_profile?.working_days || []);
      setDaysModalVisible(true);
    } catch (error) {
      console.log("Error fetching profile working days:", error);
      // Fallback al estado local si la API falla
      setSelectedDays(user.professional_profile?.working_days || []);
      setDaysModalVisible(true);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const saveDays = async () => {
    setSavingDays(true);
    try {
      const response = await api.put("/profile", {
        working_days: selectedDays,
      });
      onUpdateUser(response.data.user);
      Alert.alert("Éxito", "Días de atención actualizados con éxito.");
      setDaysModalVisible(false);
    } catch (error: any) {
      console.log("Error saving working days:", error);
      Alert.alert("Error", "No se pudieron actualizar los días de atención.");
    } finally {
      setSavingDays(false);
    }
  };

  const handleEditSlots = (day: string) => {
    Alert.alert(
      "Editar slots",
      `Edición de slots para el día ${day} estará disponible próximamente.`
    );
  };

  const handleAddService = () => {
    Alert.alert("Nuevo servicio", "La pantalla de creación de nuevos servicios estará disponible próximamente.");
  };

  const handleEditService = (service: Service) => {
    Alert.alert(
      "Editar servicio",
      `Presionaste: ${service.name}. La pantalla de edición del servicio estará disponible próximamente.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Días de atención */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Días de atención</Text>
            <TouchableOpacity onPress={handleEditDays} activeOpacity={0.7}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.daysText}>{formatWorkingDays()}</Text>
        </View>

        {/* Section: Servicios y slots de horario */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={styles.servicesTitle}>Servicios y slots de horario</Text>
          <Text style={styles.servicesSubtitle}>
            Presioná sobre alguno si querés modificarlo o eliminarlo
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 24 }} />
          ) : services.length === 0 ? (
            <Text style={styles.emptyText}>No tienes servicios creados.</Text>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceRow}
                  onPress={() => handleEditService(service)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.serviceInfo} numberOfLines={1}>
                    {service.name} | {formatDuration(service.duration_minutes)} | {formatPrice(service.price)}
                  </Text>
                  
                  {/* Custom Toggle Switch */}
                  <TouchableOpacity
                    style={[
                      styles.toggleContainer,
                      { backgroundColor: service.is_active ? "#00694c" : "#e0e3e1" },
                    ]}
                    onPress={() => handleToggleService(service)}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        service.is_active
                          ? { alignSelf: "flex-end", marginRight: 2 }
                          : { alignSelf: "flex-start", marginLeft: 2 },
                      ]}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Button Area */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddService}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Agregar nuevo servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Seleccioná tus días de atención */}
      <Modal
        visible={daysModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDaysModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccioná tus días de atención</Text>
            </View>

            {/* Modal Content (List) */}
            <ScrollView style={styles.modalScroll} bounces={false}>
              <View style={styles.daysListContainer}>
                {ALL_WEEKDAYS.map((day, index) => {
                  const isChecked = selectedDays.includes(day);
                  const isLast = index === ALL_WEEKDAYS.length - 1;
                  return (
                    <View
                      key={day}
                      style={[
                        styles.dayRow,
                        !isLast && styles.dayRowBorder,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.dayCheckboxLabel}
                        onPress={() => toggleDay(day)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkboxCircle,
                            isChecked ? styles.checkboxCheckedBg : styles.checkboxUncheckedBg,
                          ]}
                        >
                          {isChecked && (
                            <MaterialIcons name="check" size={14} color="#ffffff" />
                          )}
                        </View>
                        <Text style={styles.dayNameText}>{day}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => isChecked && handleEditSlots(day)}
                        disabled={!isChecked}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.editSlotsBtnText,
                            isChecked ? styles.editSlotsBtnActive : styles.editSlotsBtnDisabled,
                          ]}
                        >
                          Editar slots
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDaysModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveDays}
                activeOpacity={0.8}
                disabled={savingDays}
              >
                {savingDays ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 150, // Espacio para que el scroll no tape el botón flotante ni el bottom bar
  },
  section: {
    width: "100%",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    paddingBottom: 2,
  },
  daysText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#3d4943",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  servicesTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    marginBottom: 4,
  },
  servicesSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    color: "#3d4943",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    marginBottom: 16,
  },
  servicesList: {
    gap: 12,
  },
  serviceRow: {
    width: "100%",
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  serviceInfo: {
    fontSize: 13,
    color: "#3d4943",
    fontWeight: "400",
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  toggleContainer: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyText: {
    fontSize: 14,
    color: "#3d4943",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 85, // Arriba de la barra de navegación
    left: 20,
    right: 20,
    backgroundColor: "transparent",
  },
  addButton: {
    height: 56,
    backgroundColor: "#2d3130", // inverse-surface
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  // Modal Días de Atención Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7dbd9",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  modalScroll: {
    maxHeight: 350,
  },
  daysListContainer: {
    paddingHorizontal: 24,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7dbd9",
  },
  dayCheckboxLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxCheckedBg: {
    backgroundColor: "#00694c",
  },
  checkboxUncheckedBg: {
    borderWidth: 1,
    borderColor: "#bccac1",
    backgroundColor: "transparent",
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  editSlotsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    paddingLeft: 16,
  },
  editSlotsBtnActive: {
    color: "#00694c",
  },
  editSlotsBtnDisabled: {
    color: "#6d7a73",
  },
  modalFooterRow: {
    padding: 24,
    flexDirection: "row",
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#00694c",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    color: "#00694c",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#DC3535",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
});
