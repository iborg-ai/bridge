# iborg-connector

## Description
Bridge is a connector for extracting the raw stream data from your EPOC+ headset and transmitting it to the website Iborg.ai. Data processing and visualization will all be preceded by the web server.

## Headset Support

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/EPOC%2B.png" width="400"/>
Epoc+(2019)

## Download

[GitHub]([https://github.com/iborg-ai/bridge](https://github.com/iborg-ai/bridge/tree/347cec6))

 *  MacOS Supported: Sierra, High Sierra, Mojave, higher may also avaliable
 
 *  Windows Supported: Win10, Win11

[Node.js](https://nodejs.org/en) 

*  v12.x or above

[PVisual Studio Code](https://code.visualstudio.com) or any other code editor

## Setup

### 1. Download and install the required tools on your computer

### 2. How do I clone the repository?


Via SSH:
```bash
git clone --branch 347cec6 git@github.com:iborg-ai/bridge.git
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

### 4. Enter your client information in index.js

Open index.js from "/crs", find the "user", and enter your license, clientId, and clientSecret from here.

<img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/license_clientId.png" width="450"/>

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
* [Cotex API](https://emotiv.gitbook.io/cortex-api/data-subscription/subscribe)


## Problem & Solution
"code":-32027,"message":"The application do not have permission to use the license."
or "code":-32024,"message":"The license has expired."
contact EMOTIVE support from https://github.com/Emotiv/cortex-v2-example/issues/145
('You must accept access request from this app on CortexUI')

You can open Emotive Lancher, click Login, select accepte, and run the application again.
