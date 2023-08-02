const server = require("http").createServer();
const WebSocket = require('ws');
const uuid = require('uuid').v4;
let coreClientId = uuid();
var cors = require('cors');
let userID = 001
let URLiborg="wss://iborg.ai/eeg/"+userID.toString()
if (process.platform =="darwin"){
  const io = require("socket.io")(server, { 
    serveClient: true,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    cors: {origin: ["http://127.0.0.1:8080", URLiborg]} 
  });
}else{
  const io = require("socket.io")(server, { 
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    transports: ['websocket', 'polling', 'flashsocket'],
    origins: ['http://127.0.0.1:8080', URLiborg,"https://iborg.ai"] 
  });
}



const net = require("net"); 
server.listen(process.env.PORT || '8080');

let socketCore;
let coreConnected = false;
const connectToCore = () => {
  try {
    socketCore = new WebSocket('wss://iborg.ai:8443?type=bridge&token=' + coreClientId);
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
    console.log('core connection error')
    console.error(error);
  }
}
connectToCore();

let isSocketConnected = false;
let authReceived = false;

const connect = () => { 
  if (!isSocketConnected) {
    const socket = net.createConnection({ port: 13854 }, () => { //TCP
      console.log("Connected to ThinkGear Connector");
      isSocketConnected = true;
      socket.setDefaultEncoding("utf8");
      socket.setEncoding("utf8");
      try{
        var timer = setInterval(() => {
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
          else
          {console.log('Error authReceived')};
        }, 5000);
      }catch(error){
        console.log('Brainwave authorization error')
        console.log(error);
      };
    });
    socket.on("data", (data) => { 
      try {
        const json = JSON.parse(data); 
        if (json.rawEeg) {
          let TimeStamp=new Date().getTime() 
          if (Array.isArray(json.rawEeg)) { 
            io.emit("data", { 
              rawEeg: json.rawEeg,
              timestamp: TimeStamp,
              userNmb: coreClientId
            });
            socketCore.send(JSON.stringify({  
              rawEeg: json.rawEeg,
              timestamp: TimeStamp,
              userNmb: coreClientId
            }));
          } else {
            io.emit("data", { 
              rawEeg: [json.rawEeg],
              timestamp: [TimeStamp],
              userNmb: [coreClientId]
            });
            socketCore.send(JSON.stringify({ 
              rawEeg: [json.rawEeg],
              timestamp: [TimeStamp],
              userNmb: [coreClientId]
            }));
          }
        }

      } catch (error) {
        console.log(error);
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
      console.log('ThinkGear Connector Connection error'); 
    });
  }
};
connect();


setInterval(() => { 
  if(!coreConnected){
    console.log('Reconnecting to core ...');
    connectToCore();
  }
}, 2000);



