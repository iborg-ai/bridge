const server = require("http").createServer();
const WebSocket = require('ws');
const Cortex = require('./cortex');
const uuid = require('uuid').v4;
const io = require("socket.io")(server, {
  serveClient: true,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});
const net = require("net");
server.listen(process.env.PORT || '8080');

let isSocketConnected = false;
let authReceived = false;

let test = true;

const connect = () => {
  if (!isSocketConnected) {
    const socket = net.createConnection({ port: 13854 }, () => {
      console.log("Connected to ThinkGear Connector");
      isSocketConnected = true;
      socket.setDefaultEncoding("utf8");
      socket.setEncoding("utf8");
      let timer = setInterval(() => {
        if (!authReceived && socket.writable) {
          console.log("Making authorization request");
          socket.write(
            JSON.stringify({
              appName: "Brainwave Shooters",
              appKey: "9f54141b4b4c567c558d3a76cb8d715cbde03096",
              enableRawOutput: true,
              format: "Json",
            })
          );
        }
      }, 5000);
    });
    socket.on("data", (data) => {
      try {
        const json = JSON.parse(data);
        console.log(json);
        if (json.rawEeg) {
          if (Array.isArray(json.rawEeg)) {
            io.emit("data", {
              rawEeg: json.rawEeg
            });
          } else {
            io.emit("data", {
              rawEeg: [json.rawEeg]
            });
          }
        }
      } catch (error) {
        console.log(data);
      }
    });
    socket.on("end", () => {
      console.log("Disconnected from ThinkGear Connector");
      isSocketConnected = false;
      setTimeout(() => {
        connect();
      }, 5000);
    });
    socket.on("error", (error) => {
      setTimeout(() => {
        connect();
      }, 5000);
    });
  }
};
connect();

let socketCore;
let coreConnected = false;
let coreClientId = uuid();
const connectToCore = () => {
  try {
    socketCore = new WebSocket('ws://127.0.0.1:3000?type=bridge&token=' + coreClientId);
    socketCore.on('open', () => {
      coreConnected = true;
      console.log('Connected to Core');
    });
    socketCore.on('close', () => {
      coreConnected = false;
    });
    socketCore.on('error', () => {
      coreConnected = false;
    });
  } catch (error) {
    console.error(error);
  }
}
connectToCore();

let c;
const connectToCortex = () => {
  try {
    let socketUrl = 'wss://localhost:6868'
    let user = {
      license: "f765db7b-3656-49a3-bca9-d9399859e88c",
      clientId: "aL8VXfiPcV16rGNb9mYwe5EH7ELQSlWaSZhiKZaj",
      clientSecret: "ZlMtktZyNjKalQku6CbGPg5ZCBMeF9EV5xX9OczTIfn5mkIJoXxFshQHbVdZDjSSkNfxJbsUOBGga0xpwQ0JOk6JzdsK9u2WblIDqxUZA6YBhe4lNrHK2nhqV3i0rNOg",
      debit: 1
    };
    c = new Cortex(user, socketUrl)
    let streams = ['eeg']
    c.sub(streams);
  } catch (error) {
    console.error(error);
    setTimeout(() => {
      connectToCortex();
    }, 5000);
  }
}

setInterval(() => {
  let eeg = c ? c.getEeg() : null;
  if (eeg && eeg.length > 0) {
    io.emit("data", { rawEeg: eeg.filter(e => typeof e === 'number') });
    try {
      if(coreConnected){
        socketCore.send(JSON.stringify({ rawEeg: eeg.filter(e => typeof e === 'number'), timestamp: new Date().getTime() }));
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    if (test) {
      eeg = [
        Math.floor(Math.random() * (20 - 10 + 1)) + 10,
        Math.floor(Math.random() * (125 - 100 + 1)) + 100,
        Math.floor(Math.random() * (550 - 500 + 1)) + 500,
        Math.floor(Math.random() * (1150 - 1000 + 1)) + 1000,
        Math.floor(Math.random() * (2050 - 2000 + 1)) + 2000,
        Math.floor(Math.random() * (4100 - 4000 + 1)) + 4000
      ]
      io.emit("data", { rawEeg: eeg.filter(e => typeof e === 'number') });
      try {
        if(coreConnected){
          socketCore.send(JSON.stringify({ rawEeg: eeg.filter(e => typeof e === 'number'), timestamp: new Date().getTime() }));
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}, 50);