const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = (db) => {
  const router = express.Router();

  // ===============================
  // RUTA: Registro de usuario
  // ===============================
  router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const query =
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(query, [username, email, hashedPassword], (err) => {
        if (err) {
          console.error("Error al registrar usuario:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .json({ message: "El correo o usuario ya existen" });
          }
          return res.status(500).json({ message: "Error en el registro" });
        }

        res.status(201).json({ message: "Usuario registrado exitosamente" });
      });
    } catch (error) {
      console.error("Error interno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===============================
  // RUTA: Inicio de sesión
  // ===============================
  router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Error al iniciar sesión:", err);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secret_key",
        { expiresIn: "2h" }
      );

      res.json({
        message: "Inicio de sesión exitoso",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      });
    });
  });

  // ===============================
  // RUTA: Verificar token y obtener perfil
  // ===============================
  router.get("/profile", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key",
      (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Token inválido" });
        }

        const query =
          "SELECT id, username, email, created_at FROM users WHERE id = ?";
        db.query(query, [decoded.id], (err, results) => {
          if (err) {
            console.error("Error al obtener perfil:", err);
            return res.status(500).json({ message: "Error al obtener perfil" });
          }

          if (results.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
          }

          res.json(results[0]);
        });
      }
    );
  });

  return router;
};
