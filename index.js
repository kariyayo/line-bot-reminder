var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.raw({ type: '*/*' }));
app.set('port', (process.env.PORT || 5000));

var model = require('./model.js');
var api = require('./api.js');
var cronJobs = require('./cronJobs.js');


var parse = function(whenText) {
  var s = whenText
    .replace(/１/g, "1")
    .replace(/２/g, "2")
    .replace(/３/g, "3")
    .replace(/４/g, "4")
    .replace(/５/g, "5")
    .replace(/６/g, "6")
    .replace(/７/g, "7")
    .replace(/８/g, "8")
    .replace(/９/g, "9")
    .replace(/０/g, "0");
  if (s.lastIndexOf("毎日", 0) === 0) {
    var time = s.substring(2).split("時");
    var hour = parseInt(time[0]);
    var minute = parseInt(time[1]);
    if (hour && minute) {
      return "00 " + minute + " " + hour + " * * *";
    } else if (hour) {
      return "00 00 " + hour + " * * *";
    } else {
      return null;
    }
  } else if (s.lastIndexOf("毎週", 0) === 0) {
    var dayOfTheWeek;
    switch (s.substring(2, 5)) {
      case "日曜日":
        dayOfTheWeek = "0"
        break;
      case "月曜日":
        dayOfTheWeek = "1"
        break;
      case "火曜日":
        dayOfTheWeek = "2"
        break;
      case "水曜日":
        dayOfTheWeek = "3"
        break;
      case "木曜日":
        dayOfTheWeek = "4"
        break;
      case "金曜日":
        dayOfTheWeek = "5"
        break;
      case "土曜日":
        dayOfTheWeek = "6"
        break;
      default:
        break;
    }
    var time = s.substring(5).split("時");
    var hour = parseInt(time[0]);
    var minute = parseInt(time[1]);
    if (dayOfTheWeek && hour && minute) {
      return "00 " + minute + " " + hour + " * * " + dayOfTheWeek;
    } else if (dayOfTheWeek && hour) {
      return "00 00 " + hour + " * * " + dayOfTheWeek;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

var showList = function(who) {
  var s = cronJobs.show(who);
  if (s) {
    return s + "\n\n" + "取り消す場合は、「取消 <番号>」と入力してください。";
  } else {
    return "登録されてるリマインドはありません。\n\nリマインドを登録するには以下のように入力してください。\n「<いつ> <何を>」\n\n例\n毎週水曜日9時 燃えないゴミ\n毎日20時30分 犬の散歩";
  }
};

var stopSchedule = function(who, inputText) {
  var number;
  if (inputText.lastIndexOf("取消", 0) === 0) {
    number = parseInt(inputText.substring(3));
  } else {
    number = parseInt(inputText.substring(5));
  }
  if (number) {
    var _id = cronJobs.stop(who, number - 1);
    model.Schedule.findByIdAndRemove(_id, function(err, result) {
      if (err) console.log(err);
    });
  }
  return "取り消しました。";
};

var addSchedule = function(from, inputText) {
  var result;
  var words = inputText.replace(/　/g, " ").split(" ");
  if (words && words.length > 1) {
    var when = parse(words[0]);
    var what = words.slice(1).join(" ");
    if (when) {
      var schedule = new model.Schedule();
      schedule.when = when;
      schedule.what = what;
      schedule.who = from;
      schedule.inputText = inputText;
      schedule.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          cronJobs.addCron(schedule, api.sendMessage);
        }
      });
      result = "登録しました！\n" + inputText;
    } else {
      result = "<いつ> の部分は以下のように入力してください。\n毎週水曜日9時\n毎日20時30分";
    }
  } else {
    result = "登録されているリマインドを確認するには「一覧」と入力してください。\nリマインドを登録するには以下のように入力してください。\n「<いつ> <何を>」\n\n例\n毎週水曜日9時 燃えないゴミ\n毎日20時30分 犬の散歩";
  }
  return result;
};



var reload = function() {
  model.Schedule.find({}, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      cronJobs.clear();
      docs.forEach(function(doc) {
        cronJobs.addCron(doc, api.sendMessage);
      });
    }
  });
};

reload();



app.get('/', function(req, res) {
  res.send("OK");
});


app.get('/reload', function(req, res) {
  reload();
  res.send("RELOAD");
});


app.post('/linebot/callback', function(req, res) {
  if (!api.isValid(req)) {
    res.send("NG");
  } else {
    JSON.parse(req.body.toString('utf8')).result.forEach(function(msg) {
      var inputText = msg.content.text;
      var resText;
      if (inputText.lastIndexOf("一覧", 0) === 0) {
        resText = showList(msg.content.from);
      } else if (inputText.lastIndexOf("取消", 0) === 0
          || inputText.lastIndexOf("取り消し", 0) === 0) {
        resText = stopSchedule(msg.content.from, inputText);
      } else {
        resText = addSchedule(msg.content.from, inputText);
      }
      api.sendMessage(msg.content.from, resText);
    });
    res.send("OK");
  }
});


app.listen(app.get('port'), function() {
  console.log('app is running on port', app.get('port'));
});

