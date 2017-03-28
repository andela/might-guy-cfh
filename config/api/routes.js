//  const async = require('async');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'),
  User = mongoose.model('User');
const avatars = require('../../app/controllers/avatars').all();
const config = require('../config');

module.exports = (app) => {
    //  api Routes
  app.post('/api/auth/signup', (req, res) => {
    if (req.body.name && req.body.password && req.body.email) {
      User.findOne({
        email: req.body.email
      }).exec((err, existingUser) => {
        if (err) throw err;
        if (!existingUser) {
          const user = new User(req.body);
          // Switch the user's avatar index to an actual avatar url
          user.avatar = avatars[user.avatar];
          user.provider = 'jwt';
          user.save((err) => {
            if (err) {
              res.json({ success: false,
                message: `unknown error : ${err.errors}` });
            }
            req.logIn(user, (err) => {
              if (err) return next (err);
              const token = jwt.sign(user, config.secret, {
                expiresIn: 10080 // in seconds
              });
              res.json({ success: true, token: `JWT ${token}` });
            });
          });
        } else {
          res.json({ success: false, message: 'User already exist' });
        }
      });
    } else {
      res.json({ success: false, message: 'You must enter all field' });
    }
  });

  // Create signin api
  app.post('/api/auth/signin', (req, res) => {
    if (!req.body.email || !req.body.password) {
      res.json({ success: false,
        message: 'You need to enter username and password' });
    } else {
      User.findOne({
        email: req.body.email
      }, (err, user) => {
        if (err) throw err;
        if (!user) {
          res.json({
            success: false,
            message: 'User does not exist'
          });
        }
        const isMatch = user.authenticate(req.body.password);
        //  console.log('isMatch', isMatch);
        if (isMatch === true) {
          req.logIn(user, (err) => {
            if (err) return next(err);
            const token = jwt.sign(user, config.secret, {
              expiresIn: 10080 // in seconds
            });
            res.json({ success: true, token: `JWT ${token}` });
          });
        } else {
          res.json({ success: false,
            message: 'Unable to Login. Invalid credentials' });
        }
      });
    }
  });
};
