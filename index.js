import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = 3000;

app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el motor de inteligencia artificial central de una Super-App de viajes de última generación. Tu objetivo es procesar el cuestionario de un usuario y generar un itinerario de viaje optimizado, altamente específico y estructurado.

REGLAS ESTRICTAS DE RESPUESTA:
1. Responde ÚNICAMENTE con un objeto JSON válido. No incluyas introducciones, ni explicaciones, ni bloques de código de markdown (no uses \`\`\`json). Solo el JSON crudo.
2. Cada actividad debe ser real y específica del destino. Evita generalidades como "visitar el centro".
3. Debes incluir obligatoriamente el enlace de búsqueda de Google Maps para cada lugar usando el formato: https://www.google.com/maps/search/?api=1&query=Nombre+Del+Lugar+Ciudad
4. Para cada día, debes incluir una actividad alternativa bajo techo marcada como "alternativa_lluvia", manteniendo la coherencia con el presupuesto e intereses.

ESTRUCTURA DEL JSON QUE DEBES DEVOLVER (Sigue este esquema exactamente):

{
  "viaje": {
    "destino": "Nombre del Destino",
    "resumen_presupuesto": "Breve consejo de manejo de dinero para este destino según su presupuesto",
    "itinerario_diario": [
      {
        "dia": 1,
        "enfoque": "Temática de este día (ej: Exploración Histórica)",
        "actividades": [
          {
            "momento": "Mañana / Tarde / Noche",
            "titulo": "Nombre de la actividad o atracción",
            "descripcion": "Explicación detallada de qué hacer y por qué se adapta a sus intereses.",
            "google_maps_url": "URL_DE_GOOGLE_MAPS_SIGUIENDO_LA_REGLA_3"
          }
        ],
        "alternativa_lluvia": {
          "titulo": "Actividad bajo techo alternativa",
          "descripcion": "Qué hacer en este destino si el clima falla este día.",
          "google_maps_url": "URL_DE_GOOGLE_MAPS_SIGUIENDO_LA_REGLA_3"
        }
      }
    ],
    "consejos_supervivencia": [
      "Consejo local 1",
      "Consejo local 2"
    ]
  }
}`;

app.get('/', (req, res) => {
  res.json({ message: 'App Viajes API running' });
});

app.post('/api/generate-itinerary', async (req, res) => {
  const { destino, dias, tipo_viaje, presupuesto, intereses } = req.body;

  if (!destino || !dias || !tipo_viaje || !presupuesto || !intereses) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: destino, dias, tipo_viaje, presupuesto, intereses',
    });
  }

  if (!Array.isArray(intereses) || intereses.length === 0) {
    return res.status(400).json({ error: '"intereses" debe ser un array con al menos un elemento' });
  }

  const userMessage = JSON.stringify({ destino, dias, tipo_viaje, presupuesto, intereses });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = message.content[0].text;

  let itinerary;
  try {
    itinerary = JSON.parse(rawText);
  } catch {
    return res.status(502).json({ error: 'La IA devolvió una respuesta no válida', raw: rawText });
  }

  res.json(itinerary);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
