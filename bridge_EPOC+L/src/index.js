const server = require("http").createServer();
const WebSocket = require('ws'); 
const Cortex = require('./cortex');
const uuid = require('uuid').v4; 
var cors = require('cors'); 
let connectionMode = 0; //0 or 1
let coreClientId = uuid();
let userID = 001;
let URLiborg="wss://iborg.ai/eegEpocPlus/"+userID.toString()

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
const { truncate } = require("fs");
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
    let user = {
      license: " ",
      clientId: " ",
      clientSecret: " ",
      debit: 1
    };
   
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
connectToCortex(); 
let i =0
let shift = new Array(16).fill(0);
setInterval(() => { 
  let eeg = c ? c.getEeg() : null;
  try {
    if (eeg && eeg.length > 0 && coreConnected) {
      if(i<50){
        rawdata= eeg.filter(e => typeof e === 'number');
        rawdata= rawdata.slice(2,18);
        i+=1
        shift= shift.map((v,i)=> v+rawdata[i]);
        console.log('waiting ...');
      }else if (i ==50){ 
        shift = shift.map((v,i)=> Math.floor(v/50)) ;
        console.log(shift);
        i+=1
      }else{
        rawdata= eeg.filter(e => typeof e === 'number');
        rawdata= rawdata.slice(2,18) ;
        rawdata= rawdata.map((v,i)=> Math.floor(v- shift[i]));
        console.log(rawdata)
        let TimeStamp=new Date().getTime() 
        timeCalculator= TimeStamp;
        io.emit("data", {
          rawEeg: rawdata,
          timestamp: [TimeStamp],
          userNmb: [coreClientId],
          model: "epoc+"
        });

        socketCore.send(JSON.stringify({
          rawEeg: rawdata,
          timestamp: [TimeStamp],
          userNmb: [coreClientId],
          model: "epoc+"
        }));
      }

    
    }

  } catch (error) {
    console.log("sent signal to core error")
    console.error(error);
  }
}, 8);


