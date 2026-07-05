import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

interface DayData {
  day: number | null;
  status: "none" | "available" | "unavailable";
}

const DAYS_IN_JULY: DayData[] = [
  // Padding para empezar el miércoles (Julio 2026 empieza en Miércoles)
  { day: null, status: "none" },
  { day: null, status: "none" },
  { day: null, status: "none" },
  // Semana 1
  { day: 1, status: "none" },
  { day: 2, status: "none" },
  { day: 3, status: "unavailable" },
  { day: 4, status: "none" },
  // Semana 2
  { day: 5, status: "none" },
  { day: 6, status: "available" },
  { day: 7, status: "unavailable" },
  { day: 8, status: "available" },
  { day: 9, status: "available" },
  { day: 10, status: "unavailable" },
  { day: 11, status: "none" },
  // Semana 3
  { day: 12, status: "none" },
  { day: 13, status: "unavailable" },
  { day: 14, status: "available" },
  { day: 15, status: "available" },
  { day: 16, status: "unavailable" },
  { day: 17, status: "available" },
  { day: 18, status: "none" },
  // Semana 4
  { day: 19, status: "none" },
  { day: 20, status: "available" },
  { day: 21, status: "available" },
  { day: 22, status: "unavailable" },
  { day: 23, status: "available" },
  { day: 24, status: "available" },
  { day: 25, status: "none" },
  // Semana 5
  { day: 26, status: "none" },
  { day: 27, status: "unavailable" },
  { day: 28, status: "available" },
  { day: 29, status: "unavailable" },
  { day: 30, status: "available" },
  { day: 31, status: "available" },
];

export default function CalendarioProfesional({ navigation, route }: any) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleDayPress = (day: number | null) => {
    if (day !== null) {
      setSelectedDay(day);
    }
  };

  const getCellStyles = (item: DayData) => {
    const isSelected = selectedDay === item.day;
    let bgStyle = styles.dayCellDefault;
    let textStyle = styles.dayTextDefault;

    if (item.status === "available") {
      bgStyle = styles.dayCellAvailable;
      textStyle = styles.dayTextAvailable;
    } else if (item.status === "unavailable") {
      bgStyle = styles.dayCellUnavailable;
      textStyle = styles.dayTextUnavailable;
    }

    return {
      bg: [
        styles.dayCell,
        bgStyle,
        isSelected && styles.dayCellSelected,
      ],
      text: [
        styles.dayText,
        textStyle,
      ],
    };
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
          <TouchableOpacity style={styles.monthNavButton} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={24} color="#3d4943" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>Julio 2026</Text>
          <TouchableOpacity style={styles.monthNavButton} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={24} color="#3d4943" />
          </TouchableOpacity>
        </View>

        {/* Calendar Widget */}
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
            {DAYS_IN_JULY.map((item, index) => {
              if (item.day === null) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const cellStyles = getCellStyles(item);

              return (
                <TouchableOpacity
                  key={`day-${item.day}`}
                  style={cellStyles.bg}
                  onPress={() => handleDayPress(item.day)}
                  activeOpacity={0.8}
                >
                  <Text style={cellStyles.text}>{item.day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
            <Text style={styles.legendText}>Sin turnos disponibles</Text>
          </View>
        </View>

        {/* Contextual Stats Card */}
        <View style={styles.statsCard}>
          <MaterialIcons name="info" size={20} color="#0d1f1b" style={styles.statsIcon} />
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>Resumen de disponibilidad</Text>
            <Text style={styles.statsDescription}>
              Tienes 14 días con espacios abiertos este mes. Puedes bloquear slots específicos para vacaciones o mantenimiento.
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
    paddingBottom: 110, // Para dar espacio al footer fijo
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
  dayCellSelected: {
    borderWidth: 2,
    borderColor: "#00694c",
  },
  dayCellDefault: {
    backgroundColor: "transparent",
  },
  dayCellAvailable: {
    backgroundColor: "#adedd8",
  },
  dayCellUnavailable: {
    backgroundColor: "#ffdad6",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayTextDefault: {
    color: "#181c1c",
  },
  dayTextAvailable: {
    color: "#2a6959",
  },
  dayTextUnavailable: {
    color: "#ba1a1a",
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
