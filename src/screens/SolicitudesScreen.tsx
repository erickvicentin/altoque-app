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
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

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
  const [requests, setRequests] = useState<ProfessionalRequest[]>([
    {
      id: "1",
      clientName: "Martín C.",
      serviceName: "Corte Clásico + Barba",
      timeText: "Hoy, 14:30 hs",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBJooX12ebFwtBeLmu7KXWMjPvUu5Zj8av5otzrceRhKd2u8npF5phe1KqKx7a1H7dhqlJVL9gZc_GwtZgO4Dy7vsKLwFNPg5zqXeBALyJXL_sDN966ngOQZOlYSo6hJSvcscawTioP5zmaqBppn68KGCwu38GmkvroguQ68oZXkKO_mDUWWN2lA7afLdnfVqV7su7UE_fVHjsZTTJ5cj3LB_klpMT0beBm4_iI99ekY0zy1naIQJcRE_mw79Clr-Lz384RCb2Ttw",
    },
    {
      id: "2",
      clientName: "Luciana R.",
      serviceName: "Perfilado de Cejas",
      timeText: "Mañana, 10:00 hs",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDa1_A5HNZAK_ehbDXqr-US4hzRbxpUrEZTmpSpyLVDN_Cknau4gkrZHSHenhCCGSvhvaZ_twZZEPGjukHu9opyKEki2ae_bGBzzYyYxXKpxzMfFMmSRgNCw1UPdnrK7hjltau9JiAGhCGKA0Ys5eVL1OMYM72LM9kiVSC8yqrXlaLiraNwFDvw8xUgSW-5bpYjhJ5XiGm6Bfxdb7Rr6pvSKSD8OF2wUHCUP8CrHthjjSs3yllNQn60BKm8ko8_b42J8PHh-pxtmA",
    },
    {
      id: "3",
      clientName: "Tomás V.",
      serviceName: "Corte Moderno",
      timeText: "Jueves, 18:15 hs",
    },
    {
      id: "4",
      clientName: "Javier M.",
      serviceName: "Lavado y Peinado",
      timeText: "Viernes, 09:30 hs",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDmE5EfqNYXvbq36Fu1m1ED8AgwSqBMxjbKTeESfXpn6S_sMWkheEGNaknb9aD8EhBhn71QCUG5Uf1HVebaDumaLmgxnsCPAfYskGP0kelBuabmmFyxzgsRRhXLX03CKjmi9b341i47t2NK1Fnrx3DS0AR3PqOXDGqkPOf7Ngiujvh90DXahHcdNZoK-MXXeusDIDbiyM-9s8ksyGsCne3t-3tWWcim6qXiiGx4SqfbWogte-xIICbKEyoLbmF62EPUopZsfG3lCg",
    },
  ]);

  // State para notificaciones del cliente
  const [notifications, setNotifications] = useState<ClientNotification[]>([
    {
      id: "1",
      professionalName: "Fran Perez",
      serviceName: "Corte Clásico",
      timeText: "Hoy, 10:30 hs",
      status: "accepted",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBDyBj5TaecCAsFprwmZlD-c_anCrDnZEWxM-CqeCMhA1JvXkvukrUqERYryCCSqSydbCIU0NH8dXPKIGdjvDTfB_At78BYA1ZVbCJ0x1bA9m0fW7rMiCPaUAnqPvcKIDbntAyB6sWlCy_DQfrB_AoAtmqX22s3e57HPvE2ZvsfIe_5DersGjw4_gqTGkzD2YejCuzqaRBsR2LRfbtw6kHYZ0hxg5q0pAgVFmbPfYC8OBJZq4YBBEPUidEZ5qvi03mG7oiXQrsnVA",
    },
    {
      id: "2",
      professionalName: "Ana Silva",
      serviceName: "Clase de Pilates",
      timeText: "Ayer, 18:00 hs",
      status: "rejected",
      imageUrl: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: "3",
      professionalName: "Carlos Gomez",
      serviceName: "Instalación de Aire",
      timeText: "Hace 2 días",
      status: "accepted",
      imageUrl: "https://i.pravatar.cc/150?img=33",
    },
  ]);

  // States para el Modal de Confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfessionalRequest | null>(null);

  // Manejadores para profesional
  const triggerAcceptConfirm = (request: ProfessionalRequest) => {
    setSelectedRequest(request);
    setConfirmModalVisible(true);
  };

  const handleAcceptRequest = () => {
    if (selectedRequest) {
      Alert.alert("Solicitud Aceptada", `Has aceptado el turno de ${selectedRequest.clientName}.`);
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
      setConfirmModalVisible(false);
      setSelectedRequest(null);
    }
  };

  const handleRejectRequest = (id: string, name: string) => {
    Alert.alert("Solicitud Rechazada", `Has rechazado el turno de ${name}.`);
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  // Manejadores para cliente
  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
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
        <Text style={styles.headerTitle}>Solicitudes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isProfessional ? (
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
    fontSize: 17,
    fontWeight: "600",
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
