// Set Initial Variables \\
var zmq = require('zeromq');// Asynchronous Messaging Framework
var matrix_io = require('matrix-protos').matrix_io;// Protocol Buffers for MATRIX function
var matrix_ip = '127.0.0.1';// Local IP
var matrix_gpio_base_port = 20049;// Port for GPIO driver
var counter = 1;// Counter for gpio value toggle 

// BASE PORT \\
// Create a Pusher socket
var configSocket = zmq.socket('push');
// Connect Pusher to Base port
configSocket.connect('tcp://' + matrix_ip + ':' + matrix_gpio_base_port);

//Create driver configuration
var outputConfig = matrix_io.malos.v1.driver.DriverConfig.create({
  // Update rate configuration
  delayBetweenUpdates: 2.0,// 2 seconds between updates
  timeoutAfterLastPing: 6.0,// Stop sending updates 6 seconds after pings.
  //GPIO Configuration
  gpio: matrix_io.malos.v1.io.GpioParams.create({
    pin: 0,// Use pin 0
    mode: matrix_io.malos.v1.io.GpioParams.EnumMode.OUTPUT,// Set as output mode
    value: 0// Set initial pin value as off
  })
});

//Function to toggle gpio value to 0 or 1
function toggle(){
  outputConfig.gpio.value = counter%2;// Set pin value as 1 or 0
  counter++;// increase counter
  // Send MATRIX configuration to MATRIX device
  configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(outputConfig).finish());
}

// KEEP-ALIVE PORT \\
// Create a Pusher socket
var pingSocket = zmq.socket('push');
// Connect Pusher to Keep-alive port
pingSocket.connect('tcp://' + matrix_ip + ':' + (matrix_gpio_base_port + 1));
// Send initial ping
pingSocket.send('');
// Send ping & toggle pin value every 2 seconds
setInterval(function(){
  pingSocket.send('');// Send ping
  toggle();// Change pin value
}, 2000);

// ERROR PORT \\
// Create a Subscriber socket
var errorSocket = zmq.socket('sub');
// Connect Subscriber to Error port
errorSocket.connect('tcp://' + matrix_ip + ':' + (matrix_gpio_base_port + 2));
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
updateSocket.connect('tcp://' + matrix_ip + ':' + (matrix_gpio_base_port + 3));
// Subscribe to messages
updateSocket.subscribe('');
// On Message
updateSocket.on('message', function(buffer){
  // Extract message
  var data = matrix_io.malos.v1.io.GpioParams.decode(buffer);
  // String value to represent all GPIO pins as off
  var zeroPadding = '0000000000000000';
  // Remove padding to make room for GPIO values
  var gpioValues = zeroPadding.slice(0, zeroPadding.length - data.values.toString(2).length);
  // Convert GPIO values to 16-bit and add to string
  gpioValues = gpioValues.concat(data.values.toString(2));
  // Convert string to chronologically ordered array
  gpioValues = gpioValues.split("").reverse();
  // Log GPIO pin states from gpioValues[0-15]
  console.log('GPIO PINS-->[0-15]\n'+'['+gpioValues.toString()+']');
});