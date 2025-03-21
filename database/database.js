import * as SQLite from "expo-sqlite";

// Open or create the database
const openDatabaseAsync = async () => {
  return await SQLite.openDatabaseAsync("cineapp.db");
};

async function createMoviesTable() {
  try {
    const db = await openDatabaseAsync();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER,
        director TEXT,
        genre TEXT,
        poster TEXT,
        rating REAL,
        synopsis TEXT
      )`);
    console.log("Movies table created or already exists");
  } catch (error) {
    console.error("Error creating movies table:", error);
    throw new Error(`Failed to create movies table: ${error.message}`);
  }
}
export const seedMovies = async () => {
  try {
    const db = await openDatabaseAsync();
    
    // Check if movies already exist to avoid duplicates
    const existingMovies = await db.getAllAsync("SELECT * FROM movies");
    const count = existingMovies.length;
    
    if (count > 0) {
      console.log("Movies already seeded, skipping...");
      return;
    }
    
    // Sample movie data
    const movies = [
      {
        title: "The Shawshank Redemption",
        year: 1994,
        director: "Frank Darabont",
        genre: JSON.stringify(["Drama"]),
        poster: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg",
        rating: 9.3,
        synopsis: "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion."
      },
      {
        title: "The Godfather",
        year: 1972,
        director: "Francis Ford Coppola",
        genre: JSON.stringify(["Crime", "Drama"]),
        poster: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 9.2,
        synopsis: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."
      },
      {
        title: "Pulp Fiction",
        year: 1994,
        director: "Quentin Tarantino",
        genre: JSON.stringify(["Crime", "Drama"]),
        poster: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 8.9,
        synopsis: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
      },
      {
        title: "Inception",
        year: 2010,
        director: "Christopher Nolan",
        genre: JSON.stringify(["Action", "Adventure", "Sci-Fi"]),
        poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        rating: 8.8,
        synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O."
      },
      {
        title: "Parasite",
        year: 2019,
        director: "Bong Joon Ho",
        genre: JSON.stringify(["Drama", "Thriller"]),
        poster: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg",
        rating: 8.5,
        synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan."
      }
    ];
    
    // Insert movies into the database
    for (const movie of movies) {
      console.log(movie)
      await db.runAsync(
        `INSERT INTO movies (title, year, director, genre, poster, rating, synopsis) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movie.title,
          movie.year,
          movie.director,
          movie.genre,
          movie.poster,
          movie.rating,
          movie.synopsis
        ]
      );
    }
    
    console.log("Successfully seeded 5 movies to the database");
  } catch (error) {
    console.error("Error seeding movies:", error);
    throw new Error(`Failed to seed movies: ${error.message}`);
  }
};
async function createFavoritesTable() {
  try {
    const db = await openDatabaseAsync();

    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        movieId INTEGER,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (movieId) REFERENCES movies (id),
        UNIQUE(userId, movieId)
      )`
    );
    console.log("Favorites table created or already exists");
  } catch (error) {
    console.error("Error creating favorites table:", error);
    throw new Error(`Failed to create favorites table: ${error.message}`);
  }
}

async function createUsersTable() {
  try {
    const db = await openDatabaseAsync();

    await db.execAsync(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      createdAt TEXT
    )`);
    console.log("Users table created or already exists");
  } catch (error) {
    console.error("Error creating users table:", error);
    throw new Error(`Failed to create users table: ${error.message}`);
  }
}

async function createSessionsTable() {
  try {
    const db = await openDatabaseAsync();

    await db.execAsync(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      deviceInfo TEXT,
      ipAddress TEXT,
      lastActive TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )`);
    console.log("Sessions table created or already exists");
  } catch (error) {
    console.error("Error creating sessions table:", error);
    throw new Error(`Failed to create sessions table: ${error.message}`);
  }
}

// Function to create a new session
export async function createSession(
  userId,
  deviceInfo = null,
  ipAddress = null
) {
  const db = await openDatabaseAsync();

  const token = generateUniqueToken();

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const createdAt = now.toISOString();
  const expirationDate = expiresAt.toISOString();

  await db.execAsync(
    `INSERT INTO sessions (userId, token, deviceInfo, ipAddress, lastActive, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, token, deviceInfo, ipAddress, createdAt, expirationDate, createdAt]
  );

  return token;
}

