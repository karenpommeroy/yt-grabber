import fs from "fs-extra";
import http from "http";
import https from "https";
import $_ from "lodash";
import {mkdirp} from "mkdirp";
import path from "path";

const getDirName = path.dirname;

export const readFileAsync = (filename: string, encoding: BufferEncoding = "utf-8") => {
    return new Promise<string>((resolve, reject) => {
        try {
            fs.readFile(filename, { encoding }, (error: any, buffer: any) => {
                if (error) resolve("");
                else resolve(buffer);
            });
        } catch (error) {
            reject(error);
        }
    });
};

export const readFileSync = (filename: string, encoding: BufferEncoding = "utf-8") => {
    return fs.readFileSync(filename, { encoding });
};

export const writeFileAsync = (data: any, filename: string, encoding?: BufferEncoding, mode: any = 0o775) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mkdirResult = await mkdirp(getDirName(filename), { mode: 0o775 });

            fs.writeFile(filename, data, { encoding, mode }, (error: any, result?: any) => {
                if (error) reject(error.message);
                else resolve(result);
            });
        } catch (error) {
            reject(error);
        }
    });
};

export const writeStreamAsync = (url: string, filename: string, encoding?: BufferEncoding) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mkdirResult = await mkdirp(getDirName(filename), { mode: 0o775 });

            const file = fs.createWriteStream(filename as any, { encoding });
            file.on("error", (error: any) => {
                reject(error.message);
            });
            const action = $_.startsWith(url, "https") ? https : http;

            return action.get(url, (response) => {
                response.on("error", (error) => {
                    fs.unlinkSync(filename);
                    reject(error);
                });

                response.pipe(file);
                file.on("finish", () => {
                    resolve(file);
                });
            });
        } catch (error) {
            reject(error);
        }
    });
};

export const copy = async (src: string, dest: string) => {
    const ensurePath = await fs.mkdirp(path.dirname(dest));

    return fs.copyFile(src, dest);
};

export const findFiles = async (
    pathname: string,
    options?: { filter: string[] },
): Promise<Array<{ id: string; name: string; path: string }>> => {
    const fileList: Array<{ id: string; name: string; path: string }> = [];

    if (!fs.existsSync(pathname)) {
        throw new Error("Directory does not exists!");
    }
    const filter = $_.get(options, "filter");
    const files = await fs.readdir(pathname);

    for (const file of files) {
        const filename = path.join(pathname, file);
        const stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            fileList.push(...(await findFiles(filename, options)));
        } else if ($_.includes(filter, path.extname(filename))) {
            fileList.push({
                id: path.relative("public", filename),
                name: path.parse(filename).name,
                path: path.relative("public", filename),
            });
        }
    }

    return fileList;
};

export const createDirectory = (pathname: string) => {
    return mkdirp(getDirName(pathname), { mode: 0o775 });
};

export const removeDirectory = (pathname: string) => {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(pathname)) {
            resolve("Directory does not exists!");
        }
        const err = (await fs.remove(getDirName(pathname))) as any;

        if (err) return reject(err);

        resolve(pathname);
    });
};

export const remove = (filename: string) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(filename)) {
                return resolve(filename);
            }
            fs.unlink(filename, (error) => {
                if (error) reject(error);
                else resolve(filename);
            });
        } catch (error) {
            reject(error);
        }
    });
};

// export const getDirectorySize = (pathname: string) => {
//     return new Promise((resolve, reject) => {
//         try {
//             getSize(pathname, (error: any, size: number) => {
//                 if (error) return reject(error);

//                 return resolve(size);
//             });
//         } catch (error) {
//             reject(error);
//         }
//     });
// };

// export const getUserDirectorySize = (userId: string, host: string) => {
//     return getDirectorySize(`${host}/data/${userId}`);
// };

// export const downloadAndSaveImage = (sourceUrl: string, targetPath: string, encoding: string = "base64") => {
//     return writeStreamAsync(sourceUrl, targetPath, encoding);
// };

// export const downloadAndSaveFile = (sourceUrl: string, targetPath: string, encoding?: string) => {
//     return writeStreamAsync(sourceUrl, targetPath, encoding);
// };

// export const saveImage = (imageData: string, targetPath: string, encoding: string = "base64") => {
//     if ($_.startsWith(imageData, "http")) {
//         return downloadAndSaveImage(imageData, targetPath, encoding);
//     }

//     return writeFileAsync(imageData, targetPath, encoding);
// };
