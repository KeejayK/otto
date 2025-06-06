require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendar');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const cors = require('cors');

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://ottocalendar.netlify.app', 'https://otto-8z43.onrender.com'];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);


app.use(bodyParser.json());

app.use('/api/calendar', calendarRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;