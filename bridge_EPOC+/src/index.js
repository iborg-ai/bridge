const server = require("http").createServer();
const WebSocket = require('ws'); 
const Cortex = require('./cortex');
const uuid = require('uuid').v4; 
var cors = require('cors'); 
let connectionMode = 0; //0 or 1
let coreClientId = uuid();
let userID = 001
let URLiborg="wss://iborg.ai/eeg/eegEpocPlus/"+userID.toString()

let io;
if (connectionMode == 0){
  io = require("socket.io")(server, {
    serveClient: true,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    cors: {origin: ["http://127.0.0.1:8080", URLiborg]}
      });
  
}else{
  io = require("socket.io")(server, { 
    serveClient: true,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    transports: ['websocket', 'polling', 'flashsocket'],
    origins: ['http://127.0.0.1:8080', URLiborg,"https://iborg.ai"] 
  });
}

const net = require("net");  
server.listen(process.env.PORT || '8080'); 
console.log(process.platform)

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

setInterval(() => {
  if(!coreConnected){
    console.log('Reconnecting to core ...');
    connectToCore();
  }
}, 2000);

function epocSignal(){
  const { spawn } = require('child_process');
  const serial_number=" "
  const py = spawn('py', ['src/emotive_epoc+.py']);
  py.stdin.write(serial_number)
  py.stdin.end()
  var samplingFQ=256 
  var timeCalculator = 0

  py.stdout.on('data',(data) =>{
    data = data.toString('utf8')
    if (data == 'processing...'){
      console.log(data)
    }
    else if (data[0] == '['){
      if(timeCalculator + 1000/samplingFQ < new Date().getTime()){
        let rawdata= data.substring(1, data.length-3).split(",").map(Number); //data: string -> list
        console.log(rawdata)
        
        let TimeStamp=new Date().getTime() 
        timeCalculator= TimeStamp
        try {
          io.emit("data", { 
            rawEeg: rawdata,
            timestamp: [TimeStamp],
            userNmb: [coreClientId],
            model: "epoc+"
          });
          // send a message to the core server
          socketCore.send(JSON.stringify({ 
            rawEeg: rawdata,
            timestamp: [TimeStamp],
            userNmb: [coreClientId],
            model: "epoc+"
          }));
        } catch (error) {
          console.log('Egg data error'); 
          console.log(error);
        }
      }
      
    }else{
      console.log(data)
    }
  })

  py.stderr.on('data',(data) =>{
    console.log('error0:'+data)
    py.stdout.end()
  })
}
epocSignal();


