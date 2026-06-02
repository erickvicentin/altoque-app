import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import api from "../services/api";

export default function HomeProfesional({ route, navigation }: any) {
  const { name } = route.params || { name: "Profesional" };

  const handleLogout = async () => {
    try {
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <Text style={[styles.welcomeText, { color: "#FF6D00" }]}>
        ¡Hola profesional, {name}!
      </Text>
      <Text style={styles.subtitle}>
        Acá vas a gestionar tu agenda de turnos asignados.
      </Text>

      {/* BOTÓN DE CERRAR SESIÓN */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#FF3B30", // Un color rojo suave para indicar "salida/peligro"
    fontSize: 16,
    fontWeight: "600",
  },
});
