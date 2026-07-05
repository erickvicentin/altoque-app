import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
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
        return (
          <View style={styles.tabContent}>
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeText}>¡Hola profesional, {user.name}!</Text>
              <Text style={styles.subtitle}>
                Acá vas a gestionar tu agenda de turnos asignados.
              </Text>
            </View>
          </View>
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
        <Text style={styles.logo}>{TABS_NAMES[activeTab] || "alToque"}</Text>
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
    color: "#181c1c",
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
  tabContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 100, // Safe space for bottom tab bar
  },
  welcomeCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#3d4943",
    textAlign: "center",
    lineHeight: 22,
  },
});
