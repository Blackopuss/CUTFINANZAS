// server.js
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_muy_segura";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD, // Tu contraseña de MySQL
  database: "finanzas",
});

db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    return;
  }
  console.log("Conectado a MySQL");

  // Crear tabla de usuarios si no existe
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) console.error("Error creando tabla:", err);
    else console.log("Tabla users lista");
  });
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    req.userId = decoded.id;
    next();
  });
};

// Ruta de registro
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validaciones básicas
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    // Verificar si el usuario ya existe
    const checkUserQuery =
      "SELECT * FROM users WHERE email = ? OR username = ?";
    db.query(checkUserQuery, [email, username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error en el servidor" });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "El usuario o email ya existe" });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const insertQuery =
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(
        insertQuery,
        [username, email, hashedPassword],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error al registrar usuario" });
          }

          res.status(201).json({
            message: "Usuario registrado exitosamente",
            userId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Ruta de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email y contraseña son requeridos" });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = results[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  });
});

// Ruta protegida de ejemplo
app.get("/api/profile", verifyToken, (req, res) => {
  const query =
    "SELECT id, username, email, created_at FROM users WHERE id = ?";
  db.query(query, [req.userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(results[0]);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
