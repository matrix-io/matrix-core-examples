## Set Initial Variables ##
import os # Miscellaneous operating system interface
import zmq # Asynchronous messaging framework
import time # Time access and conversions
import sys # System-specific parameters and functions
import random # Generate pseudo-random numbers
from matrix_io.proto.malos.v1 import driver_pb2 # MATRIX Protocol Buffer driver library
from multiprocessing import Process # Allow for multiple processes at once
from zmq.eventloop import ioloop # Asynchronous events through ZMQ
matrix_ip = '127.0.0.1' # Local device ip
servo_port = 20045 # Driver Base port
# Handy function for connecting to the Error port 
from utils import register_error_callback

## BASE PORT ##
def send_servo_command(pin):
    # Define zmq socket
    context = zmq.Context()
    # Create a Pusher socket
    socket = context.socket(zmq.PUSH)
    # Connect Pusher to configuration socket
    socket.connect('tcp://{0}:{1}'.format(matrix_ip, servo_port))

    # Create a new driver config
    servo_config = driver_pb2.DriverConfig()
    # Set a pin that the servo will operate on
    servo_config.servo.pin = pin

    # Function to change servo angle
    def moveServo(angle):
        # Log angle
        print('Angle: {0}'.format(angle))
        # Set the servo's angle in the config
        servo_config.servo.angle = angle
        # Serialize the config and send it to the driver
        socket.send(servo_config.SerializeToString())
        # Wait for 1 second
        time.sleep(1)
        # Run function again with random angle
        moveServo(random.randint(0, 180))

    # Initial moveServo call
    moveServo(180)

## ERROR PORT ##
def servo_error_callback(error):
    # Log error
    print('{0}'.format(error))

## Start Processes ##
if __name__ == '__main__':
    # Initiate asynchronous events
    ioloop.install()
    # Start Error Port connection
    Process(target=register_error_callback, args=(servo_error_callback, matrix_ip, servo_port)).start()
    # Send Base Port configuration 
    try:
        send_servo_command(0)
    # Avoid logging servo angle errors on user quiting
    except KeyboardInterrupt:
        print(' quit')