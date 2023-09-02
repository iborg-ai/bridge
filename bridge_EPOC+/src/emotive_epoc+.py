import sys
import os
import platform
import math
import numpy as np
system_platform = platform.system()
if system_platform == "Windows":
    import pywinusb.hid as hid
elif system_platform == "Darwin":
    import hid
import gevent
from Crypto.Cipher import AES
from Crypto import Random
from gevent.queue import Queue
from subprocess import check_output

DEVICE_POLL_INTERVAL = 0.001  # in seconds

sensor_bits = {
    'AF3': [46, 47, 32, 33, 34, 35, 36, 37, 38, 39, 24, 25, 26, 27],  # <- 4
    'F7': [48, 49, 50, 51, 52, 53, 54, 55, 40, 41, 42, 43, 44, 45],  # <-6
    'F3': [10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7],  # <- 8
    'FC5': [28, 29, 30, 31, 16, 17, 18, 19, 20, 21, 22, 23, 8, 9],  # <- 2   
    'T7': [66, 67, 68, 69, 70, 71, 56, 57, 58, 59, 60, 61, 62, 63],  # <- 8
    'P7': [84, 85, 86, 87, 72, 73, 74, 75, 76, 77, 78, 79, 64, 65],  # <- 10
    'O1': [102, 103, 88, 89, 90, 91, 92, 93, 94, 95, 80, 81, 82, 83],  # <- 12
    'O2': [140, 141, 142, 143, 128, 129, 130, 131, 132, 133, 134, 135, 120, 121],  # <- 2
    'P8': [158, 159, 144, 145, 146, 147, 148, 149, 150, 151, 136, 137, 138, 139],  # <- 4
    'T8': [160, 161, 162, 163, 164, 165, 166, 167, 152, 153, 154, 155, 156, 157],  # <- 6
    'FC6': [214, 215, 200, 201, 202, 203, 204, 205, 206, 207, 192, 193, 194, 195],  # <- 12
    'F4': [216, 217, 218, 219, 220, 221, 222, 223, 208, 209, 210, 211, 212, 213],  # <- 6
    'F8': [178, 179, 180, 181, 182, 183, 168, 169, 170, 171, 172, 173, 174, 175],  # <- 8
    'AF4': [196, 197, 198, 199, 184, 185, 186, 187, 188, 189, 190, 191, 176, 177],  # <- 10
    # 'GYRO_X': [224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239],  # 232, 233, 234, 235],
    # 'GYRO_Y': [248, 249, 250, 251, 252, 253, 254, 255, 240, 241, 242, 243, 244, 245, 246, 247],
}

quality_bits = [ 101, 102,99, 100, 103, 104, 105, 106, 107, 108, 111, 112, 109, 110,]

sensors_name = [
    'AF3',
    'F7',
    'F3',
    'FC5',
    'T7',
    'P7',
    'O1',
    'O2',
    'P8',
    'T8',
    'FC6',
    'F4',
    'F8',
    'AF4',
]


battery_values = {
    "255": 100,
    "254": 100,
    "253": 100,
    "252": 100,
    "251": 100,
    "250": 100,
    "249": 100,
    "248": 100,
    "247": 99,
    "246": 97,
    "245": 93,
    "244": 89,
    "243": 85,
    "242": 82,
    "241": 77,
    "240": 72,
    "239": 66,
    "238": 62,
    "237": 55,
    "236": 46,
    "235": 32,
    "234": 20,
    "233": 12,
    "232": 6,
    "231": 4,
    "230": 3,
    "229": 2,
    "228": 2,
    "227": 2,
    "226": 1,
    "225": 0,
    "224": 0,
}

g_battery = 0
tasks = Queue()


sensor_quality_bit = {
    0: 'AF3',
    1: 'F7',
    2: "F3",
    3: 'FC5',
    4: 'T7',
    5: 'P7',
    6: 'O1',
    7: 'O2',
    8: 'P8',
    9: 'T8',
    10: 'FC6',
    11: 'F4',
    12: 'F8',
    13: 'AF4',
}

