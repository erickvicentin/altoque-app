import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Platform, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ProfileScreen from "./ProfileScreen";
import ServicesScreen from "./ServicesScreen";
import BottomNavBar, { TabItem } from "./BottomNavBar";
import api from "../services/api";


export default function HomeProfesional({ route, navigation }: any) {
  const { user: initialUser } = route.params || {};
  const [user, setUser] = useState(initialUser || { name: "Profesional", role: "professional" });
  const [activeTab, setActiveTab] = useState("negocio");

  // Estados para notificaciones y polling de turnos
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [latestPendingRequest, setLatestPendingRequest] = useState<any | null>(null);
  const knownPendingIds = useRef<number[]>([]);
  const isInitialLoad = useRef(true);



  const TABS_NAMES: Record<string, string> = {
    "negocio": "Mi negocio",
    "servicios": "Mis Servicios",
    "perfil": "Mi Perfil",
  };

  const checkPendingRequests = useCallback(async (isPoll = false) => {
    try {
      const response = await api.get("/appointments");
      const list = response.data || [];

      // 1. Solicitudes pendientes para notificaciones
      const pendingApps = list.filter((app: any) => app.status === "pending");
      const pendingIds = pendingApps.map((app: any) => app.id);
      setHasPendingRequests(pendingApps.length > 0);

      // Ordenar por ID descendente (la última ingresada primero)
      pendingApps.sort((a: any, b: any) => b.id - a.id);
      setLatestPendingRequest(pendingApps.length > 0 ? pendingApps[0] : null);

      // 2. Próximos clientes confirmados (accepted y a futuro)
      const acceptedApps = list.filter((app: any) => app.status === "accepted");
      const now = new Date();
      const upcoming = acceptedApps.filter((app: any) => {
        const appDate = new Date(`${app.date}T${app.start_time}`);
        return appDate >= now;
      });

      // Ordenar ascendentemente (más cercanos primero)
      upcoming.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Guardar el top 3
      setUpcomingAppointments(upcoming.slice(0, 3));

      if (isPoll && !isInitialLoad.current) {
        // Detectar si hay IDs nuevos que no estaban en knownPendingIds
        const newRequests = pendingIds.filter((id: number) => !knownPendingIds.current.includes(id));
        if (newRequests.length > 0) {
          // Disparar notificación nativa del teléfono (OS Banner)
          // No native notification to avoid emulator crash, dot update is enough
          console.log("Nueva Solicitud de Turno: Tenés una nueva solicitud de turno pendiente de revisión en Novedades.");
        }
      }

      knownPendingIds.current = pendingIds;
      isInitialLoad.current = false;
    } catch (error) {
      console.error("Error checking pending requests:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Carga inicial al entrar en foco (sin alert)
      checkPendingRequests(false);

      // Polling cada 10 segundos
      const intervalId = setInterval(() => {
        checkPendingRequests(true);
      }, 10000);

      return () => {
        clearInterval(intervalId);
      };
    }, [checkPendingRequests])
  );

  const handleAcceptRequest = async (id: number, clientName: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, {
        status: "accepted",
      });

      const response = await api.get("/appointments");
      const list = response.data || [];

      const pendingApps = list.filter((app: any) => app.status === "pending");
      pendingApps.sort((a: any, b: any) => b.id - a.id);
      setLatestPendingRequest(pendingApps.length > 0 ? pendingApps[0] : null);
      setHasPendingRequests(pendingApps.length > 0);

      const acceptedApps = list.filter((app: any) => app.status === "accepted");
      const now = new Date();
      const upcoming = acceptedApps.filter((app: any) => {
        const appDate = new Date(`${app.date}T${app.start_time}`);
        return appDate >= now;
      });
      upcoming.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      setUpcomingAppointments(upcoming.slice(0, 3));

      if (pendingApps.length > 0) {
        Alert.alert("Solicitud Aceptada", `Has aceptado el turno de ${clientName}.`);
      } else {
        Alert.alert("Solicitud Aceptada", `Has aceptado el turno de ${clientName}.\nNo tenés nuevas solicitudes.`);
      }
    } catch (error: any) {
      console.error("Error accepting request:", error);
      const msg = error.response?.data?.message || "No se pudo aceptar la solicitud.";
      Alert.alert("Error", msg);
    }
  };

  const handleRejectRequest = async (id: number, clientName: string) => {
    Alert.alert(
      "Rechazar Solicitud",
      `¿Estás seguro de que deseas rechazar el turno de ${clientName}?`,
      [
        { text: "Volver Atrás", style: "cancel" },
        {
          text: "Si, confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/appointments/${id}/status`, {
                status: "rejected",
              });

              const response = await api.get("/appointments");
              const list = response.data || [];

              const pendingApps = list.filter((app: any) => app.status === "pending");
              pendingApps.sort((a: any, b: any) => b.id - a.id);
              setLatestPendingRequest(pendingApps.length > 0 ? pendingApps[0] : null);
              setHasPendingRequests(pendingApps.length > 0);

              const acceptedApps = list.filter((app: any) => app.status === "accepted");
              const now = new Date();
              const upcoming = acceptedApps.filter((app: any) => {
                const appDate = new Date(`${app.date}T${app.start_time}`);
                return appDate >= now;
              });
              upcoming.sort((a: any, b: any) => {
                const dateA = new Date(`${a.date}T${a.start_time}`);
                const dateB = new Date(`${b.date}T${b.start_time}`);
                return dateA.getTime() - dateB.getTime();
              });
              setUpcomingAppointments(upcoming.slice(0, 3));

              if (pendingApps.length > 0) {
                Alert.alert("Solicitud Rechazada", `Has rechazado el turno de ${clientName}.`);
              } else {
                Alert.alert("Solicitud Rechazada", `Has rechazado el turno de ${clientName}.\nNo tenés nuevas solicitudes.`);
              }
            } catch (error: any) {
              console.error("Error rejecting request:", error);
              const msg = error.response?.data?.message || "No se pudo rechazar la solicitud.";
              Alert.alert("Error", msg);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };

  const professionalTabs: TabItem[] = [
    { key: "negocio", label: "Mi negocio", icon: "home" },
    { key: "servicios", label: "Servicios", icon: "storefront" },
    { key: "perfil", label: "Perfil", icon: "person" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "negocio":
        const firstName = user.name ? user.name.split(" ")[0] : "Profesional";
        const getGreeting = () => {
          const hour = new Date().getHours();
          if (hour >= 6 && hour < 13) return "Buenos días";
          if (hour >= 13 && hour < 20) return "Buenas tardes";
          return "Buenas noches";
        };
        const greeting = getGreeting();
        return (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <Text style={styles.welcomeText}>{greeting}, {firstName} 👋</Text>

            {/* Tus próximos clientes */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Tus próximos clientes</Text>

              {upcomingAppointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No tienes próximos clientes confirmados</Text>
                </View>
              ) : (
                upcomingAppointments.map((app: any) => {
                  const clientUser = app.client || {};
                  const service = app.service || {};
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={styles.clientCard}
                      onPress={() => navigation.navigate("TurnoDetail", { appointmentId: app.id })}
                      activeOpacity={0.7}
                    >
                      {clientUser.avatar_url ? (
                        <Image
                          source={{ uri: clientUser.avatar_url }}
                          style={styles.clientAvatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Feather name="user" size={24} color="#bccac1" />
                        </View>
                      )}
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>
                          {`${clientUser.name || ""} ${clientUser.last_name || ""}`.trim() || "Cliente"}
                        </Text>
                        <Text style={styles.clientService}>
                          {service.name || "Servicio"}
                        </Text>
                      </View>
                      <View style={styles.timeBadge}>
                        <Text style={styles.timeBadgeText}>
                          {app.start_time ? app.start_time.substring(0, 5) : "--:--"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("ProfessionalAppointments")}
              >
                <Text style={styles.outlineButtonText}>Ver más turnos</Text>
              </TouchableOpacity>
            </View>

            {/* Confirmación pendiente */}
            {latestPendingRequest && (
              <>
                {/* Divider */}
                <View style={styles.divider} />

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Confirmación pendiente</Text>

                  {/* Warning Card */}
                  <View style={styles.warningCard}>
                    <View style={styles.warningCardHeader}>
                      {latestPendingRequest.client?.avatar_url ? (
                        <Image
                          source={{ uri: latestPendingRequest.client.avatar_url }}
                          style={styles.clientAvatar}
                        />
                      ) : (
                        <View style={[styles.clientAvatar, { backgroundColor: "#fffbeb", justifyContent: "center", alignItems: "center" }]}>
                          <Feather name="user" size={24} color="#d97706" />
                        </View>
                      )}
                      <View style={styles.clientInfo}>
                        <Text style={[styles.clientName, { color: "#92400E" }]}>
                          {`${latestPendingRequest.client?.name || ""} ${latestPendingRequest.client?.last_name || ""}`.trim() || "Cliente"}
                        </Text>
                        <Text style={[styles.clientService, { color: "rgba(146, 64, 14, 0.8)" }]}>
                          {latestPendingRequest.service?.name || "Servicio"}
                        </Text>
                      </View>
                      <View style={styles.warningTimeBadge}>
                        <Text style={styles.warningTimeBadgeText}>
                          {latestPendingRequest.start_time ? latestPendingRequest.start_time.substring(0, 5) : "--:--"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.warningCardActions}>
                      <TouchableOpacity
                        style={styles.warningRejectButton}
                        activeOpacity={0.7}
                        onPress={() => handleRejectRequest(latestPendingRequest.id, `${latestPendingRequest.client?.name || ""} ${latestPendingRequest.client?.last_name || ""}`.trim())}
                      >
                        <Text style={styles.warningRejectButtonText}>Rechazar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.warningConfirmButton}
                        activeOpacity={0.7}
                        onPress={() => handleAcceptRequest(latestPendingRequest.id, `${latestPendingRequest.client?.name || ""} ${latestPendingRequest.client?.last_name || ""}`.trim())}
                      >
                        <Text style={styles.warningConfirmButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Quick Actions */}
            <View style={[styles.sectionContainer, { paddingBottom: Platform.OS === "ios" ? 110 : 95 }]}>
              <TouchableOpacity
                style={[styles.outlineButton, { flexDirection: "row", gap: 8 }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("CalendarioProfesional")}
              >
                <MaterialIcons name="calendar-today" size={20} color="#00694c" />
                <Text style={styles.outlineButtonText}>Mi calendario</Text>
              </TouchableOpacity>

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { marginRight: 8 }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("Solicitudes", { user })}
                >
                  <Text style={styles.actionButtonText}>Solicitudes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );
      case "servicios":
        return (
          <ServicesScreen
            user={user}
            navigation={navigation}
            setActiveTab={setActiveTab}
            onUpdateUser={setUser}
          />
        );
      case "perfil":
        return (
          <ProfileScreen
            user={user}
            onUpdateUser={setUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.logo}>alToque</Text>
        {activeTab === "negocio" ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Solicitudes", { user })}
          >
            <View>
              <Feather name="bell" size={24} color="#3d4943" />
              {hasPendingRequests && <View style={styles.notificationDot} />}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavBar
        tabs={professionalTabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00694c",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e11d48',
  },
  mainContent: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  scrollContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    marginVertical: 16,
  },
  sectionContainer: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    marginBottom: 12,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181c1c",
  },
  clientService: {
    fontSize: 13,
    color: "#3d4943",
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: "rgba(0, 105, 76, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00694c",
  },
  outlineButton: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#00694c",
    backgroundColor: "transparent",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
  },
  divider: {
    height: 1,
    backgroundColor: "#bccac1",
    marginVertical: 16,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#92400E",
    borderRadius: 12,
    padding: 16,
  },
  warningCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningTimeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  warningTimeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  warningCardActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  warningRejectButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(146, 64, 14, 0.3)",
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  warningRejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  warningConfirmButton: {
    flex: 1,
    backgroundColor: "#92400E",
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  warningConfirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  rowButtons: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#6d7a73",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181c1c",
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#707d76",
    textAlign: "center",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#ebefed",
    justifyContent: "center",
    alignItems: "center",
  },
});
