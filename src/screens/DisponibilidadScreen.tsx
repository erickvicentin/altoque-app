import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../services/api";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const SPANISH_DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function DisponibilidadScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { professional } = route.params || {};

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Time Slots States
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (professional?.id) {
      fetchServices();
    }
  }, [professional]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedService]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const profileId = professional.professional_profile_id || professional.id;
      const response = await api.get(`/professionals/${profileId}/services`);
      setServices(response.data);
      if (response.data.length > 0) {
        setSelectedService(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios del profesional.");
    } finally {
      setLoadingServices(false);
    }
  };

  // Normalize helper to compare spanish working days correctly
  const normalizeDay = (day: string) => {
    return day
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Check if professional works on this specific date
  const isDayWorking = (date: Date) => {
    // Check if in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }

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

    // Case 1: working_days is an array of strings
    if (Array.isArray(workingDays)) {
      const normalizedDayName = normalizeDay(dayName);
      return workingDays.some(
        (workDay: string) => normalizeDay(workDay) === normalizedDayName
      );
    }

    // Case 2: working_days is a key-value object (e.g. {"Lunes": { "is_active": true, ... }})
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

  // Generate simulated time slots based on professional working hours and selected service
  const generateTimeSlots = () => {
    if (!selectedDate || !selectedService) return;

    let workingDays = professional.working_days;
    if (typeof workingDays === 'string') {
      try {
        workingDays = JSON.parse(workingDays);
      } catch (e) {}
    }

    const dayName = SPANISH_DAY_NAMES[selectedDate.getDay()];
    const normalizedDayName = normalizeDay(dayName);

    let open1 = professional?.open_time_1 || "08:00";
    let close1 = professional?.close_time_1 || "12:00";
    let hasSecond = professional?.has_second_range || false;
    let open2 = professional?.open_time_2 || "15:30";
    let close2 = professional?.close_time_2 || "21:00";

    // If working_days is an object with daily schedules, use the custom daily hours!
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

      // Slot interval is 30 minutes
      while (currentMin + selectedService.duration_minutes <= endLimit) {
        const hour = Math.floor(currentMin / 60);
        const min = currentMin % 60;
        const timeString = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")} hs`;
        slots.push(timeString);
        currentMin += 30; // 30 min steps
      }
    };

    addSlotsForRange(open1, close1);
    if (hasSecond) {
      addSlotsForRange(open2, close2);
    }

    setAvailableSlots(slots);
    setSelectedSlot(null); // Reset selected slot
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar rendering helper
  const renderCalendarDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];

    // Render placeholders for days of previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-prev-${i}`} style={styles.calendarDayPlaceholder} />);
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isWorking = isDayWorking(date);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;

      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDayButton,
            !isWorking && styles.disabledDayButton
          ]}
          disabled={!isWorking}
          onPress={() => setSelectedDate(date)}
        >
          <View style={[
            styles.dayInnerCircle,
            isToday && styles.todayDayCircle,
            isSelected && styles.selectedDayCircle,
          ]}>
            <Text
              style={[
                styles.calendarDayText,
                isToday && styles.todayDayText,
                isSelected && styles.selectedDayText,
                !isWorking && styles.disabledDayText
              ]}
            >
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Render placeholders for days of next month to complete the row
    const totalCells = firstDayIndex + daysInMonth;
    const remainder = totalCells % 7;
    const cellsNeededAtEnd = remainder === 0 ? 0 : 7 - remainder;
    for (let i = 0; i < cellsNeededAtEnd; i++) {
      days.push(<View key={`empty-next-${i}`} style={styles.calendarDayPlaceholder} />);
    }

    return days;
  };

  const handleContinue = () => {
    if (!selectedDate) {
      Alert.alert("Falta información", "Por favor, elegí un día del calendario.");
      return;
    }
    if (!selectedService) {
      Alert.alert("Falta información", "Por favor, seleccioná un servicio.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Falta información", "Por favor, elegí un horario disponible.");
      return;
    }

    navigation.navigate("ConfirmarReserva", {
      professional,
      selectedService,
      selectedDate: selectedDate.toISOString(),
      selectedSlot
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#008560" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Disponibilidad - {professional?.name || "Profesional"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Section */}
        <View style={styles.sectionCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
              <Feather name="chevron-left" size={20} color="#3d4943" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
              <Feather name="chevron-right" size={20} color="#3d4943" />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdaysContainer}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {renderCalendarDays()}
          </View>

          {/* Key / Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: "#adedd8", borderWidth: 1, borderColor: "#bccac1" }]} />
              <Text style={styles.legendText}>Hoy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: "#00694c" }]} />
              <Text style={styles.legendText}>Seleccionado</Text>
            </View>
          </View>
        </View>

        {/* Service Select Section */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Elegir Servicio</Text>
          {loadingServices ? (
            <ActivityIndicator size="small" color="#008560" style={{ padding: 12 }} />
          ) : services.length === 0 ? (
            <View style={styles.noServicesCard}>
              <Text style={styles.noServicesText}>Este profesional no tiene servicios configurados.</Text>
            </View>
          ) : (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.dropdownHeaderTitle}>
                    {selectedService ? selectedService.name : "Seleccioná un servicio"}
                  </Text>
                  {selectedService && (
                    <Text style={styles.dropdownHeaderSubtitle}>
                      {selectedService.duration_minutes} min • ${Math.round(selectedService.price)}
                    </Text>
                  )}
                </View>
                <Feather
                  name={servicesDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#707d76"
                />
              </TouchableOpacity>

              {servicesDropdownOpen && (
                <View style={styles.dropdownList}>
                  {services.map((item) => {
                    const isSelected = selectedService?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedService(item);
                          setServicesDropdownOpen(false);
                        }}
                      >
                        <View>
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                            {item.name}
                          </Text>
                          <Text style={styles.dropdownItemMeta}>
                            Duración: {item.duration_minutes} min • Precio: ${Math.round(item.price)}
                          </Text>
                        </View>
                        {isSelected && (
                          <Feather name="check" size={18} color="#00694c" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Time Selection Section */}
        {selectedDate && (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Horarios disponibles</Text>
            {availableSlots.length === 0 ? (
              <View style={styles.noServicesCard}>
                <Text style={styles.noServicesText}>
                  No hay horarios disponibles para el servicio de {selectedService?.duration_minutes} min en este día.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotChip,
                        isSelected && styles.selectedSlotChip
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotChipText, isSelected && styles.selectedSlotChipText]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <Text style={styles.disclaimerText}>
          Los precios son estimativos y pueden variar dependiendo del profesional en el local.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleContinue}>
          <Text style={styles.confirmButtonText}>Continuar a detalles del turno</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7faf8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e9e7',
    backgroundColor: '#f7faf8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181c1c',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6e9e7',
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f4f2',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181c1c',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#707d76',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#e6e9e7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  calendarDayPlaceholder: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#e6e9e7',
    backgroundColor: '#fafcfb',
  },
  calendarDayButton: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#e6e9e7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  dayInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayDayCircle: {
    backgroundColor: '#adedd8',
    borderWidth: 1,
    borderColor: '#bccac1',
  },
  selectedDayCircle: {
    backgroundColor: '#00694c',
  },
  disabledDayButton: {
    opacity: 0.25,
    backgroundColor: '#f7faf8',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#181c1c',
  },
  todayDayText: {
    color: '#181c1c',
    fontWeight: '700',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledDayText: {
    color: '#a0afab',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e6e9e7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#707d76',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#707d76',
    marginBottom: 10,
    marginLeft: 4,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
  },
  dropdownHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#181c1c',
  },
  dropdownHeaderSubtitle: {
    fontSize: 12,
    color: '#707d76',
    marginTop: 2,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
    borderRadius: 12,
    marginTop: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f4f2',
  },
  dropdownItemActive: {
    backgroundColor: '#f4fffa',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181c1c',
  },
  dropdownItemTextActive: {
    color: '#00694c',
    fontWeight: '700',
  },
  dropdownItemMeta: {
    fontSize: 12,
    color: '#707d76',
    marginTop: 2,
  },
  noServicesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e9e7',
    padding: 16,
    alignItems: 'center',
  },
  noServicesText: {
    fontSize: 14,
    color: '#707d76',
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingLeft: 4,
  },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
    width: '30%',
    alignItems: 'center',
  },
  selectedSlotChip: {
    backgroundColor: '#00694c',
    borderColor: '#00694c',
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#181c1c',
  },
  selectedSlotChipText: {
    color: '#ffffff',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#707d76',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e6e9e7',
    padding: 16,
  },
  confirmButton: {
    backgroundColor: '#00694c',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
