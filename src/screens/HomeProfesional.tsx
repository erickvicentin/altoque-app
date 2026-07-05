import React, { useState, useCallback, useEffect } from "react";
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
  const [knownPendingIds, setKnownPendingIds] = useState<number[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);



  const TABS_NAMES: Record<string, string> = {
    "negocio": "Mi negocio",
    "servicios": "Mis Servicios",
    "perfil": "Mi Perfil",
  };

  const checkPendingRequests = async (isPoll = false) => {
    try {
      const response = await api.get("/appointments");
      const list = response.data || [];
      const pendingApps = list.filter((app: any) => app.status === "pending");
      
      const pendingIds = pendingApps.map((app: any) => app.id);
      
      setHasPendingRequests(pendingApps.length > 0);

      if (isPoll && !isInitialLoad) {
        // Detectar si hay IDs nuevos que no estaban en knownPendingIds
        const newRequests = pendingIds.filter((id: number) => !knownPendingIds.includes(id));
        if (newRequests.length > 0) {
          // Disparar notificación nativa del teléfono (OS Banner)
          // No native notification to avoid emulator crash, dot update is enough
          console.log("Nueva Solicitud de Turno: Tenés una nueva solicitud de turno pendiente de revisión en Novedades.");
        }
      }

      setKnownPendingIds(pendingIds);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error checking pending requests:", error);
    }
  };

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
    }, [knownPendingIds, isInitialLoad])
  );

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
        return (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <Text style={styles.welcomeText}>Buenos días, {firstName} 👋</Text>

            {/* Tus próximos clientes */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Tus próximos clientes</Text>
              
              {/* Card 1 */}
              <View style={styles.clientCard}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD991lyhiuuAvLYYJkcDbnS4X2jq0Y-gi-fQtYVTPzyc7W9BhC-9JuGhKDY9E5O3WQhaczbWn06_LWDZKEOgb5yIK4HDivN9Rq9qzhj4QmpTKzydhSyaQOeOOIZwET8N7BveTuz_11Se7fuFzEgzBElCy5l2-M3g52vQN0wbtOe-i_OiCUtkf6tJxNkmeNM9ZYYnHOuXxm1P2mruQvvPQx8GmUdhEr4QyFttahZk5ByVgHwAkakHOkSwEyBrQ4arN9VXUoTkzpvcQ" }}
                  style={styles.clientAvatar}
                />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>María López</Text>
                  <Text style={styles.clientService}>Corte + Barba</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>10:00</Text>
                </View>
              </View>

              {/* Card 2 */}
              <View style={styles.clientCard}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsIEa1df9VW4fbw_dRZDCLuBAhW9QpJbtw2aSjBbq_v_mpiydiY5zv170JxW0oNwELJI9YPzo7NGfP1wh9iRSVl5ncQzv-FIMWyoUTU26_Slby9jd49poT3XxLeVeNBnfId3M1n-77dSS_ObGQ3jsDZIBrI7mLUBZRRXaCpcqWSNSRL5I9uVDNDe8wbon1RSbG4v5olGkjp4VY01kOjBEPniaW66nKAIxcwpHbTvqiU6cxFHZHLA_82Hwgm7EeUm89JxaBpX6nhg" }}
                  style={styles.clientAvatar}
                />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>Lucas Gómez</Text>
                  <Text style={styles.clientService}>Solo Corte</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>11:30</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.outlineButton} activeOpacity={0.7}>
                <Text style={styles.outlineButtonText}>Ver más</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Confirmación pendiente */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Confirmación pendiente</Text>

              {/* Warning Card */}
              <View style={styles.warningCard}>
                <View style={styles.warningCardHeader}>
                  <Image
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWEisCu0iiID-HIHkHBtAosLAYxdUD8qW7z1q1BKuWxiSE_KfUPV1Ltxy5xuijGpAW10vtBArN9AAgPN7NcXvhZVFPtnSV_OaZ6q-oi89k6a_G9KDrOU69AtrEHWzkusIYMjhzIJOPxk6OkFLWsv4o4cfG5PWMP6s7npNQzl0vulFM1jhfDAMaHM6Ooq4fRodyHk6NU9MaMZUcmkERlKE4XXnBLtbtii2NceB-q8sm-RE6ni1Vm206L4mMrDoIl5LaoyIkNVrwIg" }}
                    style={styles.clientAvatar}
                  />
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { color: "#92400E" }]}>Sofía Martínez</Text>
                    <Text style={[styles.clientService, { color: "rgba(146, 64, 14, 0.8)" }]}>Coloración</Text>
                  </View>
                  <View style={styles.warningTimeBadge}>
                    <Text style={styles.warningTimeBadgeText}>15:00</Text>
                  </View>
                </View>
                
                <View style={styles.warningCardActions}>
                  <TouchableOpacity style={styles.warningRejectButton} activeOpacity={0.7}>
                    <Text style={styles.warningRejectButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.warningConfirmButton} activeOpacity={0.7}>
                    <Text style={styles.warningConfirmButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

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
                <TouchableOpacity style={[styles.actionButton, { marginLeft: 8 }]} activeOpacity={0.7}>
                  <Text style={styles.actionButtonText}>Ver reseñas</Text>
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("Solicitudes", { user })}
        >
          <View>
            <Feather name="bell" size={24} color="#3d4943" />
            {hasPendingRequests && <View style={styles.notificationDot} />}
          </View>
        </TouchableOpacity>
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
});
