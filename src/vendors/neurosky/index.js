const net = require('net');
const crypto = require('crypto');
const { v4: uuidV4 } = require('uuid');

// Neurosky Client
const client = new net.Socket(),
    clientID = uuidV4(),
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
            console.log('[OK] Connected');
            clientConnected = true;
            if (client.writable) {
                client.write(JSON.stringify({ appName, appKey, enableRawOutput, format }));
                configSent = true;
                console.log('[OK] Configuration data sent');
            }
        });
    } catch (error) {
        client.destroy();
        console.error(error);
    }
};

const Destroy = () => {
    client.destroy();
};

const GetConnectedStatus = () => {
    return clientConnected;
};


client.on('data', (data) => {
    if (configSent && data) {
        try {
            let json = JSON.parse(data.toString());
            if (json.hasOwnProperty('rawEeg') || json.hasOwnProperty('rawEegMulti')) {
                let packet = {
                    clientID: clientID,
                    timestamp: new Date().getTime(),
                    values: Object.values(json.rawEegMulti) || [json.rawEeg]
                };
                // Do something with the data packet
                console.log(JSON.stringify(packet, null, 2));
            } else {
            }
        } catch (error) {
            console.error(error);
        }
    }
});

client.on('close', () => {
    client.destroy();
    clientConnected = false;
});

client.on('error', () => {
    client.destroy();
    clientConnected = false;
});

module.exports = {
    Connect,
    GetConnectedStatus,
    Destroy
};