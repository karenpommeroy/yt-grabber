import Store from "electron-store";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import {Bootstrap} from "./bootstrap";
import {getProcessArgs} from "./common/Helpers";
import {createLogger} from "./common/Logger";
import schema from "./common/Store";

const args = getProcessArgs();

global.logger = createLogger({
    level: args["debug"] ? "debug" : "error",
    logFile: true,
    logFilePath: "application.log",
});
global.store = new Store({ schema, clearInvalidConfig: true });
logger.debug("Electron store initialized.");

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container!);

root.render(React.createElement(Bootstrap));
logger.debug("Application rendered.");
