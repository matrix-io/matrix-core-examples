## Set Initial Variables ##
import os # Miscellaneous operating system interface
import zmq # Asynchronous messaging framework
import time # Time access and conversions
import sys # System-specific parameters and functions
from matrix_io.proto.malos.v1 import driver_pb2 # MATRIX Protocol Buffer driver library
from matrix_io.proto.malos.v1 import sense_pb2 # MATRIX Protocol Buffer sensor library
from multiprocessing import Process # Allow for multiple processes at once
from zmq.eventloop import ioloop # Asynchronous events through ZMQ
matrix_ip = '127.0.0.1' # Local device ip
imu_port = 20013 # Driver Base port
# Handy functions for connecting to the keep-Alive, Data Update, & Error port 
from utils import driver_keep_alive, register_data_callback, register_error_callback

## BASE PORT ##
def config_socket():
    # Define zmq socket
    context = zmq.Context()
    # Create a Pusher socket
    socket = context.socket(zmq.PUSH)
    # Connect Pusher to configuration socket
    socket.connect('tcp://{0}:{1}'.format(matrix_ip, imu_port))

    # Create a new driver config
    driver_config_proto = driver_pb2.DriverConfig()
    # Delay between updates in seconds
    driver_config_proto.delay_between_updates = 0.05
    # Timeout after last ping
    driver_config_proto.timeout_after_last_ping = 6.0

    # Send driver configuration through ZMQ socket
    socket.send(driver_config_proto.SerializeToString())

## ERROR PORT ##
def imu_error_callback(error):
    # Log error
    print('{0}'.format(error))

## DATA UPDATE PORT ##
def imu_data_callback(data):
    # Extract data
    data = sense_pb2.Imu().FromString(data[0])
    # Log data 
    print('{0}'.format(data))

## Start Processes ##
if __name__ == '__main__':
    # Initiate asynchronous events
    ioloop.install()
    # Send Base Port configuration 
    config_socket()
    # Start Error Port connection
    Process(target=register_error_callback, args=(imu_error_callback, matrix_ip, imu_port)).start()
    # Start Data Update Port connection
    Process(target=register_data_callback, args=(imu_data_callback, matrix_ip, imu_port)).start()
    # Start Keep-alive Port connection
    Process(target=driver_keep_alive, args=(matrix_ip, imu_port)).start()