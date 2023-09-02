# Bridge

## Description
Bridge is a connector for extracting the raw stream data from your headset and transmitting it to the website Iborg.ai. Data processing and visualization will all be preceded by the web server.

## Headset Support
**_Bridge_MindWave_**  will support NeuroSky MindWave Mobile 2 EEG Sensor Starter Kit

**_Bridge_EPOC+L_**  will support Epoc+ headset with a SDK license

**_Bridge_EPOC+_** will support Epoc+ headset (2019)


## Frequently asked questions

### 1. How do I reduce the samplying frequency of my EEG signals?

 Epoc+ transmits wireless data at 128 or 256 Hz. You might change the value of "samplingFQ" in index.js to reduce the sampling rate.

 ### 2. The bridge is not able to connect with the IBORG website and blocked by CORS policy?

 It is because some systems don't support 'cros' dependency. Please set connectionMode to 1 in index.js.

 <img src="https://github.com/iborg-ai/bridge/blob/347cec6/bridge_EPOC%2B/IMG/connectionMode.png" width="350"/>

 

