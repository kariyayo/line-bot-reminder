var crypto = require('crypto')
var request = require('request').defaults({'proxy':process.env.FIXIE_URL});

var ENDPOINT_URL = 'https://trialbot-api.line.me/v1/events';
var HEADERS = {
  'Content-Type': 'application/json',
  'X-Line-ChannelID': process.env.LINE_CHANNEL_ID,
  'X-Line-ChannelSecret': process.env.LINE_CHANNEL_SECRET,
  'X-Line-Trusted-User-With-ACL': process.env.LINE_CHANNEL_MID
};

module.exports = {
  isValid: function(req) {
    var signature = crypto
      .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
      .update(req.body)
      .digest('base64');
    return signature == req.get("X-LINE-CHANNELSIGNATURE")
  },
  sendMessage: function(to, text) {
    var contentJson = {
      to: [to],
      toChannel: 1383378250,
      eventType: '138311608800106203',
      content: {
        contentType: 1,
        toType: 1,
        text: text
      }
    };

    var options = {
      url: ENDPOINT_URL,
      method: 'POST',
      headers: HEADERS,
      json: contentJson
    };

    request(options, function(error, response, body) {
      if (error) console.log(error);
    });
  }
}
