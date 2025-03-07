import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMovies, searchMovies, isFavorite, toggleFavorite, getCurrentUser } from '../../database/database';

const HomeScreen = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  // Get all unique genres from movies
  const genres = [...new Set(movies.flatMap(movie => movie.genre))].sort();
  
  // Get all unique years from movies
  const years = [...new Set(movies.map(movie => movie.year))].sort((a, b) => b - a);

  // Load movies on component mount and when focused
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          // Get current user
          const user = await getCurrentUser();
          setCurrentUser(user);
          
          // Get all movies
          const allMovies = await getMovies();
          setMovies(allMovies);
          setFilteredMovies(allMovies);
          
          // Load user favorites
          if (user) {
            const userFavorites = {};
            for (const movie of allMovies) {
              userFavorites[movie.id] = await isFavorite(user.id, movie.id);
            }
            setFavorites(userFavorites);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }, [])
  );

  // Handle search input
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim() === '' && activeFilters.length === 0) {
      setFilteredMovies(movies);
    } else {
      const results = await searchMovies(
        text,
        genreFilter,
        yearFilter
      );
      setFilteredMovies(results);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (movieId) => {
    if (!currentUser) {
      navigation.navigate('ProfileStack', { screen: 'Login' });
      return;
    }
    
    await toggleFavorite(currentUser.id, movieId);
    setFavorites(prev => ({
      ...prev,
      [movieId]: !prev[movieId]
    }));
  };

  // Apply filters
  const applyFilters = async () => {
    const newActiveFilters = [];
    
    if (genreFilter) {
      newActiveFilters.push({ type: 'genre', value: genreFilter });
    }
    
    if (yearFilter) {
      newActiveFilters.push({ type: 'year', value: yearFilter });
    }
    
    setActiveFilters(newActiveFilters);
    
    const results = await searchMovies(
      searchQuery,
      genreFilter,
      yearFilter
    );
    
    setFilteredMovies(results);
    setModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    setGenreFilter('');
    setYearFilter('');
  };

  // Remove a specific filter
  const removeFilter = async (filterToRemove) => {
    const newFilters = activeFilters.filter(
      filter => !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    );
    
    setActiveFilters(newFilters);
    
    if (filterToRemove.type === 'genre') {
      setGenreFilter('');
    } else if (filterToRemove.type === 'year') {
      setYearFilter('');
    }
    
    // Reapply remaining filters
    const results = await searchMovies(
      searchQuery,
      filterToRemove.type === 'genre' ? '' : genreFilter,
      filterToRemove.type === 'year' ? '' : yearFilter
    );
    
    setFilteredMovies(results);
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const allMovies = await getMovies();
      setMovies(allMovies);
      
      if (searchQuery.trim() === '' && activeFilters.length === 0) {
        setFilteredMovies(allMovies);
      } else {
        const results = await searchMovies(
          searchQuery,
          genreFilter,
          yearFilter
        );
        setFilteredMovies(results);
      }
      
      // Refresh favorites
      if (currentUser) {
        const userFavorites = {};
        for (const movie of allMovies) {
          userFavorites[movie.id] = await isFavorite(currentUser.id, movie.id);
        }
        setFavorites(userFavorites);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, genreFilter, yearFilter, activeFilters, currentUser]);

  // Navigate to movie details
  const handleMoviePress = (movie) => {
    navigation.navigate('MovieDetails', { 
      id: movie.id,
      title: movie.title,
      isFavorite: favorites[movie.id]
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>Carregando filmes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar and filter button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar filmes..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="options" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Filtros:</Text>
          {activeFilters.map((filter, index) => (
            <TouchableOpacity
              key={index}
              style={styles.activeFilterTag}
              onPress={() => removeFilter(filter)}
            >
              <Text style={styles.activeFilterText}>
                {filter.type === 'genre' ? 'Gênero: ' : 'Ano: '}
                {filter.value}
              </Text>
              <Ionicons name="close-circle" size={16} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Movie grid */}
      {filteredMovies.length > 0 ? (
        <FlatList
          data={filteredMovies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={handleMoviePress}
              isFavorite={favorites[item.id] || false}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#1e90ff"]}
              tintColor="#1e90ff"
            />
          }
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color="#888" />
          <Text style={styles.noResultsText}>Nenhum filme encontrado</Text>
          <Text style={styles.noResultsSubtext}>
            Tente outros termos de busca ou remova alguns filtros
          </Text>
        </View>
      )}

      {/* Filter modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Filtros</Text>
            
            {/* Genre filter */}
            <Text style={styles.filterLabel}>Gênero</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
            >
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.filterChip,
                    genreFilter === genre && styles.filterChipSelected,
                  ]}
                  onPress={() => setGenreFilter(genreFilter === genre ? '' : genre)}
                >
                  <Text style={styles.filterChipText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Year filter */}
            <Text style={styles.filterLabel}>Ano</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.filterChip,
                    yearFilter === year.toString() && styles.filterChipSelected,
                  ]}
                  onPress={() => setYearFilter(yearFilter === year.toString() ? '' : year.toString())}
                >
                  <Text style={styles.filterChipText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Modal buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonReset}
                onPress={resetFilters}
              >
                <Text style={styles.modalButtonText}>Limpar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonApply}
                onPress={applyFilters}
              >
                <Text style={styles.modalButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  filterButton: {
    backgroundColor: '#1e90ff',
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    borderRadius: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  noResultsSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  filterScrollView: {
    marginBottom: 15,
  },
  filterChip: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  filterChipSelected: {
    backgroundColor: '#1e90ff',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonReset: {
    backgroundColor: '#555',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  modalButtonApply: {
    backgroundColor: '#1e90ff',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeFiltersLabel: {
    color: '#bbb',
    marginRight: 10,
    fontSize: 14,
  },
  activeFilterTag: {
    backgroundColor: '#1e90ff',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  }
});

export default HomeScreen;
