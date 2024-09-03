import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT, 10),
});

export { pool };

export async function getUserById(cuentaId) {
  try {
    const [rows] = await pool.query(
      `
            SELECT u.*, c.username
            FROM usuario u
            JOIN cuenta c ON u.id = c.usuario_id
            WHERE c.id = ?
        `,
      [cuentaId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error(
      "Error al consultar la base de datos en getUserById:",
      err.message
    );
    throw err;
  }
}

export async function validateUserCredentials(username, password) {
  try {
    const [accounts] = await pool.query(
      "SELECT * FROM cuenta WHERE username = ?",
      [username]
    );
    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    const isMatch = await bcrypt.compare(password, account.password_hash);

    if (isMatch) {
      return { accountId: account.id, usuarioId: account.usuario_id };
    } else {
      return null;
    }
  } catch (err) {
    console.error(
      "Error al validar credenciales en validateUserCredentials:",
      err.message
    );
    throw err;
  }
}

export async function getAllMovies() {
  try {
    const [rows] = await pool.query(`
            SELECT p.*, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
            FROM peliculas p
            LEFT JOIN contenido_categoria cc ON p.id = cc.contenido_id AND cc.tipo_contenido = 'pelicula'
            LEFT JOIN categorias c ON cc.categoria_id = c.id
            GROUP BY p.id
        `);
    return rows;
  } catch (error) {
    console.error("Error al obtener películas en getAllMovies:", error.message);
    throw error;
  }
}

export async function getMovieById(movieId) {
  try {
    const [rows] = await pool.query(
      `
            SELECT p.*, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
            FROM peliculas p
            LEFT JOIN contenido_categoria cc ON p.id = cc.contenido_id AND cc.tipo_contenido = 'pelicula'
            LEFT JOIN categorias c ON cc.categoria_id = c.id
            WHERE p.id = ?
            GROUP BY p.id
        `,
      [movieId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Error al obtener película en getMovieById:", error.message);
    throw error;
  }
}

export async function getAllVideos() {
  try {
    const [peliculas] = await pool.query(`
            SELECT p.*, 'pelicula' AS tipo, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
            FROM peliculas p
            LEFT JOIN contenido_categoria cc ON p.id = cc.contenido_id AND cc.tipo_contenido = 'pelicula'
            LEFT JOIN categorias c ON cc.categoria_id = c.id
            GROUP BY p.id
        `);
    const [episodios] = await pool.query(`
            SELECT e.*, 'episodio' AS tipo, t.serie_id, s.nombre AS nombre_serie, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
            FROM episodios e
            JOIN temporadas t ON e.temporada_id = t.id
            JOIN series s ON t.serie_id = s.id
            LEFT JOIN contenido_categoria cc ON e.id = cc.contenido_id AND cc.tipo_contenido = 'episodio'
            LEFT JOIN categorias c ON cc.categoria_id = c.id
            GROUP BY e.id
        `);
    return [...peliculas, ...episodios];
  } catch (err) {
    console.error("Error al obtener videos en getAllVideos:", err.message);
    throw err;
  }
}

export async function getAllSeries() {
  try {
    const [rows] = await pool.query(`
            SELECT s.id, s.nombre, s.descripcion, 
                COUNT(DISTINCT t.id) AS num_temporadas, 
                COUNT(DISTINCT e.id) AS num_episodios
            FROM series s
            LEFT JOIN temporadas t ON s.id = t.serie_id
            LEFT JOIN episodios e ON t.id = e.temporada_id
            GROUP BY s.id
        `);
    return rows;
  } catch (error) {
    console.error("Error al obtener series en getAllSeries:", error.message);
    throw error;
  }
}

export async function getSeriesDetails(seriesId) {
  try {
    const [seriesInfo] = await pool.query(
      `
            SELECT id, nombre, descripcion
            FROM series
            WHERE id = ?
        `,
      [seriesId]
    );

    if (seriesInfo.length === 0) {
      return null; // Serie no encontrada
    }

    const [seasons] = await pool.query(
      `
            SELECT id, numero, nombre
            FROM temporadas
            WHERE serie_id = ?
            ORDER BY numero
        `,
      [seriesId]
    );

    const [episodes] = await pool.query(
      `
            SELECT e.id, e.nombre, e.url_video, e.url_imagen, e.sinopsis, e.fecha_subida, t.numero AS temporada_numero
            FROM episodios e
            JOIN temporadas t ON e.temporada_id = t.id
            WHERE t.serie_id = ?
            ORDER BY t.numero, e.numero_episodio
        `,
      [seriesId]
    );

    return {
      ...seriesInfo[0],
      temporadas: seasons.length ? seasons : [],
      episodios: episodes.length ? episodes : [],
    };
  } catch (error) {
    console.error(
      "Error al obtener detalles de la serie en getSeriesDetails:",
      error.message
    );
    throw error;
  }
}

export async function getVideosByCategory(categoryId) {
  try {
    const [peliculas] = await pool.query(
      `
            SELECT p.*, 'pelicula' AS tipo, c.nombre AS nombre_categoria
            FROM peliculas p
            JOIN contenido_categoria cc ON p.id = cc.contenido_id AND cc.tipo_contenido = 'pelicula'
            JOIN categorias c ON cc.categoria_id = c.id
            WHERE c.id = ?
        `,
      [categoryId]
    );

    const [episodios] = await pool.query(
      `
            SELECT e.*, 'episodio' AS tipo, s.nombre AS nombre_serie, c.nombre AS nombre_categoria
            FROM episodios e
            JOIN temporadas t ON e.temporada_id = t.id
            JOIN series s ON t.serie_id = s.id
            JOIN contenido_categoria cc ON e.id = cc.contenido_id AND cc.tipo_contenido = 'episodio'
            JOIN categorias c ON cc.categoria_id = c.id
            WHERE c.id = ?
        `,
      [categoryId]
    );

    return [...peliculas, ...episodios];
  } catch (err) {
    console.error(
      "Error al obtener videos por categoría en getVideosByCategory:",
      err.message
    );
    throw err;
  }
}

export async function getAllCategories() {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM categorias");
    return rows;
  } catch (err) {
    console.error(
      "Error al obtener categorías en getAllCategories:",
      err.message
    );
    throw err;
  }
}

async function insertUserAndAccount(
  connection,
  {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    email,
    username,
    password_hash,
  }
) {
  const [resultUsuario] = await connection.query(
    "INSERT INTO usuario (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email) VALUES (?, ?, ?, ?, ?)",
    [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email]
  );
  const usuario_id = resultUsuario.insertId;

  await connection.query(
    "INSERT INTO cuenta (usuario_id, username, password_hash) VALUES (?, ?, ?)",
    [usuario_id, username, password_hash]
  );

  return usuario_id;
}

export async function registerUser(
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  email,
  username,
  password
) {
  const connection = await pool.getConnection();
  try {
    const password_hash = await bcrypt.hash(password, 10);
    await connection.beginTransaction();

    const usuario_id = await insertUserAndAccount(connection, {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      username,
      password_hash,
    });

    await connection.commit();
    return { success: true, usuario_id };
  } catch (err) {
    await connection.rollback();
    console.error("Error al registrar usuario en registerUser:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

export async function getAllSeriesWithEpisodes() {
  try {
    const [series] = await pool.query(`
            SELECT s.id, s.nombre, s.descripcion
            FROM series s
        `);

    const seriesWithEpisodes = await Promise.all(
      series.map(async (serie) => {
        const [episodes] = await pool.query(
          `
                SELECT e.*, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
                FROM episodios e
                JOIN temporadas t ON e.temporada_id = t.id
                LEFT JOIN contenido_categoria cc ON e.id = cc.contenido_id AND cc.tipo_contenido = 'episodio'
                LEFT JOIN categorias c ON cc.categoria_id = c.id
                WHERE t.serie_id = ?
                GROUP BY e.id
            `,
          [serie.id]
        );

        return {
          title: serie.nombre,
          data: episodes,
        };
      })
    );

    return seriesWithEpisodes;
  } catch (error) {
    console.error("Error al obtener series con episodios:", error.message);
    throw error;
  }
}

export async function updateUserProfile(cuentaId, userData) {
  try {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      username,
    } = userData;
    const [result] = await pool.query(
      `
            UPDATE usuario u
            JOIN cuenta c ON u.id = c.usuario_id
            SET u.primer_nombre = ?, u.segundo_nombre = ?, u.primer_apellido = ?, u.segundo_apellido = ?, u.email = ?, c.username = ?
            WHERE c.id = ?
        `,
      [
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        username,
        cuentaId,
      ]
    );
    return result.affectedRows > 0; // Retorna true si se actualizó al menos una fila
  } catch (err) {
    console.error(
      "Error al actualizar el perfil en updateUserProfile:",
      err.message
    );
    throw err;
  }
}

export async function saveGuardada(userId, movieId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO guardadas (id_cuenta, id_contenido) VALUES (?, ?)",
      [userId, movieId]
    );
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error("Error al guardar favorito en saveGuardada:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

export async function getSavedMovies(userId) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT p.*, 'pelicula' AS tipo, GROUP_CONCAT(c.nombre SEPARATOR ', ') AS nombre_categoria
      FROM peliculas p
      LEFT JOIN contenido_categoria cc ON p.id = cc.contenido_id AND cc.tipo_contenido = 'pelicula'
      LEFT JOIN categorias c ON cc.categoria_id = c.id
      LEFT JOIN guardadas g ON p.id = g.id_contenido
      WHERE g.id_cuenta = ?
      GROUP BY p.id;
      `,
      [userId]
    );
    connection.release();

    return { success: true, movies: rows };
  } catch (error) {
    console.error("Error al obtener las películas guardadas:", error);
    throw new Error("Error al obtener las películas guardadas");
  }
}
