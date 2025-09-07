import express from 'express';  // Import express
import bodyParser from 'body-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import 'dotenv/config'; // Import dotenv package to load environment variables
import fetch from 'node-fetch'; // For Groq API calls

// ===== Commented out DB-related imports (not needed for demo) =====
// import mongoose from 'mongoose';
// import stringSimilarity from 'string-similarity';
// import UserDataRoute from './src/routes/UserDataRoute.js';
// import UserLoginRoute from './src/routes/UserLoginRoute.js';
// import userLocationRouter from "./src/routes/userLocationRouter.js";
// import userAssessmentRouter from './src/routes/userAssessmentRouter.js';
// import AdminAssessmentRouter from "./src/routes/AdminAssessmentRouter.js";
// import initializeSocket from './src/Socket.js';
// import DrAppointmentRouter from "./src/routes/DrAppointmentRouter.js";
// import AiAssessmentRouter from "./src/routes/AiAssessmentRouter.js";
// import connectDB from './src/db/index.js';

const Port = process.env.PORT || 5000; // Default to 5000 if not set
const app = express(); // Create express app

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ===== Chatbot REST endpoint using Groq API =====
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const messages = [
      {
        role: 'system',
        content:
          "You are a compassionate AI mental health assistant for university and higher-education students. " +
          "Answer empathetically, never provide medical diagnosis, encourage seeking professional help when needed, " +
          "and be concise and supportive. Avoid giving medication or clinical instructions."
      },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE'}`
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages,
        max_tokens: 512,
        temperature: 0.7
      })
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      console.error('Groq API error:', groqResp.status, errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const groqData = await groqResp.json();
    const reply =
      groqData?.choices?.[0]?.message?.content ??
      groqData?.choices?.[0]?.text ??
      'Sorry, I could not generate a response at this time.';

    return res.json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Commented out all DB and other routes =====
// app.use('/api', UserDataRoute);
// app.use('/api', UserLoginRoute);
// app.use('/api', userAssessmentRouter);
// app.use('/api', AdminAssessmentRouter);
// app.use('/api', DrAppointmentRouter);
// app.use('/api', AiAssessmentRouter);

// ===== Commented out DB connection =====
// connectDB();

// ===== Simple test route =====
app.get('/', (req, res) => {
  res.send('Chatbot backend is running 🚀');
});

// ===== Start Server =====
const server = http.createServer(app); 
// const io = initializeSocket(server); // disabled for now

server.listen(Port, () => 
  console.log(`🚀 Chatbot server running on port: http://localhost:${Port}`)
);
