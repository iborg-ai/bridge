# iborg-connector

## Description
Bridge is a connector for extracting the raw stream data from ThinkGearConnector and transmitting it to the website Iborg.ai. Data processing and visualization will all be preceded by the web server.

## Headset Support
<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_MindWave/IMG/MindWave_Mobile_2.png" width="200"/>
NeuroSky MindWave Mobile 2 EEG Sensor Starter Kit is supported by our project.

## Download

[GitHub](https://github.com/iborg-ai/bridge)

 *  MacOS Supported: Sierra, High Sierra, Mojave, higher may also avaliable
 
 *  Windows Supported: Win10, Win11
 
[ThinkGearConnector](https://developer.neurosky.com/docs/doku.php?id=thinkgear_connector_tgc)

*  Supported: Windows, Mac OS

*  You might have to digitally purchase the NeuroSky SDK from their store for 0 $.

[Node.js](https://nodejs.org/en) 

*  v12.x or above

## Setup

### 1. Download and install the required tools on your computer

### 2. How do I clone the repository?


Via SSH:
```bash
git clone git@github.com:iborg-ai/bridge.git
```

or

Via HTTPS:
```bash
git clone https://github.com/iborg-ai/bridge.git
```

### 3. Install the node modules

From the root of the repository, run

```bash
npm install
```

## Connect your EEG headset

Connect your EEG headset via bluetooth. The setup process is pretty straight forward similar to any bluetooth device that you want to pair. The NeuroSky EEG headset will be visible as 'MindWave Mobile'.

## Run the application

From the root of the repository, run
```bash
npm start
```
