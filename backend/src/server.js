const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', apiRoutes);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`=== PRODUCTION BACKEND LISTENING ON PORT ${env.port} ===`);
});
