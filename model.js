var mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

var ScheduleSchema = new mongoose.Schema({
  when: String,
  what: String,
  who: String,
  inputText: String
});
mongoose.model('Schedule', ScheduleSchema);

module.exports = {
  Schedule: mongoose.model('Schedule')
}

