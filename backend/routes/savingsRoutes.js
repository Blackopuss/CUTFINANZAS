module.exports = (db, verifyToken) => {
	const express = require("express");
	const app = express.Router();

	// ======================================================
	// FUNCIONES AUXILIARES
	// ======================================================

	const normalizeDeadline = (d) => {
		if (!d || d === "" || d === "null") return null;

		try {
			const date = new Date(d);
			if (isNaN(date.getTime())) return null;
			return date.toISOString().split("T")[0];
		} catch {
			return null;
		}
	};

	// ======================================================
	// OBTENER TODAS LAS METAS
	// ======================================================
	app.get("/savings-goals", verifyToken, (req, res) => {
		const query = `
      SELECT 
        sg.*,
        ROUND((sg.current_amount / sg.target_amount) * 100, 2) as progress_percentage,
        (sg.target_amount - sg.current_amount) as remaining_amount,
        CASE 
          WHEN sg.current_amount >= sg.target_amount THEN 'completada'
          WHEN sg.deadline IS NOT NULL AND sg.deadline < CURDATE() AND sg.current_amount < sg.target_amount THEN 'vencida'
          ELSE 'activa'
        END as calculated_status
      FROM savings_goals sg
      WHERE sg.user_id = ?
      ORDER BY 
        CASE sg.status
          WHEN 'activa' THEN 1
          WHEN 'vencida' THEN 2
          WHEN 'completada' THEN 3
        END,
        sg.deadline IS NULL,
        sg.deadline ASC
    `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener metas:", err);
				return res.status(500).json({ message: "Error al obtener metas" });
			}
			res.json(results);
		});
	});

	// ======================================================
	// OBTENER META ESPECÍFICA
	// ======================================================
	app.get("/savings-goals/:id", verifyToken, (req, res) => {
		const goalId = req.params.id;

		const goalQuery = `
      SELECT 
        sg.*,
        ROUND((sg.current_amount / sg.target_amount) * 100, 2) as progress_percentage,
        (sg.target_amount - sg.current_amount) as remaining_amount
      FROM savings_goals sg
      WHERE sg.id = ? AND sg.user_id = ?
    `;

		db.query(goalQuery, [goalId, req.userId], (err, goalResults) => {
			if (err)
				return res.status(500).json({ message: "Error al obtener la meta" });

			if (goalResults.length === 0) {
				return res.status(404).json({ message: "Meta no encontrada" });
			}

			const goal = goalResults[0];

			const contributionsQuery = `
        SELECT * FROM goal_contributions 
        WHERE goal_id = ? 
        ORDER BY contribution_date DESC
      `;

			db.query(contributionsQuery, [goalId], (err, contributions) => {
				if (err) return res.json(goal);

				goal.contributions = contributions;
				res.json(goal);
			});
		});
	});

	// ======================================================
	// CREAR META
	// ======================================================
	app.post("/savings-goals", verifyToken, (req, res) => {
		const { name, target_amount, deadline, description } = req.body;

		if (!name || !target_amount) {
			return res.status(400).json({
				message: "Nombre y monto objetivo son requeridos",
			});
		}

		if (parseFloat(target_amount) <= 0) {
			return res
				.status(400)
				.json({ message: "El monto objetivo debe ser mayor a 0" });
		}

		const normalizedDeadline = normalizeDeadline(deadline);

		const insertQuery = `
      INSERT INTO savings_goals (user_id, name, target_amount, deadline, description) 
      VALUES (?, ?, ?, ?, ?)
    `;

		db.query(
			insertQuery,
			[
				req.userId,
				name,
				parseFloat(target_amount),
				normalizedDeadline,
				description || null,
			],
			(err, result) => {
				if (err) {
					console.error("Error al crear meta:", err);
					return res.status(500).json({ message: "Error al crear la meta" });
				}

				res.status(201).json({
					message: "Meta creada exitosamente",
					goalId: result.insertId,
				});
			},
		);
	});

	// ======================================================
	// EDITAR META
	// ======================================================
	app.put("/savings-goals/:id", verifyToken, (req, res) => {
		const goalId = req.params.id;
		const { name, target_amount, deadline, description } = req.body;

		if (!name || !target_amount) {
			return res
				.status(400)
				.json({ message: "Nombre y monto objetivo son requeridos" });
		}

		if (parseFloat(target_amount) <= 0) {
			return res
				.status(400)
				.json({ message: "El monto objetivo debe ser mayor a 0" });
		}

		const normalizedDeadline = normalizeDeadline(deadline);

		const checkQuery =
			"SELECT * FROM savings_goals WHERE id = ? AND user_id = ?";

		db.query(checkQuery, [goalId, req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al verificar la meta" });

			if (results.length === 0) {
				return res.status(404).json({ message: "Meta no encontrada" });
			}

			const updateQuery = `
        UPDATE savings_goals 
        SET name = ?, target_amount = ?, deadline = ?, description = ?
        WHERE id = ? AND user_id = ?
      `;

			db.query(
				updateQuery,
				[
					name,
					parseFloat(target_amount),
					normalizedDeadline,
					description || null,
					goalId,
					req.userId,
				],
				(err) => {
					if (err) {
						console.error("Error al actualizar meta:", err);
						return res
							.status(500)
							.json({ message: "Error al actualizar la meta" });
					}

					res.json({ message: "Meta actualizada exitosamente" });
				},
			);
		});
	});

	// ======================================================
	// ELIMINAR META
	// ======================================================
	app.delete("/savings-goals/:id", verifyToken, (req, res) => {
		const goalId = req.params.id;

		const checkQuery =
			"SELECT * FROM savings_goals WHERE id = ? AND user_id = ?";

		db.query(checkQuery, [goalId, req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al verificar la meta" });

			if (results.length === 0) {
				return res.status(404).json({ message: "Meta no encontrada" });
			}

			const deleteQuery =
				"DELETE FROM savings_goals WHERE id = ? AND user_id = ?";

			db.query(deleteQuery, [goalId, req.userId], (err) => {
				if (err)
					return res.status(500).json({ message: "Error al eliminar la meta" });

				res.json({ message: "Meta eliminada exitosamente" });
			});
		});
	});

	// ======================================================
	// AGREGAR CONTRIBUCIÓN + NOTIFICACIÓN META COMPLETADA
	// ======================================================
	app.post("/savings-goals/:id/contribute", verifyToken, (req, res) => {
		const goalId = req.params.id;
		const { amount, note } = req.body;

		const amountNum = parseFloat(amount);

		if (!amountNum || amountNum <= 0) {
			return res.status(400).json({ message: "El monto debe ser mayor a 0" });
		}

		const checkQuery =
			"SELECT * FROM savings_goals WHERE id = ? AND user_id = ?";

		db.query(checkQuery, [goalId, req.userId], (err, results) => {
			if (err) {
				console.error("Error SELECT:", err);
				return res.status(500).json({ message: "Error al verificar la meta" });
			}

			if (results.length === 0) {
				return res.status(404).json({ message: "Meta no encontrada" });
			}

			const goal = results[0];

			const current = parseFloat(goal.current_amount);
			const target = parseFloat(goal.target_amount);

			const newTotal = Math.round((current + amountNum) * 100) / 100;

			if (newTotal - target > 0.000001) {
				return res.status(400).json({
					message: "La contribución excede el monto objetivo",
					maxAllowed: Math.round((target - current) * 100) / 100,
				});
			}

			db.beginTransaction((err) => {
				if (err) {
					console.error("Error beginTransaction:", err);
					return res
						.status(500)
						.json({ message: "Error al iniciar transacción" });
				}

				const insertContributionQuery = `
					INSERT INTO goal_contributions (goal_id, user_id, amount, contribution_date, note) 
					VALUES (?, ?, ?, CURDATE(), ?)
				`;

				db.query(
					insertContributionQuery,
					[goalId, req.userId, amountNum, note || null],
					(err, result) => {
						if (err) {
							console.error("Error INSERT:", err);
							return db.rollback(() =>
								res
									.status(500)
									.json({ message: "Error al registrar contribución" }),
							);
						}

						const updateGoalQuery = `
							UPDATE savings_goals 
							SET current_amount = current_amount + ?
							WHERE id = ? AND user_id = ?
						`;

						db.query(
							updateGoalQuery,
							[amountNum, goalId, req.userId],
							(err) => {
								if (err) {
									console.error("Error UPDATE:", err);
									return db.rollback(() =>
										res
											.status(500)
											.json({ message: "Error al actualizar meta" }),
									);
								}

								db.commit((err) => {
									if (err) {
										console.error("Error COMMIT:", err);
										return db.rollback(() =>
											res.status(500).json({
												message: "Error al confirmar transacción",
											}),
										);
									}

									if (Math.abs(newTotal - target) < 0.00001) {
										const msg = `🎉 ¡Has completado tu meta "${goal.name}"!`;
									}

									res.status(201).json({
										message: "Contribución registrada exitosamente",
										contributionId: result.insertId,
									});
								});
							},
						);
					},
				);
			});
		});
	});

	// ======================================================
	// RESUMEN ESTADÍSTICO
	// ======================================================
	app.get("/savings-goals/summary/stats", verifyToken, (req, res) => {
		const query = `
      SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN status = 'activa' THEN 1 END) as active_goals,
        COUNT(CASE WHEN status = 'completada' THEN 1 END) as completed_goals,
        COALESCE(SUM(target_amount), 0) as total_target,
        COALESCE(SUM(current_amount), 0) as total_saved,
        COALESCE(SUM(target_amount - current_amount), 0) as total_remaining
      FROM savings_goals
      WHERE user_id = ?
    `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener resumen:", err);
				return res.status(500).json({ message: "Error al obtener resumen" });
			}

			res.json(results[0]);
		});
	});

	return app;
};
