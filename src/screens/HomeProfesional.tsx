import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeProfesional({ route }: any) {
  const { name } = route.params || { name: "Profesional" };
  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <Text style={[styles.welcomeText, { color: "#FF6D00" }]}>
        ¡Hola profesional, {name}!
      </Text>
      <Text style={styles.subtitle}>
        Acá vas a gestionar tu agenda de turnos asignados.
      </Text>
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
});
