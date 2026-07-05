import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";

const SPANISH_DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function BloquearSlot() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dateStr: initialDateStr } = route.params || {};

  // Form states
  const [dateStr, setDateStr] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);

  // Client states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Loading and profile states
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<any | null>(null);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const today = new Date();
    let initialDate = initialDateStr;
    if (!initialDate) {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      initialDate = `${year}-${month}-${day}`;
    }

    setDateStr(initialDate);
    const parts = initialDate.split("-");
    setCalendarDate(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));

    loadProfessionalAndServices(initialDate);
  }, []);

  const loadProfessionalAndServices = async (dateParam: string) => {
    try {
      setLoading(true);
      const profileRes = await api.get("/profile");
      const profProfile = profileRes.data.user.professional_profile;
      setProfessional(profProfile);

      const servicesRes = await api.get(`/professionals/${profProfile.id}/services`);
      setServices(servicesRes.data || []);
      if (servicesRes.data.length > 0) {
        setSelectedService(servicesRes.data[0]);
      }

      await fetchBusySlots(profProfile.id, dateParam);
    } catch (error) {
      console.error("Error loading professional details/services:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusySlots = async (profileId: number, targetDateStr: string) => {
    try {
      const response = await api.get(`/professionals/${profileId}/busy-slots`, {
        params: { date: targetDateStr },
      });
      setBusySlots(response.data || []);
    } catch (error) {
      console.error("Error fetching busy slots:", error);
    }
  };

  useEffect(() => {
    if (professional?.id && dateStr) {
      fetchBusySlots(professional.id, dateStr);
    }
  }, [dateStr, professional?.id]);

  const handlePrevMonth = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    setCalendarDate(new Date(y, m - 1, 1));
  };

  const handleNextMonth = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    setCalendarDate(new Date(y, m + 1, 1));
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    return (
      calendarDate.getFullYear() <= today.getFullYear() &&
      calendarDate.getMonth() <= today.getMonth()
    );
  };

  const normalizeDay = (day: string) => {
    return day
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const isDayWorking = (date: Date) => {
    if (!professional?.working_days) {
      return false;
    }

    let workingDays = professional.working_days;
    if (typeof workingDays === 'string') {
      try {
        workingDays = JSON.parse(workingDays);
      } catch (e) {
        workingDays = workingDays.split(',').map((s: string) => s.trim());
      }
    }

    const dayName = SPANISH_DAY_NAMES[date.getDay()];

    if (Array.isArray(workingDays)) {
      const normalizedDayName = normalizeDay(dayName);
      return workingDays.some(
        (workDay: string) => normalizeDay(workDay) === normalizedDayName
      );
    }

    if (typeof workingDays === 'object' && workingDays !== null) {
      const normalizedDayName = normalizeDay(dayName);
      const matchedKey = Object.keys(workingDays).find(
        (key) => normalizeDay(key) === normalizedDayName
      );
      if (matchedKey) {
        return !!workingDays[matchedKey]?.is_active;
      }
    }

    return false;
  };

  useEffect(() => {
    if (!dateStr || !selectedService || !professional) {
      setAvailableSlots([]);
      return;
    }

    const parts = dateStr.split("-");
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    if (!isDayWorking(dateObj)) {
      setAvailableSlots([]);
      return;
    }

    let workingDays = professional.working_days;
    if (typeof workingDays === 'string') {
      try {
        workingDays = JSON.parse(workingDays);
      } catch (e) {}
    }

    const dayName = SPANISH_DAY_NAMES[dateObj.getDay()];
    const normalizedDayName = normalizeDay(dayName);

    let open1 = professional?.open_time_1 || "08:00";
    let close1 = professional?.close_time_1 || "12:00";
    let hasSecond = professional?.has_second_range || false;
    let open2 = professional?.open_time_2 || "15:30";
    let close2 = professional?.close_time_2 || "21:00";

    if (typeof workingDays === 'object' && workingDays !== null && !Array.isArray(workingDays)) {
      const matchedKey = Object.keys(workingDays).find(
        (key) => normalizeDay(key) === normalizedDayName
      );
      if (matchedKey) {
        const daySchedule = workingDays[matchedKey];
        open1 = daySchedule.open_time_1 || open1;
        close1 = daySchedule.close_time_1 || close1;
        hasSecond = !!daySchedule.has_second_range;
        open2 = daySchedule.open_time_2 || open2;
        close2 = daySchedule.close_time_2 || close2;
      }
    }

    const slots: string[] = [];

    const addSlotsForRange = (startStr: string, endStr: string) => {
      const [startHour, startMin] = startStr.split(":").map(Number);
      const [endHour, endMin] = endStr.split(":").map(Number);

      let currentMin = startHour * 60 + startMin;
      const endLimit = endHour * 60 + endMin;

      while (currentMin + selectedService.duration_minutes <= endLimit) {
        const hour = Math.floor(currentMin / 60);
        const min = currentMin % 60;
        const timeString = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        slots.push(timeString);
        currentMin += 30;
      }
    };

    addSlotsForRange(open1, close1);
    if (hasSecond) {
      addSlotsForRange(open2, close2);
    }

    const toMin = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const duration = selectedService.duration_minutes;

    const filteredSlots = slots.filter((slot) => {
      const slotStart = toMin(slot);
      const slotEnd = slotStart + duration;

      return !busySlots.some((busy) => {
        const busyStart = toMin(busy.start_time.substring(0, 5));
        const busyEnd = toMin(busy.end_time.substring(0, 5));
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });

    setAvailableSlots(filteredSlots);
    
    if (filteredSlots.length > 0) {
      if (!selectedTimeSlot || !filteredSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(filteredSlots[0]);
      }
    } else {
      setSelectedTimeSlot(null);
    }

  }, [dateStr, selectedService, professional, busySlots]);

  const handleBlockSlot = async () => {
    if (buttonState !== "idle") return;

    if (!selectedService) {
      Alert.alert("Error", "Debes seleccionar un servicio.");
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert("Error", "Debes seleccionar un horario.");
      return;
    }

    if (!dateStr) {
      Alert.alert("Error", "Debes seleccionar una fecha.");
      return;
    }

    setButtonState("loading");

    try {
      const notesContent = `Cliente externo: ${firstName} ${lastName}\nF. Nac: ${birthDate}\nTel: ${phone}\nDomicilio: ${address}`;

      await api.post("/appointments", {
        professional_profile_id: professional.id,
        service_id: selectedService.id,
        date: dateStr,
        start_time: selectedTimeSlot,
        notes: notesContent.trim(),
      });

      setButtonState("done");

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      console.error("Error blocking slot:", error);
      const msg = error.response?.data?.message || "No se pudo bloquear el slot. Verifica que no se solape con otro turno.";
      Alert.alert("Error", msg);
      setButtonState("idle");
    }
  };

  const renderCalendarDays = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(y, m, 1).getDay();

    const days = [];

    // Placeholders for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-prev-${i}`} style={styles.calendarDayCellEmpty} />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(y, m, day);
      const isPast = cellDate < today;

      const cellDateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = dateStr === cellDateStr;

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDayCellSelected,
            isPast && styles.calendarDayCellDisabled,
          ]}
          disabled={isPast}
          onPress={() => {
            setDateStr(cellDateStr);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isPast && styles.calendarDayTextDisabled,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    // Placeholders for next month
    const totalCells = firstDayIndex + daysInMonth;
    const remainder = totalCells % 7;
    const cellsNeededAtEnd = remainder === 0 ? 0 : 7 - remainder;
    for (let i = 0; i < cellsNeededAtEnd; i++) {
      days.push(<View key={`empty-next-${i}`} style={styles.calendarDayCellEmpty} />);
    }

    return days;
  };

  const renderButtonContent = () => {
    switch (buttonState) {
      case "loading":
        return (
          <View style={styles.buttonContentRow}>
            <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
            <Text style={styles.blockButtonText}>Procesando...</Text>
          </View>
        );
      case "done":
        return (
          <View style={styles.buttonContentRow}>
            <MaterialIcons name="check-circle" size={20} color="#ffffff" />
            <Text style={styles.blockButtonText}>Slot bloqueado</Text>
          </View>
        );
      default:
        return (
          <View style={styles.buttonContentRow}>
            <MaterialIcons name="block" size={20} color="#ffffff" />
            <Text style={styles.blockButtonText}>Bloquear Slot</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#00694c" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00694c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bloquear slot de horario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Section 1: Appointment Details */}
        <View style={styles.formSection}>
          
          {/* Fecha del turno - Calendario Inline */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha del turno</Text>
            <View style={styles.calendarContainer}>
              {/* Month navigation */}
              <View style={styles.calendarHeaderRow}>
                <TouchableOpacity
                  style={[styles.calendarNavButton, isPrevMonthDisabled() && styles.calendarNavButtonDisabled]}
                  onPress={handlePrevMonth}
                  disabled={isPrevMonthDisabled()}
                >
                  <MaterialIcons name="chevron-left" size={24} color={isPrevMonthDisabled() ? "#bccac1" : "#3d4943"} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </Text>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={handleNextMonth}
                >
                  <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
                </TouchableOpacity>
              </View>

              {/* Days Header */}
              <View style={styles.calendarDaysHeader}>
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                  <Text key={d} style={styles.calendarDayHeaderLabel}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.calendarDaysGrid}>
                {renderCalendarDays()}
              </View>
            </View>
          </View>

          {/* Servicio */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Servicio</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => {
                setIsServiceOpen(!isServiceOpen);
                setIsTimeSlotOpen(false);
              }}
            >
              <Text style={styles.dropdownValue}>
                {selectedService ? `${selectedService.name} - ${selectedService.duration_minutes} min ($${selectedService.price})` : "Seleccionar servicio"}
              </Text>
              <MaterialIcons name="expand-more" size={24} color="#3d4943" />
            </TouchableOpacity>
            {isServiceOpen && (
              <View style={styles.dropdownOptions}>
                {services.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedService(item);
                      setIsServiceOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedService?.id === item.id && styles.optionTextSelected,
                      ]}
                    >
                      {item.name} - {item.duration_minutes} min (${item.price})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Horarios disponibles */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Horarios disponibles según duración del turno</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => {
                setIsTimeSlotOpen(!isTimeSlotOpen);
                setIsServiceOpen(false);
              }}
            >
              <Text style={styles.dropdownValue}>
                {selectedTimeSlot ? `${selectedTimeSlot} hs` : "No hay horarios disponibles"}
              </Text>
              <MaterialIcons name="expand-more" size={24} color="#3d4943" />
            </TouchableOpacity>
            {isTimeSlotOpen && availableSlots.length > 0 && (
              <View style={styles.dropdownOptions}>
                {availableSlots.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedTimeSlot(item);
                      setIsTimeSlotOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedTimeSlot === item && styles.optionTextSelected,
                      ]}
                    >
                      {item} hs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section Divider / Title */}
        <Text style={styles.sectionTitle}>Datos del cliente (Externo)</Text>

        {/* Form Section 2: Client Data */}
        <View style={styles.formSection}>
          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre(s)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor="#bccac1"
              />
            </View>
          </View>

          {/* Apellido */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Apellido(s)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
                placeholderTextColor="#bccac1"
              />
            </View>
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.textInput, !birthDate && { color: "#bccac1" }, { lineHeight: 48 }]}>
                {birthDate || "DD / MM / AAAA"}
              </Text>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color="#3d4943"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Teléfono */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Número de Teléfono"
                placeholderTextColor="#bccac1"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Domicilio */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Domicilio</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Dirección"
                placeholderTextColor="#bccac1"
              />
              <MaterialIcons
                name="location-on"
                size={20}
                color="#3d4943"
                style={styles.inputIcon}
              />
            </View>
          </View>
        </View>

        {/* Visual Placeholder for context */}
        <View style={styles.placeholderCard}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo8tTWzcCsC88_L15Np_NDrcR-c7R6c91zCJR6nvf1g5bvhyo35oiOQlVRidOk2K2CkPMNb7Id8Igi2tINx06df9c5wq8o7nf52u5IoXmXcjCjamkE5r3lweOq0E-K7wdANhBvJLwR1p1FQCkp4-qqxTDRxdmxp5Hienlx7VZ2cBWWTXZ70yV6YBSn0CY1mg-l_ZseaopFQYgMJnNI5Z1MD6rG-RgYXbraysS_rXlQAA3q_3_QH1-DpoTNKp1rKrLNZILA6oLc2w",
            }}
            style={styles.placeholderImage}
          />
          <View style={styles.placeholderTextContainer}>
            <Text style={styles.placeholderTitle}>Confirmación de bloqueo</Text>
            <Text style={styles.placeholderDescription}>
              Este horario no estará disponible para otros clientes una vez bloqueado.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Bottom Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.blockButton,
            buttonState === "done" && styles.blockButtonDone,
          ]}
          activeOpacity={0.9}
          onPress={handleBlockSlot}
          disabled={buttonState !== "idle" || !selectedTimeSlot}
        >
          {renderButtonContent()}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal for Birth Date */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const selectDate = birthDateObj || new Date(new Date().setFullYear(new Date().getFullYear() - 18));
                    setBirthDateObj(selectDate);
                    const day = String(selectDate.getDate()).padStart(2, "0");
                    const month = String(selectDate.getMonth() + 1).padStart(2, "0");
                    const year = selectDate.getFullYear();
                    setBirthDate(`${day} / ${month} / ${year}`);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.iosModalConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={
                  birthDateObj ||
                  new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                }
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  if (date) setBirthDateObj(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={
              birthDateObj ||
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
            }
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setBirthDateObj(date);
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                setBirthDate(`${day} / ${month} / ${year}`);
              }
            }}
          />
        )
      )}
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#181c1c",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    height: 48,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#181c1c",
  },
  inputIcon: {
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    height: 48,
    paddingHorizontal: 16,
  },
  dropdownValue: {
    fontSize: 14,
    color: "#181c1c",
  },
  dropdownOptions: {
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginTop: 4,
    overflow: "hidden",
  },
  optionItem: {
    paddingHorizontal: 16,
    justifyContent: "center",
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f2",
  },
  optionText: {
    fontSize: 14,
    color: "#3d4943",
  },
  optionTextSelected: {
    fontWeight: "600",
    color: "#00694c",
  },
  placeholderCard: {
    backgroundColor: "#f1f4f2",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  placeholderTextContainer: {
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181c1c",
    marginBottom: 4,
  },
  placeholderDescription: {
    fontSize: 13,
    color: "#3d4943",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(247, 250, 248, 0.95)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 233, 231, 0.5)",
  },
  blockButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#00694c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00694c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  blockButtonDone: {
    backgroundColor: "#2f6d5d",
    shadowColor: "#2f6d5d",
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonSpinner: {
    marginRight: 4,
  },
  blockButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  calendarContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    padding: 12,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarNavButtonDisabled: {
    opacity: 0.35,
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181c1c",
  },
  calendarDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarDayHeaderLabel: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#707d76",
  },
  calendarDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: "12%",
    marginHorizontal: "1.14%",
    marginVertical: 2,
    aspectRatio: 1,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayCellEmpty: {
    width: "14.28%",
    aspectRatio: 1,
  },
  calendarDayCellSelected: {
    backgroundColor: "#00694c",
  },
  calendarDayCellDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#181c1c",
  },
  calendarDayTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  calendarDayTextDisabled: {
    color: "#707d76",
  },
  // iOS Modal Styles
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  iosModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  iosModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7F6",
  },
  iosModalCancelText: {
    fontSize: 16,
    color: "#5D6B68",
    fontWeight: "500",
  },
  iosModalConfirmText: {
    fontSize: 16,
    color: "#00694c",
    fontWeight: "bold",
  },
});
