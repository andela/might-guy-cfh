var async = require('async');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const gameRecord = require('../app/models/gameRecord');
const invite = require('../app/controllers/invite');

const sg = require('sendgrid')(`SG.SsgxbJ1IRiSImn2gI1qAkA.
  VdN9m18YcsrOoc6-kpg_C3h4B207Ftxc_znG3dHE5qk`);

const sendMail = (to, gameLink, gameOwner) => {
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [
        {
          to: [
            {
              email: `${to}`,
            },
          ],
          subject: 'Cards For Humanity',
        },
      ],
      from: {
        email: 'cardsforhumanity@mightguy.io',
      },
      content: [
        {
          type: 'text/plain',
          value: `Cards For Humanity player, *${gameOwner}*, would like to
          invite you to game their game: ${gameLink}.
          \nClick on the link to join them in a rough ride.`,
        },
      ],
    },
  });

  sg.API(request)
    .then(response => response)
    .catch(error =>
      `${error} There was a problem sending the invites. Please try again.`
    );
};

module.exports = function (app, passport, auth) {
  //User Routes
  var users = require('../app/controllers/users');
  app.get('/signin', users.signin);
  app.get('/signup', users.signup);
  app.get('/chooseavatars', users.checkAvatar);
  app.get('/signout', users.signout);

  //Setting up the users api
  app.post('/users', users.create);
  app.post('/users/avatars', users.avatars);

  const middleware = require('./middlewares/authorization.js');

  app.get('/api/search/users', middleware.requiresLogin, (req, res) => {
    User.find({}, (error, result) => {
      if (!(error)) {
        res.send(result);
      } else {
        res.send(error);
      }
    });
  });


  app.post('/inviteusers', middleware.requiresLogin, (req, res) => {
    const url = req.body.url;
    const userEmail = req.body.invitee;
    const gameOwner = req.body.gameOwner;

    sendMail(userEmail, url, gameOwner);
    res.send(`Invite sent to ${userEmail}`);
  });
  app.post('/api/games/:id/start', middleware.requiresLogin, (req, res) => {
    const gamePlayDate = req.body.gamePlayDate;
    const gameRounds = req.body.gameRounds;
    const winner = req.body.gameWinner;
    const gamePlayers = req.body.gamePlayers;
    const gameID = req.params.id;

    const record = new gameRecord(
      {
        gamePlayDate,
        gameID,
        gamePlayers,
        gameRounds,
        winner
      }
    );

    record.save((error) => {
      if (error) {
        console.log(error);
      }
    }
    );

    gamePlayers.forEach((userName) => {
      User.findOneAndUpdate({ name: userName },
        {
          $push: { gameRecord: gameID }
        }, (error) => {
          if (error) {
            res.send('An error occured.');
          } else {
            res.send(`Game ${gameID} has been successfully recorded`);
          }
        });
    });
  });

  // Donation Routes
  app.post('/donations', users.addDonation);
  app.post('/friends', invite.addFriend);
  app.post('/notify', invite.sendNotification);
  app.post('/api/friends', invite.getFriends);
  app.post('/api/notify', invite.loadNotification);
  app.post('/api/read', invite.readNotification);

  app.post('/users/session', passport.authenticate('local', {
    failureRedirect: '/signin',
    failureFlash: 'Invalid email or password.'
  }), users.session);

  app.get('/users/me', users.me);
  app.get('/users/:userId', users.show);

  //Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/signin'
  }), users.authCallback);

  //Setting the github oauth routes
  app.get('/auth/github', passport.authenticate('github', {
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/signin'
  }), users.authCallback);

  //Setting the twitter oauth routes
  app.get('/auth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/signin'
  }), users.authCallback);

  //Setting the google oauth routes
  app.get('/auth/google', passport.authenticate('google', {
    failureRedirect: '/signin',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }), users.signin);

  app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/signin'
  }), users.authCallback);

  //Finish with setting up the userId param
  app.param('userId', users.user);

  // Answer Routes
  var answers = require('../app/controllers/answers');
  app.get('/answers', answers.all);
  app.get('/answers/:answerId', answers.show);
  // Finish with setting up the answerId param
  app.param('answerId', answers.answer);

  // Question Routes
  var questions = require('../app/controllers/questions');
  app.get('/questions', questions.all);
  app.get('/questions/:questionId', questions.show);
  // Finish with setting up the questionId param
  app.param('questionId', questions.question);

  // Avatar Routes
  var avatars = require('../app/controllers/avatars');
  app.get('/avatars', avatars.allJSON);

  //Home route
  var index = require('../app/controllers/index');
  app.get('/play', index.play);
  app.get('/', index.render);
  app.get('/gametour', index.gameTour);

};
