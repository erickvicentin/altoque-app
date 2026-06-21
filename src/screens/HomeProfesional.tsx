import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileScreen from "./ProfileScreen";
import BottomNavBar, { TabItem } from "./BottomNavBar";

export default function HomeProfesional({ route, navigation }: any) {
  const { user: initialUser } = route.params || {};
  const [user, setUser] = useState(initialUser || { name: "Profesional", role: "professional" });
  const [activeTab, setActiveTab] = useState("negocio");

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
          <View style={styles.tabContent}>
            <View style={styles.placeholderCard}>
              <MaterialIcons name="storefront" size={64} color="#008560" style={styles.placeholderIcon} />
              <Text style={styles.placeholderTitle}>Servicios</Text>
              <Text style={styles.placeholderSubtitle}>
                Acá vas a poder configurar y gestionar los servicios que ofreces al público.
              </Text>
            </View>
          </View>
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
        <Text style={styles.logo}>alToque</Text>
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
  placeholderCard: {
    alignItems: "center",
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: "#3d4943",
    textAlign: "center",
    lineHeight: 22,
  },
});
