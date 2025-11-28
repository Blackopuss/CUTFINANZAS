const express = require('express');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = (db, verifyToken) => {
  const router = express.Router();

  // Middleware para db
  router.use((req, res, next) => {
    req.db = db;
    next();
  });

  // --- FUNCIÓN HELPER PARA LIMPIAR JSON DE LA IA ---
  function cleanAIResponse(text) {
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
  }

  // --- FUNCIÓN HELPER PARA LLAMAR A LA IA ---
  async function callLocalAI(messages, temperature = 0.1) {
    try {
      const response = await fetch("http://192.168.56.1:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen2.5-vl-7b",
          messages,
          temperature,
          max_tokens: 2048
        })
      });

      const data = await response.json();
      if (!data.choices || !data.choices[0].message) {
        throw new Error("Respuesta IA vacía");
      }

      return data.choices[0].message.content;

    } catch (e) {
      console.error("Error conectando con IA local:", e.message);
      return null;
    }
  }

  // ================================================================
  // 1. ANALIZAR TICKET (VISIÓN PURA - SIN OCR)
  // ================================================================
  router.post('/analyze-receipt', verifyToken, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image provided' });

      // 1. Convertir Buffer a Base64 para que la IA pueda "ver" la imagen
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // 2. OBTENER CATEGORÍAS DISPONIBLES
      // Consultamos las categorías del usuario y las por defecto para dárselas a la IA
      const categoriesQuery = `
        SELECT name FROM user_categories WHERE user_id = ?
        UNION
        SELECT name FROM default_categories
      `;
      
let categoriesList = `
Alimentación, Compras, Educación, Entretenimiento, Mascotas, Servicios, Transporte, Otros
`;

      try {
        const categories = await new Promise((resolve, reject) => {
            req.db.query(categoriesQuery, [req.userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        if (categories && categories.length > 0) {
           categoriesList = categories.map(c => `"${c.name}"`).join(", ");

        }
      } catch (dbErr) {
        console.error("Error fetching categories for AI:", dbErr);
      }

      // 3. PROMPT DE VISIÓN MEJORADO
      const visionMessages = [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analiza esta imagen de un ticket de compra.
              
              TU OBJETIVO ES EXTRAER DATOS PARA UN REGISTRO DE GASTOS.
              
              Instrucciones:
              1. **Total (amount)**: Busca el monto TOTAL pagado.
              2. **Fecha (date)**: Busca la fecha. Si la encuentras, conviértela a formato ISO "YYYY-MM-DD". SI NO ENCUENTRAS LA FECHA, USA LA FECHA DE HOY: "${new Date().toISOString().split('T')[0]}".
              3. **Categoría (category)**: Elige la categoría que mejor encaje de esta lista: [${categoriesList}]. Si ninguna encaja bien, usa "Otros".
              4. **Descripción (description)**: DEBE TENER EXACTAMENTE ESTE FORMATO:
                 compra en "NOMBRE_TIENDA" "LISTA_RESUMIDA_PRODUCTOS"
                 Ejemplo: compra en "OXXO" "Refresco, Papas"
                 Ejemplo: compra en "Walmart" "Leche, Huevos, Pan"
              
              Responde SOLO con este JSON plano:
              {
                "amount": 0.00,
                "date": "YYYY-MM-DD",
                "category": "Categoría elegida",
                "products": ["prod1", "prod2"],
                "description": "compra en \"Tienda\" \"prod1, prod2\""
              }` 
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ];

      // Llamamos a la IA con los mensajes de visión
      const rawAI = await callLocalAI(visionMessages, 0.1); // Temp baja para precisión
      
      let parsed = {};
      const today = new Date().toISOString().split('T')[0];

      if (rawAI) {
        try {
          const jsonString = cleanAIResponse(rawAI);
          parsed = JSON.parse(jsonString);
        } catch (e) {
          console.error("Fallo al parsear JSON de IA:", rawAI);
        }
      }

      // 4. VALIDACIÓN Y FALLBACKS
      
      // Validar monto
      let finalAmount = parseFloat(parsed.amount);
      if (isNaN(finalAmount)) finalAmount = 0;

      // Validar fecha
      let finalDate = parsed.date;
      const isValidISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

      if (!finalDate || finalDate === 'null' || !isValidISO(finalDate)) {
         // Intentar arreglar o usar hoy
         const timestamp = Date.parse(finalDate);
         if (!isNaN(timestamp)) {
            finalDate = new Date(timestamp).toISOString().split('T')[0];
         } else {
            finalDate = today;
         }
      }

      // Validar descripción (asegurar formato si la IA falló un poco, aunque el prompt es estricto)
      let finalDesc = parsed.description;
      if (!finalDesc || typeof finalDesc !== 'string') {
         const store = parsed.store || "Tienda";
         const prods = parsed.products && parsed.products.length > 0 ? parsed.products.join(", ") : "Varios";
         finalDesc = `compra en "${store}" "${prods}"`;
      }

      const result = {
        amount: finalAmount,
        date: finalDate,
        category: parsed.category || "Otros",
        products: parsed.products || [],
        description: finalDesc
      };

      return res.json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error analizando ticket" });
    }
  });

  // ================================================================
  // 2. GUARDAR TRANSACCIÓN
  // ================================================================
  router.post('/add-transaction', verifyToken, async (req, res) => {
    const { amount, category, description, date, type } = req.body;
    const userId = req.userId;

    if (!amount || !date) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    try {
      const sql = `
        INSERT INTO transactions (user_id, amount, category, description, transaction_date, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const finalType = type || 'gasto';

      await new Promise((resolve, reject) => {
        req.db.query(sql, [userId, amount, category, description, date, finalType], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.status(201).json({ message: "Gasto guardado correctamente" });

    } catch (error) {
      console.error("Error guardando:", error);
      res.status(500).json({ message: "Error al guardar en base de datos" });
    }
  });

  // ================================================================
  // 3. CHAT FINANCIERO
  // ================================================================
  router.post('/chat-finance', verifyToken, async (req, res) => {
    const { question } = req.body;
    const userId = req.userId;

    if (!question) {
      return res.status(400).json({ message: "La pregunta es requerida" });
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const query = (sql, params) => new Promise((resolve, reject) => {
        req.db.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const transactions = await query(
        `SELECT t.amount, t.category, t.description, t.transaction_date, t.type
         FROM transactions t
         WHERE t.user_id = ? AND t.transaction_date >= ?
         ORDER BY t.transaction_date DESC`,
        [userId, dateStr]
      );

      const categorySummary = await query(
        `SELECT category, SUM(amount) AS total
         FROM transactions
         WHERE user_id = ? AND transaction_date >= ?
         GROUP BY category`,
        [userId, dateStr]
      );

      const systemPrompt = `Eres un analista financiero. Usa los datos JSON proporcionados para responder.`;

      const dataPayload = {
        summary_by_category: categorySummary,
        recent_transactions: transactions.slice(0, 50)
      };

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: JSON.stringify(dataPayload) },
        { role: "user", content: question }
      ];

      const reply = await callLocalAI(messages, 0.2);

      res.json({ reply: reply || "Lo siento, no pude procesar tu consulta." });

    } catch (error) {
      console.error("Error in chat-finance:", error);
      res.status(500).json({ message: "Error al procesar la consulta con IA" });
    }
  });

  return router;
};
