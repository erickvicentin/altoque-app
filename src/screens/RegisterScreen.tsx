import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import api from "../services/api";

export default function RegisterScreen({ navigation }: any) {
  const [role, setRole] = useState<"client" | "professional">("client");
  const [loading, setLoading] = useState(false);

  // Estados comunes
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    phone: "",
    address_line: "", // Para cliente
    profession: "Barberia", // Para pro (valor por defecto)
    has_physical_shop: false, // Para pro
    shop_address: "", // Para pro
  });

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await api.post("/register", {
        ...formData,
        role: role,
      });

      Alert.alert("¡Éxito!", "Usuario creado correctamente");
      navigation.replace("Login");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al registrar";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>Crear Cuenta</Text>

      {/* SWITCH DE ROL (Selector tipo Figma) */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "client" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("client")}
        >
          <Text
            style={[
              styles.roleText,
              role === "client" && styles.roleTextActive,
            ]}
          >
            Cliente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "professional" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("professional")}
        >
          <Text
            style={[
              styles.roleText,
              role === "professional" && styles.roleTextActive,
            ]}
          >
            Profesional
          </Text>
        </TouchableOpacity>
      </View>

      {/* CAMPOS COMUNES */}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        onChangeText={(v) => setFormData({ ...formData, name: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellido"
        onChangeText={(v) => setFormData({ ...formData, last_name: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(v) => setFormData({ ...formData, email: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={(v) => setFormData({ ...formData, password: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        keyboardType="phone-pad"
        onChangeText={(v) => setFormData({ ...formData, phone: v })}
      />

      {/* CAMPOS DINÁMICOS SEGÚN ROL */}
      {role === "client" ? (
        <TextInput
          style={styles.input}
          placeholder="Dirección Principal (Calle, N°, Ciudad)"
          onChangeText={(v) => setFormData({ ...formData, address_line: v })}
        />
      ) : (
        <View>
          <Text style={styles.label}>Rubro Profesional:</Text>
          <View style={styles.pickerContainer}>
            {["Pilates", "Barberia", "Carpinteria", "Electricidad"].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  formData.profession === p && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, profession: p })}
              >
                <Text
                  style={formData.profession === p ? { color: "white" } : {}}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text>¿Tienes local físico?</Text>
            <Switch
              value={formData.has_physical_shop}
              onValueChange={(v) =>
                setFormData({ ...formData, has_physical_shop: v })
              }
            />
          </View>

          {formData.has_physical_shop && (
            <TextInput
              style={styles.input}
              placeholder="Dirección del Local"
              onChangeText={(v) =>
                setFormData({ ...formData, shop_address: v })
              }
            />
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Procesando..." : "Registrarme"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", padding: 25 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 40,
    color: "#212121",
  },
  roleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
  roleText: { color: "#666", fontWeight: "500" },
  roleTextActive: { color: "#00C853", fontWeight: "bold" },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 15,
    fontSize: 16,
  },
  label: { fontSize: 14, color: "#666", marginBottom: 10 },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipActive: { backgroundColor: "#00C853", borderColor: "#00C853" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#00C853",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
