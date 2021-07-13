"use strict";


var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const { prototype } = require('events');

var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

var connectionString = 'HostName=DACSAIOT.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=VYv8XMXd0lKl84wae/clyNWuWaBbeIMls6YiAg2VVnM=';
var targetDevice = 'iot2000';

var serviceClient = Client.fromConnectionString(connectionString);

function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

function receiveFeedback(err, receiver){
    receiver.on('message', function (msg) {
      console.log('Feedback message:')
      console.log(msg.getData().toString('utf-8'));
    });
}

var publicDir = require('path').join(__dirname,'/public');

var app = express();
app.use(express.static(publicDir))//images
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/final.html'));
});
app.get('/on', function(request, response) {

    serviceClient.open(function (err) {
        if (err) {
          console.error('Could not connect: ' + err.message);
        } else {
          console.log('Service client connected');
          serviceClient.getFeedbackReceiver(receiveFeedback);
          var message = new Message('1');
          message.ack = 'full';
          message.messageId = "My Message ID";
          console.log('Sending message: ' + message.getData());
          serviceClient.send(targetDevice, message, printResultFor('send'));
        }
      });
    response.sendFile(path.join(__dirname + '/final.html'));
});

app.get('/off', function(request, response) {

    serviceClient.open(function (err) {
        if (err) {
          console.error('Could not connect: ' + err.message);
        } else {
          console.log('Service client connected');
          serviceClient.getFeedbackReceiver(receiveFeedback);
          var message = new Message('0');
          message.ack = 'full';
          message.messageId = "My Message ID";
          console.log('Sending message: ' + message.getData());
          serviceClient.send(targetDevice, message, printResultFor('send'));
        }
      });
    response.sendFile(path.join(__dirname + '/final.html'));
});



app.listen(8080)