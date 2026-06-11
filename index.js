import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = 3000;

app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get('/', (req, res) => {
  res.json({ message: 'App Viajes API running' });
});

app.post('/api/generate-itinerary', async (req, res) => {
  const { destination, days, preferences } = req.body;

  if (!destination || !days) {
    return res.status(400).json({ error: 'destination and days are required' });
  }

  const prompt = `Crea un itinerario de viaje detallado para ${destination} de ${days} día(s).${preferences ? ` Preferencias: ${preferences}.` : ''} Incluye actividades, lugares de interés y recomendaciones para cada día.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  res.json({ itinerary: message.content[0].text });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
