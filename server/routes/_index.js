/** Collect all route registrations so app.js stays tidy */
module.exports = function initRoutes(app) {
  app.use('/api/v1',                 require('./auth.routes'));
  app.use('/api/v1/users',           require('./user.routes'));
  app.use('/api/v1/astrologers',     require('./astrologer.routes'));
  app.use('/api/v1/reviews',         require('./review.routes'));
  app.use('/api/v1/chat',            require('../chat/routes/chat.routes'));
  app.use('/api/v1/wallet',          require('./wallet.routes'));
  app.use('/api/v1/billing',         require('./billing.routes'));
  app.use('/api/v1/horoscope',       require('../astroCalculation/routes/horoscope.route'));
}; 