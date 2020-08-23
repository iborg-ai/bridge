const NeuroSky = require("./vendors/neurosky/index");
console.log("[STARTED] Bridge ...");
const timer = setInterval(() => {
	if (!NeuroSky.GetConnectedStatus()) {
		try {
			NeuroSky.Destroy();
		} catch (error) {

		}
		try {
			NeuroSky.Connect();
		} catch (error) {
			console.error(error);
		}
	}
}, 5000);