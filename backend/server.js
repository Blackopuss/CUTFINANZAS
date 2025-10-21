const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: process.env.DB_PASSWORD,
  database: "finanzas",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");

  // Crear tabla de usuarios si no existe
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createUsers, (err) => {
    if (err) console.error("Error creando tabla users:", err);
    else console.log("Tabla 'users' lista ✅");
  });

  // Crear tabla de tarjetas si no existe
  const createCards = `
    CREATE TABLE IF NOT EXISTS cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      card_name VARCHAR(100) NOT NULL,
      card_type ENUM('Débito','Crédito') NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.query(createCards, (err) => {
    if (err) console.error("Error creando tabla cards:", err);
    else console.log("Tabla 'cards' lista ✅");
  });
});

// Importar middleware y rutas
const verifyToken = require("./middleware/verifyToken");
const authRoutes = require("./routes/authRoutes")(db);
const cardRoutes = require("./routes/cardRoutes")(db, verifyToken);

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
