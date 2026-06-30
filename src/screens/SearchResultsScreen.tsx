import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const category = route.params?.category || 'Búsqueda';

  const results = [
    {
      id: '1',
      name: 'Fran Perez',
      rating: 4.9,
      reviews: 15,
      isTop: true,
      image: 'https://i.pravatar.cc/150?img=11', // Placeholder image
    },
    {
      id: '2',
      name: 'Barbershop',
      rating: 3.7,
      reviews: 12,
      isTop: false,
      isShop: true,
    },
    {
      id: '3',
      name: 'Robert Draw',
      rating: 5.0,
      reviews: 4,
      isTop: false,
      image: 'https://i.pravatar.cc/150?img=14', // Placeholder image
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#008560" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados de {category}</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <ScrollView style={styles.container}>
        
        {/* Results Info & Filter */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{results.length} resultados encontrados</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="sliders" size={16} color="#3d4943" style={styles.filterIcon} />
            <Text style={styles.filterText}>Filtrar</Text>
          </TouchableOpacity>
        </View>

        {/* Results List */}
        {results.map((item) => (
          <TouchableOpacity key={item.id} style={styles.resultCard}>
            <View style={styles.cardContent}>
              
              {/* Image/Icon */}
              {item.isShop ? (
                <View style={[styles.imagePlaceholder, { backgroundColor: '#e6e9e7' }]}>
                  <Feather name="shopping-bag" size={32} color="#008560" />
                </View>
              ) : (
                <Image source={{ uri: item.image }} style={styles.profileImage} />
              )}
              
              {/* Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewsText}>({item.reviews} {item.reviews === 1 ? 'reseña' : 'reseñas'})</Text>
                </View>
              </View>

              {/* Arrow */}
              <Feather name="chevron-right" size={20} color="#3d4943" />
            </View>

            {/* Top Badge */}
            {item.isTop && (
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>Top</Text>
                <Feather name="check" size={12} color="#008560" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181c1c',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#3d4943',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bccac1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#3d4943',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e9e7',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#181c1c',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#707d76',
    marginLeft: 6,
  },
  topBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#c2f0d9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#008560',
    marginRight: 2,
  },
});
