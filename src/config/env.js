// Loads .env once and fails fast when a required key is missing.
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = process.env.DATABASE_URL || '';

// On a server (Render) one DATABASE_URL replaces the five DB_ keys.
const REQUIRED = [
  ...(databaseUrl ? [] : ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']),
  'HUB_API_KEY',
  'JWT_SECRET',
  'CORS_ORIGINS',
];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required .env keys: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your own values.'
  );
}

// postgres://user:password@host:5432/name  ->  its five parts
function databaseFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    // The message must not repeat the URL: it contains the password.
    throw new Error('DATABASE_URL is not a valid database address.');
  }
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 5432,
    name: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

const database = databaseUrl
  ? databaseFromUrl(databaseUrl)
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

module.exports = {
  nodeEnv,

  port: Number(process.env.PORT) || 3001,

  hubApiKey: process.env.HUB_API_KEY,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  bcryptRounds: 10,

  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),

  db: {
    ...database,
    // Tests use a database of their own, so they never touch your real data.
    name: nodeEnv === 'test' ? `${database.name}_test` : database.name,
    // On Render's external address the connection needs SSL: DB_SSL=true.
    ssl: process.env.DB_SSL === 'true',
  },
};