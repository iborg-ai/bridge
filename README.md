# iborg-connector

## 1. Setup

### 1.1 Download the necessary tools

Basic toolset includes
- Visual Studio Code or any other code editor
- Git (version 2+)
- Node.js v12.x or above
- NeuroSky ThinkGear Connector (separate packages for [macOS](http://store.neurosky.com/products/mac-developer-tools-4-0) and [Windows](http://store.neurosky.com/products/pc-developer-tools-4-0) are available)

### 1.2 Install the above tools

You will have to digitally purchase the NeuroSky SDK from their store for 0 $.

### 1.3 Clone the repositiory
To clone the repository,

Via SSH:
```bash
git clone git@github.com:iborg-ai/bridge.git
```

or

Via HTTPS:
```bash
git clone https://github.com/iborg-ai/bridge.git
```

### 1.4 Install the node modules

From the root of the repository, run

```bash
npm install
```

## 2. Connect your EEG headset

Connect your EEG headset via bluetooth. The setup process is pretty straight forward similar to any bluetooth device that you want to pair. The NeuroSky EEG headset will be visible as 'MindWave Mobile'.

## 3. Run the application

From the root of the repository, run
```bash
node src/index.js
```
