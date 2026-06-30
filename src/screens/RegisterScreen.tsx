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
  StatusBar,
  Modal,
  FlatList,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../services/api";

export default function RegisterScreen({ navigation }: any) {
  const [role, setRole] = useState<"client" | "professional">("client");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  // animaciones para el switch deslizante
  const [slideAnim] = useState(new Animated.Value(0));
  const [containerWidth, setContainerWidth] = useState(0);

  const professions = ["Pilates", "Barberia", "Carpinteria", "Electricidad"];
  const genderOptions =
    role === "client"
      ? ["Hombre", "Mujer", "Prefiero no decirlo"]
      : ["Mujer", "Hombre", "Otro"];

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    address_line: "",
    birth_date: "",
    gender: "",
    profession: "",
    has_physical_shop: false,
    shop_address: "",
  });

  const selectRole = (selectedRole: "client" | "professional") => {
    setRole(selectedRole);
    Animated.timing(slideAnim, {
      toValue: selectedRole === "client" ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    //ocultar datepicker en android
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      setDateOfBirth(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFormData({
        ...formData,
        birth_date: `${year}-${month}-${day}`,
      });
    }
  };

  const getDisplayDate = () => {
    if (!formData.birth_date) return "";
    const parts = formData.birth_date.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (role === "client") {
        return `${day}/${month}/${year}`;
      } else {
        return `${month}/${day}/${year}`;
      }
    }
    return formData.birth_date;
  };

  const handleRegister = async () => {
    // validar campos principales
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert("Error", "Por favor, completa los campos obligatorios");
      return;
    }

    // validar contraseña mínimo 6 caracteres
    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // validar mayor de 18 años
    if (!formData.birth_date) {
      Alert.alert("Error", "Por favor, completa tu fecha de nacimiento");
      return;
    }

    const birthDateObj = new Date(formData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      Alert.alert(
        "Error de edad",
        "Debes ser mayor de 18 años para registrarte",
      );
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        "Términos y Condiciones",
        "Debes aceptar los Términos de Servicio y la Política de Privacidad para registrarte",
      );
      return;
    }

    let apiName = formData.name.trim();
    let apiLastName = formData.last_name.trim();

    let payload: any = {};

    if (role === "client") {
      if (!formData.last_name) {
        Alert.alert("Error", "Por favor, completa tu apellido");
        return;
      }
      if (!formData.address_line) {
        Alert.alert("Error", "Por favor, completa tu domicilio");
        return;
      }

      payload = {
        email: formData.email.trim(),
        password: formData.password,
        name: apiName,
        last_name: apiLastName,
        role: "client",
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        address_line: formData.address_line.trim(),
      };
    } else {
      // Profesional
      if (!formData.last_name) {
        Alert.alert("Error", "Por favor, completa tu apellido");
        return;
      }

      if (!formData.profession) {
        Alert.alert("Error", "Por favor, selecciona una profesión");
        return;
      }

      if (formData.has_physical_shop && !formData.shop_address) {
        Alert.alert(
          "Error",
          "Por favor, completa la dirección de tu local físico",
        );
        return;
      }

      payload = {
        email: formData.email.trim(),
        password: formData.password,
        name: apiName,
        last_name: apiLastName,
        role: "professional",
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        profession: formData.profession,
        has_physical_shop: formData.has_physical_shop,
        shop_address: formData.has_physical_shop
          ? formData.shop_address.trim()
          : null,
      };
    }

    setLoading(true);
    try {
      await api.post("/register", payload);

      Alert.alert("¡Éxito!", "Usuario creado correctamente");
      navigation.replace("Login");
    } catch (error: any) {
      let msg = "Error al registrar";
      if (error.response?.data) {
        if (error.response.data.errors) {
          const validationErrors = Object.values(
            error.response.data.errors,
          ).flat();
          msg = validationErrors.join("\n");
        } else {
          msg = error.response.data.message || msg;
        }
      }
      Alert.alert("Error de registro", msg);
    } finally {
      setLoading(false);
    }
  };

  const selectProfession = (prof: string) => {
    setFormData({ ...formData, profession: prof });
    setShowProfessionModal(false);
  };

  const toggleGender = (selectedGender: string) => {
    setFormData({ ...formData, gender: selectedGender });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F6" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContainer} onLayout={onContainerLayout}>
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.tabBackgroundActive,
                {
                  width: containerWidth / 2 - 4,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, containerWidth / 2 - 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => selectRole("client")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                role === "client" && styles.tabTextActive,
              ]}
            >
              Cliente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => selectRole("professional")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                role === "professional" && styles.tabTextActive,
              ]}
            >
              Profesional
            </Text>
          </TouchableOpacity>
        </View>

        {role === "professional" && (
          <Text style={styles.subtitleHeader}>
            Únete a nuestra red de profesionales
          </Text>
        )}
        {role === "client" && (
          <Text style={styles.subtitleHeader}>
            Crea tu cuenta para empezar a usar alToque
          </Text>
        )}

        <View style={styles.card}>
          {role === "client" ? (
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="tu@email.com"
                    placeholderTextColor="#9AA6A3"
                    value={formData.email}
                    onChangeText={(v) => setFormData({ ...formData, email: v })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9AA6A3"
                    value={formData.password}
                    onChangeText={(v) =>
                      setFormData({ ...formData, password: v })
                    }
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconRight}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#8A9A96"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre(s)</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Juan"
                    placeholderTextColor="#9AA6A3"
                    value={formData.name}
                    onChangeText={(v) => setFormData({ ...formData, name: v })}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Apellido(s)</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Pérez"
                    placeholderTextColor="#9AA6A3"
                    value={formData.last_name}
                    onChangeText={(v) =>
                      setFormData({ ...formData, last_name: v })
                    }
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Domicilio</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="map-pin"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Calle, Número, Ciudad"
                    placeholderTextColor="#9AA6A3"
                    value={formData.address_line}
                    onChangeText={(v) =>
                      setFormData({ ...formData, address_line: v })
                    }
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de Nacimiento</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather
                    name="calendar"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <Text
                    style={[
                      styles.textInput,
                      !formData.birth_date && { color: "#9AA6A3" },
                      { lineHeight: 48 },
                    ]}
                  >
                    {getDisplayDate() || "DD/MM/AA"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Género</Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, styles.selectTrigger]}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !formData.gender && styles.selectPlaceholder,
                    ]}
                  >
                    {formData.gender || "Selecciona un género"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconRight}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                <View style={[styles.inputWrapper, styles.inputWithIcon]}>
                  <Feather
                    name="mail"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="tu@email.com"
                    placeholderTextColor="#9AA6A3"
                    value={formData.email}
                    onChangeText={(v) => setFormData({ ...formData, email: v })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Contraseña</Text>
                <View style={[styles.inputWrapper, styles.inputWithIcon]}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9AA6A3"
                    value={formData.password}
                    onChangeText={(v) =>
                      setFormData({ ...formData, password: v })
                    }
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconRight}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#8A9A96"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre(s)</Text>
                <View style={[styles.inputWrapper, styles.inputWithIcon]}>
                  <Feather
                    name="user"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. María"
                    placeholderTextColor="#9AA6A3"
                    value={formData.name}
                    onChangeText={(v) => setFormData({ ...formData, name: v })}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Apellido(s)</Text>
                <View style={[styles.inputWrapper, styles.inputWithIcon]}>
                  <Feather
                    name="user"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. Pérez"
                    placeholderTextColor="#9AA6A3"
                    value={formData.last_name}
                    onChangeText={(v) =>
                      setFormData({ ...formData, last_name: v })
                    }
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Profesión principal</Text>
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    styles.inputWithIcon,
                    styles.selectTrigger,
                  ]}
                  onPress={() => setShowProfessionModal(true)}
                >
                  <Feather
                    name="briefcase"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <Text
                    style={[
                      styles.selectText,
                      !formData.profession && styles.selectPlaceholder,
                    ]}
                  >
                    {formData.profession || "Selecciona una profesión"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconRight}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleContainer}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>
                    Activar domicilio de atención
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    Para brindar servicios en un lugar físico
                  </Text>
                </View>
                <Switch
                  value={formData.has_physical_shop}
                  onValueChange={(v) =>
                    setFormData({ ...formData, has_physical_shop: v })
                  }
                  trackColor={{ false: "#E2EAE7", true: "#056750" }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E2EAE7"
                />
              </View>

              {formData.has_physical_shop && (
                <View style={[styles.fieldGroup, { marginTop: 12 }]}>
                  <View style={[styles.inputWrapper, styles.inputWithIcon]}>
                    <Feather
                      name="map-pin"
                      size={20}
                      color="#8A9A96"
                      style={styles.iconLeft}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Calle, Número, Ciudad"
                      placeholderTextColor="#9AA6A3"
                      value={formData.shop_address}
                      onChangeText={(v) =>
                        setFormData({ ...formData, shop_address: v })
                      }
                    />
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Género (Opcional)</Text>
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    styles.inputWithIcon,
                    styles.selectTrigger,
                  ]}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Feather
                    name="user"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <Text
                    style={[
                      styles.selectText,
                      !formData.gender && styles.selectPlaceholder,
                    ]}
                  >
                    {formData.gender || "Selecciona un género"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconRight}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, styles.inputWithIcon]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather
                    name="calendar"
                    size={20}
                    color="#8A9A96"
                    style={styles.iconLeft}
                  />
                  <Text
                    style={[
                      styles.textInput,
                      !formData.birth_date && { color: "#9AA6A3" },
                      { lineHeight: 48 },
                    ]}
                  >
                    {getDisplayDate() || "mm/dd/yyyy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            {acceptedTerms && (
              <Feather name="check" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            He leído y acepto los{" "}
            <Text style={styles.termsLink}>Términos de Servicio</Text> y la{" "}
            <Text style={styles.termsLink}>Política de Privacidad</Text> de
            alToque.
          </Text>
        </View>

        {role === "client" ? (
          <View style={styles.clientButtonsRow}>
            <TouchableOpacity
              style={styles.cancelButtonOutlined}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButtonSolid}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Registrando..." : "Registrarse"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.professionalButtonsColumn}>
            <TouchableOpacity
              style={styles.submitButtonSolid}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Registrando..." : "Crear cuenta profesional"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButtonSoftBg}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.cancelButtonSoftText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showProfessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu Profesión</Text>
            <FlatList
              data={professions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => selectProfession(item)}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                  {formData.profession === item && (
                    <Feather name="check" size={20} color="#056750" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProfessionModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu género</Text>
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, gender: item });
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                  {formData.gender === item && (
                    <Feather name="check" size={20} color="#056750" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {Platform.OS === "ios" ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const selectDate =
                      dateOfBirth ||
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18),
                      );
                    setDateOfBirth(selectDate);
                    const day = String(selectDate.getDate()).padStart(2, "0");
                    const month = String(selectDate.getMonth() + 1).padStart(
                      2,
                      "0",
                    );
                    const year = selectDate.getFullYear();
                    setFormData({
                      ...formData,
                      birth_date: `${year}-${month}-${day}`,
                    });
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.iosModalConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={
                  dateOfBirth ||
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18),
                  )
                }
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  if (date) setDateOfBirth(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={
              dateOfBirth ||
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
            }
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setDateOfBirth(date);
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                setFormData({
                  ...formData,
                  birth_date: `${year}-${month}-${day}`,
                });
              }
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subtitleHeader: {
    fontSize: 16,
    color: "#4D5B57",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  tabContainer: {
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flexDirection: "row",
    backgroundColor: "#E8ECEB",
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    position: "relative",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 22,
    zIndex: 1,
  },
  tabBackgroundActive: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "#7E8B88",
    fontWeight: "600",
    fontSize: 15,
  },
  tabTextActive: {
    color: "#056750",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2EAE7",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#056750",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3A37",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9F8",
    borderWidth: 1,
    borderColor: "#E2EAE7",
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingLeft: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#2D3A37",
    padding: 0,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  selectTrigger: {
    justifyContent: "space-between",
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: "#2D3A37",
  },
  selectPlaceholder: {
    color: "#9AA6A3",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2EAE7",
    marginVertical: 16,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2EAE7",
    backgroundColor: "#F7F9F8",
  },
  chipActive: {
    borderColor: "#056750",
    backgroundColor: "#E6F0EE",
  },
  chipText: {
    fontSize: 14,
    color: "#5D6B68",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#056750",
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2D3A37",
  },
  toggleSubtitle: {
    fontSize: 12,
    color: "#7E8B88",
    marginTop: 2,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#CCD7D3",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    borderColor: "#056750",
    backgroundColor: "#056750",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#5D6B68",
    lineHeight: 18,
  },
  termsLink: {
    color: "#056750",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  clientButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButtonOutlined: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#056750",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#056750",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonSolid: {
    flex: 1,
    height: 50,
    backgroundColor: "#056750",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  professionalButtonsColumn: {
    gap: 12,
  },
  cancelButtonSoftBg: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2EAE7",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7F6",
  },
  cancelButtonSoftText: {
    color: "#5D6B68",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3A37",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7F6",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#2D3A37",
  },
  modalCloseButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#E8ECEB",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#4D5B57",
    fontSize: 16,
    fontWeight: "bold",
  },
  // iOS Modal Styles
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  iosModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  iosModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7F6",
  },
  iosModalCancelText: {
    fontSize: 16,
    color: "#5D6B68",
    fontWeight: "500",
  },
  iosModalConfirmText: {
    fontSize: 16,
    color: "#056750",
    fontWeight: "bold",
  },
});
