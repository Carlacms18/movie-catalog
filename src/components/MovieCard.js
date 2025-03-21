import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const MovieCard = ({ movie, onPress, isFavorite, onToggleFavorite }) => {
  // Function to handle favorite button press without propagating to the card press
  const handleFavoritePress = (e) => {
    // Prevent the card's onPress from being triggered
    e.stopPropagation();
    onToggleFavorite(movie.id);
  };

  // Function to render genre badges
  const renderGenres = () => {
    const displayGenres = JSON.parse(movie.genre)
    
    
    return displayGenres.map((genre, index) => (
      <View key={index} style={styles.genreBadge}>
        <Text style={styles.genreText}>{genre}</Text>
      </View>
    ));
  };
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(movie)}
      activeOpacity={0.8}
    >
      {/* Movie Poster */}
      <Image 
        source={{ uri: movie.poster }} 
        style={styles.poster}
        resizeMode="cover"
      />
      
      {/* Favorite Button */}
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
      >
        <Ionicons 
          name={isFavorite ? "heart" : "heart-outline"}
          size={24}
          color={isFavorite ? "#ff3b30" : "#fff"}
        />
      </TouchableOpacity>
      
      {/* Rating Badge */}
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
      </View>
      
      {/* Movie Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {movie.title}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.year}>{movie.year}</Text>
          <View style={styles.genreContainer}>
            {renderGenres()}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  poster: {
    width: '100%',
    height: 180,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    color: '#bbb',
    fontSize: 14,
    marginRight: 10,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreBadge: {
    backgroundColor: '#1e90ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  genreText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MovieCard;