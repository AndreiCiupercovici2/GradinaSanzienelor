const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

require('./db');

const app = express();
const port = process.env.PORT || 3000;

//Import modular routes
const { apiLimiter } = require('./middlewares/rateLimiter');
const helmet = require('helmet');
const portalInternRoutes = require('./routes/portalInternRoutes');
const accomodationRoutes = require('./routes/accomodationRoutes');
const mealRoutes = require('./routes/mealRoutes');
const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static('src'));
app.use('/api', apiLimiter);
app.use('/flatpickr', express.static('node_modules/flatpickr'));
app.use(helmet());

// Routes
app.use('/api', portalInternRoutes);
app.use('/api', accomodationRoutes);
app.use('/api', mealRoutes);
app.use('/api', authRoutes);
app.use('/', pageRoutes);


app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});
