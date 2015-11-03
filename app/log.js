var log = function(io){
  return function(message){
    console.log(message);
    io.emit('message', message);
  }
};

module.exports = log;
