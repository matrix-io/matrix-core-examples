## Set Initial Variables ##
import os # Miscellaneous operating system interface
import zmq # Asynchronous messaging framework
import time # Time access and conversions
import sys # System-specific parameters and functions
from matrix_io.proto.malos.v1 import driver_pb2 # MATRIX Protocol Buffer driver library
from matrix_io.proto.malos.v1 import io_pb2 # MATRIX Protocol Buffer sensor library
from multiprocessing import Process # Allow for multiple processes at once
from zmq.eventloop import ioloop # Asynchronous events through ZMQ
matrix_ip = '127.0.0.1' # Local device ip
gpio_port = 20049 # Driver Base port
# Handy functions for connecting to the keep-Alive, Data Update, & Error port 
from utils import driver_keep_alive, register_data_callback, register_error_callback

## BASE PORT ##
# Define zmq socket
context = zmq.Context()
# Create a Pusher socket
socket = context.socket(zmq.PUSH)
# Connect Pusher to configuration socket
socket.connect('tcp://{0}:{1}'.format(matrix_ip, gpio_port))

# Configure GPIO update rates and timeout
def config_gpio_read():
    # Create a new driver config
    config = driver_pb2.DriverConfig()
    # Delay between updates in seconds
    config.delay_between_updates = 2.0
    # Timeout after last ping
    config.timeout_after_last_ping = 3.5
    # Send driver configuration through ZMQ socket
    socket.send(config.SerializeToString())

# Recursive function to toggle pin state
def config_gpio_write(pin, value):
    # Create a new driver config
    config = driver_pb2.DriverConfig()
    # set desired pin
    config.gpio.pin = pin
    # Set pin mode to output
    config.gpio.mode = io_pb2.GpioParams.OUTPUT
    # Set the output of the pin initially
    config.gpio.value = value%2
    # Send driver configuration through ZMQ socket
    socket.send(config.SerializeToString())

    # Wait 2 seconds
    time.sleep(2)
    # Increase value and run again
    value += 1
    config_gpio_write(0, value%2)

## ERROR PORT ##
def gpio_error_callback(error):
    # Log error
    print('{0}'.format(error))

## DATA UPDATE PORT ##
def gpio_callback(msg):
    # Extract data
    data = io_pb2.GpioParams().FromString(msg[0])
    # Convert GPIO values to 16-bit
    gpioValues = ('{0:016b}'.format(data.values))
    # Reverse string for chronological order
    gpioValues = gpioValues[::-1]
    # Convert string into an array
    gpioValues = list(gpioValues)
    # Log GPIO pin states from gpioValues[0-15]
    print('GPIO PINS-->[0-15]\n{0}'.format(gpioValues))

## Start Processes ##
if __name__ == "__main__":
    # Initiate asynchronous events
    ioloop.install()
    # Start Error Port connection
    Process(target=register_error_callback, args=(gpio_error_callback, matrix_ip, gpio_port)).start()
    # Start Keep-alive Port connection
    Process(target=driver_keep_alive, args=(matrix_ip, gpio_port, 1)).start()
    # Start Data Update Port connection
    Process(target=register_data_callback, args=(gpio_callback, matrix_ip, gpio_port)).start()
    # Send Base Port configurations
    try:
        # Configure GPIO update and timeout
        config_gpio_read()
        # Toggle state of selected pin, start with pin on
        config_gpio_write(0, 1)
    # Avoid logging GPIO errors on user quiting
    except KeyboardInterrupt:
        print('quit')