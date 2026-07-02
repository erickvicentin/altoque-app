import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

interface ProfessionalDetail {
  name: string;
  category: string;
  image?: string;
  isShop?: boolean;
  specialty: string;
  rating: number;
  reviewsCount: number;
  bio: string;
  completedAppointments: number;
  responseTime: string;
}

const mockDetails: Record<string, ProfessionalDetail> = {
  "Fran Perez": {
    name: "Fran Perez",
    category: "Barbería",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEY3oA3t0G7nVj5yic1n1GshTw8zQv2-qX1i-HS38DPx6gYgMo5h61uR7u0JX_r76uJ6fsnCmXuIppLZlsP-9aY_3UujJVOeUT_8EQl07zHrjHydx-cyPaMy4NqiiTvFJddAcQPJ8D693OpN3g5Xf91NmIdA1GQHiGAQGBWNkvfloone9PztnCkR6BvlB82DS-CHttO_2_ZZWE3zwVkORosffFq_YIQRVxIjJW8XbfLGSfhjDMXlE-jq5YjI-bpLyozrPSiZfpSA",
    specialty: "Servicios de corte y barbería",
    rating: 4.9,
    reviewsCount: 15,
    bio: "Con 7 años de experiencia en el rubro, me especializo en cortes clásicos y modernos, así como en perfilado y cuidado de barba. Mi objetivo es que cada cliente salga de mi sillón sintiéndose su mejor versión, con un servicio rápido, prolijo y en un ambiente relajado.",
    completedAppointments: 24,
    responseTime: "2 hs",
  },
  "Carlos Gomez": {
    name: "Carlos Gomez",
    category: "Electricidad",
    image: "https://i.pravatar.cc/150?img=33",
    specialty: "Instalaciones eléctricas y reparaciones",
    rating: 4.8,
    reviewsCount: 22,
    bio: "Electricista matriculado con amplia trayectoria en reparaciones hogareñas y comerciales. Especialista en cortocircuitos, cableados completos, tableros eléctricos y colocación de luminarias. Trabajo garantizado y presupuestos sin cargo.",
    completedAppointments: 58,
    responseTime: "1 hs",
  },
  "ElectroHogar": {
    name: "ElectroHogar",
    category: "Electricidad",
    isShop: true,
    specialty: "Servicio técnico y venta de repuestos",
    rating: 4.1,
    reviewsCount: 8,
    bio: "Somos un local comercial dedicado a la reparación de electrodomésticos y venta de artículos eléctricos. Ofrecemos servicio técnico a domicilio para equipos grandes y atención en nuestro taller para dispositivos pequeños.",
    completedAppointments: 110,
    responseTime: "4 hs",
  },
  "Luis Martinez": {
    name: "Luis Martinez",
    category: "Electricidad",
    image: "https://i.pravatar.cc/150?img=59",
    specialty: "Electricidad residencial",
    rating: 4.5,
    reviewsCount: 14,
    bio: "Ofrezco servicios de electricidad en general para el hogar. Reparación de enchufes, llaves de luz, instalaciones de aire acondicionado y urgencias las 24 horas. Rapidez y confianza a tu servicio.",
    completedAppointments: 32,
    responseTime: "30 min",
  },
  "Ana Silva": {
    name: "Ana Silva",
    category: "Pilates",
    image: "https://i.pravatar.cc/150?img=5",
    specialty: "Clases particulares de Pilates y Postura",
    rating: 5.0,
    reviewsCount: 30,
    bio: "Instructora certificada de Pilates Reformer y Mat. Me enfoco en la rehabilitación postural, tonificación y flexibilidad. Clases adaptadas a tus necesidades y nivel, con seguimiento personalizado para cumplir tus objetivos.",
    completedAppointments: 85,
    responseTime: "1 hs",
  },
  "Estudio Zen": {
    name: "Estudio Zen",
    category: "Pilates",
    isShop: true,
    specialty: "Centro integral de Pilates y Yoga",
    rating: 4.6,
    reviewsCount: 18,
    bio: "Un espacio pensado para tu bienestar físico y mental. Ofrecemos clases grupales e individuales de Pilates con equipamiento moderno. Profesores capacitados y ambiente climatizado para que disfrutes tu entrenamiento.",
    completedAppointments: 142,
    responseTime: "3 hs",
  },
  "Muebles López": {
    name: "Muebles López",
    category: "Carpintería",
    isShop: true,
    specialty: "Fábrica y restauración de muebles",
    rating: 4.7,
    reviewsCount: 45,
    bio: "Empresa familiar con más de 20 años diseñando y fabricando muebles de madera a medida. Nos especializamos en bajo mesadas, placares y restauración de piezas antiguas de calidad. Materiales de primera línea y terminaciones excelentes.",
    completedAppointments: 210,
    responseTime: "5 hs",
  },
  "Mario Rojas": {
    name: "Mario Rojas",
    category: "Carpintería",
    image: "https://i.pravatar.cc/150?img=15",
    specialty: "Carpintería artesanal e instalaciones",
    rating: 4.2,
    reviewsCount: 7,
    bio: "Carpintero con experiencia en colocación de aberturas, armado de muebles prefabricados, arreglos de puertas, cajones y trabajos en madera en general. Soluciones rápidas y prolijas para tu casa.",
    completedAppointments: 19,
    responseTime: "3 hs",
  },
  "Diego Torres": {
    name: "Diego Torres",
    category: "Carpintería",
    image: "https://i.pravatar.cc/150?img=60",
    specialty: "Diseño y armado de interiores",
    rating: 4.9,
    reviewsCount: 25,
    bio: "Diseño muebles modernos a medida en melamina y madera maciza. Placares, vestidores, estanterías flotantes y racks de TV. Excelente asesoramiento en optimización de espacios y renderizado 3D de proyectos.",
    completedAppointments: 40,
    responseTime: "2 hs",
  },
  "Barbershop": {
    name: "Barbershop",
    category: "Barbería",
    isShop: true,
    specialty: "Peluquería y barbería express",
    rating: 3.7,
    reviewsCount: 12,
    bio: "Cadena de barberías con atención al paso. Cortes clásicos, degradados (fade) y afeitado tradicional. No requiere turno previo, vení cuando quieras. Contamos con un equipo dinámico y los mejores productos.",
    completedAppointments: 130,
    responseTime: "15 min",
  },
  "Robert Draw": {
    name: "Robert Draw",
    category: "Barbería",
    image: "https://i.pravatar.cc/150?img=14",
    specialty: "Estilista masculino y cortes de tendencia",
    rating: 5.0,
    reviewsCount: 4,
    bio: "Especialista en cortes urbanos de última tendencia, diseños artísticos con navaja (tribales, líneas) y colorimetría masculina. Si buscás un cambio de look radical o un estilo único, este es tu lugar.",
    completedAppointments: 10,
    responseTime: "1 hs",
  },
};