data_old=[]
def get_level(data, bits):
    """
    Returns sensor level value from data using sensor bit mask in micro volts (uV).
    """
    level = 0
    for i in range(13, -1, -1):
        level <<= 1
        b, o = (bits[i] // 8) + 1, bits[i] % 8
        level |= (data[b] >> o) & 1       
    return level 


def get_linux_setup():
    """
    Returns hidraw device path and headset serial number.
    """
    raw_inputs = []
    for filename in os.listdir("/sys/class/hidraw"):
        real_path = check_output(["realpath", "/sys/class/hidraw/" + filename])
        split_path = real_path.split('/')
        s = len(split_path)
        s -= 4
        i = 0
        path = ""
        while s > i:
            path = path + split_path[i] + "/"
            i += 1
        raw_inputs.append([path, filename])
    for input in raw_inputs:
        try:
            with open(input[0] + "/manufacturer", 'r') as f:
                manufacturer = f.readline()
                f.close()
            if "Emotiv Systems" in manufacturer:
                with open(input[0] + "/serial", 'r') as f:
                    serial = f.readline().strip()
                    f.close()
                print ("Serial: " + serial + " Device: " + input[1])
                hidraw = input[1]
                hidraw_id = int(hidraw[-1])
                hidraw_id += 1
                hidraw = "hidraw" + hidraw_id.__str__()
                print ("Serial: " + serial + " Device: " + hidraw + " (Active)")
                return [serial, hidraw, ]
        except IOError as e:
            print ("Couldn't open file: %s" % e)


def is_old_model(serial_number):
    if "GM" in serial_number[-2:]:
        return False
    return True


class EmotivPacket(object):
    """
    Basic semantics for input bytes.
    """

    def __init__(self, data, sensors, model):
        global g_battery
        self.raw_data = data
        self.counter = data[0]
        self.battery = g_battery
        if self.counter > 127:
            self.battery = self.counter
            g_battery = battery_values[str(self.battery)]
            self.counter = 128
        self.sync = self.counter == 0xe9
        self.gyro_x = data[29] - 106
        self.gyro_y = data[30] - 105
        sensors['X']['value'] = self.gyro_x
        sensors['Y']['value'] = self.gyro_y
        self.old_model = model
        for name, bits in sensor_bits.items():
            value = get_level(self.raw_data, bits)//2 +100 #- 8192 
            setattr(self, name, (value,))
            sensors[name]['value'] = math.floor(value)
            # print(value)
        self.quality_bit, self.quality_value = self.handle_quality(sensors)
        self.sensors = sensors

    def handle_quality(self, sensors):
        current_contact_quality = get_level(self.raw_data, quality_bits)
        
        sensor = self.raw_data[0]
        
        if sensor_quality_bit.get(sensor, False):
            sensors[sensor_quality_bit[sensor]]['quality'] = current_contact_quality
        else:
            sensors['Unknown']['quality'] = current_contact_quality
            sensors['Unknown']['value'] = sensor
        
    
        return sensor, current_contact_quality
        

    def __repr__(self):
        return 'EmotivPacket(counter=%i, battery=%i, gyro_x=%i, gyro_y=%i)' % (
            self.counter,
            self.battery,
            self.gyro_x, 
            self.gyro_y
            )


class Emotiv(object):
    def __init__(self, display_output=True, serial_number=sys.stdin.readline(), is_research=False):
        """
        Sets up initial values.
        """
        self.test = False
        self.running = True
        self.packets = Queue()
        self.packets_received = 0
        self.packets_processed = 0
        self.current_processed = 0
        self.battery = 0
        self.display_output = display_output
        self.is_research = is_research
        self.sensors = {
            'F3': {'value': 0, 'quality': 0},
            'FC5': {'value': 0, 'quality': 0},
            'AF3': {'value': 0, 'quality': 0},
            'F7': {'value': 0, 'quality': 0},
            'T7': {'value': 0, 'quality': 0},
            'P7': {'value': 0, 'quality': 0},
            'O1': {'value': 0, 'quality': 0},
            'O2': {'value': 0, 'quality': 0},
            'P8': {'value': 0, 'quality': 0},
            'T8': {'value': 0, 'quality': 0},
            'F8': {'value': 0, 'quality': 0},
            'AF4': {'value': 0, 'quality': 0},
            'FC6': {'value': 0, 'quality': 0},
            'F4': {'value': 0, 'quality': 0},
            'X': {'value': 0, 'quality': 0},
            'Y': {'value': 0, 'quality': 0},
            'Unknown': {'value': 0, 'quality': 0},
            'Battery': {'value': 0}
        }
        self.USBconnected= 0 
        self.serial_number = serial_number
        self.old_model = False
        self.shift =np.array([0]*14)
        self.shift_num = 0
        self.shift2 =np.array([0]*14)

    def setup(self):
        """
        Runs setup function depending on platform.
        """
        print (system_platform + " detected.")
        if system_platform == "Windows":
            self.setup_windows()
        elif system_platform == "Linux":
            self.setup_posix()
        elif system_platform == "Darwin":
            self.setup_darwin()

    def setup_windows(self):
        """
        Setup for headset on the Windows platform.
        """
        devices = []
        try:
            for device in hid.find_all_hid_devices():
                if device.vendor_id != 0x1234 and device.product_id != 0xED02:
                    continue
                else:
                    self.USBconnected=1
                
                print("device.product_name:"+device.product_name)
                if device.product_name == 'Brain Waves':
                    devices.append(device)
                    device.open()
                    self.serial_number = device.serial_number
                    device.set_raw_data_handler(self.handler)
                elif device.product_name == 'EPOC BCI':
                    devices.append(device)
                    device.open()
                    self.serial_number = device.serial_number
                    device.set_raw_data_handler(self.handler)
                elif device.product_name == '00000000000':
                    devices.append(device)
                    device.open()
                    self.serial_number = device.serial_number
                    device.set_raw_data_handler(self.handler)
                elif device.product_name == 'Emotiv RAW DATA':
                    devices.append(device)
                    device.open()
                    self.serial_number = device.serial_number
                    device.set_raw_data_handler(self.handler)
                if device.product_name == 'EEG Signals':
                    devices.append(device)
                    device.open()
                    self.serial_number = device.serial_number
                    device.set_raw_data_handler(self.handler)

                    

            if self.USBconnected==1:
                print('self.USBconnected=')
                crypto = gevent.spawn(self.setup_crypto, self.serial_number)
                console_updater = gevent.spawn(self.update_console)
                crypto.join()
            else:
                print('please connect your USB acceptor')
            
        
        finally:
            print('finally')
            if self.USBconnected==1:
                for device in devices:
                    device.close()
                gevent.kill(crypto, KeyboardInterrupt)
                gevent.kill(console_updater, KeyboardInterrupt)


    def handler(self,data):
        """
        Receives packets from headset for Windows. Sends them to a Queue to be processed
        by the crypto greenlet.
        """
        c=[]
        for i in data[1:]:
            c.append(i.to_bytes(1, 'big'))        
        tasks.put_nowait(b''.join(c))
        self.packets_received += 1
        return True

    def setup_darwin(self):
        """
        Setup for headset on the OS X platform.
        Receives packets from headset and sends them to a Queue to be processed
        by the crypto greenlet.
        """
        _os_decryption = False
        hidraw = hid.device(0x21a1, 0x0001)
        if not hidraw:
            hidraw = hid.device(0x21a1, 0x1234)
        if not hidraw:
            hidraw = hid.device(0xed02, 0x1234)
        if not hidraw:
            print ("Device not found. Uncomment the code in setup_darwin and modify hid.device(vendor_id, product_id)")
            raise ValueError
        
        if self.serial_number == "":
            print ("Serial number needs to be specified manually in __init__().")
            raise ValueError
        else:
            print ("Serial number is specified! LMAOOO!")
        
        crypto = gevent.spawn(self.setup_crypto, self.serial_number)
        console_updater = gevent.spawn(self.update_console)
        zero = 0
        hidraw.open(0x1234, 0xED02, self.serial_number)
        ii=0

        while self.running:
            try:
                if self.test == True:
                    ii+=1
                    if ii == 100:
                        self.running = False
                        self.display_output = False
                        break
                try:
                    data = hidraw.read(34)
                except Exception as e:
                    print(e)
                    hidraw.close()
                    gevent.kill(crypto, KeyboardInterrupt)
                    gevent.kill(console_updater, KeyboardInterrupt)
                if len(data) == 32:
                    data = [zero] + data

                if data != "":
                    if _os_decryption:
                        self.packets.put_nowait(data)
                    else:
                        c=[]
                        for i in data[1:]:
                            c.append(i.to_bytes(1, 'big'))
                        tasks.put_nowait(b''.join(c))
                        self.packets_received += 1
                    
                    try:
                        gevent.sleep(0)
                    except KeyboardInterrupt:
                        self.running = False
                        self.display_output = False
                else:
                    gevent.sleep(DEVICE_POLL_INTERVAL)
            except KeyboardInterrupt:
                self.running = False
                self.display_output = False
        crypto.join()
        hidraw.close()
        gevent.kill(crypto, KeyboardInterrupt)
        gevent.kill(console_updater, KeyboardInterrupt)

    def setup_crypto(self, sn):
        k = ['\0'] * 16
        k[0] = sn[-1]
        k[1] = '\x00'
        k[2] = sn[-2]
        k[3] = '\x15'
        k[4] = sn[-3]
        k[5] = '\x00'
        k[6] = sn[-4]
        k[7] = '\x0C'
        k[8] = sn[-3]
        k[9] = '\x00'
        k[10] = sn[-2]
        k[11] = 'D'
        k[12] = sn[-1]
        k[13] = '\x00'
        k[14] = sn[-2]
        k[15] = 'X'
        key = ''.join(k)
        iv = Random.new().read(AES.block_size)
        if system_platform == "Windows":
            cipher = AES.new(bytes(key,encoding='utf8'), AES.MODE_ECB)
        elif system_platform == "Darwin":
            cipher = AES.new(key, AES.MODE_ECB, iv)
        while self.running:
            while not tasks.empty():
                task = tasks.get()
                try:
                    if system_platform == "Windows":
                        data = cipher.decrypt(task[:16])+cipher.decrypt(task[16:])
                        
                    else:
                        data = cipher.decrypt(task)
                    
                    try:
                        self.packets.put_nowait(EmotivPacket(
                            data, self.sensors, self.old_model))
                        self.packets_processed += 1

                    except Exception as e:
                        print(e)
                        pass
                except Exception as e:
                    print(e)
                    pass

                try:
                    gevent.sleep(0)
                except KeyboardInterrupt:
                    self.running = False
                    self.display_output = False
            try:
                gevent.sleep(0)
            except KeyboardInterrupt:
                self.running = False
                self.display_output = False

    def dequeue(self):
        try:
            return self.packets.get()
        except Exception as e:
            print (e)

    def close(self):
        self.running = False

    def update_console(self):
        print('update_console')
        if self.display_output:
            while self.running:
                if self.packets_processed > self.current_processed:
                
                    self.current_processed = self.packets_processed
                    output_list=[]
                    for i in sensors_name:
                        output_list.append(self.sensors[i]['value'])
                    
                    #gyroscope values
                    self.gyro_x = self.sensors['X']['value']
                    self.gyro_y = self.sensors['Y']['value']
                    if self.shift_num < 50:
                        self.shift_num +=1
                        self.shift += np.array(output_list)
                        print('processing...')
                        sys.stdout.flush()
                    elif self.shift_num == 50:
                        self.shift_num +=1
                        self.shift =self.shift//50
                        sys.stdout.flush()
                    else:
                        raweeg = np.array(output_list)-self.shift
                        raweeg = ','.join(str(round(x,2)) for x in raweeg)
                        print('['+raweeg+','+str(self.gyro_x)+','+str(self.gyro_y)+']')
                        sys.stdout.flush()

                try:
                    gevent.sleep(0)
                except KeyboardInterrupt:
                    self.running = False
                    self.display_output = False

if __name__ == "__main__":
    a = Emotiv()
    try:
        a.setup()
        
    except KeyboardInterrupt:
        a.close()


