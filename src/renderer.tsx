import Store from "electron-store";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import {Bootstrap} from "./bootstrap";
import schema from "./common/Store";

global.store = new Store({ schema, clearInvalidConfig: true });

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container!);

root.render(React.createElement(Bootstrap));
