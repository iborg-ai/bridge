const SerialPort = require('serialport');
const server = require('http').createServer();
const devices = [];
const isTest = false;

const io = require('socket.io')(server, {
	serveClient: true,
	pingInterval: 10000,
	pingTimeout: 5000,
	cookie: false
});

server.listen(8080);

if (isTest) {
	console.log('Running in test mode ...');
	setInterval(() => {
		const data = {
			rawEeg: [
				Math.random()
			]
		};
		console.log(data);
		io.emit('data', data);
	}, 10);
} else {
	SerialPort.list().then((ports) => {
		ports.forEach((port) => {
			const { path } = port;
			if (path.includes('MindWaveMobile-Serial')) {
				devices.push({
					manufacturer: 'MindWaveMobile',
					path
				});
			}
		});

		if (devices.length > 0) {
			console.log(JSON.stringify(devices, null, 2));
			devices.forEach((device) => {
				const port = new SerialPort(device.path, { autoOpen: false, baudRate: 9600 });
				console.log('Opening port: ', device.path);
				port.on('open', () => {
					if (port.writable) {
						port.write(JSON.stringify({ "appName": "Brainwave Shooters", "appKey": "9f54141b4b4c567c558d3a76cb8d715cbde0306", "enableRawOutput": true, "format": "Json" }));
					}
					console.log('Opened Port: ', device.path);
				});
				port.on('data', (data) => {
					console.log('Incoming data on: ', device.path);
					console.log(data.toJSON());
					io.emit('data', {
						rawEeg: [Math.random()]
					});
				});
				port.on('error', (error) => {
					console.error('Error occured on: ', device.path);
					console.error(error);
				});
				port.open((error) => {
					if (error) {
						console.error(error);
					}
				});
			});
		} else {
			console.log('No supported headset is connected');
		}
	});
}