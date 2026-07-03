import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface Appointment {
  id: string;
  serviceName: string;
  professionalName: string;
  timeText: string;
  imageUrl: string;
  isPrimaryColor: boolean; // Indica si el texto/icono del evento usa el color primary o tertiary-container
}

export default function ClientAppointmentsScreen() {
  const navigation = useNavigation<any>();

  const appointments: Appointment[] = [
    {
      id: "1",
      serviceName: "Corte Clásico",
      professionalName: "Juan Perez",
      timeText: "Mañana, 10:00 AM",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBDyBj5TaecCAsFprwmZlD-c_anCrDnZEWxM-CqeCMhA1JvXkvukrUqERYryCCSqSydbCIU0NH8dXPKIGdjvDTfB_At78BYA1ZVbCJ0x1bA9m0fW7rMiCPaUAnqPvcKIDbntAyB6sWlCy_DQfrB_AoAtmqX22s3e57HPvE2ZvsfIe_5DersGjw4_gqTGkzD2YejCuzqaRBsR2LRfbtw6kHYZ0hxg5q0pAgVFmbPfYC8OBJZq4YBBEPUidEZ5qvi03mG7oiXQrsnVA",
      isPrimaryColor: true,
    },
    {
      id: "2",
      serviceName: "Masaje Descontracturante",
      professionalName: "Maria Rossi",
      timeText: "Jueves 24, 15:30",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCbAQn6O1hmn8DZp8XfSjQ0BaFPLF263EjoWQZsHJNPk3RmsAAvVGn8WFyuJG_XRRkSo6rn7tNh-bqvY1sBskBhzlpCkA-9sDysPfmdAhfvGJ40EKY-ivDL91iXX2u8BXWeT7RNUUW5TbaCN60Ld6V-LojB9hXfhSgvBGuNyWhAhgsM_B5R7qm0Lz9Ay-Oh8_VLZMvAvVj1TXi724WKgCbyzyHGE0Gyo5Yo2vfKc1ebQ0gOeaVYWCWCoLR8jFXjTtUHcqGh5exWrQ",
      isPrimaryColor: false,
    },
    {
      id: "3",
      serviceName: "Barba y Perfilado",
      professionalName: "Carlos Gomez",
      timeText: "Lunes 28, 11:00 AM",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCDuUR160Eeg8yvi4Zw7n9gcHcbiPgVsunjTa9DHLOrXftgTcV8rbWEZRe_v11WxV-PPIfFaVJ_uNPUSQVD8ysdWeY6MGDs5MlK4wXR1_LRpGg_qJ1T0UP-iSD11_QMwONtdVlFqoZ0JedyQYjaU8rzjJTQcRfWgaPHTzZSXkc2amk9TRGCaSHiLtZXMoPyO2vuAIJMnovsa0Xf3lUWYKQZjXnTIju0R7bMf74z7rGUzabGj8ejcr_q-htWLdBG0jl2wy0R4Xf2Xg",
      isPrimaryColor: false,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#3d4943" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>alToque</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Próximos Turnos</Text>

        <View style={styles.cardsContainer}>
          {appointments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.professionalName}>con {item.professionalName}</Text>
                
                <View style={styles.timeRow}>
                  <MaterialIcons
                    name="event"
                    size={16}
                    color={item.isPrimaryColor ? "#00694c" : "#667873"}
                  />
                  <Text
                    style={[
                      styles.timeText,
                      { color: item.isPrimaryColor ? "#00694c" : "#667873" },
                    ]}
                  >
                    {item.timeText}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf8",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e9e7",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    marginTop: 24,
    marginBottom: 32,
    lineHeight: 34,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ebefed",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#181c1c",
  },
  professionalName: {
    fontSize: 14,
    color: "#3d4943",
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
