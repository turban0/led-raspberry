var express = require("express");
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var log     = require('./app/log')(io);

app.use(express.static(__dirname + '/public'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});

//sockets
io.on('connection', function(socket){
  console.log('Client connected');
  log("Standby");
  socket.on('disconnect', function(){
    console.log('Client disconnected');
  });
  socket.on('buttonPressed', function(){
    //log("Button pressed");
    buttonPressed();
  });
  socket.on('buttonReleased', function(){
    //log("Button released");
    buttonReleased();
  });
});


//logic
var state = {
  StandBy: 1,
  Learning: 2,
  Playback: 3
}

var currentState = state.StandBy;
var savedPattern = [];
var timer = undefined;
var playbackTimeout;

function buttonPressed(){
  switch(currentState) {
    case state.StandBy:
      currentState = state.Learning;
      log("Learning");
      timer = new Date();
      clearTimeout(playbackTimeout);
      io.emit("setLedState", 1);
      break;
    case state.Learning:
      clearTimeout(playbackTimeout);
      savedPattern.push(new Date() - timer);
      timer = new Date();
      io.emit("setLedState", 1);
      break;
    case state.Playback:
      clearTimeout(playbackTimeout);
      io.emit("setLedState", 0);
      savedPattern = [];
      timer = undefined;
      currentState = state.StandBy;
      log("Standby");
      break;
  }
}

function buttonReleased(){
  if(currentState === state.Learning){
      clearTimeout(playbackTimeout);
      savedPattern.push(new Date() - timer);
      timer = new Date();
      playbackTimeout = setTimeout(playback, 5000);
      io.emit("setLedState", 0);
  }
}

function playback(){
  currentState = state.Playback;
  log("Playback");
  var i = 0;

  function switchLed(ms){
    if(i % 2) {
      log("Led will turn off in " + ms + "ms");
    } else {
      log("Led will turn on in " + ms + "ms");
    }
    playbackTimeout = setTimeout(function(){
      io.emit("setLedState", ++i % 2);
      var nextDelay = savedPattern.shift();
      if(nextDelay){
        switchLed(nextDelay);
      } else {
        timer = undefined;
        currentState = state.StandBy;
        log("StandBy");
      }
    }, ms);
  }

  var nextDelay = savedPattern.shift();
  if(nextDelay) {
    io.emit("setLedState", ++i % 2);
    switchLed(nextDelay);
  } else {
    timer = undefined;
    currentState = state.StandBy;
    log("StandBy");
  }
}
