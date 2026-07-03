import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const category = route.params?.category || 'Búsqueda';
  const searchQuery = route.params?.search || '';

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, [category, searchQuery]);

  const fetchProfessionals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/professionals', {
        params: {
          profession: category,
          search: searchQuery
        }
      });
      setResults(response.data);
    } catch (err: any) {
      console.error('Error fetching professionals:', err);
      setError('No se pudieron cargar los profesionales. Por favor, reintentá más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#008560" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {searchQuery ? `Buscar: "${searchQuery}"` : `Resultados de ${category}`}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#008560" />
            <Text style={styles.loadingText}>Buscando profesionales...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Feather name="alert-triangle" size={64} color="#ba1a1a" style={styles.emptyIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProfessionals}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={48} color="#707d76" />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados encontrados</Text>
            <Text style={styles.emptySubtitle}>
              No hay profesionales registrados en la categoría "{category}"{searchQuery ? ` que coincidan con "${searchQuery}"` : ''} en este momento.
            </Text>
            <TouchableOpacity 
              style={styles.exploreOtherButton} 
              onPress={() => navigation.navigate('HomeCliente', { screen: 'explorar' })}
            >
              <Text style={styles.exploreOtherButtonText}>Ver otras categorías</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </Text>
              <TouchableOpacity style={styles.filterButton}>
                <Feather name="sliders" size={16} color="#3d4943" style={styles.filterIcon} />
                <Text style={styles.filterText}>Filtrar</Text>
              </TouchableOpacity>
            </View>

            {results.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultCard}
                onPress={() =>
                  navigation.navigate("ProfessionalProfile", {
                    professional: item,
                  })
                }
              >
                <View style={styles.cardContent}>
                  
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.profileImage} />
                  ) : item.isShop ? (
                    <View style={[styles.imagePlaceholder, { backgroundColor: '#e6e9e7' }]}>
                      <Feather name="shopping-bag" size={32} color="#008560" />
                    </View>
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: '#e6e9e7' }]}>
                      <Feather name="user" size={32} color="#008560" />
                    </View>
                  )}
                  
                  <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>

                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={16} color="#f59e0b" />
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      <Text style={styles.reviewsText}>
                        ({item.reviews} {item.reviews === 1 ? 'reseña' : 'reseñas'})
                      </Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={20} color="#3d4943" />
                </View>

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
        )}
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3d4943',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#008560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e6e9e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181c1c',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#707d76',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreOtherButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#008560',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreOtherButtonText: {
    color: '#008560',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyIcon: {
    marginBottom: 16,
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
    resizeMode: 'cover',
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f3f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#3d4943',
    fontWeight: '500',
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
