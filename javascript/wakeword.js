// Set Initial Variables \\
var zmq = require('zeromq');// Asynchronous Messaging Framework
var matrix_io = require('matrix-protos').matrix_io;// MATRIX Protocol Buffers
var matrix_ip = '127.0.0.1';// Local Device IP
var matrix_wakeword_base_port = 60001; // Wakeword base port
const LM_PATH = 'INSERT_PATH_TO_YOUR_FILE.lm';// Language Model File
const DIC_PATH = 'INSERT_PATH_TO_YOUR_FILE.dic';// Dictation File

// BASE PORT \\
// Create a Pusher socket
var configSocket = zmq.socket('push');
// Connect Pusher to Base port
configSocket.connect('tcp://' + matrix_ip + ':' + matrix_wakeword_base_port /* config */);
// Create driver configuration
var config = matrix_io.malos.v1.driver.DriverConfig.create(
{ // Create & Set wakeword configurations
  wakeword: matrix_io.malos.v1.io.WakeWordParams.create({
    lmPath: LM_PATH,// Language model file path
    dicPath: DIC_PATH,// Dictation file path
    channel: matrix_io.malos.v1.io.WakeWordParams.MicChannel.channel8,// Desired MATRIX microphone
    enableVerbose: false// Enable verbose option
  })
});
// Send configuration to MATRIX device
configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());
console.log('Listening for wakewords');

// KEEP-ALIVE PORT \\
// Create a Pusher socket
var pingSocket = zmq.socket('push');
// Connect Pusher to Keep-alive port
pingSocket.connect('tcp://' + matrix_ip + ':' + (matrix_wakeword_base_port + 1));
// Send initial ping
pingSocket.send('');
// Send a ping every 2 seconds
setInterval(function(){
  pingSocket.send('');// Send ping
}, 2000);

// ERROR PORT \\
// Create a Subscriber socket
var errorSocket = zmq.socket('sub');
// Connect Subscriber to Error port
errorSocket.connect('tcp://' + matrix_ip + ':' + (matrix_wakeword_base_port + 2));
// Connect Subscriber to Error port
errorSocket.subscribe('');
// On Message
errorSocket.on('message', function(error_message){
  //console.log('Error received: ' + error_message.toString('utf8'));// Log error
});

// DATA UPDATE PORT \\
// Create a Subscriber socket
var updateSocket = zmq.socket('sub');
// Connect Subscriber to Base port
updateSocket.connect('tcp://' + matrix_ip + ':' + (matrix_wakeword_base_port + 3));
// Subscribe to messages
updateSocket.subscribe('');
// On Message
updateSocket.on('message', function(wakeword_buffer) {
  // Extract message
  var wakeWordData = matrix_io.malos.v1.io.WakeWordParams.decode(wakeword_buffer);
  // Log message
  console.log(wakeWordData);
  // Run actions based on the phrase heard
  switch(wakeWordData.wakeWord) {
    // CHANGE TO YOUR PHRASE
    case "MATRIX START":
      console.log('I HEARD MATRIX START!');
      break;
    // CHANGE TO YOUR PHRASE
    case "MATRIX STOP":
      console.log('I HEARD MATRIX STOP!');
      break;
  }
});
