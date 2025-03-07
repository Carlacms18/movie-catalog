
// Dados iniciais
const initialMovies = [
  {
    id: 1,
    title: "Interestelar",
    year: 2014,
    director: "Christopher Nolan",
    genre: ["Ficção Científica", "Drama", "Aventura"],
    poster: "https://exemplo.com/poster-interestelar.jpg",
    rating: 8.6,
    synopsis: "Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade."
  },
  {
    id: 2,
    title: "Pulp Fiction",
    year: 1994,
    director: "Quentin Tarantino",
    genre: ["Crime", "Drama"],
    poster: "https://exemplo.com/poster-pulp-fiction.jpg",
    rating: 8.9,
    synopsis: "As vidas de dois assassinos da máfia, um boxeador, um gângster e sua esposa, e um par de bandidos se entrelaçam em quatro histórias de violência e redenção."
  },
  {
    id: 3,
    title: "Pulp Fiction",
    year: 1994,
    director: "Quentin Tarantino",
    genre: ["Crime", "Drama"],
    poster: "https://exemplo.com/poster-pulp-fiction.jpg",
    rating: 8.9,
    synopsis: "As vidas de dois assassinos da máfia, um boxeador, um gângster e sua esposa, e um par de bandidos se entrelaçam em quatro histórias de violência e redenção."
  }
];

// Inicializar o banco de dados
export const initDatabase = async () => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    if (moviesData === null) {
      await AsyncStorage.setItem('movies', JSON.stringify(initialMovies));
    }
    
    const usersData = await AsyncStorage.getItem('users');
    if (usersData === null) {
      await AsyncStorage.setItem('users', JSON.stringify([]));
    }
    
    const favoritesData = await AsyncStorage.getItem('favorites');
    if (favoritesData === null) {
      await AsyncStorage.setItem('favorites', JSON.stringify({}));
    }
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
};

// Funções para gerenciamento de filmes
export const getMovies = async () => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    return JSON.parse(moviesData) || [];
  } catch (error) {
    console.error('Erro ao obter filmes:', error);
    return [];
  }
};

export const getMovieById = async (id) => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    return movies.find(movie => movie.id === id) || null;
  } catch (error) {
    console.error('Erro ao obter filme por ID:', error);
    return null;
  }
};

export const searchMovies = async (query, genreFilter = '', yearFilter = '') => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    const searchTerm = query.toLowerCase();
    
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm) ||
                           movie.director.toLowerCase().includes(searchTerm);
      
      const matchesGenre = genreFilter === '' || 
                          movie.genre.some(g => g.toLowerCase() === genreFilter.toLowerCase());
      
      const matchesYear = yearFilter === '' || movie.year.toString() === yearFilter;
      
      return matchesSearch && matchesGenre && matchesYear;
    });
  } catch (error) {
    console.error('Erro ao pesquisar filmes:', error);
    return [];
  }
};

export const addMovie = async (movie) => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    
    // Gerar novo ID
    const newId = movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1;
    const newMovie = { ...movie, id: newId };
    
    movies.push(newMovie);
    await AsyncStorage.setItem('movies', JSON.stringify(movies));
    return newMovie;
  } catch (error) {
    console.error('Erro ao adicionar filme:', error);
    return null;
  }
};

export const updateMovie = async (id, updatedData) => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    
    const index = movies.findIndex(movie => movie.id === id);
    if (index !== -1) {
      movies[index] = { ...movies[index], ...updatedData };
      await AsyncStorage.setItem('movies', JSON.stringify(movies));
      return movies[index];
    }
    return null;
  } catch (error) {
    console.error('Erro ao atualizar filme:', error);
    return null;
  }
};

export const deleteMovie = async (id) => {
  try {
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    
    const newMovies = movies.filter(movie => movie.id !== id);
    await AsyncStorage.setItem('movies', JSON.stringify(newMovies));
    return true;
  } catch (error) {
    console.error('Erro ao excluir filme:', error);
    return false;
  }
};

// Funções para gerenciamento de usuários
export const registerUser = async (email, password, name) => {
  try {
    const usersData = await AsyncStorage.getItem('users');
    const users = JSON.parse(usersData) || [];
    
    // Verificar se o email já está registrado
    if (users.some(user => user.email === email)) {
      return { success: false, message: 'Este email já está em uso' };
    }
    
    // Registrar novo usuário
    const newUser = { 
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      email, 
      password, 
      name,
      createdAt: new Date().toISOString() 
    };
    
    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    return { success: true, user: { ...newUser, password: undefined } };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return { success: false, message: 'Erro ao registrar usuário' };
  }
};

export const loginUser = async (email, password) => {
  try {
    const usersData = await AsyncStorage.getItem('users');
    const users = JSON.parse(usersData) || [];
    
    const user = users.find(user => user.email === email && user.password === password);
    
    if (user) {
      await AsyncStorage.setItem('currentUser', JSON.stringify({ 
        id: user.id,
        email: user.email,
        name: user.name 
      }));
      return { success: true, user: { ...user, password: undefined } };
    } else {
      return { success: false, message: 'Email ou senha incorretos' };
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, message: 'Erro ao fazer login' };
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('currentUser');
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { success: false, message: 'Erro ao fazer logout' };
  }
};

export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
};

// Funções para gerenciamento de favoritos
export const toggleFavorite = async (userId, movieId) => {
  try {
    const favoritesData = await AsyncStorage.getItem('favorites');
    const favorites = JSON.parse(favoritesData) || {};
    
    if (!favorites[userId]) {
      favorites[userId] = [];
    }
    
    const index = favorites[userId].indexOf(movieId);
    
    if (index === -1) {
      favorites[userId].push(movieId);
    } else {
      favorites[userId].splice(index, 1);
    }
    
    await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Erro ao marcar/desmarcar favorito:', error);
    return false;
  }
};

export const getFavorites = async (userId) => {
  try {
    const favoritesData = await AsyncStorage.getItem('favorites');
    const favorites = JSON.parse(favoritesData) || {};
    
    return favorites[userId] || [];
  } catch (error) {
    console.error('Erro ao obter favoritos:', error);
    return [];
  }
};

export const isFavorite = async (userId, movieId) => {
  try {
    const favoritesData = await AsyncStorage.getItem('favorites');
    const favorites = JSON.parse(favoritesData) || {};
    
    return favorites[userId] && favorites[userId].includes(movieId);
  } catch (error) {
    console.error('Erro ao verificar favorito:', error);
    return false;
  }
};

export const getFavoriteMovies = async (userId) => {
  try {
    const favoriteIds = await getFavorites(userId);
    const moviesData = await AsyncStorage.getItem('movies');
    const movies = JSON.parse(moviesData) || [];
    
    return movies.filter(movie => favoriteIds.includes(movie.id));
  } catch (error) {
    console.error('Erro ao obter filmes favoritos:', error);
    return [];
  }
};