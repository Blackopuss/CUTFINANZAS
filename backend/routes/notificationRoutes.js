module.exports = (db, verifyToken) => {
	const express = require("express");
	const app = express.Router();

	// ============================================
	// RUTAS DE NOTIFICACIONES
	// ============================================

	// Obtener notificaciones del usuario
	app.get("/notifications", verifyToken, (req, res) => {
		const query = `
      SELECT n.*, sg.name as goal_name
      FROM notifications n
      LEFT JOIN savings_goals sg ON n.goal_id = sg.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener notificaciones:", err);
				return res
					.status(500)
					.json({ message: "Error al obtener notificaciones" });
			}
			res.json(results);
		});
	});

	// Marcar como leída
	app.put("/notifications/:id/read", verifyToken, (req, res) => {
		const notificationId = req.params.id;
		const query =
			"UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";

		db.query(query, [notificationId, req.userId], (err) => {
			if (err) {
				console.error("Error al marcar notificación:", err);
				return res
					.status(500)
					.json({ message: "Error al marcar notificación" });
			}
			res.json({ message: "Notificación marcada como leída" });
		});
	});

	// Marcar todas como leídas
	app.put("/notifications/read-all", verifyToken, (req, res) => {
		const query = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";

		db.query(query, [req.userId], (err) => {
			if (err) {
				console.error("Error al marcar notificaciones:", err);
				return res
					.status(500)
					.json({ message: "Error al marcar notificaciones" });
			}
			res.json({ message: "Todas las notificaciones marcadas como leídas" });
		});
	});

	// Contar no leídas
	app.get("/notifications/unread/count", verifyToken, (req, res) => {
		const query =
			"SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al contar notificaciones:", err);
				return res
					.status(500)
					.json({ message: "Error al contar notificaciones" });
			}
			res.json({ count: results[0].count });
		});
	});

	return app;
};
