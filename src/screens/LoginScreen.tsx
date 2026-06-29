import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../services/api";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login", { email, password });
      const { user, access_token } = response.data;

      if (access_token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      }

      if (user.role === "client") {
        navigation.replace("HomeCliente", { user });
      } else if (user.role === "professional") {
        navigation.replace("HomeProfesional", { user });
      }
    } catch (error: any) {
      console.log(error);
      const errorMsg =
        error.response?.data?.message ||
        "Hubo un problema al conectar con el servidor";
      Alert.alert("Error de Login", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail("");
    setPassword("");
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      Alert.alert("Cancelado", "Campos limpiados");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F6" />

      <View style={styles.header}>
      </View>

      <View style={styles.content}>
        <Text style={styles.logo}>alToque</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="tu@email.com"
              placeholderTextColor="#9AA6A3"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#9AA6A3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Cargando..." : "Ingresar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.footerText}>
            No tenes una cuenta? <Text style={styles.signUpText}>Registrate acá</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 16,
    color: "#7E8B88",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: -40,
  },
  logo: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#056750",
    textAlign: "center",
    marginBottom: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2EAE7",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: "#056750",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#CCD7D3",
    borderRadius: 10,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginVertical: 10,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  inputLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#4D5B57",
  },
  textInput: {
    fontSize: 16,
    color: "#1E2A27",
    padding: 0,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#056750",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  loginButton: {
    height: 50,
    backgroundColor: "#056750",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#056750",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#056750",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    paddingBottom: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#5D6B68",
    fontSize: 15,
  },
  signUpText: {
    color: "#056750",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#5D6B68",
    textAlign: "center",
    marginBottom: 36,
  },
});
