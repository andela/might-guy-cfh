/**
 * Module dependencies.
 */
let mongoose = require('mongoose'),
  async = require('async'),
  Question = mongoose.model('Question'),
  _ = require('underscore'),
  region;


/**
 * Find question by id
 */
exports.question = function (req, res, next, id) {
  Question.load(id, (err, question) => {
    if (err) return next(err);
    if (!question) return next(new Error(`Failed to load question ${id}`));
    req.question = question;
    next();
  });
};

/**
 * Show an question
 */
exports.show = function (req, res) {
  res.jsonp(req.question);
};

/**
 * List of Questions
 */
exports.all = function (req, res) {
  Question.find({ official: true, numAnswers: { $lt: 3 } }).select('-_id').exec((err, questions) => {
    if (err) {
      res.render('error', {
          status: 500
        });
    } else {
      res.jsonp(questions);
    }
  });
};

exports.setRegion = (regionId) => {
  region = regionId;
};

/**
 * List of Questions (for Game class)
 */
exports.allQuestionsForGame = function (cb) {
  if (region === '58f4de8ef08434413b6aec50') {
      Question.find({ official: true, numAnswers: { $lt: 3 } }).select('-_id').exec((err, questions) => {
    if (err) {
      console.log(err);
    } else {
      cb(questions);
    }
  });
} else {
    Question.find({ official: true, regionId: region, numAnswers: { $lt: 3 } }).select('-_id').exec((err, questions) => {
    if (err) {
      console.log(err);
    } else {
      cb(questions);
    }
  });
  }
};
