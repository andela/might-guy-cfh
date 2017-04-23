/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
/**
 * Question Schema
 */
const NotificationSchema = new Schema({
  to: String,
  from: String,
  message: String,
  link: String,
  read: Number // 1 should be mark as read
});

mongoose.model('Notification', NotificationSchema);
