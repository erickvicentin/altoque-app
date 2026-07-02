import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import api from "../services/api";

interface Service {
  id: number;
  professional_profile_id: number;
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface ServicesScreenProps {
  user: any;
  navigation: any;
  setActiveTab: (tab: string) => void;
}

export default function ServicesScreen({ user, navigation, setActiveTab }: ServicesScreenProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar servicios al montar
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      setServices(response.data);
    } catch (error: any) {
      console.log("Error fetching services:", error);
      Alert.alert("Error", "No se pudieron cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  // Toggle de activación/desactivación
  const handleToggleService = async (service: Service) => {
    const updatedActive = !service.is_active;

    // Actualización optimista de la UI
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, is_active: updatedActive } : s))
    );

    try {
      await api.put(`/services/${service.id}`, {
        is_active: updatedActive,
      });
    } catch (error: any) {
      console.log("Error updating service status:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del servicio");
      // Revertir en caso de error
      fetchServices();
    }
  };

  // Formateador de duración (ej. 60 -> "1 h", 45 -> "45 m", 90 -> "1.5 h")
  const formatDuration = (mins: number) => {
    if (mins < 60) {
      return `${mins} m`;
    }
    const hours = mins / 60;
    if (mins % 60 === 0) {
      return `${hours} h`;
    }
    return `${hours.toFixed(1).replace(".", ".")} h`;
  };

  // Formateador de precio (ej. 15000 -> "$15.000")
  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return "$0";
    
    // Formato manual con punto de miles para Español (Argentina)
    const roundedPrice = Math.round(numericPrice);
    return `$${roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  // Formateador de días de atención
  const formatWorkingDays = () => {
    const days = user.professional_profile?.working_days || [];
    if (!days || days.length === 0) {
      return "Sin días de atención configurados";
    }
    if (days.length === 1) {
      return days[0];
    }
    
    // Ej: "Lunes, Martes, Jueves y Sábados"
    const lastDay = days[days.length - 1];
    const otherDays = days.slice(0, -1).join(", ");
    return `${otherDays} y ${lastDay}`;
  };

  const handleEditDays = () => {
    Alert.alert("Días de atención", "La pantalla de edición de días de atención estará disponible próximamente.");
  };

  const handleAddService = () => {
    Alert.alert("Nuevo servicio", "La pantalla de creación de nuevos servicios estará disponible próximamente.");
  };

  const handleEditService = (service: Service) => {
    Alert.alert(
      "Editar servicio",
      `Presionaste: ${service.name}. La pantalla de edición del servicio estará disponible próximamente.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Días de atención */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Días de atención</Text>
            <TouchableOpacity onPress={handleEditDays} activeOpacity={0.7}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.daysText}>{formatWorkingDays()}</Text>
        </View>

        {/* Section: Servicios y slots de horario */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={styles.servicesTitle}>Servicios y slots de horario</Text>
          <Text style={styles.servicesSubtitle}>
            Presioná sobre alguno si querés modificarlo o eliminarlo
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#00694c" style={{ marginTop: 24 }} />
          ) : services.length === 0 ? (
            <Text style={styles.emptyText}>No tienes servicios creados.</Text>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceRow}
                  onPress={() => handleEditService(service)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.serviceInfo} numberOfLines={1}>
                    {service.name} | {formatDuration(service.duration_minutes)} | {formatPrice(service.price)}
                  </Text>
                  
                  {/* Custom Toggle Switch */}
                  <TouchableOpacity
                    style={[
                      styles.toggleContainer,
                      { backgroundColor: service.is_active ? "#00694c" : "#e0e3e1" },
                    ]}
                    onPress={() => handleToggleService(service)}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        service.is_active
                          ? { alignSelf: "flex-end", marginRight: 2 }
                          : { alignSelf: "flex-start", marginLeft: 2 },
                      ]}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Button Area */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddService}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Agregar nuevo servicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 150, // Espacio para que el scroll no tape el botón flotante ni el bottom bar
  },
  section: {
    width: "100%",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    paddingBottom: 2,
  },
  daysText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#3d4943",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  servicesTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#181c1c",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    marginBottom: 4,
  },
  servicesSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    color: "#3d4943",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    marginBottom: 16,
  },
  servicesList: {
    gap: 12,
  },
  serviceRow: {
    width: "100%",
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  serviceInfo: {
    fontSize: 13,
    color: "#3d4943",
    fontWeight: "400",
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  toggleContainer: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyText: {
    fontSize: 14,
    color: "#3d4943",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 85, // Arriba de la barra de navegación
    left: 20,
    right: 20,
    backgroundColor: "transparent",
  },
  addButton: {
    height: 56,
    backgroundColor: "#2d3130", // inverse-surface
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
});
