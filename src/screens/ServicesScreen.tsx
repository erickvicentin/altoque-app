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
  TextInput,
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
  const [selectedDaysObj, setSelectedDaysObj] = useState<Record<string, any>>({});
  const [savingDays, setSavingDays] = useState(false);

  // States para el modal de Gestión de Servicios (CRUD)
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState(60); // 60 mins por defecto
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [deletingService, setDeletingService] = useState(false);

  // View activa dentro del modal ("days" | "slots")
  const [activeView, setActiveView] = useState<"days" | "slots">("days");
  const [editingDay, setEditingDay] = useState("");
  const [slotOpen1, setSlotOpen1] = useState("08:00");
  const [slotClose1, setSlotClose1] = useState("12:00");
  const [slotHasSecond, setSlotHasSecond] = useState(false);
  const [slotOpen2, setSlotOpen2] = useState("15:30");
  const [slotClose2, setSlotClose2] = useState("21:00");

  const ALL_WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const initSelectedDaysObj = (daysData: any) => {
    const initialObj: Record<string, any> = {};
    ALL_WEEKDAYS.forEach(day => {
      let isActive = false;
      let open_time_1 = "08:00";
      let close_time_1 = "12:00";
      let has_second_range = false;
      let open_time_2 = "15:30";
      let close_time_2 = "21:00";

      if (Array.isArray(daysData)) {
        isActive = daysData.includes(day);
      } else if (typeof daysData === "object" && daysData !== null) {
        isActive = !!daysData[day]?.is_active;
        open_time_1 = daysData[day]?.open_time_1 || "08:00";
        close_time_1 = daysData[day]?.close_time_1 || "12:00";
        has_second_range = !!daysData[day]?.has_second_range;
        open_time_2 = daysData[day]?.open_time_2 || "15:30";
        close_time_2 = daysData[day]?.close_time_2 || "21:00";
      }

      initialObj[day] = {
        is_active: isActive,
        open_time_1,
        close_time_1,
        has_second_range,
        open_time_2,
        close_time_2
      };
    });
    return initialObj;
  };

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
    const days = user.professional_profile?.working_days;
    if (!days) {
      return "Sin días de atención configurados";
    }

    let activeDaysList: string[] = [];
    if (Array.isArray(days)) {
      activeDaysList = days;
    } else if (typeof days === "object" && days !== null) {
      activeDaysList = Object.keys(days).filter((day) => days[day]?.is_active);
    }

    if (activeDaysList.length === 0) {
      return "Sin días de atención configurados";
    }

    // 1. Filtrar y ordenar cronológicamente de Lunes a Domingo
    const sortedDays = activeDaysList
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
      setSelectedDaysObj(initSelectedDaysObj(freshUser.professional_profile?.working_days));
      setActiveView("days");
      setDaysModalVisible(true);
    } catch (error) {
      console.log("Error fetching profile working days:", error);
      // Fallback al estado local si la API falla
      setSelectedDaysObj(initSelectedDaysObj(user.professional_profile?.working_days));
      setActiveView("days");
      setDaysModalVisible(true);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDaysObj((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_active: !prev[day]?.is_active,
      },
    }));
  };

  const saveDays = async () => {
    setSavingDays(true);
    try {
      const response = await api.put("/profile", {
        working_days: selectedDaysObj,
      });
      onUpdateUser(response.data.user);
      Alert.alert("Éxito", "Días de atención y horarios actualizados con éxito.");
      setDaysModalVisible(false);
    } catch (error: any) {
      console.log("Error saving working days:", error);
      Alert.alert("Error", "No se pudieron actualizar los días de atención.");
    } finally {
      setSavingDays(false);
    }
  };

  const handleEditSlots = (day: string) => {
    const daySchedule = selectedDaysObj[day] || {};
    setEditingDay(day);
    setSlotOpen1(daySchedule.open_time_1 || "08:00");
    setSlotClose1(daySchedule.close_time_1 || "12:00");
    setSlotHasSecond(!!daySchedule.has_second_range);
    setSlotOpen2(daySchedule.open_time_2 || "15:30");
    setSlotClose2(daySchedule.close_time_2 || "21:00");
    setActiveView("slots");
  };

  const saveSlots = () => {
    if (!validateSlotsLocally()) {
      return;
    }

    setSelectedDaysObj((prev) => ({
      ...prev,
      [editingDay]: {
        ...prev[editingDay],
        open_time_1: slotOpen1,
        close_time_1: slotClose1,
        has_second_range: slotHasSecond,
        open_time_2: slotOpen2,
        close_time_2: slotClose2,
      },
    }));

    setActiveView("days");
  };

  const replicateSlotsToAllDays = () => {
    if (!validateSlotsLocally()) {
      return;
    }

    setSelectedDaysObj((prev) => {
      const updated = { ...prev };
      ALL_WEEKDAYS.forEach((day) => {
        updated[day] = {
          ...updated[day],
          open_time_1: slotOpen1,
          close_time_1: slotClose1,
          has_second_range: slotHasSecond,
          open_time_2: slotOpen2,
          close_time_2: slotClose2,
        };
      });
      return updated;
    });
    Alert.alert("Éxito", `Horario de ${editingDay} copiado a todos los demás días.`);
  };

  const adjustHour = (time: string, isSlot1: boolean, isOpen: boolean, increment: boolean) => {
    const [h, m] = time.split(":").map(Number);
    const newH = increment ? (h + 1) % 24 : (h - 1 + 24) % 24;
    const formatted = `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    if (isSlot1) {
      if (isOpen) setSlotOpen1(formatted);
      else setSlotClose1(formatted);
    } else {
      if (isOpen) setSlotOpen2(formatted);
      else setSlotClose2(formatted);
    }
  };

  const adjustMinutes = (time: string, isSlot1: boolean, isOpen: boolean, increment: boolean) => {
    const [h, m] = time.split(":").map(Number);
    const newM = increment ? (m + 5) % 60 : (m - 5 + 60) % 60;
    const formatted = `${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;

    if (isSlot1) {
      if (isOpen) setSlotOpen1(formatted);
      else setSlotClose1(formatted);
    } else {
      if (isOpen) setSlotOpen2(formatted);
      else setSlotClose2(formatted);
    }
  };

  const validateSlotsLocally = (): boolean => {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const startA = toMinutes(slotOpen1);
    const endA = toMinutes(slotClose1) <= startA
      ? toMinutes(slotClose1) + 24 * 60
      : toMinutes(slotClose1);

    // Check duration 1
    if (endA - startA < 5) {
      Alert.alert("Horario Inválido", "La duración del primer rango debe ser de al menos 5 minutos.");
      return false;
    }

    if (slotHasSecond) {
      const startB = toMinutes(slotOpen2);
      const endB = toMinutes(slotClose2) <= startB
        ? toMinutes(slotClose2) + 24 * 60
        : toMinutes(slotClose2);

      // Check duration 2
      if (endB - startB < 5) {
        Alert.alert("Horario Inválido", "La duración del segundo rango debe ser de al menos 5 minutos.");
        return false;
      }

      // Check overlap: max(startA, startB) < min(endA, endB)
      if (Math.max(startA, startB) < Math.min(endA, endB)) {
        Alert.alert(
          "Horarios Superpuestos",
          "Los rangos horarios de atención ingresados se superponen. Por favor, asegúrate de que no coincidan."
        );
        return false;
      }
    }

    return true;
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceName("");
    setServicePrice("");
    setServiceDuration(60); // 1 hora por defecto
    setServiceIsActive(true);
    setServiceModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    // Limpiar tarifa a string de dígitos para el input
    const cleanPrice = Math.round(Number(service.price)).toString();
    setServicePrice(cleanPrice);
    setServiceDuration(Number(service.duration_minutes));
    setServiceIsActive(!!service.is_active);
    setServiceModalVisible(true);
  };

  const handlePriceInputChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, "");
    setServicePrice(raw);
  };

  const formatPriceInput = (val: string) => {
    if (!val) return "";
    return `$ ${val.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const adjustServiceDurationHours = (increment: boolean) => {
    const hh = Math.floor(serviceDuration / 60);
    const mm = serviceDuration % 60;
    let newH = increment ? hh + 1 : hh - 1;
    if (newH < 0) newH = 0;
    if (newH > 24) newH = 24;
    const newTotal = newH * 60 + mm;
    setServiceDuration(newTotal < 5 ? 5 : newTotal);
  };

  const adjustServiceDurationMinutes = (increment: boolean) => {
    const hh = Math.floor(serviceDuration / 60);
    const mm = serviceDuration % 60;
    let newM = increment ? mm + 5 : mm - 5;
    let newH = hh;
    if (newM >= 60) {
      newM = 0;
      newH += 1;
    } else if (newM < 0) {
      newM = 55;
      newH -= 1;
    }
    if (newH < 0) {
      newH = 0;
      newM = 0;
    }
    if (newH > 24) {
      newH = 24;
      newM = 0;
    }
    const newTotal = newH * 60 + newM;
    setServiceDuration(newTotal < 5 ? 5 : newTotal);
  };

  const handleSaveService = async () => {
    if (!serviceName.trim()) {
      Alert.alert("Error", "Por favor, ingresa el título del servicio.");
      return;
    }
    if (!servicePrice.trim() || Number(servicePrice) <= 0) {
      Alert.alert("Error", "Por favor, ingresa una tarifa válida.");
      return;
    }
    if (serviceDuration < 5) {
      Alert.alert("Error", "La duración del servicio debe ser de al menos 5 minutos.");
      return;
    }

    setSavingService(true);
    try {
      const payload = {
        name: serviceName,
        price: Number(servicePrice),
        duration_minutes: serviceDuration,
        is_active: serviceIsActive,
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        Alert.alert("Éxito", "Servicio actualizado con éxito.");
      } else {
        await api.post("/services", payload);
        Alert.alert("Éxito", "Servicio creado con éxito.");
      }

      setServiceModalVisible(false);
      fetchServices();
    } catch (error: any) {
      console.log("Error saving service:", error);
      const errorMsg = error.response?.data?.message || "No se pudo guardar el servicio.";
      Alert.alert("Error", errorMsg);
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = () => {
    if (!editingService) return;

    Alert.alert(
      "Confirmación",
      `¿Estás seguro de que quieres borrar el servicio "${editingService.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            setDeletingService(true);
            try {
              await api.delete(`/services/${editingService.id}`);
              Alert.alert("Éxito", "Servicio eliminado con éxito.");
              setServiceModalVisible(false);
              fetchServices();
            } catch (error: any) {
              console.log("Error deleting service:", error);
              Alert.alert("Error", "No se pudo eliminar el servicio.");
            } finally {
              setDeletingService(false);
            }
          },
        },
      ]
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
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="design-services" size={80} color="#bccac1" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyStateText}>
                No tenés servicios cargados.{"\n"}¡Creá uno y empezá a ofrecerlos!
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceRow}
                  onPress={() => handleEditService(service)}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceDetailsContainer}>
                    {/* Line 1: Nombre */}
                    <View style={styles.serviceDetailRow}>
                      <MaterialIcons name="label" size={16} color="#00694c" style={{ marginRight: 6 }} />
                      <Text style={styles.serviceNameText}>{service.name}</Text>
                    </View>

                    {/* Line 2: Duración */}
                    <View style={[styles.serviceDetailRow, { marginTop: 4 }]}>
                      <MaterialIcons name="access-time" size={16} color="#6d7a73" style={{ marginRight: 6 }} />
                      <Text style={styles.serviceDetailText}>Duración: {formatDuration(service.duration_minutes)}</Text>
                    </View>

                    {/* Line 3: Tarifa */}
                    <View style={[styles.serviceDetailRow, { marginTop: 4 }]}>
                      <MaterialIcons name="attach-money" size={16} color="#6d7a73" style={{ marginRight: 6 }} />
                      <Text style={styles.serviceDetailText}>Tarifa: {formatPrice(service.price)}</Text>
                    </View>
                  </View>

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

      {/* Modal: Configuración de Días y Horarios de Atención */}
      <Modal
        visible={daysModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (activeView === "slots") {
            setActiveView("days");
          } else {
            setDaysModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          {activeView === "days" ? (
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccioná tus días de atención</Text>
              </View>

              {/* Modal Content (List) */}
              <ScrollView style={styles.modalScroll} bounces={false}>
                <View style={styles.daysListContainer}>
                  {ALL_WEEKDAYS.map((day, index) => {
                    const isChecked = !!selectedDaysObj[day]?.is_active;
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
          ) : (
            <View style={[styles.modalCard, { borderRadius: 20 }]}>
              {/* Modal Header */}
              <View style={styles.modalSlotsHeader}>
                <TouchableOpacity
                  style={styles.modalSlotsBackButton}
                  onPress={() => setActiveView("days")}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#00694c" />
                </TouchableOpacity>
                <Text style={styles.modalSlotsTitle}>Configurá tus horarios de atención</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Modal Content */}
              <View style={styles.modalSlotsContent}>
                <Text style={styles.modalSlotsSubtitle}>
                  Podés ofrecer hasta dos rangos de horarios para el día {editingDay}.
                </Text>

                {/* First Range Vertical Stack */}
                <View style={styles.timeRangeVerticalContainer}>
                  <View style={styles.timeInputColCentered}>
                    <Text style={styles.timeLabelCentered}>Apertura</Text>
                    <View style={styles.timeAdjustmentBoxCentered}>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustHour(slotOpen1, true, true, false)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="remove" size={16} color="#00694c" />
                      </TouchableOpacity>
                      <Text style={styles.timeNumberText}>{slotOpen1.split(":")[0]}</Text>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustHour(slotOpen1, true, true, true)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="add" size={16} color="#00694c" />
                      </TouchableOpacity>

                      <Text style={styles.colonText}>:</Text>

                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustMinutes(slotOpen1, true, true, false)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="remove" size={16} color="#00694c" />
                      </TouchableOpacity>
                      <Text style={styles.timeNumberText}>{slotOpen1.split(":")[1]}</Text>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustMinutes(slotOpen1, true, true, true)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="add" size={16} color="#00694c" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.timeInputColCentered}>
                    <Text style={styles.timeLabelCentered}>Cierre</Text>
                    <View style={styles.timeAdjustmentBoxCentered}>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustHour(slotClose1, true, false, false)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="remove" size={16} color="#00694c" />
                      </TouchableOpacity>
                      <Text style={styles.timeNumberText}>{slotClose1.split(":")[0]}</Text>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustHour(slotClose1, true, false, true)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="add" size={16} color="#00694c" />
                      </TouchableOpacity>

                      <Text style={styles.colonText}>:</Text>

                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustMinutes(slotClose1, true, false, false)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="remove" size={16} color="#00694c" />
                      </TouchableOpacity>
                      <Text style={styles.timeNumberText}>{slotClose1.split(":")[1]}</Text>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => adjustMinutes(slotClose1, true, false, true)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="add" size={16} color="#00694c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Second Range Header w/ Toggle */}
                <View style={styles.secondRangeToggleRow}>
                  <Text style={styles.secondRangeLabel}>Segundo rango (opcional)</Text>
                  <TouchableOpacity
                    style={[
                      styles.smallSwitchContainer,
                      slotHasSecond ? styles.switchActiveBg : styles.switchInactiveBg,
                    ]}
                    onPress={() => setSlotHasSecond(!slotHasSecond)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.smallSwitchThumb,
                        slotHasSecond ? styles.smallSwitchThumbActive : styles.smallSwitchThumbInactive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Second Range Vertical Stack */}
                {slotHasSecond && (
                  <View style={styles.timeRangeVerticalContainer}>
                    <View style={styles.timeInputColCentered}>
                      <Text style={styles.timeLabelCentered}>Apertura</Text>
                      <View style={styles.timeAdjustmentBoxCentered}>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustHour(slotOpen2, false, true, false)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="remove" size={16} color="#00694c" />
                        </TouchableOpacity>
                        <Text style={styles.timeNumberText}>{slotOpen2.split(":")[0]}</Text>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustHour(slotOpen2, false, true, true)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="add" size={16} color="#00694c" />
                        </TouchableOpacity>

                        <Text style={styles.colonText}>:</Text>

                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustMinutes(slotOpen2, false, true, false)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="remove" size={16} color="#00694c" />
                        </TouchableOpacity>
                        <Text style={styles.timeNumberText}>{slotOpen2.split(":")[1]}</Text>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustMinutes(slotOpen2, false, true, true)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="add" size={16} color="#00694c" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.timeInputColCentered}>
                      <Text style={styles.timeLabelCentered}>Cierre</Text>
                      <View style={styles.timeAdjustmentBoxCentered}>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustHour(slotClose2, false, false, false)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="remove" size={16} color="#00694c" />
                        </TouchableOpacity>
                        <Text style={styles.timeNumberText}>{slotClose2.split(":")[0]}</Text>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustHour(slotClose2, false, false, true)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="add" size={16} color="#00694c" />
                        </TouchableOpacity>

                        <Text style={styles.colonText}>:</Text>

                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustMinutes(slotClose2, false, false, false)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="remove" size={16} color="#00694c" />
                        </TouchableOpacity>
                        <Text style={styles.timeNumberText}>{slotClose2.split(":")[1]}</Text>
                        <TouchableOpacity
                          style={styles.adjustBtn}
                          onPress={() => adjustMinutes(slotClose2, false, false, true)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="add" size={16} color="#00694c" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Replicate Button */}
                <TouchableOpacity
                  style={styles.replicateBtn}
                  onPress={replicateSlotsToAllDays}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="content-copy" size={16} color="#00694c" style={{ marginRight: 8 }} />
                  <Text style={styles.replicateBtnText}>Replicar estos horarios a todos los días</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Footer */}
              <View style={[styles.modalFooterRow, { paddingTop: 0 }]}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#00694c" }]}
                  onPress={saveSlots}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal: Gestión de Servicios (Crear/Editar/Borrar) */}
      <Modal
        visible={serviceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderRadius: 20, padding: 24, maxHeight: "90%" }]}>
            {/* Modal Header */}
            <View style={[styles.modalSlotsHeader, { borderBottomWidth: 0, height: 40 }]}>
              <TouchableOpacity
                style={styles.modalSlotsBackButton}
                onPress={() => setServiceModalVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={24} color="#00694c" />
              </TouchableOpacity>
              <Text style={styles.modalSlotsTitle}>
                {editingService ? "Editar servicio" : "Crear servicio"}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 24 }} contentContainerStyle={{ gap: 20 }}>
              {/* Título del servicio */}
              <View style={styles.fieldCol}>
                <Text style={styles.timeLabel}>Título del servicio</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={serviceName}
                    onChangeText={(val) => {
                      if (val.length <= 20) setServiceName(val);
                    }}
                    placeholder="Ej. Corte y Barba"
                    placeholderTextColor="#6d7a73"
                  />
                  <Text style={styles.charCounter}>{serviceName.length}/20</Text>
                </View>
              </View>

              {/* Tarifa del servicio */}
              <View style={styles.fieldCol}>
                <Text style={styles.timeLabel}>Tarifa del servicio</Text>
                <TextInput
                  style={styles.textInputFull}
                  value={formatPriceInput(servicePrice)}
                  onChangeText={handlePriceInputChange}
                  placeholder="$ 0"
                  placeholderTextColor="#6d7a73"
                  keyboardType="numeric"
                />
              </View>

              {/* Tiempo de bloqueo */}
              <View style={styles.timeInputColCentered}>
                <Text style={styles.timeLabelCentered}>Tiempo de bloqueo</Text>
                <View style={styles.timeAdjustmentBoxCentered}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => adjustServiceDurationHours(false)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={16} color="#00694c" />
                  </TouchableOpacity>
                  <Text style={styles.timeNumberText}>
                    {String(Math.floor(serviceDuration / 60)).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => adjustServiceDurationHours(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={16} color="#00694c" />
                  </TouchableOpacity>

                  <Text style={styles.colonText}>:</Text>

                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => adjustServiceDurationMinutes(false)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={16} color="#00694c" />
                  </TouchableOpacity>
                  <Text style={styles.timeNumberText}>
                    {String(serviceDuration % 60).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => adjustServiceDurationMinutes(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={16} color="#00694c" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Servicio disponible Toggle */}
              <View style={styles.secondRangeToggleRow}>
                <Text style={styles.secondRangeLabel}>Servicio disponible</Text>
                <TouchableOpacity
                  style={[
                    styles.smallSwitchContainer,
                    serviceIsActive ? styles.switchActiveBg : styles.switchInactiveBg,
                  ]}
                  onPress={() => setServiceIsActive(!serviceIsActive)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.smallSwitchThumb,
                      serviceIsActive ? styles.smallSwitchThumbActive : styles.smallSwitchThumbInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={[styles.modalFooterRow, { paddingHorizontal: 0, marginTop: 12 }]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setServiceModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#00694c" }]}
                  onPress={handleSaveService}
                  activeOpacity={0.8}
                  disabled={savingService}
                >
                  {savingService ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Delete Button (only if editing) */}
              {editingService && (
                <View style={styles.deleteBtnRow}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteService}
                    activeOpacity={0.8}
                    disabled={deletingService}
                  >
                    {deletingService ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="delete" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.deleteBtnText}>Borrar servicio</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  serviceDetailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  serviceDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  serviceDetailText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#3d4943",
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
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    width: "100%",
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6d7a73",
    textAlign: "center",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
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
  // Modal Slots Header Styles
  modalSlotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e3e1",
  },
  modalSlotsBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  modalSlotsTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    flex: 1,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  modalSlotsContent: {
    padding: 24,
    gap: 24,
  },
  modalSlotsSubtitle: {
    fontSize: 14,
    color: "#3d4943",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  // Time Selector Styles
  timeRangeVerticalContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  timeInputColCentered: {
    alignItems: "center",
    width: "100%",
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3d4943",
    marginBottom: 6,
    textAlign: "left",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  timeLabelCentered: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3d4943",
    marginBottom: 6,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  timeAdjustmentBoxCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    width: 220,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f4f2",
  },
  timeNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#181c1c",
    marginHorizontal: 6,
    width: 24,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  colonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3d4943",
    marginHorizontal: 4,
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
    width: "100%",
  },
  secondRangeLabel: {
    fontSize: 14,
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
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
  smallSwitchThumbActive: {
    alignSelf: "flex-end",
  },
  smallSwitchThumbInactive: {
    alignSelf: "flex-start",
  },
  switchActiveBg: {
    backgroundColor: "#00694c",
  },
  switchInactiveBg: {
    backgroundColor: "#d7dbd9",
  },
  replicateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#00694c",
    borderRadius: 12,
    height: 48,
    width: "100%",
    marginTop: 12,
    backgroundColor: "#f4fffa",
  },
  replicateBtnText: {
    color: "#00694c",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  // Service Modal Specific Styles
  fieldCol: {
    flexDirection: "column",
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#181c1c",
    padding: 0, // Reset default Android paddings
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  charCounter: {
    fontSize: 11,
    color: "#6d7a73",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  textInputFull: {
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  deleteBtnRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#e0e3e1",
    paddingTop: 16,
    marginTop: 4,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ba1a1a",
    borderRadius: 12,
    height: 48,
    width: "100%",
  },
  deleteBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
});
