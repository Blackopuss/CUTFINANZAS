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
	//cambien poor su contrasena y usuario, cambie al mio. Comente la que sta en las emnv
	user: "admin",
	password: "123456789",
	// password: process.env.DB_PASSWORD ,
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
      balance DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
	db.query(createCards, (err) => {
		if (err) console.error("Error creando tabla cards:", err);
		else console.log("Tabla 'cards' lista ✅");
	});

	// Crear tabla de categorías
	const createCategories = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      icon VARCHAR(50),
      color VARCHAR(20)
    )
  `;
	db.query(createCategories, (err) => {
		if (err) console.error("Error creando tabla categories:", err);
		else console.log("Tabla 'categories' lista ✅");
	});

	// Crear tabla de transacciones
	const createTransactions = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      card_id INT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type ENUM('gasto','ingreso') DEFAULT 'gasto',
      category VARCHAR(100),
      description TEXT,
      transaction_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL
    )
  `;
	db.query(createTransactions, (err) => {
		if (err) console.error("Error creando tabla transactions:", err);
		else console.log("Tabla 'transactions' lista ✅");
	});
});

// Importar middleware y rutas
const verifyToken = require("./middleware/verifyToken");
const authRoutes = require("./routes/authRoutes")(db);
const cardRoutes = require("./routes/cardRoutes")(db, verifyToken);
const financeRoutes = require("./routes/financeRoutes")(db, verifyToken);
const categoryRoutes = require("./routes/categoryRoutes")(db, verifyToken);
const savingsRoutes = require("./routes/savingsRoutes")(db, verifyToken);
const notificationRoutes = require("./routes/notificationRoutes")(
	db,
	verifyToken,
);
const profileRoutes = require("./routes/profileRoutes")(db, verifyToken);

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api", financeRoutes);
app.use("/api", categoryRoutes);
app.use("/api", savingsRoutes);
app.use("/api", notificationRoutes);
app.use("/api", profileRoutes);

// Iniciar servidor
app.listen(PORT, () => {
	console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
