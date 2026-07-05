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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

type FilterType = "accepted" | "pending" | "history";

export default function ProfessionalAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("accepted");

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments");
      setAppointments(response.data || []);
    } catch (error) {
      console.error("Error fetching professional appointments:", error);
      Alert.alert("Error", "No se pudieron cargar tus turnos.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const parts = dateStr.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const date = new Date(year, month, day);

      const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const MONTH_NAMES = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      const dayName = DAYS_OF_WEEK[date.getDay()];
      const monthName = MONTH_NAMES[date.getMonth()];
      const cleanTime = timeStr.substring(0, 5);

      return `${dayName}, ${day} de ${monthName} - ${cleanTime} hs`;
    } catch (e) {
      return `${dateStr} a las ${timeStr}`;
    }
  };

  const getFilteredAppointments = () => {
    let filtered = [];
    if (activeFilter === "accepted") {
      filtered = appointments.filter((app) => app.status === "accepted" || app.status === "blocked");
      // Sort upcoming first
      filtered.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (activeFilter === "pending") {
      filtered = appointments.filter((app) => app.status === "pending");
      // Sort upcoming first
      filtered.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (activeFilter === "history") {
      filtered = appointments.filter(
        (app) =>
          app.status === "completed" ||
          app.status === "cancelled" ||
          app.status === "rejected"
      );
      // Sort most recent first
      filtered.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateB.getTime() - dateA.getTime();
      });
    }
    return filtered;
  };

  const filteredList = getFilteredAppointments();

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

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeFilter === "accepted" && styles.tabButtonActive]}
          onPress={() => setActiveFilter("accepted")}
        >
          <Text style={[styles.tabText, activeFilter === "accepted" && styles.tabTextActive]}>
            Confirmados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === "pending" && styles.tabButtonActive]}
          onPress={() => setActiveFilter("pending")}
        >
          <Text style={[styles.tabText, activeFilter === "pending" && styles.tabTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === "history" && styles.tabButtonActive]}
          onPress={() => setActiveFilter("history")}
        >
          <Text style={[styles.tabText, activeFilter === "history" && styles.tabTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mis Turnos</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 40 }} />
        ) : filteredList.length === 0 ? (
          <View style={styles.noAppointmentsContainer}>
            <Feather name="calendar" size={64} color="#707d76" style={{ marginBottom: 16 }} />
            <Text style={styles.noAppointmentsTitle}>No hay turnos para mostrar</Text>
            <Text style={styles.noAppointmentsSubtitle}>
              {activeFilter === "accepted"
                ? "Los turnos confirmados aparecerán en esta sección."
                : activeFilter === "pending"
                ? "Los turnos pendientes de aprobación aparecerán aquí."
                : "El historial de turnos completados, rechazados o cancelados se mostrará aquí."}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {filteredList.map((item) => {
              const clientUser = item.client || {};
              const service = item.service || {};
              const statusStyle = getStatusColor(item.status);

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
                  <View style={styles.imageContainer}>
                    {clientUser.avatar_url ? (
                      <Image source={{ uri: clientUser.avatar_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Feather name="user" size={32} color="#00694c" />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={styles.serviceName}>{service.name || "Servicio"}</Text>
                    <Text style={styles.clientName}>Cliente: {displayName}</Text>
                    
                    <View style={styles.timeRow}>
                      <MaterialIcons
                        name="event"
                        size={16}
                        color={statusStyle.text}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: statusStyle.text },
                        ]}
                      >
                        {formatDateTime(item.date, item.start_time)}
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e9e7",
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#00694c",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#707d76",
  },
  tabTextActive: {
    fontWeight: "600",
    color: "#00694c",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    marginTop: 24,
    marginBottom: 20,
    lineHeight: 34,
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
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ebefed",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c2f0d9",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  clientName: {
    fontSize: 14,
    color: "#3d4943",
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
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
