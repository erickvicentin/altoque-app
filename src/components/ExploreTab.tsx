import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function ExploreTab() {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchNextAppointment();
    }, [])
  );

  const fetchNextAppointment = async () => {
    try {
      const response = await api.get('/appointments');
      const list = response.data || [];
      const upcoming = list.filter(
        (app: any) => app.status === 'pending' || app.status === 'accepted'
      );
      
      upcoming.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      } else {
        setNextAppointment(null);
      }
    } catch (error) {
      console.error("Error loading next appointment:", error);
    }
  };

  const formatAppointmentTime = (dateStr: string, timeStr: string) => {
    try {
      const parts = dateStr.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const date = new Date(year, month, day);

      const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayName = daysOfWeek[date.getDay()];
      const cleanTime = timeStr.substring(0, 5);

      return `${dayName} ${cleanTime} hs`;
    } catch (e) {
      return `${dateStr} a las ${timeStr}`;
    }
  };

  const handleSearch = () => {
    navigation.navigate('SearchResults', { category: 'Búsqueda', search: searchText });
  };

  const handleCategoryPress = (categoryName: string) => {
    navigation.navigate('SearchResults', { category: categoryName });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>¿Qué servicio buscás hoy?</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#a0aab2" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar peluquería, plomero..."
          placeholderTextColor="#a0aab2"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categorías principales</Text>
      <View style={styles.categoriesGrid}>
        
        {/* Category 1 */}
        <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Barbería')}>
          <View style={[styles.iconCircle, { backgroundColor: '#c2f0d9' }]}>
            <Feather name="scissors" size={24} color="#008560" />
          </View>
          <Text style={styles.categoryTitle}>Barbería</Text>
          <Text style={styles.categorySubtitle}>Estética & Cuidado</Text>
        </TouchableOpacity>

        {/* Category 2 */}
        <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Electricidad')}>
          <View style={[styles.iconCircle, { backgroundColor: '#e6e9e7' }]}>
            <Feather name="zap" size={24} color="#3d4943" />
          </View>
          <Text style={styles.categoryTitle}>Electricidad</Text>
          <Text style={styles.categorySubtitle}>Hogar & Arreglos</Text>
        </TouchableOpacity>

        {/* Category 3 */}
        <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Pilates')}>
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <Feather name="activity" size={24} color="#b91c1c" />
          </View>
          <Text style={styles.categoryTitle}>Pilates</Text>
          <Text style={styles.categorySubtitle}>Salud & Fitness</Text>
        </TouchableOpacity>

        {/* Category 4 */}
        <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('Carpintería')}>
          <View style={[styles.iconCircle, { backgroundColor: '#e2e8f0' }]}>
            <Feather name="tool" size={24} color="#475569" />
          </View>
          <Text style={styles.categoryTitle}>Carpintería</Text>
          <Text style={styles.categorySubtitle}>Muebles & Madera</Text>
        </TouchableOpacity>

      </View>

      {/* Upcoming Appointments */}
      <Text style={styles.sectionTitle}>Próximos turnos</Text>
      {nextAppointment ? (
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View>
              <Text style={styles.appointmentTitle}>{nextAppointment.service?.name || "Servicio"}</Text>
              <Text style={styles.appointmentSubtitle}>
                con {nextAppointment.professional_profile?.user?.name || "Profesional"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("TurnoDetail", {
                  appointment: {
                    serviceName: "Corte y Barba",
                    professionalName: "Fran Perez",
                    day: "Viernes",
                    date: "18 de mayo",
                    time: "18:45",
                    duration: "1h",
                    price: "$4.500",
                    location: "Av. Sarmiento 1515",
                    imageUrl:
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDyBj5TaecCAsFprwmZlD-c_anCrDnZEWxM-CqeCMhA1JvXkvukrUqERYryCCSqSydbCIU0NH8dXPKIGdjvDTfB_At78BYA1ZVbCJ0x1bA9m0fW7rMiCPaUAnqPvcKIDbntAyB6sWlCy_DQfrB_AoAtmqX22s3e57HPvE2ZvsfIe_5DersGjw4_gqTGkzD2YejCuzqaRBsR2LRfbtw6kHYZ0hxg5q0pAgVFmbPfYC8OBJZq4YBBEPUidEZ5qvi03mG7oiXQrsnVA",
                  },
                })
              }
            >
              <MaterialIcons name="more-vert" size={24} color="#3d4943" />
            </TouchableOpacity>
          </View>
          <View style={styles.appointmentTags}>
            <View style={styles.timeTag}>
              <Feather name="clock" size={14} color="#008560" />
              <Text style={styles.timeTagText}>
                {formatAppointmentTime(nextAppointment.date, nextAppointment.start_time)}
              </Text>
            </View>
            <View style={[
              styles.statusTag,
              nextAppointment.status === 'pending' && styles.statusTagPending
            ]}>
              <Text style={[
                styles.statusTagText,
                nextAppointment.status === 'pending' && styles.statusTagTextPending
              ]}>
                {nextAppointment.status === 'pending' ? 'Pendiente' : 'Confirmado'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noAppointmentsCard}>
          <Feather name="calendar" size={32} color="#707d76" style={{ marginBottom: 8 }} />
          <Text style={styles.noAppointmentsText}>No tenés turnos programados.</Text>
          <Text style={styles.noAppointmentsSubtext}>Explorá categorías para reservar uno.</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.moreAppointmentsBtn}
        onPress={() => navigation.navigate("ClientAppointments")}
      >
        <Text style={styles.moreAppointmentsText}>Ver más turnos</Text>
      </TouchableOpacity>

      {/* Extra space for scroll */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f7faf8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#181c1c',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 34,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e9e7',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#181c1c',
    height: 40,
  },
  searchButton: {
    backgroundColor: '#008560',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e6e9e7',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#707d76',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#e6e9e7',
    borderLeftColor: '#008560',
    padding: 16,
    marginBottom: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 2,
  },
  appointmentSubtitle: {
    fontSize: 14,
    color: '#707d76',
  },
  appointmentTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c2f0d9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  timeTagText: {
    color: '#008560',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusTag: {
    backgroundColor: '#e6e9e7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTagText: {
    color: '#707d76',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTagPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
  },
  statusTagTextPending: {
    color: '#d97706',
  },
  noAppointmentsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e9e7',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  noAppointmentsText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 4,
  },
  noAppointmentsSubtext: {
    fontSize: 13,
    color: '#707d76',
    textAlign: 'center',
  },
  moreAppointmentsBtn: {
    alignItems: 'center',
    marginBottom: 32,
  },
  moreAppointmentsText: {
    color: '#008560',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
