import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get('/', (req, res) => {
  res.json({ message: 'App Viajes API running' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
