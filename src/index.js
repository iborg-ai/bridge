const server = require("http").createServer();
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
          io.emit("data", json);
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
      console.error(error);
      setTimeout(() => {
        connect();
      }, 5000);
    });
  }
};

connect();
