const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  console.error('[Backend Error]:', err.message);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

app.listen(env.port, '0.0.0.0', () => {
  console.log(`=== AI SHORTS STUDIO BACKEND RUNNING ===`);
  console.log(`Local API : http://localhost:${env.port}/api/health`);
});
