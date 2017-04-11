const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const gameRecordSchema = new Schema({
  gamePlayDate: String,
  gameID: String,
  gamePlayers: [],
  gameRounds: Number,
  winner: String
});

module.exports = mongoose.model('Record', gameRecordSchema);
