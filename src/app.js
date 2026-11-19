// Builds the Express app. Does NOT start listening - server.js does that.
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Middleware runs in this order for every request.
if (env.nodeEnv !== 'test') app.use(morgan('dev'));   // 1. one log line per request
app.use(express.json());                              // 2. turn the JSON body into req.body

// Uploaded pictures (question set covers) are served as files, e.g. /uploads/covers/set-1-xxxx.png
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Hub Contract: every endpoint lives under /api/v1
app.use('/api/v1', routes);                           // 3. the routes

app.use(notFound);                                    // 4. no route matched
app.use(errorHandler);                                // 5. something was thrown

module.exports = app;