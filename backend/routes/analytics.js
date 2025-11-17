module.exports = (db, verifyToken) => {
	const express = require("express");
	const app = express.Router();
	// ============================================
	// RUTAS DE ANÁLISIS DE DATOS
	// ============================================

	// Obtener gastos por día en un rango de fechas
	app.get("/analytics/expenses-by-day", verifyToken, (req, res) => {
		const { start_date, end_date } = req.query;

		// Por defecto: últimos 30 días
		const endDate = end_date || new Date().toISOString().split("T")[0];
		const startDate =
			start_date ||
			new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];

		const query = `
    SELECT 
      DATE(transaction_date) as date,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
    GROUP BY DATE(transaction_date)
    ORDER BY date ASC
  `;

		db.query(query, [req.userId, startDate, endDate], (err, results) => {
			if (err) {
				console.error("Error al obtener gastos por día:", err);
				return res.status(500).json({ message: "Error al obtener datos" });
			}
			res.json(results);
		});
	});

	// Obtener gastos por categoría en un rango de fechas
	app.get("/analytics/expenses-by-category", verifyToken, (req, res) => {
		const { start_date, end_date } = req.query;

		const endDate = end_date || new Date().toISOString().split("T")[0];
		const startDate =
			start_date ||
			new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];

		const query = `
    SELECT 
      t.category,
      uc.icon,
      uc.color,
      SUM(t.amount) as total_amount,
      COUNT(t.id) as transaction_count,
      ROUND((SUM(t.amount) / (SELECT SUM(amount) FROM transactions WHERE user_id = ? AND transaction_date BETWEEN ? AND ?)) * 100, 2) as percentage
    FROM transactions t
    LEFT JOIN user_categories uc ON t.category = uc.name AND t.user_id = uc.user_id
    WHERE t.user_id = ? AND t.transaction_date BETWEEN ? AND ?
    GROUP BY t.category, uc.icon, uc.color
    ORDER BY total_amount DESC
  `;

		db.query(
			query,
			[req.userId, startDate, endDate, req.userId, startDate, endDate],
			(err, results) => {
				if (err) {
					console.error("Error al obtener gastos por categoría:", err);
					return res.status(500).json({ message: "Error al obtener datos" });
				}
				res.json(results);
			},
		);
	});

	// Obtener gastos por mes (últimos 12 meses)
	app.get("/analytics/expenses-by-month", verifyToken, (req, res) => {
		const query = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m') as month,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count,
      AVG(amount) as avg_amount
    FROM transactions
    WHERE user_id = ? AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month ASC
  `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener gastos por mes:", err);
				return res.status(500).json({ message: "Error al obtener datos" });
			}
			res.json(results);
		});
	});

	// Obtener comparativa semanal
	app.get("/analytics/weekly-comparison", verifyToken, (req, res) => {
		const query = `
    SELECT 
      WEEK(transaction_date) as week_number,
      YEAR(transaction_date) as year,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ? AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
    GROUP BY YEAR(transaction_date), WEEK(transaction_date)
    ORDER BY year, week_number ASC
  `;

		db.query(query, [req.userId], (err, results) => {
			if (err) {
				console.error("Error al obtener comparativa semanal:", err);
				return res.status(500).json({ message: "Error al obtener datos" });
			}
			res.json(results);
		});
	});

	// Obtener resumen de período
	app.get("/analytics/period-summary", verifyToken, (req, res) => {
		const { start_date, end_date } = req.query;

		const endDate = end_date || new Date().toISOString().split("T")[0];
		const startDate =
			start_date ||
			new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];

		const query = `
    SELECT 
      COUNT(*) as total_transactions,
      SUM(amount) as total_spent,
      AVG(amount) as avg_transaction,
      MAX(amount) as max_transaction,
      MIN(amount) as min_transaction,
      (SELECT category FROM transactions WHERE user_id = ? AND transaction_date BETWEEN ? AND ? GROUP BY category ORDER BY SUM(amount) DESC LIMIT 1) as top_category
    FROM transactions
    WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
  `;

		db.query(
			query,
			[req.userId, startDate, endDate, req.userId, startDate, endDate],
			(err, results) => {
				if (err) {
					console.error("Error al obtener resumen:", err);
					return res.status(500).json({ message: "Error al obtener datos" });
				}
				res.json(results[0]);
			},
		);
	});

	// Obtener tendencia (comparación con período anterior)
	app.get("/analytics/trend", verifyToken, (req, res) => {
		const { start_date, end_date } = req.query;

		const endDate = end_date || new Date().toISOString().split("T")[0];
		const startDate =
			start_date ||
			new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];

		// Calcular el período anterior
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diff = end - start;
		const prevEnd = new Date(start - 1);
		const prevStart = new Date(prevEnd - diff);

		const query = `
    SELECT 
      'current' as period,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
    UNION ALL
    SELECT 
      'previous' as period,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
  `;

		db.query(
			query,
			[
				req.userId,
				startDate,
				endDate,
				req.userId,
				prevStart.toISOString().split("T")[0],
				prevEnd.toISOString().split("T")[0],
			],
			(err, results) => {
				if (err) {
					console.error("Error al obtener tendencia:", err);
					return res.status(500).json({ message: "Error al obtener datos" });
				}

				const current = results.find((r) => r.period === "current") || {
					total_amount: 0,
					transaction_count: 0,
				};
				const previous = results.find((r) => r.period === "previous") || {
					total_amount: 0,
					transaction_count: 0,
				};

				const amountChange =
					previous.total_amount > 0
						? (
								((current.total_amount - previous.total_amount) /
									previous.total_amount) *
								100
						  ).toFixed(2)
						: 0;

				const countChange =
					previous.transaction_count > 0
						? (
								((current.transaction_count - previous.transaction_count) /
									previous.transaction_count) *
								100
						  ).toFixed(2)
						: 0;

				res.json({
					current,
					previous,
					amountChange: parseFloat(amountChange),
					countChange: parseFloat(countChange),
				});
			},
		);
	});
	return app;
};