const getProfessionalDetail = (
  name: string,
  category: string,
  rating: number,
  reviewsCount: number,
  image?: string,
  isShop?: boolean
): ProfessionalDetail => {
  if (mockDetails[name]) {
    return mockDetails[name];
  }
  return {
    name,
    category,
    image,
    isShop,
    specialty: `Servicios de ${category.toLowerCase()}`,
    rating: rating || 5.0,
    reviewsCount: reviewsCount || 0,
    bio: `Profesional independiente especializado en ${category.toLowerCase()}. Comprometido con brindar una excelente calidad de atención y soluciones eficientes para cada cliente.`,
    completedAppointments: Math.floor(Math.random() * 30) + 5,
    responseTime: "1-2 hs",
  };
};

export default function ProfessionalProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Extract professional details passed from SearchResultsScreen
  const { professional } = route.params || {};

  if (!professional) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se cargó la información del profesional.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get full details (matching mockDetails or fallback generator)
  const detail = getProfessionalDetail(
    professional.name,
    professional.category || "Servicios",
    professional.rating,
    professional.reviews,
    professional.image,
    professional.isShop
  );

  const handleVerDisponibilidad = () => {
    Alert.alert("Disponibilidad", `Mostrando agenda disponible para ${detail.name}`);
  };

  const handleVerOpiniones = () => {
    Alert.alert("Opiniones", `Mostrando ${detail.reviewsCount} opiniones de ${detail.name}`);
  };

  const handleContactarWhatsApp = () => {
    Alert.alert("WhatsApp", `Abriendo chat de WhatsApp con ${detail.name}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* Header / TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#00694c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {detail.isShop ? (
              <View style={styles.shopIconCircle}>
                <Feather name="shopping-bag" size={54} color="#008560" />
              </View>
            ) : detail.image ? (
              <Image source={{ uri: detail.image }} style={styles.avatar} />
            ) : (
              <View style={styles.shopIconCircle}>
                <Feather name="user" size={54} color="#008560" />
              </View>
            )}
          </View>
          <Text style={styles.specialtyText}>{detail.specialty}</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={18} color="#00694c" />
            <Text style={styles.ratingValue}>{detail.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsCount}>
              ({detail.reviewsCount} {detail.reviewsCount === 1 ? "reseña" : "reseñas"})
            </Text>
          </View>
        </View>

        {/* Bio Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sobre {detail.name.split(" ")[0]}</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{detail.bio}</Text>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridColPrimary}>
            <Text style={styles.gridLabelPrimary}>TURNOS COMPLETADOS</Text>
            <Text style={styles.gridValuePrimary}>{detail.completedAppointments}</Text>
          </View>
          <View style={styles.gridColSecondary}>
            <Text style={styles.gridLabelSecondary}>TIEMPO DE RESPUESTA</Text>
            <Text style={styles.gridValueSecondary}>{detail.responseTime}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleVerDisponibilidad}
          >
            <Text style={styles.primaryButtonText}>Ver disponibilidad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleVerOpiniones}
          >
            <Text style={styles.outlineButtonText}>Ver opiniones</Text>
          </TouchableOpacity>
        </View>

        {/* WhatsApp Button */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleContactarWhatsApp}
        >
          <Feather name="message-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappButtonText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>

        {/* Extra spacing at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ba1a1a",
    textAlign: "center",
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#00694c",
    borderRadius: 8,
  },
  backBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#bccac1",
    backgroundColor: "#f7faf8",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181c1c",
    flex: 1,
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#bccac1",
    backgroundColor: "#e0e3e1",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  shopIconCircle: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  specialtyText: {
    fontSize: 14,
    color: "#3d4943",
    fontWeight: "400",
    marginBottom: 8,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00694c",
  },
  reviewsCount: {
    fontSize: 11,
    color: "#3d4943",
    fontWeight: "600",
    marginLeft: 4,
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  bioCard: {
    backgroundColor: "#f7faf8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bccac1",
    padding: 16,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#3d4943",
  },
  gridContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  gridColPrimary: {
    flex: 1,
    backgroundColor: "#adedd8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bccac1",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  gridColSecondary: {
    flex: 1,
    backgroundColor: "#f7faf8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bccac1",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  gridLabelPrimary: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2f6d5d",
    textAlign: "center",
  },
  gridValuePrimary: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2f6d5d",
  },
  gridLabelSecondary: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3d4943",
    textAlign: "center",
  },
  gridValueSecondary: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
  },
  actionsContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  primaryButton: {
    height: 48,
    backgroundColor: "#00694c",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  outlineButton: {
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#00694c",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#00694c",
    fontSize: 14,
    fontWeight: "600",
  },
  whatsappButton: {
    height: 56,
    backgroundColor: "#25D366",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
