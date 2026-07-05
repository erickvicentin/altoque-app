import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../services/api";

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export default function ConfirmarReservaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { professional, selectedService, selectedDate, selectedSlot } = route.params || {};

  const hasPhysicalShop = professional?.isShop ?? professional?.has_physical_shop;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    if (!hasPhysicalShop) {
      fetchAddresses();
    }
  }, [hasPhysicalShop]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await api.get("/addresses");
      const list = response.data || [];
      setAddresses(list);

      // Pre-seleccionar la predeterminada o la primera
      const defaultAddr = list.find((a: any) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id);
      }
    } catch (error) {
      console.error("Error fetching client addresses:", error);
      Alert.alert("Error", "No se pudieron cargar tus direcciones para la visita a domicilio.");
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Formato de fecha: "Lunes, 18 de mayo"
  const getFormattedDate = () => {
    if (!selectedDate) return "";
    const dateObj = new Date(selectedDate);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const dayNumber = dateObj.getDate();
    const monthName = MONTH_NAMES[dateObj.getMonth()];
    return `${dayName}, ${dayNumber} de ${monthName}`;
  };

  const handleConfirmar = async () => {
    if (!hasPhysicalShop && !selectedAddressId) {
      Alert.alert("Dirección Requerida", "Debes seleccionar una dirección para la atención a domicilio.");
      return;
    }

    try {
      const profileId = professional.professional_profile_id || professional.id;
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const cleanSlot = selectedSlot.replace(' hs', '').trim();

      const payload = {
        professional_profile_id: profileId,
        service_id: selectedService.id,
        date: formattedDate,
        start_time: cleanSlot,
        notes: "Reserva realizada desde la app alToque.",
        address_id: !hasPhysicalShop ? selectedAddressId : null,
      };

      await api.post("/appointments", payload);

      Alert.alert(
        "¡Reserva Exitosa!",
        "Tu turno ha sido reservado de forma correcta y está en espera de confirmación.",
        [
          { text: "Aceptar", onPress: () => navigation.navigate("HomeCliente") }
        ]
      );
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      const errorMsg = error.response?.data?.message || "No se pudo concretar la reserva del turno.";
      Alert.alert("Error", errorMsg);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar Operación",
      "¿Estás seguro de que deseas cancelar la reserva de este turno?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, cancelar", 
          style: "destructive", 
          onPress: () => navigation.navigate("ProfessionalProfile", { professional }) 
        }
      ]
    );
  };

  const isConfirmDisabled = !hasPhysicalShop && !selectedAddressId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#008560" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>alToque</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Title */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Revisá el detalle de tu turno</Text>
        </View>

        {/* Stacked Cards Detail */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Service */}
          <View style={styles.detailCard}>
            <View style={styles.cardIconWrapper}>
              <MaterialIcons name="business-center" size={28} color="#008560" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Servicio</Text>
              <Text style={styles.cardValue}>{selectedService?.name || "Servicio no especificado"}</Text>
            </View>
          </View>

          {/* Card 2: Professional */}
          <View style={styles.detailCard}>
            {professional?.image ? (
              <Image source={{ uri: professional.image }} style={styles.professionalAvatar} />
            ) : (
              <View style={[styles.professionalAvatar, styles.avatarPlaceholder]}>
                <Feather name="user" size={24} color="#707d76" />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Profesional</Text>
              <Text style={styles.cardValue}>{professional?.name || "Profesional"}</Text>
            </View>
          </View>

          {/* Card 3: Location / Address Selection */}
          {hasPhysicalShop ? (
            <View style={styles.detailCard}>
              <View style={styles.cardIconWrapper}>
                <Feather name="map-pin" size={24} color="#008560" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Dirección de atención (Local físico)</Text>
                <Text style={styles.cardValue}>{professional?.shop_address || "Dirección del local"}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.detailCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={styles.cardIconWrapper}>
                  <Feather name="home" size={24} color="#008560" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Atención a Domicilio</Text>
                  <Text style={styles.cardValue}>Seleccioná tu dirección:</Text>
                </View>
              </View>

              {loadingAddresses ? (
                <ActivityIndicator size="small" color="#008560" style={{ marginTop: 12 }} />
              ) : addresses.length === 0 ? (
                <View style={styles.noAddressesContainer}>
                  <Text style={styles.noAddressesText}>
                    ⚠️ No tenés direcciones guardadas para recibir la visita a domicilio.
                  </Text>
                  <TouchableOpacity
                    style={styles.addAddressBtn}
                    onPress={() => {
                      Alert.alert(
                        "Dirección Requerida",
                        "Por favor, ve a la pestaña Perfil en la pantalla de inicio y agrega una dirección física para continuar con la reserva."
                      );
                    }}
                  >
                    <Text style={styles.addAddressBtnText}>Cómo agregar una dirección</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addressListContainer}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.addressOption,
                          isSelected && styles.addressOptionSelected
                        ]}
                        onPress={() => setSelectedAddressId(addr.id)}
                      >
                        <View style={styles.addressOptionLeft}>
                          <MaterialIcons 
                            name={isSelected ? "radio-button-checked" : "radio-button-unchecked"} 
                            size={20} 
                            color={isSelected ? "#008560" : "#707d76"} 
                          />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.addressAlias}>{addr.alias}</Text>
                            <Text style={styles.addressLine}>{addr.address_line}</Text>
                          </View>
                        </View>
                        {addr.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Date/Time Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Date Tile */}
          <View style={styles.bentoTile}>
            <View style={styles.tileHeader}>
              <MaterialIcons name="calendar-today" size={20} color="#008560" />
              <Text style={styles.tileLabel}>Fecha</Text>
            </View>
            <Text style={styles.tileValue}>{getFormattedDate()}</Text>
          </View>

          {/* Time Tile */}
          <View style={styles.bentoTile}>
            <View style={styles.tileHeader}>
              <MaterialIcons name="schedule" size={20} color="#008560" />
              <Text style={styles.tileLabel}>Horario</Text>
            </View>
            <Text style={styles.tileValue}>{selectedSlot || "Horario"}</Text>
            <Text style={styles.tileSubvalue}>Turno de {selectedService?.duration_minutes || 30} min</Text>
          </View>
        </View>

        {/* Cost Pill */}
        <View style={styles.costPillContainer}>
          <View style={styles.costPill}>
            <MaterialIcons name="payments" size={20} color="#f5fff7" />
            <Text style={styles.costText}>Costo: ${selectedService ? Math.round(selectedService.price) : 0}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.confirmBtn, isConfirmDisabled && styles.confirmBtnDisabled]} 
            onPress={handleConfirmar} 
            activeOpacity={0.9}
            disabled={isConfirmDisabled}
          >
            <Text style={styles.confirmBtnText}>Confirmar reserva de turno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} activeOpacity={0.9}>
            <Text style={styles.cancelBtnText}>Cancelar operación</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7faf8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e9e7',
    backgroundColor: '#f7faf8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008560',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#181c1c',
    lineHeight: 32,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#f1f4f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e6e9e7',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#707d76',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181c1c',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#707d76',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181c1c',
  },
  tileSubvalue: {
    fontSize: 11,
    color: '#707d76',
    marginTop: 4,
  },
  costPillContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008560',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  costText: {
    color: '#f5fff7',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  confirmBtn: {
    backgroundColor: '#085041',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#bccac1',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#DC3535',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  noAddressesContainer: {
    marginTop: 12,
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  noAddressesText: {
    fontSize: 12,
    color: '#b45309',
    textAlign: 'center',
    lineHeight: 18,
  },
  addAddressBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addAddressBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressListContainer: {
    marginTop: 12,
    gap: 8,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e9e7',
    borderRadius: 8,
    backgroundColor: '#fafcfa',
  },
  addressOptionSelected: {
    borderColor: '#008560',
    backgroundColor: '#f5fff7',
  },
  addressOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressAlias: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#181c1c',
  },
  addressLine: {
    fontSize: 12,
    color: '#707d76',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#ebefed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3d4943',
  },
});
