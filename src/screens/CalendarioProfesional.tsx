import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const SPANISH_DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function CalendarioProfesional() {
  const navigation = useNavigation<any>();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [professional, setProfessional] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get("/profile");
      setProfessional(profileRes.data.user.professional_profile);

      const appointmentsRes = await api.get("/appointments");
      setAppointments(appointmentsRes.data || []);
    } catch (error) {
      console.error("Error loading professional calendar data:", error);
      Alert.alert("Error", "No se pudo cargar la información del calendario.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
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

  const getDayStatus = (date: Date): "available" | "unavailable" => {
    if (!isDayWorking(date)) {
      return "unavailable";
    }

    if (!professional) return "unavailable";

    let workingDays = professional.working_days;
    if (typeof workingDays === 'string') {
      try {
        workingDays = JSON.parse(workingDays);
      } catch (e) {}
    }

    const dayName = SPANISH_DAY_NAMES[date.getDay()];
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

    const getMinutes = (timeStr: string) => {
      const parts = timeStr.split(":");
      return Number(parts[0]) * 60 + Number(parts[1]);
    };

    const range1Start = getMinutes(open1);
    const range1End = getMinutes(close1);
    const range2Start = getMinutes(open2);
    const range2End = getMinutes(close2);

    // Generate 30-minute intervals for this day's schedule
    const intervals: [number, number][] = [];
    
    let curr = range1Start;
    while (curr + 30 <= range1End) {
      intervals.push([curr, curr + 30]);
      curr += 30;
    }

    if (hasSecond) {
      curr = range2Start;
      while (curr + 30 <= range2End) {
        intervals.push([curr, curr + 30]);
        curr += 30;
      }
    }

    if (intervals.length === 0) {
      return "unavailable";
    }

    // Get appointments on this date
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${yearStr}-${monthStr}-${dayStr}`;

    const dayApps = appointments.filter((app) => {
      return (
        app.date === formattedDate &&
        (app.status === "accepted" ||
          app.status === "pending" ||
          app.status === "blocked")
      );
    });

    const appRanges = dayApps.map((app) => {
      const startClean = app.start_time.substring(0, 5);
      const endClean = app.end_time.substring(0, 5);
      return [getMinutes(startClean), getMinutes(endClean)];
    });

    // Check if there's at least one 30-minute interval that is free
    const hasFreeInterval = intervals.some(([iStart, iEnd]) => {
      return !appRanges.some(([aStart, aEnd]) => iStart < aEnd && iEnd > aStart);
    });

    return hasFreeInterval ? "available" : "unavailable";
  };

  const handleDayPress = (date: Date) => {
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    navigation.navigate("DailyAppointments", { dateStr });
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];

    // Render placeholders for days of previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-prev-${i}`} style={styles.dayCellEmpty} />);
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = getDayStatus(date);

      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = date < today;

      const cellBgStyle = isPast
        ? styles.dayCellPast
        : status === "available"
        ? styles.dayCellAvailable
        : styles.dayCellUnavailable;

      const cellTextStyle = isPast
        ? styles.dayTextPast
        : status === "available"
        ? styles.dayTextAvailable
        : styles.dayTextUnavailable;

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            cellBgStyle,
            isToday && styles.dayCellToday,
          ]}
          onPress={() => handleDayPress(date)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dayText, cellTextStyle, isToday && styles.dayTextToday]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    // Render placeholders for days of next month to complete the row
    const totalCells = firstDayIndex + daysInMonth;
    const remainder = totalCells % 7;
    const cellsNeededAtEnd = remainder === 0 ? 0 : 7 - remainder;
    for (let i = 0; i < cellsNeededAtEnd; i++) {
      days.push(<View key={`empty-next-${i}`} style={styles.dayCellEmpty} />);
    }

    return days;
  };

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
        <Text style={styles.headerTitle}>Calendario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthNavButton} activeOpacity={0.7} onPress={handlePrevMonth}>
            <MaterialIcons name="chevron-left" size={24} color="#3d4943" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity style={styles.monthNavButton} activeOpacity={0.7} onPress={handleNextMonth}>
            <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 40, marginBottom: 40 }} />
        ) : (
          /* Calendar Widget */
          <View style={styles.calendarWidget}>
            {/* Days Header */}
            <View style={styles.daysHeader}>
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dayName) => (
                <Text key={dayName} style={styles.dayHeaderLabel}>
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {renderCalendarDays()}
            </View>
          </View>
        )}

        {/* Legend Section */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicatorBg, { backgroundColor: "#adedd8" }]}>
              <View style={[styles.legendIndicatorDot, { backgroundColor: "#00694c" }]} />
            </View>
            <Text style={styles.legendText}>Con turnos disponibles</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendIndicatorBg, { backgroundColor: "#ffdad6" }]}>
              <View style={[styles.legendIndicatorDot, { backgroundColor: "#ba1a1a" }]} />
            </View>
            <Text style={styles.legendText}>Sin turnos disponibles o no laborable</Text>
          </View>
        </View>

        {/* Contextual Stats Card */}
        <View style={styles.statsCard}>
          <MaterialIcons name="info" size={20} color="#0d1f1b" style={styles.statsIcon} />
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>Uso del Calendario</Text>
            <Text style={styles.statsDescription}>
              Presiona sobre cualquier día laborable (en verde) para ver la lista de turnos programados en esa fecha. Puedes bloquear horas específicas usando el botón de abajo.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Bottom Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.blockButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("BloquearSlot")}
        >
          <MaterialIcons name="block" size={20} color="#ffffff" />
          <Text style={styles.blockButtonText}>Bloquear Slot</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
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
    paddingBottom: 110, // space for fixed footer
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  calendarWidget: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayHeaderLabel: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellEmpty: {
    width: "14.28%",
    aspectRatio: 1,
  },
  dayCell: {
    width: "12%",
    marginHorizontal: "1.14%",
    marginVertical: 4,
    aspectRatio: 1,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#00694c",
  },
  dayCellAvailable: {
    backgroundColor: "#adedd8",
  },
  dayCellUnavailable: {
    backgroundColor: "#ffdad6",
  },
  dayCellPast: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayTextToday: {
    fontWeight: "700",
  },
  dayTextAvailable: {
    color: "#2a6959",
  },
  dayTextUnavailable: {
    color: "#ba1a1a",
  },
  dayTextPast: {
    color: "#707d76",
  },
  legendContainer: {
    gap: 16,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  legendIndicatorBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  legendIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#181c1c",
  },
  statsCard: {
    backgroundColor: "#d3e7e0",
    borderRadius: 12,
    borderColor: "rgba(188, 202, 193, 0.3)",
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  statsIcon: {
    marginTop: 2,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d1f1b",
    marginBottom: 4,
  },
  statsDescription: {
    fontSize: 14,
    color: "#394a45",
    lineHeight: 20,
    opacity: 0.8,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#00694c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  blockButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
