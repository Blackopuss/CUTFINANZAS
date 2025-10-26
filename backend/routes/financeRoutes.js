const express = require("express");

module.exports = (db, verifyToken) => {
	const router = express.Router();

	// ============================================
	// RUTAS DE GESTIÓN DE FONDOS
	// ============================================

	// Agregar saldo a una tarjeta
	router.post("/cards/:id/add-balance", verifyToken, (req, res) => {
		const cardId = req.params.id;
		const { amount } = req.body;

		if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
			return res
				.status(400)
				.json({ message: "El monto debe ser un número positivo" });
		}

		const checkQuery = "SELECT * FROM cards WHERE id = ? AND user_id = ?";
		db.query(checkQuery, [cardId, req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al verificar la tarjeta" });
			if (results.length === 0)
				return res.status(404).json({ message: "Tarjeta no encontrada" });

			const updateQuery =
				"UPDATE cards SET balance = balance + ? WHERE id = ? AND user_id = ?";
			db.query(updateQuery, [parseFloat(amount), cardId, req.userId], (err) => {
				if (err)
					return res.status(500).json({ message: "Error al agregar saldo" });
				res.json({
					message: "Saldo agregado exitosamente",
					amountAdded: parseFloat(amount),
				});
			});
		});
	});

	// Obtener total de dinero de todas las tarjetas
	router.get("/total-balance", verifyToken, (req, res) => {
		const query = "SELECT SUM(balance) as total FROM cards WHERE user_id = ?";
		db.query(query, [req.userId], (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al calcular el total" });
			const total = results[0].total || 0;
			res.json({ total: parseFloat(total).toFixed(2) });
		});
	});

	// ============================================
	// RUTAS DE GESTIÓN DE GASTOS
	// ============================================

	// Obtener todas las categorías
	router.get("/categories", verifyToken, (req, res) => {
		const query = "SELECT * FROM categories ORDER BY name";
		db.query(query, (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al obtener categorías" });
			res.json(results);
		});
	});

	// Registrar un gasto
	router.post("/transactions", verifyToken, (req, res) => {
		const { card_id, amount, category, description, transaction_date } =
			req.body;

		if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
			return res
				.status(400)
				.json({ message: "El monto debe ser un número positivo" });
		}

		if (!category || !transaction_date) {
			return res
				.status(400)
				.json({ message: "Categoría y fecha son requeridos" });
		}

		if (card_id) {
			const checkCardQuery =
				"SELECT balance FROM cards WHERE id = ? AND user_id = ?";
			db.query(checkCardQuery, [card_id, req.userId], (err, results) => {
				if (err || results.length === 0) {
					return res.status(404).json({ message: "Tarjeta no encontrada" });
				}

				const currentBalance = parseFloat(results[0].balance);
				const expenseAmount = parseFloat(amount);

				if (currentBalance < expenseAmount) {
					return res.status(400).json({
						message: "Saldo insuficiente en la tarjeta",
						currentBalance,
						requiredAmount: expenseAmount,
					});
				}

				db.beginTransaction((err) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al iniciar transacción" });

					const insertQuery = `
            INSERT INTO transactions (user_id, card_id, amount, type, category, description, transaction_date) 
            VALUES (?, ?, ?, 'gasto', ?, ?, ?)
          `;

					db.query(
						insertQuery,
						[
							req.userId,
							card_id,
							expenseAmount,
							category,
							description,
							transaction_date,
						],
						(err, result) => {
							if (err)
								return db.rollback(() =>
									res.status(500).json({ message: "Error al registrar gasto" }),
								);

							const updateBalanceQuery =
								"UPDATE cards SET balance = balance - ? WHERE id = ? AND user_id = ?";
							db.query(
								updateBalanceQuery,
								[expenseAmount, card_id, req.userId],
								(err) => {
									if (err)
										return db.rollback(() =>
											res
												.status(500)
												.json({ message: "Error al actualizar saldo" }),
										);

									db.commit((err) => {
										if (err)
											return db.rollback(() =>
												res
													.status(500)
													.json({ message: "Error al confirmar transacción" }),
											);
										res.status(201).json({
											message: "Gasto registrado exitosamente",
											transactionId: result.insertId,
										});
									});
								},
							);
						},
					);
				});
			});
		} else {
			const insertQuery = `
        INSERT INTO transactions (user_id, card_id, amount, type, category, description, transaction_date) 
        VALUES (?, NULL, ?, 'gasto', ?, ?, ?)
      `;
			db.query(
				insertQuery,
				[
					req.userId,
					parseFloat(amount),
					category,
					description,
					transaction_date,
				],
				(err, result) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al registrar gasto" });
					res.status(201).json({
						message: "Gasto registrado exitosamente",
						transactionId: result.insertId,
					});
				},
			);
		}
	});

	// Obtener historial de gastos con filtros
	router.get("/transactions", verifyToken, (req, res) => {
		const { category, start_date, end_date, min_amount, max_amount } =
			req.query;

		let query = `
      SELECT t.*, c.card_name, c.bank_name, cat.icon, cat.color
      FROM transactions t
      LEFT JOIN cards c ON t.card_id = c.id
      LEFT JOIN categories cat ON t.category = cat.name
      WHERE t.user_id = ?
    `;
		const params = [req.userId];

		if (category) {
			query += " AND t.category = ?";
			params.push(category);
		}
		if (start_date) {
			query += " AND t.transaction_date >= ?";
			params.push(start_date);
		}
		if (end_date) {
			query += " AND t.transaction_date <= ?";
			params.push(end_date);
		}
		if (min_amount) {
			query += " AND t.amount >= ?";
			params.push(parseFloat(min_amount));
		}
		if (max_amount) {
			query += " AND t.amount <= ?";
			params.push(parseFloat(max_amount));
		}

		query += " ORDER BY t.transaction_date DESC, t.created_at DESC";

		db.query(query, params, (err, results) => {
			if (err)
				return res.status(500).json({ message: "Error al obtener historial" });
			res.json(results);
		});
	});

	// Obtener una transacción específica
	router.get("/transactions/:id", verifyToken, (req, res) => {
		const transactionId = req.params.id;
		const query = `
      SELECT t.*, c.card_name, c.bank_name 
      FROM transactions t
      LEFT JOIN cards c ON t.card_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `;
		db.query(query, [transactionId, req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al obtener la transacción" });
			if (results.length === 0)
				return res.status(404).json({ message: "Transacción no encontrada" });
			res.json(results[0]);
		});
	});

	// Editar un gasto
	router.put("/transactions/:id", verifyToken, (req, res) => {
		const transactionId = req.params.id;
		const { amount, category, description, transaction_date } = req.body;

		if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
			return res
				.status(400)
				.json({ message: "El monto debe ser un número positivo" });
		}

		if (!category || !transaction_date) {
			return res
				.status(400)
				.json({ message: "Categoría y fecha son requeridos" });
		}

		const checkQuery =
			"SELECT * FROM transactions WHERE id = ? AND user_id = ?";
		db.query(checkQuery, [transactionId, req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al verificar la transacción" });
			if (results.length === 0)
				return res.status(404).json({ message: "Transacción no encontrada" });

			const oldTransaction = results[0];
			const oldAmount = parseFloat(oldTransaction.amount);
			const newAmount = parseFloat(amount);
			const cardId = oldTransaction.card_id;

			if (cardId) {
				db.beginTransaction((err) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al iniciar transacción" });

					const revertQuery =
						"UPDATE cards SET balance = balance + ? WHERE id = ?";
					db.query(revertQuery, [oldAmount, cardId], (err) => {
						if (err)
							return db.rollback(() =>
								res.status(500).json({ message: "Error al revertir saldo" }),
							);

						const applyQuery =
							"UPDATE cards SET balance = balance - ? WHERE id = ?";
						db.query(applyQuery, [newAmount, cardId], (err) => {
							if (err)
								return db.rollback(() =>
									res
										.status(500)
										.json({ message: "Error al aplicar nuevo saldo" }),
								);

							const updateQuery = `
                UPDATE transactions 
                SET amount = ?, category = ?, description = ?, transaction_date = ?
                WHERE id = ? AND user_id = ?
              `;
							db.query(
								updateQuery,
								[
									newAmount,
									category,
									description,
									transaction_date,
									transactionId,
									req.userId,
								],
								(err) => {
									if (err)
										return db.rollback(() =>
											res
												.status(500)
												.json({ message: "Error al actualizar transacción" }),
										);

									db.commit((err) => {
										if (err)
											return db.rollback(() =>
												res
													.status(500)
													.json({
														message: "Error al confirmar actualización",
													}),
											);
										res.json({ message: "Gasto actualizado exitosamente" });
									});
								},
							);
						});
					});
				});
			} else {
				const updateQuery = `
          UPDATE transactions 
          SET amount = ?, category = ?, description = ?, transaction_date = ?
          WHERE id = ? AND user_id = ?
        `;
				db.query(
					updateQuery,
					[
						newAmount,
						category,
						description,
						transaction_date,
						transactionId,
						req.userId,
					],
					(err) => {
						if (err)
							return res
								.status(500)
								.json({ message: "Error al actualizar gasto" });
						res.json({ message: "Gasto actualizado exitosamente" });
					},
				);
			}
		});
	});

	// Eliminar un gasto
	router.delete("/transactions/:id", verifyToken, (req, res) => {
		const transactionId = req.params.id;

		const checkQuery =
			"SELECT * FROM transactions WHERE id = ? AND user_id = ?";
		db.query(checkQuery, [transactionId, req.userId], (err, results) => {
			if (err)
				return res
					.status(500)
					.json({ message: "Error al verificar la transacción" });
			if (results.length === 0)
				return res.status(404).json({ message: "Transacción no encontrada" });

			const transaction = results[0];
			const cardId = transaction.card_id;
			const amount = parseFloat(transaction.amount);

			if (cardId) {
				db.beginTransaction((err) => {
					if (err)
						return res
							.status(500)
							.json({ message: "Error al iniciar transacción" });

					const updateBalanceQuery =
						"UPDATE cards SET balance = balance + ? WHERE id = ?";
					db.query(updateBalanceQuery, [amount, cardId], (err) => {
						if (err)
							return db.rollback(() =>
								res.status(500).json({ message: "Error al devolver saldo" }),
							);

						const deleteQuery =
							"DELETE FROM transactions WHERE id = ? AND user_id = ?";
						db.query(deleteQuery, [transactionId, req.userId], (err) => {
							if (err)
								return db.rollback(() =>
									res
										.status(500)
										.json({ message: "Error al eliminar transacción" }),
								);

							db.commit((err) => {
								if (err)
									return db.rollback(() =>
										res
											.status(500)
											.json({ message: "Error al confirmar eliminación" }),
									);
								res.json({ message: "Gasto eliminado exitosamente" });
							});
						});
					});
				});
			} else {
				const deleteQuery =
					"DELETE FROM transactions WHERE id = ? AND user_id = ?";
				db.query(deleteQuery, [transactionId, req.userId], (err) => {
					if (err)
						return res.status(500).json({ message: "Error al eliminar gasto" });
					res.json({ message: "Gasto eliminado exitosamente" });
				});
			}
		});
	});

	return router;
};
