import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../services/api";

interface AppointmentData {
  id: number;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  service?: {
    name: string;
    duration_minutes: number;
    price: string | number;
  };
  professional_profile?: {
    shop_address?: string;
    has_physical_shop?: boolean | number;
    user?: {
      name: string;
      last_name?: string;
      avatar_url?: string;
      phone?: string;
    };
  };
  client?: {
    id: number;
    name: string;
    last_name?: string;
    avatar_url?: string;
    phone?: string;
  };
  address?: {
    id: number;
    alias: string;
    address_line: string;
  };
}

export default function TurnoDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const appointmentId = route.params?.appointmentId;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchProfileAndDetails();
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchProfileAndDetails = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get("/profile");
      setCurrentUser(profileRes.data.user);

      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment(response.data);
    } catch (error) {
      console.error("Error loading data in TurnoDetail:", error);
      Alert.alert("Error", "No se pudo cargar la información del turno.");
    } finally {
      setLoading(false);
    }
  };

  const isProfessional = currentUser?.role === "professional";

  const handleWhatsApp = () => {
    const phone = isProfessional
      ? appointment?.client?.phone
      : appointment?.professional_profile?.user?.phone;
    const userName = isProfessional
      ? `${appointment?.client?.name || ""} ${appointment?.client?.last_name || ""}`.trim() || "el cliente"
      : appointment?.professional_profile?.user?.name || "el profesional";
    
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanPhone}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert("Error", "No se pudo abrir WhatsApp en este dispositivo.");
          }
        })
        .catch((err) => {
          console.error("Error opening WhatsApp:", err);
          Alert.alert("Error", "Ocurrió un error al intentar abrir WhatsApp.");
        });
    } else {
      Alert.alert("WhatsApp", `El usuario ${userName} no tiene un número registrado.`);
    }
  };

  const checkCanCancel = (): { canCancel: boolean; reason?: string } => {
    if (!appointment) return { canCancel: false };

    // Si el turno ya no está activo
    if (appointment.status === "cancelled") {
      return { canCancel: false, reason: "El turno ya se encuentra cancelado." };
    }
    if (appointment.status === "completed") {
      return { canCancel: false, reason: "El turno ya se completó." };
    }
    if (appointment.status === "rejected") {
      return { canCancel: false, reason: "El turno fue rechazado por el profesional." };
    }

    try {
      // Calcular diferencia de tiempo (mínimo 1 hora)
      const appDateTime = new Date(`${appointment.date}T${appointment.start_time}`);
      const now = new Date();
      const differenceInMs = appDateTime.getTime() - now.getTime();
      const differenceInMinutes = differenceInMs / (1000 * 60);

      if (differenceInMinutes < 60) {
        return {
          canCancel: false,
          reason: "Falta menos de 1 hora para el turno. No es posible cancelarlo.",
        };
      }

      return { canCancel: true };
    } catch (e) {
      return { canCancel: false, reason: "Error al calcular el tiempo restante." };
    }
  };

  const handleCancelAppointment = () => {
    const { canCancel, reason } = checkCanCancel();

    if (!canCancel) {
      Alert.alert("No permitido", reason || "No se puede cancelar este turno.");
      return;
    }

    Alert.alert(
      "Cancelar Turno",
      "¿Estás seguro de que deseas cancelar este turno? Esta acción no se puede deshacer.",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              await api.patch(`/appointments/${appointmentId}/cancel`);
              Alert.alert("Turno Cancelado", "El turno ha sido cancelado con éxito.");
              fetchProfileAndDetails(); // Recargar el estado
            } catch (error: any) {
              console.error("Error cancelling appointment:", error);
              const msg = error.response?.data?.message || "No se pudo cancelar el turno.";
              Alert.alert("Error", msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = (newStatus: "accepted" | "rejected" | "cancelled") => {
    const actionLabel = newStatus === "accepted" 
      ? "aceptar" 
      : newStatus === "rejected" 
        ? "rechazar" 
        : "cancelar";

    const titleAlert = newStatus === "accepted" 
      ? "Aceptar Solicitud" 
      : newStatus === "rejected" 
        ? "Rechazar Solicitud" 
        : "Cancelar Turno";

    Alert.alert(
      titleAlert,
      `¿Estás seguro de que deseas ${actionLabel} esta solicitud de turno?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: newStatus === "accepted" ? "default" : "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              await api.patch(`/appointments/${appointmentId}/status`, {
                status: newStatus,
              });
              Alert.alert("Éxito", `El turno ha sido ${newStatus === "accepted" ? "aceptado" : newStatus === "rejected" ? "rechazado" : "cancelado"} con éxito.`);
              fetchProfileAndDetails(); // Recargar estado
            } catch (error: any) {
              console.error("Error updating appointment status:", error);
              const msg = error.response?.data?.message || "No se pudo actualizar el estado del turno.";
              Alert.alert("Error", msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatAppointmentDate = (dateStr: string) => {
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
      
      return {
        dayName: DAYS_OF_WEEK[date.getDay()],
        dateFormatted: `${day} de ${MONTH_NAMES[date.getMonth()]}`,
      };
    } catch (e) {
      return {
        dayName: "Turno",
        dateFormatted: dateStr,
      };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00694c" />
          <Text style={styles.loadingText}>Cargando detalles del turno...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#181c1c" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Feather name="alert-triangle" size={48} color="#b91c1c" />
          <Text style={[styles.loadingText, { color: "#b91c1c", marginTop: 12 }]}>
            No se encontró información para este turno.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { dayName, dateFormatted } = formatAppointmentDate(appointment.date);
  const cleanTime = appointment.start_time.substring(0, 5);
  const duration = appointment.service ? `${appointment.service.duration_minutes} min` : "1h";
  const price = appointment.service ? `$${appointment.service.price}` : "$0";
  
  const professionalName = `${appointment.professional_profile?.user?.name || ""} ${appointment.professional_profile?.user?.last_name || ""}`.trim() || "Profesional";
  const clientName = `${appointment.client?.name || ""} ${appointment.client?.last_name || ""}`.trim() || "Cliente";
  
  const location = appointment.professional_profile?.shop_address || "Domicilio de atención";
  const hasPhysicalShop = appointment.professional_profile?.has_physical_shop ?? !!appointment.professional_profile?.shop_address;
  
  const addressDetail = appointment.address
    ? `${appointment.address.alias}: ${appointment.address.address_line}`
    : "Atención a domicilio (dirección no especificada)";

  const avatarUrl = isProfessional 
    ? appointment.client?.avatar_url 
    : appointment.professional_profile?.user?.avatar_url;

  const renderClientActions = () => {
    const { canCancel, reason } = checkCanCancel();
    
    return (
      <View style={{ gap: 8 }}>
        <TouchableOpacity
          style={[
            styles.cancelButton, 
            (!canCancel || cancelling) && styles.cancelButtonDisabled
          ]}
          onPress={handleCancelAppointment}
          disabled={!canCancel || cancelling}
        >
          <Text style={styles.cancelButtonText}>
            {cancelling ? "Cancelando..." : appointment.status === "cancelled" ? "Turno Cancelado" : "Cancelar turno"}
          </Text>
        </TouchableOpacity>

        {!canCancel && appointment.status !== "cancelled" && appointment.status !== "completed" && appointment.status !== "rejected" && (
          <Text style={styles.warningText}>
            ⚠️ No puedes cancelar este turno porque falta menos de 1 hora para su inicio.
          </Text>
        )}

        {appointment.status === "cancelled" && (
          <Text style={[styles.warningText, { color: "#707d76" }]}>
            Este turno ya ha sido cancelado.
          </Text>
        )}
        
        {appointment.status === "rejected" && (
          <Text style={styles.warningText}>
            Este turno fue rechazado por el profesional.
          </Text>
        )}
        
        {appointment.status === "completed" && (
          <Text style={[styles.warningText, { color: "#00694c" }]}>
            Este turno se encuentra completado.
          </Text>
        )}
      </View>
    );
  };

  const renderProfessionalActions = () => {
    if (appointment.status === "pending") {
      return (
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleUpdateStatus("accepted")}
            disabled={cancelling}
          >
            <Text style={styles.acceptButtonText}>
              {cancelling ? "Procesando..." : "Aceptar Solicitud"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleUpdateStatus("rejected")}
            disabled={cancelling}
          >
            <Text style={styles.cancelButtonText}>
              {cancelling ? "Procesando..." : "Rechazar Solicitud"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (appointment.status === "accepted") {
      return (
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleUpdateStatus("cancelled")}
            disabled={cancelling}
          >
            <Text style={styles.cancelButtonText}>
              {cancelling ? "Procesando..." : "Cancelar Turno"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.warningText, { color: "#707d76" }]}>
            Puedes cancelar este turno confirmado si tienes un imprevisto. El cliente será notificado.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: 8 }}>
        <TouchableOpacity
          style={[styles.cancelButton, styles.cancelButtonDisabled]}
          disabled={true}
        >
          <Text style={styles.cancelButtonText}>
            {appointment.status === "cancelled" 
              ? "Turno Cancelado" 
              : appointment.status === "rejected" 
                ? "Turno Rechazado" 
                : "Turno Completado"}
          </Text>
        </TouchableOpacity>
        
        {appointment.status === "cancelled" && (
          <Text style={[styles.warningText, { color: "#707d76" }]}>
            Este turno se encuentra cancelado.
          </Text>
        )}

        {appointment.status === "rejected" && (
          <Text style={[styles.warningText, { color: "#707d76" }]}>
            Esta solicitud de turno fue rechazada.
          </Text>
        )}

        {appointment.status === "completed" && (
          <Text style={[styles.warningText, { color: "#00694c" }]}>
            Este turno se encuentra completado.
          </Text>
        )}
      </View>
    );
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
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Detalles del turno</Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.imageContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.cardImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={32} color="#00694c" />
              </View>
            )}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.infoGroup}>
              <Text style={styles.groupLabel}>SERVICIO</Text>
              <Text style={styles.groupValue}>{appointment.service?.name || "Servicio"}</Text>
            </View>
            <View style={[styles.infoGroup, { marginTop: 12 }]}>
              <Text style={styles.groupLabel}>
                {isProfessional ? "CLIENTE" : "PROFESIONAL"}
              </Text>
              <Text style={styles.groupValue}>
                {isProfessional ? clientName : professionalName}
              </Text>
            </View>
          </View>
        </View>

        {/* Date / Time Bento */}
        <View style={styles.bentoContainer}>
          <View style={styles.bentoItem}>
            <Text style={styles.groupLabel}>FECHA</Text>
            <Text style={styles.bentoDay}>{dayName}</Text>
            <Text style={styles.bentoSubtext}>{dateFormatted}</Text>
          </View>

          <View style={styles.bentoItem}>
            <Text style={styles.groupLabel}>HORARIO</Text>
            <Text style={styles.bentoDay}>{cleanTime} hs</Text>
            <Text style={styles.bentoSubtext}>Duración: {duration}</Text>
          </View>
        </View>

        {/* WhatsApp Action */}
        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Text style={styles.whatsappText}>
            💬 WhatsApp del {isProfessional ? "Cliente" : "Profesional"}
          </Text>
        </TouchableOpacity>

        {/* Location Section */}
        <View style={styles.locationGroup}>
          <Text style={styles.locationLabel}>
            {hasPhysicalShop ? "Domicilio de atención (Local físico):" : "Dirección de atención (A domicilio):"}
          </Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={styles.locationInput}
              value={hasPhysicalShop ? location : addressDetail}
              editable={false}
              multiline={true}
            />
          </View>
        </View>

        {/* Cost Pill */}
        <View style={styles.costContainer}>
          <View style={styles.costPill}>
            <Text style={styles.costText}>Total: {price}</Text>
          </View>
        </View>

        {/* Cancel/Accept/Reject Actions */}
        {isProfessional ? renderProfessionalActions() : renderClientActions()}
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
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf8",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
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
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    lineHeight: 34,
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
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
    justifyContent: "center",
    alignItems: "center",
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
  cardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  infoGroup: {
    gap: 2,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
    letterSpacing: 0.5,
  },
  groupValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  bentoContainer: {
    flexDirection: "row",
    gap: 12,
  },
  bentoItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  bentoDay: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    textTransform: "uppercase",
  },
  bentoSubtext: {
    fontSize: 14,
    color: "#3d4943",
  },
  whatsappButton: {
    width: "100%",
    backgroundColor: "#25D366",
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  locationGroup: {
    gap: 4,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
  },
  locationInputContainer: {
    width: "100%",
  },
  locationInput: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#181c1c",
    textAlignVertical: "top",
  },
  costContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  costPill: {
    backgroundColor: "#f5fff7",
    borderColor: "rgba(0, 105, 76, 0.2)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  costText: {
    color: "#00694c",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "#DC3535",
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonDisabled: {
    backgroundColor: "#bccac1",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    width: "100%",
    backgroundColor: "#008560",
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7faf8",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#3d4943",
    fontWeight: "500",
  },
  warningText: {
    fontSize: 12,
    color: "#b91c1c",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 18,
    fontWeight: "500",
  },
});