export async function validateSession(token) {
  const db = await openDatabaseAsync();

  const result = await db.execAsync(
    `SELECT * FROM sessions WHERE token = ? AND expiresAt > datetime('now')`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  await db.execAsync(`UPDATE sessions SET lastActive = ? WHERE token = ?`, [
    now,
    token,
  ]);

  return result.rows[0];
}

export async function endSession(token) {
  const db = await openDatabaseAsync();

  await db.execAsync(`DELETE FROM sessions WHERE token = ?`, [token]);
}

export async function clearExpiredSessions() {
  const db = await openDatabaseAsync();

  await db.execAsync(`DELETE FROM sessions WHERE expiresAt < datetime('now')`);
}

function generateUniqueToken() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

async function seedDatabase(params) {
  const initialMovies = [
    {
      title: "Interestelar",
      year: 2014,
      director: "Christopher Nolan",
      genre: JSON.stringify(["Ficção Científica", "Drama", "Aventura"]),
      poster: "https://exemplo.com/poster-interestelar.jpg",
      rating: 8.6,
      synopsis:
        "Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.",
    },
    {
      title: "Pulp Fiction",
      year: 1994,
      director: "Quentin Tarantino",
      genre: JSON.stringify(["Crime", "Drama"]),
      poster: "https://exemplo.com/poster-pulp-fiction.jpg",
      rating: 8.9,
      synopsis:
        "As vidas de dois assassinos da máfia, um boxeador, um gângster e sua esposa, e um par de bandidos se entrelaçam em quatro histórias de violência e redenção.",
    },
    {
      title: "O Poderoso Chefão",
      year: 1972,
      director: "Francis Ford Coppola",
      genre: JSON.stringify(["Crime", "Drama"]),
      poster: "https://exemplo.com/poster-poderoso-chefao.jpg",
      rating: 9.2,
      synopsis:
        "A história da família Corleone sob o patriarca Vito Corleone, focando na transformação de seu filho Michael de relutante outsider da família para um implacável chefe da máfia.",
    },
  ];
  await Promise.all(
    initialMovies.map((movie) => {
      db.execAsync(
        `INSERT INTO movies (title, year, director, genre, poster, rating, synopsis) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movie.title,
          movie.year,
          movie.director,
          movie.genre,
          movie.poster,
          movie.rating,
          movie.synopsis,
        ]
      );
    })
  );
}
export const initializeDatabase = async () => {
  try {
    const db = await openDatabaseAsync();

    console.log("Starting database initialization...");

    await db.withTransactionAsync(async () => {
      try {
        await createMoviesTable();
        await createFavoritesTable();
        await createUsersTable();
        await createSessionsTable();
        console.log("All tables created successfully");
        await seedMovies();
      } catch (error) {
        console.error("Transaction failed during table creation:", error);
        throw error; // This will cause the transaction to roll back
      }
    });

    console.log("Database initialization completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Database initialization failed:", error);
    return {
      success: false,
      error: error.message,
      details:
        "There was an error initializing the database. Please restart the app or contact support.",
    };
  }
};

// Optional helper function to check database health
export const checkDatabaseConnection = async () => {
  try {
    const db = await openDatabaseAsync();

    const result = await db.execAsync("SELECT sqlite_version() AS version");
    return {
      success: true,
      version: result.rows[0].version,
      message: "Database connection successful",
    };
  } catch (error) {
    console.error("Database connection check failed:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to connect to database",
    };
  }
};

// Functions for movie management
export async function getMovies() {
  const db = await openDatabaseAsync();
  const movies = await db.getAllAsync( "SELECT * FROM movies");
  return movies;
};

export const getMovieById = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM movies WHERE id = ?",
        [id],
        (_, { rows }) => {
          if (rows.length > 0) {
            const movie = rows.item(0);
            resolve({
              ...movie,
              genre: JSON.parse(movie.genre),
            });
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error("Error getting movie by ID:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const searchMovies = (query, genreFilter = "", yearFilter = "") => {
  return new Promise((resolve, reject) => {
    const searchTerm = `%${query.toLowerCase()}%`;
    let sql =
      "SELECT * FROM movies WHERE (LOWER(title) LIKE ? OR LOWER(director) LIKE ?)";
    const params = [searchTerm, searchTerm];

    if (yearFilter) {
      sql += " AND year = ?";
      params.push(yearFilter);
    }

    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, { rows }) => {
          const movies = [];
          for (let i = 0; i < rows.length; i++) {
            const movie = rows.item(i);
            const genreArray = JSON.parse(movie.genre);

            // Handle genre filter separately (after fetching) because SQLite can't search inside JSON
            if (
              !genreFilter ||
              genreArray.some(
                (g) => g.toLowerCase() === genreFilter.toLowerCase()
              )
            ) {
              movies.push({
                ...movie,
                genre: genreArray,
              });
            }
          }
          resolve(movies);
        },
        (_, error) => {
          console.error("Error searching movies:", error);
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

    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO movies (title, year, director, genre, poster, rating, synopsis) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movie.title,
          movie.year,
          movie.director,
          genreJson,
          movie.poster,
          movie.rating,
          movie.synopsis,
        ],
        (_, { insertId }) => {
          resolve({
            ...movie,
            id: insertId,
          });
        },
        (_, error) => {
          console.error("Error adding movie:", error);
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
      .then((currentMovie) => {
        if (!currentMovie) {
          reject(new Error("Movie not found"));
          return;
        }

        const mergedMovie = { ...currentMovie, ...updatedData };
        const genreJson = JSON.stringify(mergedMovie.genre);

        db.transaction((tx) => {
          tx.executeSql(
            `UPDATE movies 
             SET title = ?, year = ?, director = ?, genre = ?, poster = ?, rating = ?, synopsis = ? 
             WHERE id = ?`,
            [
              mergedMovie.title,
              mergedMovie.year,
              mergedMovie.director,
              genreJson,
              mergedMovie.poster,
              mergedMovie.rating,
              mergedMovie.synopsis,
              id,
            ],
            (_, { rowsAffected }) => {
              if (rowsAffected > 0) {
                resolve(mergedMovie);
              } else {
                reject(new Error("No movie updated"));
              }
            },
            (_, error) => {
              console.error("Error updating movie:", error);
              reject(error);
              return false;
            }
          );
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const deleteMovie = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Delete from favorites first to maintain referential integrity
      tx.executeSql(
        "DELETE FROM favorites WHERE movieId = ?",
        [id],
        () => {},
        (_, error) => {
          console.error("Error deleting movie favorites:", error);
          return false;
        }
      );

      // Then delete the movie
      tx.executeSql(
        "DELETE FROM movies WHERE id = ?",
        [id],
        (_, { rowsAffected }) => {
          resolve(rowsAffected > 0);
        },
        (_, error) => {
          console.error("Error deleting movie:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const registerUser = async (email, password, name) => {
  try {
    const db = await openDatabaseAsync();

    const createdAt = new Date().toISOString();

    const existingUser = await db.execAsync(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser) {
      if (existingUser.rows.length > 0)
        return {
          success: false,
          message: "Este email já está em uso",
        };
    }

    try {
      const statement = await db.prepareAsync(
        "INSERT INTO users (email, password, name, createdAt) VALUES ($email, $password, $name, $createdAt)"
      );
      const result = await statement.executeAsync({
        $email: email,
        $password: password,
        $name: name,
        $createdAt: createdAt,
      });

      // const token = await createSession(result.insertId);

      return {
        success: true,
        user: {
          id: result.insertId,
          email,
          name,
          createdAt,
        },
      };
    } catch (insertError) {
      if (
        insertError.message &&
        insertError.message.includes("UNIQUE constraint failed: users.email")
      ) {
        return {
          success: false,
          message: "Este email já está em uso",
        };
      }

      throw insertError;
    }
  } catch (error) {
    console.error("Error registering user:", error);

    return {
      success: false,
      message: "Erro ao registrar usuário. Por favor, tente novamente.",
      error: error.message,
    };
  }
};

export const loginUser = async (
  email,
  password,
  deviceInfo = null,
  ipAddress = null
) => {
  try {
    const db = await openDatabaseAsync();

    // Find user with matching email and password
    const result = await db.getFirstAsync(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (!result) {
      return {
        success: false,
        message: "Email ou senha incorretos",
      };
    }

    // Create a new session for the authenticated user
    // const token = await createSession(user.id, deviceInfo, ipAddress);

    return {
      success: true,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
      },
    };
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};
export const getAllUsers = async () => {
  const db = await openDatabaseAsync();
  const result = await db.getAllAsync("SELECT * FROM users");
  console.log(result, "resultado");
};
// Optional: Add a method to check current authentication status
export const checkAuthStatus = async (token) => {
  try {
    const session = await validateSession(token);

    if (!session) {
      return {
        success: false,
        message: "Sessão inválida ou expirada",
      };
    }

    // Get user details
    const result = await db.execAsync(
      "SELECT id, email, name FROM users WHERE id = ?",
      [session.userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Usuário não encontrado",
      };
    }

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error) {
    console.error("Error checking auth status:", error);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    // End the specific session associated with this token
    await endSession(token);

    return { success: true };
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

// Optional: Add a method to log out from all devices
export const logoutFromAllDevices = async (userId) => {
  try {
    // Delete all sessions for this user
    await db.execAsync("DELETE FROM sessions WHERE userId = ?", [userId]);

    return { success: true };
  } catch (error) {
    console.error("Error during multi-device logout:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM user_session",
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const session = rows.item(0);
            resolve({
              id: session.userId,
              email: session.email,
              name: session.name,
            });
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error("Error getting current user:", error);
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
    db.transaction((tx) => {
      // Check if favorite already exists
      tx.executeSql(
        "SELECT * FROM favorites WHERE userId = ? AND movieId = ?",
        [userId, movieId],
        (_, { rows }) => {
          if (rows.length > 0) {
            // Remove favorite
            tx.executeSql(
              "DELETE FROM favorites WHERE userId = ? AND movieId = ?",
              [userId, movieId],
              (_, { rowsAffected }) => {
                resolve(rowsAffected > 0);
              },
              (_, error) => {
                console.error("Error removing favorite:", error);
                reject(error);
                return false;
              }
            );
          } else {
            // Add favorite
            tx.executeSql(
              "INSERT INTO favorites (userId, movieId) VALUES (?, ?)",
              [userId, movieId],
              (_, { rowsAffected }) => {
                resolve(rowsAffected > 0);
              },
              (_, error) => {
                console.error("Error adding favorite:", error);
                reject(error);
                return false;
              }
            );
          }
        },
        (_, error) => {
          console.error("Error checking favorite status:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getFavorites = (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT movieId FROM favorites WHERE userId = ?",
        [userId],
        (_, { rows }) => {
          const favoriteIds = [];
          for (let i = 0; i < rows.length; i++) {
            favoriteIds.push(rows.item(i).movieId);
          }
          resolve(favoriteIds);
        },
        (_, error) => {
          console.error("Error getting favorites:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const isFavorite = (userId, movieId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM favorites WHERE userId = ? AND movieId = ?",
        [userId, movieId],
        (_, { rows }) => {
          resolve(rows.length > 0);
        },
        (_, error) => {
          console.error("Error checking favorite status:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getFavoriteMovies = (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
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
              genre: JSON.parse(movie.genre),
            });
          }
          resolve(movies);
        },
        (_, error) => {
          console.error("Error getting favorite movies:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};
