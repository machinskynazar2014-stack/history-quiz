require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Save score
app.post('/api/scores', async (req, res) => {
  try {
    const { playerName, score, total, topic } = req.body;
    const percent = Math.round((score / total) * 100);
    const saved = await prisma.score.create({
      data: { playerName, score, total, percent, topic }
    });
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: [{ percent: 'desc' }, { score: 'desc' }],
      take: 10
    });
    res.json(scores);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// AI explanation
app.post('/api/explain', async (req, res) => {
  if (!genAI) return res.json({ explanation: null });
  try {
    const { question, correctAnswer, wrongAnswer, topic } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Ти вчитель з історії України. Учень відповів неправильно.
Питання: "${question}"
Правильна відповідь: "${correctAnswer}"
Відповідь учня: "${wrongAnswer}"
Тема: "${topic}"

Поясни простою мовою (2-3 речення) чому правильна відповідь саме така і як запам'ятати цей факт.`;
    const result = await model.generateContent(prompt);
    res.json({ explanation: result.response.text() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(80, () => console.log('Server started on port 80'));
