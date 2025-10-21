// routes/cardRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (db, verifyToken) => {
  // ============================================
  // RUTAS DE ADMINISTRACIÓN DE TARJETAS
  // ============================================

  // Obtener todas las tarjetas del usuario
  router.get("/", verifyToken, (req, res) => {
    const query =
      "SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC";

    db.query(query, [req.userId], (err, results) => {
      if (err) {
        console.error("Error al obtener tarjetas:", err);
        return res
          .status(500)
          .json({ message: "Error al obtener las tarjetas" });
      }
      res.json(results);
    });
  });

  // Obtener una tarjeta específica
  router.get("/:id", verifyToken, (req, res) => {
    const cardId = req.params.id;
    const query = "SELECT * FROM cards WHERE id = ? AND user_id = ?";

    db.query(query, [cardId, req.userId], (err, results) => {
      if (err) {
        console.error("Error al obtener tarjeta:", err);
        return res.status(500).json({ message: "Error al obtener la tarjeta" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Tarjeta no encontrada" });
      }

      res.json(results[0]);
    });
  });

  // Agregar una nueva tarjeta
  router.post("/", verifyToken, (req, res) => {
    const { card_name, card_type, bank_name } = req.body;

    if (!card_name || !card_type || !bank_name) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    if (!["Débito", "Crédito"].includes(card_type)) {
      return res.status(400).json({ message: "Tipo de tarjeta inválido" });
    }

    const query =
      "INSERT INTO cards (user_id, card_name, card_type, bank_name) VALUES (?, ?, ?, ?)";

    db.query(
      query,
      [req.userId, card_name, card_type, bank_name],
      (err, result) => {
        if (err) {
          console.error("Error al agregar tarjeta:", err);
          return res
            .status(500)
            .json({ message: "Error al agregar la tarjeta" });
        }

        res.status(201).json({
          message: "Tarjeta agregada exitosamente",
          cardId: result.insertId,
        });
      }
    );
  });

  // Editar una tarjeta
  router.put("/:id", verifyToken, (req, res) => {
    const cardId = req.params.id;
    const { card_name, card_type, bank_name } = req.body;

    if (!card_name || !card_type || !bank_name) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    if (!["Débito", "Crédito"].includes(card_type)) {
      return res.status(400).json({ message: "Tipo de tarjeta inválido" });
    }

    const checkQuery = "SELECT * FROM cards WHERE id = ? AND user_id = ?";

    db.query(checkQuery, [cardId, req.userId], (err, results) => {
      if (err) {
        console.error("Error al verificar tarjeta:", err);
        return res
          .status(500)
          .json({ message: "Error al verificar la tarjeta" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Tarjeta no encontrada" });
      }

      const updateQuery =
        "UPDATE cards SET card_name = ?, card_type = ?, bank_name = ? WHERE id = ? AND user_id = ?";

      db.query(
        updateQuery,
        [card_name, card_type, bank_name, cardId, req.userId],
        (err) => {
          if (err) {
            console.error("Error al actualizar tarjeta:", err);
            return res
              .status(500)
              .json({ message: "Error al actualizar la tarjeta" });
          }

          res.json({ message: "Tarjeta actualizada exitosamente" });
        }
      );
    });
  });

  // Eliminar una tarjeta
  router.delete("/:id", verifyToken, (req, res) => {
    const cardId = req.params.id;
    const checkQuery = "SELECT * FROM cards WHERE id = ? AND user_id = ?";

    db.query(checkQuery, [cardId, req.userId], (err, results) => {
      if (err) {
        console.error("Error al verificar tarjeta:", err);
        return res
          .status(500)
          .json({ message: "Error al verificar la tarjeta" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Tarjeta no encontrada" });
      }

      const deleteQuery = "DELETE FROM cards WHERE id = ? AND user_id = ?";

      db.query(deleteQuery, [cardId, req.userId], (err) => {
        if (err) {
          console.error("Error al eliminar tarjeta:", err);
          return res
            .status(500)
            .json({ message: "Error al eliminar la tarjeta" });
        }

        res.json({ message: "Tarjeta eliminada exitosamente" });
      });
    });
  });

  return router;
};
