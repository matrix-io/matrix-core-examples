// Set Initial Variables \\
var zmq = require('zeromq');// Asynchronous Messaging Framework
var matrix_io = require('matrix-protos').matrix_io;// Protocol Buffers for MATRIX function
var matrix_ip = '127.0.0.1';// Local IP
var matrix_pressure_base_port = 20025;// Port for Pressure driver

// BASE PORT \\
// Create a Pusher socket
var configSocket = zmq.socket('push');
// Connect Pusher to Base port
configSocket.connect('tcp://' + matrix_ip + ':' + matrix_pressure_base_port);
// Create driver configuration
var config = matrix_io.malos.v1.driver.DriverConfig.create({
  // Update rate configuration
  delayBetweenUpdates: 2.0,// 2 seconds between updates
  timeoutAfterLastPing: 6.0,// Stop sending updates 6 seconds after pings.
});
// Send driver configuration
configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());

// KEEP-ALIVE PORT \\
// Create a Pusher socket
var pingSocket = zmq.socket('push');
// Connect Pusher to Keep-alive port
pingSocket.connect('tcp://' + matrix_ip + ':' + (matrix_pressure_base_port + 1));
// Send initial ping
pingSocket.send('');
// Send ping every 5 seconds
setInterval(function(){
  pingSocket.send('');
}, 5000);

// ERROR PORT \\
// Create a Subscriber socket
var errorSocket = zmq.socket('sub');
// Connect Subscriber to Error port
errorSocket.connect('tcp://' + matrix_ip + ':' + (matrix_pressure_base_port + 2));
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
updateSocket.connect('tcp://' + matrix_ip + ':' + (matrix_pressure_base_port + 3));
// Subscribe to messages
updateSocket.subscribe('');
// On Message
updateSocket.on('message', function(buffer){
  var data = matrix_io.malos.v1.sense.Pressure.decode(buffer);// Extract message
    console.log(data);// Log new pressure data
});