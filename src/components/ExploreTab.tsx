import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ExploreTab() {
  const navigation = useNavigation<any>();

  const handleSearch = () => {
    navigation.navigate('SearchResults', { category: 'Búsqueda' });
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
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View>
            <Text style={styles.appointmentTitle}>Corte-Barba</Text>
            <Text style={styles.appointmentSubtitle}>con Fran Perez</Text>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="more-vert" size={24} color="#3d4943" />
          </TouchableOpacity>
        </View>
        <View style={styles.appointmentTags}>
          <View style={styles.timeTag}>
            <Feather name="clock" size={14} color="#008560" />
            <Text style={styles.timeTagText}>viernes 18:45 hs</Text>
          </View>
          <View style={styles.statusTag}>
            <Text style={styles.statusTagText}>Confirmado</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.moreAppointmentsBtn}>
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
