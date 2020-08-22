const net = require('net');
const crypto = require('crypto');

// Neurosky Client
const client = new net.Socket(),
    clientID = '123',
    appName = `iBorg Client ${clientID}`,
    appKey = crypto.createHash('sha1').update(appName).digest('hex').toString(),
    enableRawOutput = true,
    format = 'Json';

let configSent = false;
let clientConnected = false;

// Connect to Neurosky Headset
const Connect = () => {
    try {
        client.connect(13854, '127.0.0.1', () => {
            console.log('Connected [OK]');
            clientConnected = true;
            if (client.writable) {
                client.write(JSON.stringify({ appName, appKey, enableRawOutput, format }));
                configSent = true;
                console.log('Configuration data sent [OK]');
            }
        });
    } catch (error) {
        console.error(error);
    }
};

const GetConnectedStatus = () => {
    return clientConnected;
};


client.on('data', (data) => {
    if (configSent) {
        try {
            let json = JSON.parse(data.toString());
            if (json.hasOwnProperty('rawEeg') || json.hasOwnProperty('rawEegMulti')) {
                let packet = {
                    clientID: clientID,
                    timestamp: new Date().getTime(),
                    values: Object.values(json.rawEegMulti) || [json.rawEeg]
                };
                // Do something with the data packet
            } else {
            }
        } catch (error) {
            console.error(error);
        }
    }
});

client.on('close', () => {
    clientConnected = false;
});

client.on('error', () => {
    clientConnected = false;
});

module.exports = {
    Connect,
    GetConnectedStatus
};