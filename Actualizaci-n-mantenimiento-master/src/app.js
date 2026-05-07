const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const appointmentRoutes = require('./routes/appointmentRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const petRoutes = require('./routes/petRoutes');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/', appointmentRoutes);
app.use('/owners', ownerRoutes);
app.use('/pets', petRoutes);

module.exports = app;
