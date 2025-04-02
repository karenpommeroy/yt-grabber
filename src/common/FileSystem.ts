import _replace from "lodash/replace";
import path from "path";

import {isDev} from "./Helpers";

export const getBinPath = () => _replace(!isDev() ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
export const getResourcesPath = () => _replace(!isDev() ? path.join(process.resourcesPath) : path.join(__dirname, "resources"), /\\/g, "/");
export const getProfilePath = () => _replace(!isDev() ? path.join(process.resourcesPath, "profile") : path.resolve("./public", "profile"), /\\/g, "/");
