import _replace from "lodash/replace";
import path from "path";

import {isDev} from "./Helpers";

export const getBinPath = () => _replace(!isDev() ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
