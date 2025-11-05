const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- MongoDB Connection ----------
const { MONGODB_URI, NODE_ENV, VERCEL } = process.env;

// Fail fast if missing in serverless
if (!MONGODB_URI && VERCEL) {
  throw new Error('MONGODB_URI is not set. Add it in Vercel → Settings → Environment Variables.');
}

const mongoUri = MONGODB_URI || 'mongodb+srv://developertag2025:xjs0pGQzmmNqxFdD@cluster0.5oapkgv.mongodb.net/task_manager?appName=Cluster0';

mongoose
  .connect(mongoUri, {
    // If your URI doesn't include the DB name, uncomment:
    // dbName: 'taskmanagement',
    serverSelectionTimeoutMS: 8000,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // Surface error in serverless env to fail the function early
    if (VERCEL) throw err;
  });

// ---------- Routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teamlead', require('./routes/teamlead'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/assets', require('./routes/assets'));

// Simple health check (useful on Vercel)
app.get('/', (_req, res) => res.status(200).send('API OK'));

// ---------- Export for Vercel; listen locally ----------
module.exports = app;

if (!VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
