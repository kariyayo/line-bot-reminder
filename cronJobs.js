var CronJob = require('cron').CronJob;

var _whoJobsMap = {};
module.exports = {
  addCron: function(schedule, f) {
    var cronJob = new CronJob({
      cronTime: schedule.when,
      onTick: function () {
        f(schedule.who, schedule.what);
      },
      start: true,
      timeZone: 'Asia/Tokyo'
    });
    cronJob.inputText = schedule.inputText;
    cronJob._id = schedule._id;
    var arr = _whoJobsMap[schedule.who];
    if (arr) {
      _whoJobsMap[schedule.who].push(cronJob);
    } else {
      _whoJobsMap[schedule.who] = [cronJob];
    }
    return cronJob;
  },
  show: function(who) {
    return _whoJobsMap[who].map(function(x, index) {
      return (index + 1) + ": " + x.inputText;
    }).join("\n");
  },
  stop: function(who, index) {
    var arr = _whoJobsMap[who];
    if (arr && arr[index]) {
      cronJob = arr[index];
      arr.splice(index, 1);
      cronJob.stop();
      return cronJob._id;
    } else {
      return null;
    }
  },
  clear: function() {
    for (key in _whoJobsMap) {
      var arr = _whoJobsMap[key];
      arr.forEach(function(cronJob) {
        cronJob.stop();
      });
    }
    _whoJobsMap = {};
  }
};

