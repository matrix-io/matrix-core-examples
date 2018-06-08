// Set Initial Variables \\
var zmq = require('zeromq');// Asynchronous Messaging Framework
var matrix_io = require('matrix-protos').matrix_io;// Protocol Buffers for MATRIX function
var matrix_ip = '127.0.0.1';// Local IP
var matrix_everloop_base_port = 20021;// Port for Everloop driver
var matrix_device_leds = 0;// Holds amount of LEDs on MATRIX device

// BASE PORT \\
// Create a Pusher socket
var configSocket = zmq.socket('push');
// Connect Pusher to Base Port
configSocket.connect('tcp://' + matrix_ip + ':' + matrix_everloop_base_port);

// Create an empty Everloop image
var image = matrix_io.malos.v1.io.EverloopImage.create();

// Loop every 50 milliseconds
setInterval(function(){
  // For each device LED
  for (var i = 0; i < matrix_device_leds; ++i) {
    // Set individual LED value
    image.led[i] = {
      red: Math.floor(Math.random() * 200)+1,
      green: Math.floor(Math.random() * 255)+1,
      blue: Math.floor(Math.random() * 50)+1,
      white: 0
    };
  }

  // Store the Everloop image in driver configuration
  var config = matrix_io.malos.v1.driver.DriverConfig.create({
    'image': image
  });

  // Send driver configuration to MATRIX device
  if(matrix_device_leds > 0)
    configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());
},50);

// KEEP-ALIVE PORT \\
// Create a Pusher socket
var pingSocket = zmq.socket('push')
// Connect Pusher to Keep-alive port
pingSocket.connect('tcp://' + matrix_ip + ':' + (matrix_everloop_base_port + 1));
// Send a single ping
pingSocket.send('');

// ERROR PORT \\
// Create a Subscriber socket
var errorSocket = zmq.socket('sub');
// Connect Subscriber to Error port
errorSocket.connect('tcp://' + matrix_ip + ':' + (matrix_everloop_base_port + 2));
// Connect Subscriber to Error port
errorSocket.subscribe('');
// On Message
errorSocket.on('message', function(error_message){
  console.log('Error received: ' + error_message.toString('utf8'));// Log error
});

// DATA UPDATE PORT \\
// Create a Subscriber socket
var updateSocket = zmq.socket('sub');
// Connect Subscriber to Data Update port
updateSocket.connect('tcp://' + matrix_ip + ':' + (matrix_everloop_base_port + 3));
// Subscribe to messages
updateSocket.subscribe('');
// On Message
updateSocket.on('message', function(buffer){
  var data = matrix_io.malos.v1.io.EverloopImage.decode(buffer);// Extract message
  matrix_device_leds = data.everloopLength;// Save MATRIX device LED count
});