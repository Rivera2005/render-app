import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import {
  validateUserCredentials,
  getAllVideos,
  getVideosByCategory,
  getAllCategories,
  getAllSeriesWithEpisodes,
  getSeriesDetails,
  registerUser,
  getAllMovies,
  getMovieById,
  getUserById,
  updateUserProfile,
  saveGuardada,
  getSavedMovies,
} from "./database.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    console.error("Mensaje enviado: Missing username or password");
    return res
      .status(400)
      .json({ success: false, message: "Missing username or password" });
  }

  try {
    const user = await validateUserCredentials(username, password);
    if (user) {
      console.log(
        "Mensaje enviado: Inicio de sesión exitoso. ¡Bienvenido de nuevo!"
      );
      return res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso. ¡Bienvenido de nuevo!",
        accountId: user.accountId, // Se envía el accountId aquí
      });
    } else {
      console.error("Mensaje enviado: Credenciales inválidas");
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Register endpoint
app.post("/register", async (req, res) => {
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    email,
    username,
    password,
  } = req.body;

  if (!primer_nombre || !primer_apellido || !email || !username || !password) {
    console.error("Mensaje enviado: Missing required fields");
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const { success, usuario_id } = await registerUser(
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      username,
      password
    );

    if (success) {
      console.log("Mensaje enviado: Registro exitoso");
      return res
        .status(201)
        .json({ success: true, message: "Registro exitoso", usuario_id });
    } else {
      console.error("Mensaje enviado: Error desconocido");
      return res
        .status(500)
        .json({ success: false, message: "Error desconocido" });
    }
  } catch (error) {
    console.error("Registration error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Videos endpoint
app.get("/videos", async (req, res) => {
  try {
    const videos = await getAllVideos();
    return res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Categories endpoint
app.get("/categories", async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Videos by category endpoint
app.get("/videos/category/:categoryId", async (req, res) => {
  const { categoryId } = req.params;

  try {
    const videos = await getVideosByCategory(categoryId);
    return res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos by category:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Series endpoint
app.get("/series", async (req, res) => {
  try {
    const series = await getAllSeriesWithEpisodes();
    return res.status(200).json(series);
  } catch (error) {
    console.error("Error fetching series:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Series details endpoint
app.get("/series/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const seriesDetails = await getSeriesDetails(id);
    if (!seriesDetails) {
      console.error("Mensaje enviado: Serie no encontrada");
      return res
        .status(404)
        .json({ success: false, message: "Serie no encontrada" });
    }
    return res.status(200).json(seriesDetails);
  } catch (error) {
    console.error("Error fetching series details:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Movies endpoint
app.get("/movies", async (req, res) => {
  try {
    const movies = await getAllMovies();
    return res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Movie details endpoint
app.get("/movies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await getMovieById(id);
    if (!movie) {
      console.error("Mensaje enviado: Película no encontrada");
      return res
        .status(404)
        .json({ success: false, message: "Película no encontrada" });
    }
    return res.status(200).json(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});


app.get("/user/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const user = await getUserById(id);
      if (user) {
        return res.status(200).json(user);
      } else {
        return res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error.message);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

// Update user profile endpoint
app.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const {
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    email,
    username,
  } = req.body;

  try {
    // Asegúrate de que la función de actualización en database.js se ajuste a los datos que estás pasando
    const success = await updateUserProfile(id, {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      username,
    });

    if (success) {
      return res
        .status(200)
        .json({ success: true, message: "Perfil actualizado correctamente" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Endpoint para guardar Guardada
app.post("/guardadas", async (req, res) => {
  const { userId, movieId } = req.body;

  if (!userId || !movieId) {
    console.error("Mensaje enviado: Faltan userId o movieId");
    return res
      .status(400)
      .json({ success: false, message: "Faltan userId o movieId" });
  }

  try {
    const success = await saveGuardada(userId, movieId);
    if (success) {
      console.log("Mensaje enviado: Guardada guardado exitosamente");
      return res.status(201).json({ success: true, message: "Guardada guardado exitosamente" });
    } else {
      console.error("Mensaje enviado: Error al guardar Guardada");
      return res
        .status(500)
        .json({ success: false, message: "Error al guardar Guardada" });
    }
  } catch (error) {
    console.error("Error al guardar Guardada:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Endpoint para obtener películas guardadas
app.get("/guardadas/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await getSavedMovies(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching saved movies:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});