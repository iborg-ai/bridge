const NeuroSky = require("./vendors/neurosky/index");
console.log("Bridge is running ...");
const timer = setInterval(() => {
	if (!NeuroSky.GetConnectedStatus()) {
		try {
			NeuroSky.Connect();
		} catch (error) {
			console.error(error);
		}
	}
}, 5000);