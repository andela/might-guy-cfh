var async = require('async');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const gameRecord = require('../app/models/gameRecord');
const invite = require('../app/controllers/invite');
const question = require('../app/controllers/questions');

const sg = require('sendgrid')('SG.SsgxbJ1IRiSImn2gI1qAkA.' +
  'VdN9m18YcsrOoc6-kpg_C3h4B207Ftxc_znG3dHE5qk');

const sendMail = (inviteeMail, gameLink, gameOwner) => {
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [
        {
          to: [
            {
              email: `${inviteeMail}`,
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
          type: 'text/html',
          value: `
          <a href="http://might-guy-cfh-staging.herokuapp.com/#!/">
            <img style="display: block; margin: auto;"
              src="http://i.imgur.com/FuXN2R2.jpg"/>
          </a>
          <h2 style="margin-top: 40px; text-align: center">
          Cards For Humanity player,
          <span style="color: rgba(203, 109, 81, 0.9)">${gameOwner}</span>,
           has invited you to their game. <br><br>

             <a href="${gameLink}">
               <div style="text-align: center">
                  <button style="background-color: rgb(41, 97, 127);
                   border: none; color: white; padding: 15px 32px;
                   text-align: center;
                   text-decoration: none;
                   display: inline-block;
                   font-size: 16px;">
                   CLICK HERE TO JOIN THE ROUGH RIDE
                  </button>
                </div>
            </a> <br>
          </h2>
          <h3 style="text-align: center">
            Alternatively, you can copy the link below and paste in your
            browser window. <br>
            <span style="display: block; margin-top: 4px;
             background-color: #bec5ce; height: 30px; padding-top: 6px;
             text-align: center;">
              ${gameLink}
            </span>
          </h3>
          `
        },
      ],
    },
  });

  sg.API(request)
    .then(response => console.log(`Mail to ${inviteeMail} successfully sent.`))
    .catch(error =>
      console.log (error)
    );
};

module.exports = function(app, passport, auth) {
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

  app.post('/api/selected-region', (req, res) => {
      const gameRegion = req.body.regionId;
      question.setRegion(gameRegion);
    });

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
  app.get('/api/games/history', middleware.requiresLogin, (req, res) => {
      const userName = req.query.name;

      gameRecord.find({ gamePlayers: { $elemMatch:
          { $in: [userName] } } }, (error, result) => {
        res.send(result);
      });
    });

  app.get('/api/leaderboard', middleware.requiresLogin, (req, res) => {
      User.find().sort({ gameWins: -1 }).exec((error, result) => {
        res.send(result);
      });
    });

  app.get('/api/donations', middleware.requiresLogin, (req, res) => {
      const userName = req.query.name;

    User.findOne({ name: userName }, (error, result) => {
      if (error) {
        console.log(error);
      }
      res.send(result.donations);
    });
  });

  app.post('/inviteusers', middleware.requiresLogin, (req) => {
    const url = req.body.url;
    const userEmail = req.body.invitee;
    const gameOwner = req.body.gameOwner;

    sendMail(userEmail, url, gameOwner);
  });

  app.post('/api/games/:id/start', middleware.requiresLogin, (req, res) => {
      // prevent Node from performing post request every 2 minutes
      // if no response is got from client to avoid multiple posts
      res.connection.setTimeout(0);

      const gamePlayDate = req.body.gamePlayDate;
      const gamePlayTime = req.body.gamePlayTime;
      const gameID = req.params.id;
      const gamePlayers = req.body.gamePlayers;
      const gameRounds = req.body.gameRounds;
      const winner = req.body.gameWinner;

      const record = new gameRecord(
        {
          gamePlayDate,
          gamePlayTime,
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
      });

      User.findOneAndUpdate({ name: winner },
        {
          $inc: { gameWins: 1 }
        }, (error) => {
          if (error) {
            console.log(`An error occured while trying to
              save win record for ${winner}`);
          } else {
            console.log(`Win record for ${winner} has been recorded`);
          }
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

  // Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the github oauth routes
  app.get('/auth/github', passport.authenticate('github', {
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the twitter oauth routes
  app.get('/auth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the google oauth routes
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
  app.get('/dashboard', index.dashBoard);
};
