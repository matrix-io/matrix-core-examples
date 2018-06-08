// Set Initial Variables \\
var zmq = require('zeromq');// Asynchronous Messaging Framework
var matrix_io = require('matrix-protos').matrix_io;// Protocol Buffers for MATRIX function
var matrix_ip = '127.0.0.1';// Local IP
var matrix_servo_base_port = 20045;// Port for Servo driver

// BASE PORT \\
// Create a Pusher socket
var configSocket = zmq.socket('push');
// Connect Pusher to Base port
configSocket.connect('tcp://' + matrix_ip + ':' + matrix_servo_base_port);
// Create driver configuration
var config = matrix_io.malos.v1.driver.DriverConfig.create({
  // Create servo configuration
  servo: matrix_io.malos.v1.io.ServoParams.create({
    pin: 0,// Use pin 0
    angle: 0// Set angle 0
  })
});
// Loop every second
setInterval(function(){
  // Pick number from 1-180
  var angle = Math.floor(Math.random() * 180)+1;
  // Set number as new random angle
  config.servo.angle = angle;
  // Log angle
  console.log('Angle: ' + angle);
  // Send driver configuration
  configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());
}, 1000);

// ERROR PORT \\
// Create a Subscriber socket
var errorSocket = zmq.socket('sub');
// Connect Subscriber to Error port
errorSocket.connect('tcp://' + matrix_ip + ':' + (matrix_servo_base_port + 2));
// Connect Subscriber to Error port
errorSocket.subscribe('');
// On Message
errorSocket.on('message', function(error_message){
  console.log('Error received: ' + error_message.toString('utf8'));// Log error
});