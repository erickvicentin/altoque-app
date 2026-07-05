import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { getStorageItem, setStorageItem } from "../services/storage";

interface ProfessionalRequest {
  id: string;
  clientName: string;
  serviceName: string;
  timeText: string;
  imageUrl?: string;
}

interface ClientNotification {
  id: string;
  professionalName: string;
  serviceName: string;
  timeText: string;
  status: "accepted" | "rejected";
  imageUrl?: string;
}

export default function SolicitudesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Extraemos el rol del usuario de los parámetros de navegación, por defecto "professional"
  const user = route.params?.user || {};
  const isProfessional = user.role !== "client";

  // State para solicitudes del profesional
  const [requests, setRequests] = useState<ProfessionalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State para notificaciones del cliente
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  // States para el Modal de Confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfessionalRequest | null>(null);

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

  const fetchRequests = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      const response = await api.get("/appointments");
      const list = response.data || [];

      if (isProfessional) {
        // Filtrar solo los turnos pendientes para el profesional
        const pendingAppointments = list.filter((app: any) => app.status === "pending");

        const mappedRequests: ProfessionalRequest[] = pendingAppointments.map((app: any) => {
          const client = app.client || {};
          const service = app.service || {};
          return {
            id: app.id.toString(),
            clientName: `${client.name || ""} ${client.last_name || ""}`.trim() || "Cliente",
            serviceName: service.name || "Servicio",
            timeText: formatDateTime(app.date, app.start_time),
            imageUrl: client.avatar_url || undefined,
          };
        });

        setRequests(mappedRequests);
      } else {
        // Para el cliente: Cargar los IDs de notificaciones ya descartadas de AsyncStorage
        const dismissedVal = await getStorageItem("dismissed_notification_ids");
        const dismissedIds: number[] = dismissedVal ? JSON.parse(dismissedVal) : [];

        // Filtrar turnos del cliente que estén aceptados o rechazados y que NO hayan sido descartados
        const clientNotifications = list.filter(
          (app: any) =>
            (app.status === "accepted" || app.status === "rejected") &&
            !dismissedIds.includes(app.id)
        );

        const mappedNotifications: ClientNotification[] = clientNotifications.map((app: any) => {
          const profUser = app.professional_profile?.user || {};
          const service = app.service || {};
          return {
            id: app.id.toString(),
            professionalName: profUser.name || "Profesional",
            serviceName: service.name || "Servicio",
            timeText: formatDateTime(app.date, app.start_time),
            status: app.status,
            imageUrl: profUser.avatar_url || undefined,
          };
        });

        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error("Error fetching professional requests or client notifications:", error);
      Alert.alert("Error", "No se pudieron cargar las novedades.");
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests(true);
    }, [isProfessional])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests(false);
    setRefreshing(false);
  }, [isProfessional]);

  // Manejadores para profesional
  const triggerAcceptConfirm = (request: ProfessionalRequest) => {
    setSelectedRequest(request);
    setConfirmModalVisible(true);
  };

  const handleAcceptRequest = async () => {
    if (selectedRequest) {
      try {
        setConfirmModalVisible(false);
        setLoading(true);
        await api.patch(`/appointments/${selectedRequest.id}/status`, {
          status: "accepted",
        });
        Alert.alert("Solicitud Aceptada", `Has aceptado el turno de ${selectedRequest.clientName}.`);
        setSelectedRequest(null);
        fetchRequests();
      } catch (error: any) {
        console.error("Error accepting request:", error);
        const msg = error.response?.data?.message || "No se pudo aceptar la solicitud.";
        Alert.alert("Error", msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRejectRequest = async (id: string, name: string) => {
    Alert.alert(
      "Rechazar Solicitud",
      `¿Estás seguro de que deseas rechazar el turno de ${name}?`,
      [
        { text: "Volver Atrás", style: "cancel" },
        {
          text: "Confirmar Rechazo",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.patch(`/appointments/${id}/status`, {
                status: "rejected",
              });
              Alert.alert("Solicitud Rechazada", `Has rechazado el turno de ${name}.`);
              fetchRequests();
            } catch (error: any) {
              console.error("Error rejecting request:", error);
              const msg = error.response?.data?.message || "No se pudo rechazar la solicitud.";
              Alert.alert("Error", msg);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Manejadores para cliente
  const handleDismissNotification = async (id: string) => {
    try {
      const dismissedVal = await getStorageItem("dismissed_notification_ids");
      const dismissedIds: number[] = dismissedVal ? JSON.parse(dismissedVal) : [];
      const numericId = parseInt(id, 10);
      if (!dismissedIds.includes(numericId)) {
        dismissedIds.push(numericId);
        await setStorageItem("dismissed_notification_ids", JSON.stringify(dismissedIds));
      }
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#181c1c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novedades</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00694c"]}
            tintColor="#00694c"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 40 }} />
        ) : isProfessional ? (
          // Vista del Profesional
          <View style={styles.listContainer}>
            {requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={48} color="#bccac1" />
                <Text style={styles.emptyText}>No tienes solicitudes pendientes</Text>
              </View>
            ) : (
              requests.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatarContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
                      ) : (
                        <Feather name="user" size={24} color="#d7dbd9" />
                      )}
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {item.serviceName}
                      </Text>
                      <Text style={styles.timeText}>{item.timeText}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectRequest(item.id, item.clientName)}
                    >
                      <Feather name="x" size={20} color="#181c1c" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => triggerAcceptConfirm(item)}
                    >
                      <Feather name="check" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          // Vista del Cliente (Notificaciones)
          <View style={styles.listContainer}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="bell-off" size={48} color="#bccac1" />
                <Text style={styles.emptyText}>No tienes notificaciones de solicitudes</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatarContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
                      ) : (
                        <Feather name="user" size={24} color="#d7dbd9" />
                      )}
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.notificationText}>
                        <Text style={styles.boldText}>{item.professionalName}</Text>{" "}
                        {item.status === "accepted" ? "aceptó" : "rechazó"} tu solicitud
                        para el servicio <Text style={styles.boldText}>{item.serviceName}</Text>.
                      </Text>
                      <Text style={styles.timeText}>{item.timeText}</Text>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              item.status === "accepted" ? "#c2f0d9" : "#fee2e2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                item.status === "accepted" ? "#00694c" : "#b91c1c",
                            },
                          ]}
                        >
                          {item.status === "accepted" ? "Aceptado" : "Rechazado"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => handleDismissNotification(item.id)}
                  >
                    <Feather name="x" size={16} color="#707d76" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet Modal for Confirming Appointment */}
      <Modal
        transparent={true}
        visible={confirmModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setConfirmModalVisible(false);
          setSelectedRequest(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Estás seguro de confirmar el turno?</Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAcceptRequest}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmar turno</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalBackButton]}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setSelectedRequest(null);
                }}
              >
                <Text style={styles.modalBackButtonText}>Volver Atrás</Text>
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
  },
  headerTitle: {
    fontSize: 24,
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
    paddingVertical: 16,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    overflow: "hidden",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ebefed",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181c1c",
  },
  serviceName: {
    fontSize: 13,
    color: "#3d4943",
    marginTop: 2,
  },
  timeText: {
    fontSize: 13,
    color: "#707d76",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#f1f4f2",
  },
  acceptButton: {
    backgroundColor: "#00694c",
  },
  // Estilos notificaciones cliente
  notificationText: {
    fontSize: 13,
    color: "#3d4943",
    lineHeight: 18,
  },
  boldText: {
    fontWeight: "600",
    color: "#181c1c",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  dismissButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  // Estilos vacíos
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#707d76",
    textAlign: "center",
  },
  // Estilos del Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: 600,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#bccac1",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 34,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#181c1c",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    width: "100%",
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmButton: {
    backgroundColor: "#1d9e75",
  },
  modalConfirmButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackButton: {
    backgroundColor: "#1c1c1c",
  },
  modalBackButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
