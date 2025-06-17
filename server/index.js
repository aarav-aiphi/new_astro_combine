const dotenv   = require('dotenv');
const http     = require('http');
const initializeSocket = require('./chat/socket/socket');
const app = require('./app');   // <— new split file (includes DB connection)

dotenv.config();
const PORT = process.env.PORT || 7000;

const server = http.createServer(app);

const io = initializeSocket(server);

// Only listen when NOT under Mocha
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server is running on http://0.0.0.0:${PORT}`));
}

module.exports = { app, server };