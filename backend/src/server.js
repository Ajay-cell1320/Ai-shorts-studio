const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

const allowedOrigins = [
  env.frontendUrl,
  'https://ai-shorts-studio.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Unauthorized domain'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use('/api', apiRoutes);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`=== PRODUCTION BACKEND LISTENING ON PORT ${env.port} ===`);
});
