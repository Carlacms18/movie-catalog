import * as SQLite from 'expo-sqlite';

// Open or create the database
const db = SQLite.openDatabase('cineapp.db');

// Initialize the database
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Create movies table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          year INTEGER,
          director TEXT,
          genre TEXT,
          poster TEXT,
          rating REAL,
          synopsis TEXT
        )`,
        [],
        () => {},
        (_, error) => { reject(error); return false; }
      );

      // Create users table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          createdAt TEXT
        )`,
        [],
        () => {},
        (_, error) => { reject(error); return false; }
      );

      // Create favorites table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          movieId INTEGER,
          FOREIGN KEY (userId) REFERENCES users (id),
          FOREIGN KEY (movieId) REFERENCES movies (id),
          UNIQUE(userId, movieId)
        )`,
        [],
        () => {},
        (_, error) => { reject(error); return false; }
      );

      // Check if movies table is empty and insert initial data if needed
      tx.executeSql(
        `SELECT COUNT(*) as count FROM movies`,
        [],
        (_, { rows }) => {
          if (rows.item(0).count === 0) {
            // Insert initial movies data
            const initialMovies = [
              {
                title: "Interestelar",
                year: 2014,
                director: "Christopher Nolan",
                genre: JSON.stringify(["Ficção Científica", "Drama", "Aventura"]),
                poster: "https://exemplo.com/poster-interestelar.jpg",
                rating: 8.6,
                synopsis: "Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade."
              },
              {
                title: "Pulp Fiction",
                year: 1994,
                director: "Quentin Tarantino",
                genre: JSON.stringify(["Crime", "Drama"]),
                poster: "https://exemplo.com/poster-pulp-fiction.jpg",
                rating: 8.9,
                synopsis: "As vidas de dois assassinos da máfia, um boxeador, um gângster e sua esposa, e um par de bandidos se entrelaçam em quatro histórias de violência e redenção."
              },
              {
                title: "O Poderoso Chefão",
                year: 1972,
                director: "Francis Ford Coppola",
                genre: JSON.stringify(["Crime", "Drama"]),
                poster: "https://exemplo.com/poster-poderoso-chefao.jpg",
                rating: 9.2,
                synopsis: "A história da família Corleone sob o patriarca Vito Corleone, focando na transformação de seu filho Michael de relutante outsider da família para um implacável chefe da máfia."
              }
            ];

            initialMovies.forEach(movie => {
              tx.executeSql(
                `INSERT INTO movies (title, year, director, genre, poster, rating, synopsis) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [movie.title, movie.year, movie.director, movie.genre, movie.poster, movie.rating, movie.synopsis],
                () => {},
                (_, error) => { console.error("Error inserting movie:", error); return false; }
              );
            });
          }
        },
        (_, error) => { reject(error); return false; }
      );
    }, 
    error => {
      console.error("Transaction error:", error);
      reject(error);
    }, 
    () => {
      console.log("Database initialization successful");
      resolve();
    });
  });
};

