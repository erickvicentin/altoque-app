import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

export default function DailyAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dateStr } = route.params || {}; // Expected in format YYYY-MM-DD

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (dateStr) {
        fetchAppointmentsForDate();
      } else {
        setLoading(false);
      }
    }, [dateStr])
  );

  const fetchAppointmentsForDate = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments");
      const list = response.data || [];
      
      // Filter for this specific date
      const filtered = list.filter((app: any) => app.date === dateStr);
      
      // Sort chronologically by start time
      filtered.sort((a: any, b: any) => {
        return a.start_time.localeCompare(b.start_time);
      });

      setAppointments(filtered);
    } catch (error) {
      console.error("Error fetching daily appointments:", error);
      Alert.alert("Error", "No se pudieron cargar los turnos de este día.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateHeader = (dateString: string) => {
    try {
      const parts = dateString.split("-");
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const dateObj = new Date(year, month, day);

      const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const MONTH_NAMES = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      
      const dayName = DAYS_OF_WEEK[dateObj.getDay()];
      const dateFormatted = `${day} de ${MONTH_NAMES[dateObj.getMonth()]} de ${year}`;
      
      return { dayName, dateFormatted };
    } catch (e) {
      return { dayName: "Turnos", dateFormatted: dateString };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      case "rejected":
        return "Rechazado";
      case "accepted":
        return "Confirmado";
      case "pending":
        return "Espera de confirmación";
      case "blocked":
        return "Bloqueado / Externo";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { text: "#00694c", bg: "#c2f0d9", border: "#a7f3d0" };
      case "cancelled":
      case "rejected":
        return { text: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" };
      case "accepted":
        return { text: "#00694c", bg: "#c2f0d9", border: "#a7f3d0" };
      case "pending":
        return { text: "#d97706", bg: "#fffbeb", border: "#fef3c7" };
      case "blocked":
        return { text: "#3d4943", bg: "#e2eae7", border: "#bccac1" };
      default:
        return { text: "#3d4943", bg: "#f1f4f2", border: "#e6e9e7" };
    }
  };

  const { dayName, dateFormatted } = formatDateHeader(dateStr || "");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#3d4943" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>alToque</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.dayNameText}>{dayName}</Text>
          <Text style={styles.dateText}>{dateFormatted}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.noAppointmentsContainer}>
            <Feather name="calendar" size={64} color="#707d76" style={{ marginBottom: 16 }} />
            <Text style={styles.noAppointmentsTitle}>No hay turnos para este día</Text>
            <Text style={styles.noAppointmentsSubtitle}>
              No se encontraron citas agendadas o bloqueadas para esta fecha.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {appointments.map((item) => {
              const clientUser = item.client || {};
              const service = item.service || {};
              const statusStyle = getStatusColor(item.status);
              const cleanStartTime = item.start_time.substring(0, 5);
              const cleanEndTime = item.end_time.substring(0, 5);

              const parseExternalClientName = (notes?: string) => {
                if (!notes) return null;
                const nameMatch = notes.match(/Cliente externo:\s*(.*)/);
                return nameMatch ? nameMatch[1].trim() : null;
              };

              const externalName = item.status === "blocked" ? parseExternalClientName(item.notes) : null;
              const displayName = externalName || `${clientUser.name || ""} ${clientUser.last_name || ""}`.trim() || "Cliente";

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => navigation.navigate("TurnoDetail", { appointmentId: item.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeBadgeContainer}>
                    <Text style={styles.timeBadgeHour}>{cleanStartTime}</Text>
                    <Text style={styles.timeBadgeSeparator}>a</Text>
                    <Text style={styles.timeBadgeHour}>{cleanEndTime}</Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.infoContainer}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {service.name || "Servicio"}
                    </Text>
                    
                    <View style={styles.clientRow}>
                      {clientUser.avatar_url ? (
                        <Image source={{ uri: clientUser.avatar_url }} style={styles.clientAvatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Feather name="user" size={14} color="#00694c" />
                        </View>
                      )}
                      <Text style={styles.clientName} numberOfLines={1}>
                        {displayName}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: statusStyle.text }
                      ]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00694c",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  dayNameText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    lineHeight: 34,
  },
  dateText: {
    fontSize: 16,
    color: "#707d76",
    marginTop: 4,
    fontWeight: "500",
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeBadgeContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  timeBadgeHour: {
    fontSize: 15,
    fontWeight: "700",
    color: "#181c1c",
  },
  timeBadgeSeparator: {
    fontSize: 11,
    color: "#707d76",
    marginVertical: 1,
  },
  cardDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#e6e9e7",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#c2f0d9",
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: {
    fontSize: 14,
    color: "#3d4943",
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  noAppointmentsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  noAppointmentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 8,
  },
  noAppointmentsSubtitle: {
    fontSize: 14,
    color: "#707d76",
    textAlign: "center",
    lineHeight: 20,
  },
});
