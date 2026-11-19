// Builds the Express app. Does NOT start listening - server.js does that.
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Render puts a proxy in front of the API. Trust the first proxy.
app.set('trust proxy', 1);

// Middleware runs in this order for every request.
if (env.nodeEnv !== 'test') app.use(morgan('dev'));   // 1. one log line per request

// Safe headers. "cross-origin" lets a web page show the uploaded cover pictures.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the pages listed in CORS_ORIGINS may read the answers in a browser.
// curl and Postman send no Origin header and are not stopped by CORS.
app.use(cors({ origin: (origin, done) => done(null, !origin || env.corsOrigins.includes(origin)) }));

app.use(express.json());                              // 2. turn the JSON body into req.body

// Uploaded pictures (question set covers) are served as files, e.g. /uploads/covers/set-1-xxxx.png
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Hub Contract: every endpoint lives under /api/v1
app.use('/api/v1', routes);                           // 3. the routes

app.use(notFound);                                    // 4. no route matched
app.use(errorHandler);                                // 5. something was thrown

module.exports = app;