import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const systemPrompt = await readFile('./prompt.txt', 'utf-8');

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ destino, dias, tipo_viaje, presupuesto, intereses }),
      },
    ],
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
