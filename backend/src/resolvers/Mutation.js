const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { hasPermission } = require('../utils');

const Mutations = {
  async createUnit(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }

    const unit = await ctx.db.mutation.createUnit({
      data: {
        ...args
      }
    }, info);

    return unit;
  },
  updateUnit(parent, args, ctx, info) {
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN'].includes(permission)
    );
    if (!hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }
    // take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateUnit(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteUnit(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. Check if they have the permissions
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN'].includes(permission)
    );
    if (!hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }
    // 2. Delete it!
    return ctx.db.mutation.deleteUnit({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] },
      },
    }, info);
    // create the JWT token
    const token = jwt.sign({userId: user.id }, process.env.APP_SECRET);
    // Set the JWT as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Return the user to the browser
    return user;
  }
};

module.exports = Mutations;
