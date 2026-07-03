import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

export default function ClientAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments");
      const list = response.data || [];
      // Only keep 'pending' or 'accepted' appointments
      const filtered = list.filter(
        (app: any) => app.status === "pending" || app.status === "accepted"
      );
      
      // Sort upcoming first
      filtered.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(filtered);
    } catch (error) {
      console.error("Error fetching client appointments:", error);
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

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Próximos Turnos</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#008560" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.noAppointmentsContainer}>
            <Feather name="calendar" size={64} color="#707d76" style={{ marginBottom: 16 }} />
            <Text style={styles.noAppointmentsTitle}>No tenés turnos programados</Text>
            <Text style={styles.noAppointmentsSubtitle}>
              Los turnos que solicites y estén en espera o confirmados aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {appointments.map((item) => {
              const isPending = item.status === "pending";
              const profUser = item.professional_profile?.user || {};
              const service = item.service || {};

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.imageContainer}>
                    {profUser.avatar_url ? (
                      <Image source={{ uri: profUser.avatar_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Feather name="user" size={32} color="#008560" />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={styles.serviceName}>{service.name || "Servicio"}</Text>
                    <Text style={styles.professionalName}>con {profUser.name || "Profesional"}</Text>
                    
                    <View style={styles.timeRow}>
                      <MaterialIcons
                        name="event"
                        size={16}
                        color={isPending ? "#d97706" : "#00694c"}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: isPending ? "#d97706" : "#00694c" },
                        ]}
                      >
                        {formatDateTime(item.date, item.start_time)}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      isPending ? styles.statusBadgePending : styles.statusBadgeAccepted
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        isPending ? styles.statusBadgeTextPending : styles.statusBadgeTextAccepted
                      ]}>
                        {isPending ? "Espera de confirmación" : "Confirmado"}
                      </Text>
                    </View>
                  </View>
                </View>
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
    color: "#181c1c",
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    marginTop: 24,
    marginBottom: 32,
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
  professionalName: {
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
  },
  statusBadgePending: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
    borderWidth: 1,
  },
  statusBadgeAccepted: {
    backgroundColor: "#c2f0d9",
    borderColor: "#a7f3d0",
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  statusBadgeTextPending: {
    color: "#d97706",
  },
  statusBadgeTextAccepted: {
    color: "#00694c",
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
