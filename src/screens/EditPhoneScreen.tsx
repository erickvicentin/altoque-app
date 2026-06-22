import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";

export default function EditPhoneScreen({ route, navigation }: any) {
  const { user, onUpdateUser } = route.params || {};

  // Parse initial country code and phone number
  const parsePhone = (fullPhone: string) => {
    if (!fullPhone) return { country: "+54", number: "" };
    
    // Check for +54 prefix
    if (fullPhone.startsWith("+54")) {
      return { country: "+54", number: fullPhone.replace("+54", "").trim() };
    }
    
    // Check for general + prefix
    if (fullPhone.startsWith("+")) {
      const match = fullPhone.match(/^(\+\d+)\s*(.*)$/);
      if (match) {
        return { country: match[1], number: match[2].trim() };
      }
    }

    return { country: "+54", number: fullPhone };
  };

  const initialParsed = parsePhone(user.phone);
  
  const [countryCode, setCountryCode] = useState<string>(initialParsed.country);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialParsed.number);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async () => {
    const trimmedNumber = phoneNumber.trim().replace(/\s+/g, "");
    if (!trimmedNumber) {
      Alert.alert("Campo requerido", "Por favor ingresá tu número de teléfono.");
      return;
    }

    // Basic length validation
    if (trimmedNumber.length < 6) {
      Alert.alert("Número inválido", "Por favor ingresá un número de teléfono válido.");
      return;
    }

    const fullPhone = `${countryCode}${trimmedNumber}`;

    setLoading(true);
    try {
      const payload = {
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        phone: fullPhone,
      };

      const response = await api.put("/profile", payload);
      onUpdateUser(response.data.user);
      Alert.alert("Éxito", "Número de celular actualizado correctamente");
      navigation.goBack();
    } catch (error: any) {
      console.log(error);
      const errorMsg =
        error.response?.data?.message ||
        "No se pudo guardar en el servidor. Se actualizó localmente.";
      Alert.alert("Error de guardado", errorMsg);

      // Fallback local
      onUpdateUser({
        ...user,
        phone: fullPhone,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          aria-label="Volver"
        >
          <MaterialIcons name="arrow-back" size={24} color="#00694c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingresá tu celular</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          {/* Instruction Text */}
          <Text style={styles.instruction}>
            Ingresá tu número de teléfono de contacto.
          </Text>

          {/* Input Row */}
          <View style={styles.inputRow}>
            {/* Country Code Selector (Static representation matching HTML spec) */}
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3d4943" />
            </View>

            {/* Phone Number Input */}
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Número"
                placeholderTextColor="#3d4943"
                keyboardType="phone-pad"
                autoFocus={true}
              />
            </View>
          </View>
        </ScrollView>

        {/* Pinned Bottom Action */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e3e1",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  instruction: {
    fontSize: 14,
    color: "#3d4943",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  countryCodeBox: {
    width: 88,
    height: 48,
    backgroundColor: "#f7faf8",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  countryCodeText: {
    fontSize: 14,
    color: "#181c1c",
  },
  phoneInputContainer: {
    flex: 1,
  },
  phoneInput: {
    height: 48,
    width: "100%",
    backgroundColor: "#f7faf8",
    borderWidth: 1.5,
    borderColor: "#00694c", // Primary color border highlights focus/active
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#181c1c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  bottomArea: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "#f7faf8",
  },
  saveButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#00694c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
