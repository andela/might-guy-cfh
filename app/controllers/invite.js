const mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Notification = mongoose.model('Notification');

const getUserId = (email) => {
  let result;
  User.find(
    { email },
    (err, response) => {
      if (!err) {
        result = response[0]._id;
      } else {
        console.log(err);
      }
    });
  return result;
};

exports.addFriend = (req, res) => {
  const email = req.body.email,
    userId = req.body.user_id,
    button = req.body.checkButton;
  if (button === 'Addfriend') {
    User.findOneAndUpdate(
      { _id: userId },
      { $push: { friends: email } },
      { safe: true, upsert: true },
      (err, result) => {
        if (!err) {
          res.json(
            {
              succ: 'Successful',
              action: 'addfriend',
              email: req.body.email
            });
          const myId = getUserId(result.email);
          console.log(myId);
        }
      });
  } else {
    User.update(
      { _id: userId },
      { $pullAll: { friends: [email] } },
      (err) => {
        if (!err) {
          res.json(
            {
              succ: 'Successful',
              action: 'unfriend',
              email: req.body.email
            });
        }
      });
  }
};

exports.getFriends = (req, res) => {
  const userId = req.body.user_id;
  User.find(
    { _id: userId },
    (err, result) => {
      const userFriends = result[0].friends;
      res.send(userFriends);
    });
};

exports.sendNotification = (req, res) => {
  const friendId = req.body.friendId,
    link = req.body.url,
    userName = req.body.name,
    message = `${userName} has just invited you to join a game`,
    friendList = req.body.friendList;
  friendList.forEach((friend) => {
    const Notify = new Notification(
      {
        to: friend,
        from: userName,
        message,
        link,
        read: 0
      }
    );
    Notify.save((err) => {
      if (!err) {
        console.log('Notified Successfully');
      }
    });
  });
};

