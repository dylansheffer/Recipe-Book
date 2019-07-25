const { forwardTo } = require('prisma-binding');

const Query = {
  units: forwardTo('db'),
  users: forwardTo('db')
};

module.exports = Query;
