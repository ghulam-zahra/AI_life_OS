const express = require('express');
const cors = require('cors');
require('dotenv').config();

const profileRoutes = require('./routes/profile.routes');
const timelineRoutes = require('./routes/timeline.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const projectsRoutes = require('./routes/projects.routes');
const resumeRoutes = require('./routes/resume.routes');
const readinessRoutes = require('./routes/readiness.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'AI LifeOS Backend is running!' });
});

app.use('/api/profile', profileRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/readiness', readinessRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});