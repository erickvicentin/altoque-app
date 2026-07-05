import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function BloquearSlot({ navigation }: any) {
  // Estados del formulario
  const [date, setDate] = useState("05 / 07 / 2026");
  const [service, setService] = useState("Corte y Barba - 1 h ($15.000)");
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [timeSlot, setTimeSlot] = useState("16 : 45");
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);

  // Datos del cliente
  const [firstName, setFirstName] = useState("Erick Emanuel");
  const [lastName, setLastName] = useState("Vicentin");
  const [birthDate, setBirthDate] = useState("25 / 11 / 1983");
  const [address, setAddress] = useState("Av. Sarmiento 501");

  // Estado del botón "Bloquear Slot"
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "done">("idle");

  const SERVICES = [
    "Corte y Barba - 1 h ($15.000)",
    "Corte de Pelo - 45 min ($10.000)",
    "Barba - 30 min ($7.000)",
  ];

  const TIME_SLOTS = ["16 : 45", "17 : 30", "18 : 15"];

  const handleBlockSlot = () => {
    if (buttonState !== "idle") return;

    setButtonState("loading");

    // Simulador de validación / guardado
    setTimeout(() => {
      setButtonState("done");

      // Regresar al calendario después de mostrar el éxito
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    }, 1500);
  };

  const renderButtonContent = () => {
    switch (buttonState) {
      case "loading":
        return (
          <View style={styles.buttonContentRow}>
            <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
            <Text style={styles.blockButtonText}>Procesando...</Text>
          </View>
        );
      case "done":
        return (
          <View style={styles.buttonContentRow}>
            <MaterialIcons name="check-circle" size={20} color="#ffffff" />
            <Text style={styles.blockButtonText}>Slot bloqueado</Text>
          </View>
        );
      default:
        return (
          <View style={styles.buttonContentRow}>
            <MaterialIcons name="block" size={20} color="#ffffff" />
            <Text style={styles.blockButtonText}>Bloquear Slot</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00694c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bloquear slot de horario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section 1: Appointment Details */}
        <View style={styles.formSection}>
          {/* Fecha del turno */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha del turno</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="DD / MM / AAAA"
                placeholderTextColor="#bccac1"
              />
              <MaterialIcons
                name="calendar-today"
                size={20}
                color="#3d4943"
                style={styles.inputIcon}
              />
            </View>
          </View>

          {/* Servicio */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Servicio</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => {
                setIsServiceOpen(!isServiceOpen);
                setIsTimeSlotOpen(false);
              }}
            >
              <Text style={styles.dropdownValue}>{service}</Text>
              <MaterialIcons name="expand-more" size={24} color="#3d4943" />
            </TouchableOpacity>
            {isServiceOpen && (
              <View style={styles.dropdownOptions}>
                {SERVICES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionItem}
                    onPress={() => {
                      setService(item);
                      setIsServiceOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        service === item && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Horarios disponibles */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Horarios disponibles según duración del turno</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => {
                setIsTimeSlotOpen(!isTimeSlotOpen);
                setIsServiceOpen(false);
              }}
            >
              <Text style={styles.dropdownValue}>{timeSlot}</Text>
              <MaterialIcons name="expand-more" size={24} color="#3d4943" />
            </TouchableOpacity>
            {isTimeSlotOpen && (
              <View style={styles.dropdownOptions}>
                {TIME_SLOTS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionItem}
                    onPress={() => {
                      setTimeSlot(item);
                      setIsTimeSlotOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        timeSlot === item && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section Divider / Title */}
        <Text style={styles.sectionTitle}>Datos del cliente</Text>

        {/* Form Section 2: Client Data */}
        <View style={styles.formSection}>
          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre(s)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
              />
            </View>
          </View>

          {/* Apellido */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Apellido(s)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
              />
            </View>
          </View>

          {/* Fecha de Nacimiento */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="DD / MM / AAAA"
              />
            </View>
          </View>

          {/* Domicilio */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Domicilio</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Dirección"
              />
              <MaterialIcons
                name="location-on"
                size={20}
                color="#3d4943"
                style={styles.inputIcon}
              />
            </View>
          </View>
        </View>

        {/* Visual Placeholder for context */}
        <View style={styles.placeholderCard}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo8tTWzcCsC88_L15Np_NDrcR-c7R6c91zCJR6nvf1g5bvhyo35oiOQlVRidOk2K2CkPMNb7Id8Igi2tINx06df9c5wq8o7nf52u5IoXmXcjCjamkE5r3lweOq0E-K7wdANhBvJLwR1p1FQCkp4-qqxTDRxdmxp5Hienlx7VZ2cBWWTXZ70yV6YBSn0CY1mg-l_ZseaopFQYgMJnNI5Z1MD6rG-RgYXbraysS_rXlQAA3q_3_QH1-DpoTNKp1rKrLNZILA6oLc2w",
            }}
            style={styles.placeholderImage}
          />
          <View style={styles.placeholderTextContainer}>
            <Text style={styles.placeholderTitle}>Confirmación de bloqueo</Text>
            <Text style={styles.placeholderDescription}>
              Este horario no estará disponible para otros clientes una vez bloqueado.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Bottom Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.blockButton,
            buttonState === "done" && styles.blockButtonDone,
          ]}
          activeOpacity={0.9}
          onPress={handleBlockSlot}
          disabled={buttonState !== "idle"}
        >
          {renderButtonContent()}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#181c1c",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110, // Espacio para el footer
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    height: 48,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#181c1c",
  },
  inputIcon: {
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    height: 48,
    paddingHorizontal: 16,
  },
  dropdownValue: {
    fontSize: 14,
    color: "#181c1c",
  },
  dropdownOptions: {
    borderWidth: 1.5,
    borderColor: "#bccac1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginTop: 4,
    overflow: "hidden",
  },
  optionItem: {
    paddingHorizontal: 16,
    justifyContent: "center",
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f2",
  },
  optionText: {
    fontSize: 14,
    color: "#3d4943",
  },
  optionTextSelected: {
    fontWeight: "600",
    color: "#00694c",
  },
  placeholderCard: {
    backgroundColor: "#f1f4f2",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  placeholderTextContainer: {
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181c1c",
    marginBottom: 4,
  },
  placeholderDescription: {
    fontSize: 13,
    color: "#3d4943",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(247, 250, 248, 0.95)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 233, 231, 0.5)",
  },
  blockButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#00694c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00694c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  blockButtonDone: {
    backgroundColor: "#2f6d5d",
    shadowColor: "#2f6d5d",
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonSpinner: {
    marginRight: 4,
  },
  blockButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
