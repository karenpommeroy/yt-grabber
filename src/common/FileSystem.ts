import fs from "fs-extra";
import {replace} from "lodash-es";
import path from "path";

import {isDev} from "./Helpers";

export const getBinPath = () => replace(!isDev() ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
export const getResourcesPath = () => replace(!isDev() ? path.join(process.resourcesPath) : path.join(__dirname, "resources"), /\\/g, "/");
export const getProfilePath = () => replace(!isDev() ? path.join(process.resourcesPath, "profile") : path.resolve("./public", "profile"), /\\/g, "/");

export const removeIncompleteFiles = (tokens: {dir: string, name: string, ext: string;}, hasParts?: boolean) => {
    const {dir, name, ext} = tokens;
    const files = fs.existsSync(dir) ? fs.readdirSync(dir, {recursive: false, withFileTypes: true}) : [];
    const regex = new RegExp(`^${name.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&")}\\s\\d{3}\\.(${ext.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&")}|webp|webm){1}(\\b.part\\b){0,1}$`);
    const regexNoPartsMerge = new RegExp(`^${name.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&")}\\.(${ext.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&")}|webp|webm){1}(\\b.part\\b){0,1}$`);
    const usedRegex = hasParts ? regex : regexNoPartsMerge;
    
    for (const file of files) {
        if (file.isFile() && (`${name}.${ext}` === file.name || usedRegex.test(file.name))) {
            fs.removeSync(path.join(file.parentPath, file.name));
        }
    }
};
