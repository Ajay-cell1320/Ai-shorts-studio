const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. API Routes
app.get('/api/ping', (req, res) => res.json({ ok: true, awake: true }));
app.use('/api', apiRoutes);

// 2. Serve Compiled React Frontend from /public
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// 3. Catch-all route for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`=== FULL-STACK APP LIVE ON PORT ${env.port} ===`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
