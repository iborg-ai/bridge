const server = require("http").createServer();
const WebSocket = require('ws'); 
const Cortex = require('./cortex');
const uuid = require('uuid').v4; 
var cors = require('cors'); 
let coreClientId = uuid();

let userID = 001
let URLiborg="wss://iborg.ai/eeg/"+userID.toString()
const io = require("socket.io")(server, {
  serveClient: true,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  cors: {origin: ["http://127.0.0.1:8080", URLiborg]} 
 });

const net = require("net"); 
server.listen(process.env.PORT || '8080'); 


let socketCore;
let coreConnected = false;
const connectToCore = () => {
  console.log('place1')
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
let json={ rawEeg: 0};
let test = false;

const connect = () => { 
  console.log('place2')
  if (!isSocketConnected) {
    const socket = net.createConnection({ port: 13854 }, () => {
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
          {console.log('Error authReceived')}; //new add 5
        }, 5000);
      }catch(error){
        console.log('Brainwave authorization error')
        console.log(error);
      };
    });
    socket.on("data", (data) => { 
      try {
        const json = JSON.parse(data);  
        console.log(json);
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
            // send a message to the core server
            socketCore.send(JSON.stringify({ 
              rawEeg: [json.rawEeg],
              timestamp: [TimeStamp],
              userNmb: [coreClientId]
            }));
          }
        }
        

      } catch (error) {
        console.log('Egg data error'); 
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


let c;
const connectToCortex = () => { 
  try {
    let socketUrl = 'wss://localhost:6868'
    let user ={
     "id": 1,
     "jsonrpc": "2.0",
     "method": "requestAccess",
     "params": {
         "clientId": "1q6JONje1NsG8htytSbH0F13XcAepKzvyLcUJvVS", 
         "clientSecret": "VhVKFzAFMPrhDyRkMKRH2bsb4cQkwGWsQOkqqzRarIlNcGraHfVSJcQTaCHqMy1sRM9FcJY8kU6hlM3lmSOmWPVEoWFTkYBwxrKPyNugEXMifLIUIeZiNo8t9sHp8LNw"
     }
  }
    c = new Cortex(user, socketUrl);
    let streams = ['eeg'];
    c.sub(streams);
  } catch (error) {
    console.log('ConnectToCortex error');
    console.error(error);
    setTimeout(() => {
      connectToCortex();
    }, 5000);
  }
}
// connectToCortex();

setInterval(() => { 
  let eeg = c ? c.getEeg() : null;
  if (eeg && eeg.length > 0) {
    io.emit("data", { rawEeg: eeg.filter(e => typeof e === 'number') });
    try {
      if(coreConnected){
        socketCore.send(JSON.stringify({ rawEeg: eeg.filter(e => typeof e === 'number'), timestamp: new Date().getTime() }));
      }
    } catch (error) {
      console.log("sent signal to core error")
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
        console.log("coreConnected error")
        console.error(error);
      }
    }
  }
}, 50);

