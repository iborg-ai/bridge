# iborg-connector

## Description
Bridge is a connector for extracting the raw stream data from your EPOC+ headset and transmitting it to the website Iborg.ai. Data processing and visualization will all be preceded by the web server.

## Headset Support

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/EPOC%2B.png" width="400"/>
Epoc+(2019)

## Download

[GitHub](https://github.com/iborg-ai/bridge/tree/347cec6)

 *  MacOS Supported: Sierra, High Sierra, Mojave, higher may also avaliable
 
 *  Windows Supported: Win10, Win11
 
[Python v3.8 or above](https://www.python.org/downloads/)

* Supported: Windows, Mac OS

[Node.js](https://nodejs.org/en) 

*  v12.x or above

[PVisual Studio Code](https://code.visualstudio.com) or any other code editor

## Required Python Libraries
[numpy](https://pypi.org/project/numpy/)
```bash
pip install numpy
```
or
```bash
py -m pip install numpy
```
[hidapi](https://pypi.org/project/hidapi/)
```bash
pip install hidapi
```
or
```bash
py -m pip install hidapi
```

[gevent](https://pypi.org/project/gevent/)
```bash
pip install gevent 
```
or
```bash
py -m pip install gevent 
```

[pycrypto (MacOS)](https://pypi.org/project/pycrypto/)
```bash
pip install pycrypto 
```
or
```bash
py -m pip install pycrypto 
```
We provide a pycrypto library for Python 3.6 and above. Please replace the installed package from our source.

[pycryptodome (Win)](https://pypi.org/project/pycrypto/)
```bash
pip install pycryptodome 
```
or
```bash
py -m pip install pycryptodome 
```
## How do I replace pycrypto library?
* Locate your installed Python Libraries, run    
```bash
python -m site 
```
* Go to the folder, for example "lib/python3.8/site-packages", and find the file "Crypto" and replace it by the file in py_modules.

## How do I get my Emotiv's Serial Number from the USB dongle?
* Download the repository, run
```bash
git clone https://github.com/signal11/hidapi.git
```
* Plug in your Emotiv's USB dongle.
* Get into the folder hidapi-master from your terminal, and continue to go to the directory that corresponds to your operating system. For example:
```bash
cd mac
```
* Run
```bash
make -f Makefile-manual
```

You will get a file named "hid.o"

* And run
```bash
hidtest
```

You will get your Serial Number from your terminal.

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/Serial_N.png" width="450"/>

## Setup

### 1. Download and install the required tools on your computer

### 2. How do I clone the repository?


Via SSH:
```bash
git clone --branch 347cec6  git@github.com:iborg-ai/bridge.git
```

or

Via HTTPS:
```bash
git clone --branch 347cec6 https://github.com/iborg-ai/bridge.git
```

### 3. Install the node modules

From the root of the repository, run

```bash
npm install
```

### 4. Enter your Serial Number in index.js

Open index.js from "/crs", find the "serial_number", and enter your Serial Number from here.

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/serial_number.png" width="450"/>

## Connect your EEG headset

Connect your EPOC+ headset via USB dongle, and trun it on.

## Confirm your contact quality is perfect with EmotivePRO

Open the EmotivePRO application and click Connect headset, then, click Next. You will see an electrode location map. Please adjust the metal electrode until it turns green.

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/Contact_Quality.png" width="450"/>

## Run the application

From the root of the repository, run
```bash
npm start
```
You will see a data flow from your terminal.

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/Rawdata.png" width="550"/>

## References
* [Brainwaves](https://github.com/nikhiljay/brainwaves)
* [Openyou/emokit](https://github.com/openyou/emokit)
* [Hidapi](https://github.com/signal11/hidapi)