// Functions for movie management
export const getMovies = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM movies',
        [],
        (_, { rows }) => {
          const movies = [];
          for (let i = 0; i < rows.length; i++) {
            const movie = rows.item(i);
            movies.push({
              ...movie,
              genre: JSON.parse(movie.genre)
            });
          }
          resolve(movies);
        },
        (_, error) => {
          console.error('Error getting movies:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getMovieById = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM movies WHERE id = ?',
        [id],
        (_, { rows }) => {
          if (rows.length > 0) {
            const movie = rows.item(0);
            resolve({
              ...movie,
              genre: JSON.parse(movie.genre)
            });
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error('Error getting movie by ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const searchMovies = (query, genreFilter = '', yearFilter = '') => {
  return new Promise((resolve, reject) => {
    const searchTerm = `%${query.toLowerCase()}%`;
    let sql = 'SELECT * FROM movies WHERE (LOWER(title) LIKE ? OR LOWER(director) LIKE ?)';
    const params = [searchTerm, searchTerm];
    
    if (yearFilter) {
      sql += ' AND year = ?';
      params.push(yearFilter);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, { rows }) => {
          const movies = [];
          for (let i = 0; i < rows.length; i++) {
            const movie = rows.item(i);
            const genreArray = JSON.parse(movie.genre);
            
            // Handle genre filter separately (after fetching) because SQLite can't search inside JSON
            if (!genreFilter || genreArray.some(g => g.toLowerCase() === genreFilter.toLowerCase())) {
              movies.push({
                ...movie,
                genre: genreArray
              });
            }
          }
          resolve(movies);
        },
        (_, error) => {
          console.error('Error searching movies:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const addMovie = (movie) => {
  return new Promise((resolve, reject) => {
    const genreJson = JSON.stringify(movie.genre);
    
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO movies (title, year, director, genre, poster, rating, synopsis) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [movie.title, movie.year, movie.director, genreJson, movie.poster, movie.rating, movie.synopsis],
        (_, { insertId }) => {
          resolve({
            ...movie,
            id: insertId
          });
        },
        (_, error) => {
          console.error('Error adding movie:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateMovie = (id, updatedData) => {
  return new Promise((resolve, reject) => {
    // First, get the current movie to merge with updates
    getMovieById(id)
      .then(currentMovie => {
        if (!currentMovie) {
          reject(new Error('Movie not found'));
          return;
        }
        
        const mergedMovie = { ...currentMovie, ...updatedData };
        const genreJson = JSON.stringify(mergedMovie.genre);
        
        db.transaction(tx => {
          tx.executeSql(
            `UPDATE movies 
             SET title = ?, year = ?, director = ?, genre = ?, poster = ?, rating = ?, synopsis = ? 
             WHERE id = ?`,
            [mergedMovie.title, mergedMovie.year, mergedMovie.director, genreJson, 
             mergedMovie.poster, mergedMovie.rating, mergedMovie.synopsis, id],
            (_, { rowsAffected }) => {
              if (rowsAffected > 0) {
                resolve(mergedMovie);
              } else {
                reject(new Error('No movie updated'));
              }
            },
            (_, error) => {
              console.error('Error updating movie:', error);
              reject(error);
              return false;
            }
          );
        });
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const deleteMovie = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Delete from favorites first to maintain referential integrity
      tx.executeSql(
        'DELETE FROM favorites WHERE movieId = ?',
        [id],
        () => {},
        (_, error) => {
          console.error('Error deleting movie favorites:', error);
          return false;
        }
      );

      // Then delete the movie
      tx.executeSql(
        'DELETE FROM movies WHERE id = ?',
        [id],
        (_, { rowsAffected }) => {
          resolve(rowsAffected > 0);
        },
        (_, error) => {
          console.error('Error deleting movie:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Functions for user management
export const registerUser = (email, password, name) => {
  return new Promise((resolve, reject) => {
    const createdAt = new Date().toISOString();
    
    db.transaction(tx => {
      // Check if email already exists
      tx.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve({ success: false, message: 'Este email já está em uso' });
          } else {
            // Insert new user
            tx.executeSql(
              'INSERT INTO users (email, password, name, createdAt) VALUES (?, ?, ?, ?)',
              [email, password, name, createdAt],
              (_, { insertId }) => {
                resolve({ 
                  success: true, 
                  user: { 
                    id: insertId, 
                    email, 
                    name, 
                    createdAt 
                  } 
                });
              },
              (_, error) => {
                console.error('Error registering user:', error);
                reject(error);
                return false;
              }
            );
          }
        },
        (_, error) => {
          console.error('Error checking existing user:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password],
        (_, { rows }) => {
          if (rows.length > 0) {
            const user = rows.item(0);
            // Store current user in a separate user_session table
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS user_session (id INTEGER PRIMARY KEY, userId INTEGER, email TEXT, name TEXT)',
              [],
              () => {
                tx.executeSql('DELETE FROM user_session', [], () => {
                  tx.executeSql(
                    'INSERT INTO user_session (userId, email, name) VALUES (?, ?, ?)',
                    [user.id, user.email, user.name],
                    () => {
                      resolve({ 
                        success: true, 
                        user: { 
                          id: user.id, 
                          email: user.email, 
                          name: user.name 
                        } 
                      });
                    },
                    (_, error) => {
                      console.error('Error storing session:', error);
                      reject(error);
                      return false;
                    }
                  );
                });
              }
            );
          } else {
            resolve({ success: false, message: 'Email ou senha incorretos' });
          }
        },
        (_, error) => {
          console.error('Error during login:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const logoutUser = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM user_session',
        [],
        () => {
          resolve({ success: true });
        },
        (_, error) => {
          console.error('Error during logout:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM user_session',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const session = rows.item(0);
            resolve({
              id: session.userId,
              email: session.email,
              name: session.name
            });
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error('Error getting current user:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Functions for favorites management
export const toggleFavorite = (userId, movieId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Check if favorite already exists
      tx.executeSql(
        'SELECT * FROM favorites WHERE userId = ? AND movieId = ?',
        [userId, movieId],
        (_, { rows }) => {
          if (rows.length > 0) {
            // Remove favorite
            tx.executeSql(
              'DELETE FROM favorites WHERE userId = ? AND movieId = ?',
              [userId, movieId],
              (_, { rowsAffected }) => {
                resolve(rowsAffected > 0);
              },
              (_, error) => {
                console.error('Error removing favorite:', error);
                reject(error);
                return false;
              }
            );
          } else {
            // Add favorite
            tx.executeSql(
              'INSERT INTO favorites (userId, movieId) VALUES (?, ?)',
              [userId, movieId],
              (_, { rowsAffected }) => {
                resolve(rowsAffected > 0);
              },
              (_, error) => {
                console.error('Error adding favorite:', error);
                reject(error);
                return false;
              }
            );
          }
        },
        (_, error) => {
          console.error('Error checking favorite status:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getFavorites = (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT movieId FROM favorites WHERE userId = ?',
        [userId],
        (_, { rows }) => {
          const favoriteIds = [];
          for (let i = 0; i < rows.length; i++) {
            favoriteIds.push(rows.item(i).movieId);
          }
          resolve(favoriteIds);
        },
        (_, error) => {
          console.error('Error getting favorites:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const isFavorite = (userId, movieId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM favorites WHERE userId = ? AND movieId = ?',
        [userId, movieId],
        (_, { rows }) => {
          resolve(rows.length > 0);
        },
        (_, error) => {
          console.error('Error checking favorite status:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getFavoriteMovies = (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT m.* 
         FROM movies m
         JOIN favorites f ON m.id = f.movieId
         WHERE f.userId = ?`,
        [userId],
        (_, { rows }) => {
          const movies = [];
          for (let i = 0; i < rows.length; i++) {
            const movie = rows.item(i);
            movies.push({
              ...movie,
              genre: JSON.parse(movie.genre)
            });
          }
          resolve(movies);
        },
        (_, error) => {
          console.error('Error getting favorite movies:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};