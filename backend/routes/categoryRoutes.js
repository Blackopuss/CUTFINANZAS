// routes/categoryRoutes.js
module.exports = (db, verifyToken) => {
	const router = require("express").Router();

	// ============================================
	// Obtener todas las categorías del usuario
	// ============================================
	router.get("/user-categories", verifyToken, (req, res) => {
		const query =
			"SELECT * FROM user_categories WHERE user_id = ? ORDER BY name";

		db.query(query, [req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al obtener categorías" });

			if (results.length === 0) {
				const initQuery = "CALL init_user_categories(?)";
				db.query(initQuery, [req.userId], (err) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al inicializar categorías" });

					db.query(query, [req.userId], (err, newResults) => {
						if (err)
							return res
								.status(500)
								.json({ message: "Error al obtener categorías" });

						res.json(newResults);
					});
				});
			} else {
				res.json(results);
			}
		});
	});

	// ============================================
	// Obtener una categoría específica
	// ============================================
	router.get("/user-categories/:id", verifyToken, (req, res) => {
		const query = "SELECT * FROM user_categories WHERE id = ? AND user_id = ?";
		db.query(query, [req.params.id, req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al obtener categoría" });
			if (results.length === 0)
				return res.status(404).json({ message: "Categoría no encontrada" });
			res.json(results[0]);
		});
	});

	// ============================================
	// Agregar una nueva categoría
	// ============================================
	router.post("/user-categories", verifyToken, (req, res) => {
		const { name, icon, color } = req.body;

		if (!name || name.trim().length === 0)
			return res.status(400).json({ message: "El nombre es requerido" });
		if (name.length > 50)
			return res
				.status(400)
				.json({ message: "El nombre no puede exceder 50 caracteres" });

		const checkQuery =
			"SELECT * FROM user_categories WHERE user_id = ? AND name = ?";
		db.query(checkQuery, [req.userId, name.trim()], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al verificar categoría" });
			if (results.length > 0)
				return res
					.status(400)
					.json({ message: "Ya existe una categoría con ese nombre" });

			const insertQuery = `
        INSERT INTO user_categories (user_id, name, icon, color)
        VALUES (?, ?, ?, ?)
      `;
			db.query(
				insertQuery,
				[req.userId, name.trim(), icon || "📌", color || "#A29BFE"],
				(err, result) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al agregar la categoría" });

					res.status(201).json({
						message: "Categoría agregada exitosamente",
						categoryId: result.insertId,
					});
				},
			);
		});
	});

	// ============================================
	// Editar una categoría
	// ============================================
	router.put("/user-categories/:id", verifyToken, (req, res) => {
		const { name, icon, color } = req.body;
		const categoryId = req.params.id;

		if (!name || name.trim().length === 0)
			return res.status(400).json({ message: "El nombre es requerido" });
		if (name.length > 50)
			return res
				.status(400)
				.json({ message: "El nombre no puede exceder 50 caracteres" });

		const checkQuery =
			"SELECT * FROM user_categories WHERE id = ? AND user_id = ?";
		db.query(checkQuery, [categoryId, req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al verificar categoría" });
			if (results.length === 0)
				return res.status(404).json({ message: "Categoría no encontrada" });

			const oldName = results[0].name;

			const checkNameQuery = `
        SELECT * FROM user_categories 
        WHERE user_id = ? AND name = ? AND id != ?
      `;

			db.query(
				checkNameQuery,
				[req.userId, name.trim(), categoryId],
				(err, nameResults) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al verificar el nombre" });
					if (nameResults.length > 0)
						return res
							.status(400)
							.json({ message: "Ya existe una categoría con ese nombre" });

					const updateQuery = `
          UPDATE user_categories 
          SET name = ?, icon = ?, color = ? 
          WHERE id = ? AND user_id = ?
        `;

					db.query(
						updateQuery,
						[
							name.trim(),
							icon || "📌",
							color || "#A29BFE",
							categoryId,
							req.userId,
						],
						(err) => {
							if (err)
								return res
									.status(500)
									.json({ message: "Error al actualizar la categoría" });

							// si cambió el nombre, actualizar transacciones
							if (oldName !== name.trim()) {
								db.query(
									`
                UPDATE transactions 
                SET category = ? 
                WHERE user_id = ? AND category = ?
              `,
									[name.trim(), req.userId, oldName],
								);
							}

							res.json({ message: "Categoría actualizada exitosamente" });
						},
					);
				},
			);
		});
	});

	// ============================================
	// Eliminar una categoría
	// ============================================
	router.delete("/user-categories/:id", verifyToken, (req, res) => {
		const categoryId = req.params.id;

		db.query(
			"SELECT * FROM user_categories WHERE id = ? AND user_id = ?",
			[categoryId, req.userId],
			(err, results) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Error al verificar categoría" });
				if (results.length === 0)
					return res.status(404).json({ message: "Categoría no encontrada" });

				const categoryName = results[0].name;

				db.query(
					`
          SELECT COUNT(*) as count 
          FROM transactions 
          WHERE user_id = ? AND category = ?
        `,
					[req.userId, categoryName],
					(err, countResults) => {
						if (err)
							return res
								.status(500)
								.json({ message: "Error al verificar transacciones" });

						if (countResults[0].count > 0)
							return res.status(400).json({
								message: `No se puede eliminar la categoría porque tiene ${countResults[0].count} transacción(es) asociada(s).`,
							});

						db.query(
							"DELETE FROM user_categories WHERE id = ? AND user_id = ?",
							[categoryId, req.userId],
							(err) => {
								if (err)
									return res
										.status(500)
										.json({ message: "Error al eliminar categoría" });

								res.json({ message: "Categoría eliminada exitosamente" });
							},
						);
					},
				);
			},
		);
	});

	// ============================================
	// Estadísticas de categorías
	// ============================================
	router.get("/user-categories/stats/usage", verifyToken, (req, res) => {
		const query = `
      SELECT 
        uc.id,
        uc.name,
        uc.icon,
        uc.color,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_spent
      FROM user_categories uc
      LEFT JOIN transactions t 
        ON t.category = uc.name AND t.user_id = uc.user_id
      WHERE uc.user_id = ?
      GROUP BY uc.id, uc.name, uc.icon, uc.color
      ORDER BY transaction_count DESC, uc.name
    `;

		db.query(query, [req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al obtener estadísticas" });
			res.json(results);
		});
	});

	return router;
};
