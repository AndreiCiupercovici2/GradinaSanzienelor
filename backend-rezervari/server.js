const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

require('./db');

//Import modular routes
const portalInternRoutes = require('./routes/portalInternRoutes');
const accomodationRoutes = require('./routes/accomodationRoutes');
const mealRoutes = require('./routes/mealRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('src'));
app.use('/flatpickr', express.static('node_modules/flatpickr'));

// Routes
app.use('/api', portalInternRoutes);
app.use('/api', accomodationRoutes);
app.use('/api', mealRoutes);
app.use('/', pageRoutes);


app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});
