const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = (db, verifyToken) => {
	const router = express.Router();

	// ============================================
	// RUTAS DE PERFIL DE USUARIO
	// ============================================

	// Obtener estadísticas completas
	router.get("/profile/stats", verifyToken, (req, res) => {
		const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM cards WHERE user_id = ?) as total_cards,
                (SELECT COALESCE(SUM(balance), 0) FROM cards WHERE user_id = ?) as total_balance,
                (SELECT COUNT(*) FROM transactions WHERE user_id = ?) as total_transactions,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ?) as total_spent,
                (SELECT COUNT(*) FROM savings_goals WHERE user_id = ?) as total_goals,
                (SELECT COUNT(*) FROM savings_goals WHERE user_id = ? AND status = 'completada') as completed_goals,
                (SELECT COUNT(*) FROM user_categories WHERE user_id = ?) as total_categories
        `;

		db.query(
			statsQuery,
			[
				req.userId,
				req.userId,
				req.userId,
				req.userId,
				req.userId,
				req.userId,
				req.userId,
			],
			(err, results) => {
				if (err) {
					console.error("Error al obtener estadísticas:", err);
					return res
						.status(500)
						.json({ message: "Error al obtener estadísticas" });
				}
				res.json(results[0]);
			},
		);
	});

	// Actividad reciente
	router.get("/profile/activity", verifyToken, (req, res) => {
		const activityQuery = `
            (
                SELECT 
                    'transaction' as type,
                    id,
                    created_at as date,
                    CONCAT('Gasto de $', amount, ' en ', category) as description
                FROM transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            )
            UNION
            (
                SELECT 
                    'goal' as type,
                    id,
                    created_at as date,
                    CONCAT('Meta creada: ', name) as description
                FROM savings_goals
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            )
            UNION
            (
                SELECT 
                    'card' as type,
                    id,
                    created_at as date,
                    CONCAT('Tarjeta agregada: ', card_name) as description
                FROM cards
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            )
            ORDER BY date DESC
            LIMIT 10
        `;

		db.query(
			activityQuery,
			[req.userId, req.userId, req.userId],
			(err, results) => {
				if (err) {
					console.error("Error al obtener actividad:", err);
					return res
						.status(500)
						.json({ message: "Error al obtener actividad" });
				}
				res.json(results);
			},
		);
	});

	// Actualizar perfil
	router.put("/profile/update", verifyToken, (req, res) => {
		const { username, email } = req.body;

		if (!username || !email) {
			return res
				.status(400)
				.json({ message: "Nombre de usuario y email son requeridos" });
		}

		const checkEmailQuery = "SELECT * FROM users WHERE email = ? AND id != ?";

		db.query(checkEmailQuery, [email, req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al verificar email" });

			if (results.length > 0) {
				return res.status(400).json({ message: "El email ya está en uso" });
			}

			const checkUsernameQuery =
				"SELECT * FROM users WHERE username = ? AND id != ?";

			db.query(checkUsernameQuery, [username, req.userId], (err, results) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Error al verificar nombre de usuario" });

				if (results.length > 0) {
					return res
						.status(400)
						.json({ message: "El nombre de usuario ya está en uso" });
				}

				const updateQuery =
					"UPDATE users SET username = ?, email = ? WHERE id = ?";

				db.query(updateQuery, [username, email, req.userId], (err) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al actualizar perfil" });

					res.json({
						message: "Perfil actualizado exitosamente",
						user: { username, email },
					});
				});
			});
		});
	});

	// Cambiar contraseña
	router.put("/profile/change-password", verifyToken, async (req, res) => {
		const { current_password, new_password } = req.body;

		if (!current_password || !new_password) {
			return res
				.status(400)
				.json({ message: "Ambas contraseñas son requeridas" });
		}

		if (new_password.length < 6) {
			return res.status(400).json({
				message: "La nueva contraseña debe tener al menos 6 caracteres",
			});
		}

		const getUserQuery = "SELECT * FROM users WHERE id = ?";

		db.query(getUserQuery, [req.userId], async (err, results) => {
			if (err || results.length === 0) {
				return res.status(500).json({ message: "Error al obtener usuario" });
			}

			const user = results[0];

			const isValidPassword = await bcrypt.compare(
				current_password,
				user.password,
			);

			if (!isValidPassword) {
				return res
					.status(401)
					.json({ message: "La contraseña actual es incorrecta" });
			}

			const hashedPassword = await bcrypt.hash(new_password, 10);

			const updateQuery = "UPDATE users SET password = ? WHERE id = ?";

			db.query(updateQuery, [hashedPassword, req.userId], (err) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Error al cambiar contraseña" });

				res.json({ message: "Contraseña cambiada exitosamente" });
			});
		});
	});

	// Eliminar cuenta
	router.delete("/profile/delete-account", verifyToken, async (req, res) => {
		const { password } = req.body;

		if (!password) {
			return res.status(400).json({ message: "La contraseña es requerida" });
		}

		const getUserQuery = "SELECT * FROM users WHERE id = ?";

		db.query(getUserQuery, [req.userId], async (err, results) => {
			if (err || results.length === 0) {
				return res.status(500).json({ message: "Error al obtener usuario" });
			}

			const user = results[0];
			const isValidPassword = await bcrypt.compare(password, user.password);

			if (!isValidPassword) {
				return res.status(401).json({ message: "Contraseña incorrecta" });
			}

			const deleteQuery = "DELETE FROM users WHERE id = ?";

			db.query(deleteQuery, [req.userId], (err) => {
				if (err)
					return res.status(500).json({ message: "Error al eliminar cuenta" });

				res.json({ message: "Cuenta eliminada exitosamente" });
			});
		});
	});

	// Gastos por categoría
	router.get("/profile/expenses-by-category", verifyToken, (req, res) => {
		const query = `
            SELECT 
                t.category,
                uc.icon,
                uc.color,
                COUNT(t.id) as transaction_count,
                COALESCE(SUM(t.amount), 0) as total_amount
            FROM transactions t
            LEFT JOIN user_categories uc 
                ON t.category = uc.name 
                AND t.user_id = uc.user_id
            WHERE t.user_id = ?
            GROUP BY t.category, uc.icon, uc.color
            ORDER BY total_amount DESC
            LIMIT 5
        `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener gastos por categoría:", err);
				return res.status(500).json({ message: "Error al obtener datos" });
			}
			res.json(results);
		});
	});

	return router;
};
