import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeCliente({ route }: any) {
  const { name } = route.params || { name: "Cliente" };
  return (
    <View style={[styles.container, { backgroundColor: "#F5F5F5" }]}>
      <Text style={styles.welcomeText}>¡Hola cliente, {name}!</Text>
      <Text style={styles.subtitle}>
        Pronto verás el listado de profesionales acá al toque.
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
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
});
