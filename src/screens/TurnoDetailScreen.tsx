import React from "react";
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
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

interface AppointmentDetail {
  serviceName: string;
  professionalName: string;
  day: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  location: string;
  imageUrl?: string;
}

export default function TurnoDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Valores por defecto basados en el mockup si no se pasan parámetros
  const appointment: AppointmentDetail = route.params?.appointment || {
    serviceName: "Corte y Barba",
    professionalName: "Fran Perez",
    day: "Lunes",
    date: "18 de mayo",
    time: "16:30",
    duration: "1h",
    price: "$4.500",
    location: "Av. Sarmiento 1515",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7SQZMNT2J8WjZJ38RMu9dyvKxZ8uG2nkCu5yyxYkVNbGH-Uag993QKairkeKOTLpaSXAjyOdJEsnO_Omcwj4i-yrXI6lHOWeBif64y_yvGrcKNvSA91XPPBus6M11yd11ulke9XW1hjGHqdyxVWreOtFFZgnn2CHGCJ04mQlTS8wG64u0RtM8mTA5avsKSDwrQrNVOJrZdc2x0LEAQJQgjajD8Xcge0AtVUk3YAREEyk1ZdpQ2UoU-RipD3S8KPEGSHZvaI43Ag",
  };

  const handleWhatsApp = () => {
    Alert.alert(
      "WhatsApp",
      `Abriendo chat de WhatsApp con el profesional ${appointment.professionalName}...`
    );
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      "Cancelar Turno",
      "¿Estás seguro de que deseas cancelar este turno?",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            Alert.alert("Turno Cancelado", "El turno ha sido cancelado con éxito.");
            navigation.goBack();
          },
        },
      ]
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
            {appointment.imageUrl ? (
              <Image source={{ uri: appointment.imageUrl }} style={styles.cardImage} />
            ) : (
              <Feather name="user" size={32} color="#008560" />
            )}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.infoGroup}>
              <Text style={styles.groupLabel}>SERVICIO</Text>
              <Text style={styles.groupValue}>{appointment.serviceName}</Text>
            </View>
            <View style={[styles.infoGroup, { marginTop: 12 }]}>
              <Text style={styles.groupLabel}>PROFESIONAL</Text>
              <Text style={styles.groupValue}>{appointment.professionalName}</Text>
            </View>
          </View>
        </View>

        {/* Date / Time Bento */}
        <View style={styles.bentoContainer}>
          <View style={styles.bentoItem}>
            <Text style={styles.groupLabel}>FECHA</Text>
            <Text style={styles.bentoDay}>{appointment.day}</Text>
            <Text style={styles.bentoSubtext}>{appointment.date}</Text>
          </View>

          <View style={styles.bentoItem}>
            <Text style={styles.groupLabel}>HORARIO</Text>
            <Text style={styles.bentoDay}>{appointment.time}</Text>
            <Text style={styles.bentoSubtext}>Turno de {appointment.duration}</Text>
          </View>
        </View>

        {/* WhatsApp Action */}
        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Text style={styles.whatsappText}>💬 WhatsApp del Profesional</Text>
        </TouchableOpacity>

        {/* Location Section */}
        <View style={styles.locationGroup}>
          <Text style={styles.locationLabel}>Domicilio de atención:</Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={styles.locationInput}
              value={appointment.location}
              editable={false}
            />
            <TouchableOpacity style={styles.clearLocationButton} disabled={true}>
              <Feather name="x" size={20} color="#6d7a73" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost Pill */}
        <View style={styles.costContainer}>
          <View style={styles.costPill}>
            <Text style={styles.costText}>Total: {appointment.price}</Text>
          </View>
        </View>

        {/* Cancel Action */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelAppointment}
        >
          <Text style={styles.cancelButtonText}>Cancelar turno</Text>
        </TouchableOpacity>
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
    position: "relative",
    width: "100%",
  },
  locationInput: {
    width: "100%",
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 14,
    color: "#181c1c",
  },
  clearLocationButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
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
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
