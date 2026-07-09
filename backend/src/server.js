const express = require('express');
const cors = require('cors');
require('dotenv').config();

const profileRoutes = require('./routes/profile.routes');
const timelineRoutes = require('./routes/timeline.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'AI LifeOS Backend is running!' });
});

app.use('/api/profile', profileRoutes);
app.use('/api/timeline', timelineRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});