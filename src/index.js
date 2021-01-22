const server = require("http").createServer();
const WebSocket = require('ws');
const Cortex = require('./cortex');
const io = require("socket.io")(server, {
  serveClient: true,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});
const net = require("net");
server.listen(8080);

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
          if(Array.isArray(json.rawEeg)){
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

let socketUrl = 'wss://localhost:6868'
let user = {
    license: "f765db7b-3656-49a3-bca9-d9399859e88c",
    clientId: "aL8VXfiPcV16rGNb9mYwe5EH7ELQSlWaSZhiKZaj",
    clientSecret: "ZlMtktZyNjKalQku6CbGPg5ZCBMeF9EV5xX9OczTIfn5mkIJoXxFshQHbVdZDjSSkNfxJbsUOBGga0xpwQ0JOk6JzdsK9u2WblIDqxUZA6YBhe4lNrHK2nhqV3i0rNOg",
    debit: 1
};

let c = new Cortex(user, socketUrl)
let streams = ['eeg']
c.sub(streams);

setInterval(() => {
  let eeg = c.getEeg();
  if(eeg && eeg.length > 0){
    io.emit("data", {rawEeg: eeg.filter(e => typeof e === 'number')});
  } else {
    if(test) {
      eeg = Array.from(new Array(6)).map(e => Math.random());
      io.emit("data", {rawEeg: eeg.filter(e => typeof e === 'number')});
    }
  }
}, 10);

