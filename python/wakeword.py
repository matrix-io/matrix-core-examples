## Set Initial Variables ##
import os # Miscellaneous operating system interface
import zmq # Asynchronous messaging framework
import time # Time access and conversions
import sys # System-specific parameters and functions
from matrix_io.proto.malos.v1 import io_pb2 # MATRIX Protocol Buffer io library
from multiprocessing import Process # Allow for multiple processes at once
from zmq.eventloop import ioloop # Asynchronous events through ZMQ
matrix_ip = '127.0.0.1' # Local device ip
wakeword_port = 60001 # Driver Base port
# Handy functions for connecting to the Data Update, & Error port 
from utils import driver_keep_alive, register_data_callback, register_error_callback
# Sphinx Knowledge Base files
LM_PATH = 'INSERT_PATH_TO_YOUR_FILE.lm'# Language Model File
DIC_PATH = 'INSERT_PATH_TO_YOUR_FILE.dic'# Dictation File

## BASE PORT ##
def config_socket():
    # Define zmq socket
    context = zmq.Context()
    # Create a Pusher socket
    socket = context.socket(zmq.PUSH)
    # Connect Pusher to configuration socket
    socket.connect('tcp://{0}:{1}'.format(matrix_ip, wakeword_port))

    # Create a new driver config
    io_config_proto = io_pb2.WakeWordParams()
    # Language Model File
    io_config_proto.lm_path = LM_PATH
    # Dictation File
    io_config_proto.dic_path = DIC_PATH
    # Desired MATRIX microphone
    io_config_proto.channel = 8
    # Enable verbose option
    io_config_proto.enable_verbose = False

    # Send driver configuration through ZMQ socket
    socket.send(io_config_proto.SerializeToString())

## ERROR PORT ##
def wakeword_error_callback(error):
    # Log error
    print('{0}'.format(error))

## DATA UPDATE PORT ##
def wakeword_data_callback(data):
    # Extract data
    data = io_pb2.WakeWordParams().FromString(data[0])
    # Log data 
    print('{0}'.format(data))
    # Run actions based on the phrase heard
    # CHANGE TO YOUR PHRASE
    if data.wake_word == 'MATRIX START':
        print ('I HEARD MATRIX START!\n')
    # CHANGE TO YOUR PHRASE
    elif data.wake_word == 'MATRIX STOP':
        print ('I HEARD MATRIX STOP!\n')

## Start Processes ##
if __name__ == '__main__':
    # Initiate asynchronous events
    ioloop.install()
    # Send Base Port configuration 
    config_socket()
    # Start Error Port connection
    Process(target=register_error_callback, args=(wakeword_error_callback, matrix_ip, wakeword_port)).start()
    # Start Data Update Port connection
    Process(target=register_data_callback, args=(wakeword_data_callback, matrix_ip, wakeword_port)).start()
    # Start Keep-alive Port connection
    Process(target=driver_keep_alive, args=(matrix_ip, wakeword_port)).start()