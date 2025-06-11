const dotenv   = require('dotenv');
const http     = require('http');
const initializeSocket = require('./chat/socket/socket');
const app = require('./app');   // <— new split file (includes DB connection)

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = initializeSocket(server);

// Only listen when NOT under Mocha
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = { app, server };