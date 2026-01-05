import CopyWebpackPlugin from "copy-webpack-plugin";
import ESLintPlugin from "eslint-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import I18nextScannerWebpackPlugin from "i18next-scanner-webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import {Configuration, ProgressPlugin} from "webpack";
import {Configuration as DevServerConfiguration} from "webpack-dev-server";
import WebpackNodeExternals from "webpack-node-externals";

export const getRoot = (dirname: string = __dirname, ...args: any[]) => {
    const rootDir = path.resolve(dirname, ".");

    args = Array.prototype.slice.call(args, 0);

    return path.join(rootDir, ...args);
};

export const reportProgress = (percentage: number, message: string, ...args: any[]) => {
    const stream = process.stderr;
    const formatted = (percentage * 100).toFixed();

    if (stream.isTTY && percentage < 1) {
        stream.cursorTo(0);
        stream.write(`${formatted}%: ${message}`);
        stream.clearLine(1);
    } else if (percentage === 1) {
        stream.write("building done!");
    }
};

export const mainConfig: Configuration = {
    mode: process.env.NODE_ENV as any,
    entry: "./src/index.ts",
    target: "electron-main",
    module: {
        rules: [
            {
                test: /\.ts$/,
                include: /src/,
                use: [{loader: "ts-loader"}],
            },
        ],
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "index.js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    externals: [WebpackNodeExternals()],
};

export const renderConfig: Configuration & DevServerConfiguration = {
    mode: process.env.NODE_ENV as any,
    entry: "./src/renderer.tsx",
    target: "electron-renderer",
    devtool: process.env.NODE_ENV === "development" ? "eval" : false,
    devServer: {
        watchFiles: {
            paths: ["/src"],
            options: {
                ignored: [
                    "**/resources/locales/**/translation.json",
                    "**/resources/locales/**/translation_old.json",
                    "**/resources/locales/**/help.json",
                    "**/resources/locales/**/help_old.json",
                ]
            }
        }
    },
    watchOptions: {
        ignored: [
            "**/resources/locales/**/translation.json",
            "**/resources/locales/**/translation_old.json",
            "**/resources/locales/**/help.json",
            "**/resources/locales/**/help_old.json",
            "/dist",
        ]
    },
    context: getRoot(__dirname, ""),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
                exclude: [/\.(test|spec|)\.ts$/, /node_modules$/, /[\\/]node_modules[\\/]$/],
            },
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader",
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false,
                        },
                    },
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                localIdentName: "[name]__[local]___[hash:base64:5]",
                                mode: "global",
                                exportLocalsConvention: "camel-case-only",
                            },
                        },
                    },
                ],
            },
            {
                test: /\.styl$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false,
                        },
                    },
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                localIdentName: "[name]__[local]___[hash:base64:5]",
                                exportLocalsConvention: "camel-case-only",
                            },
                            esModule: false,
                        },
                    },
                    {
                        loader: "stylus-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /url\("([^)]+?\.(woff|eot|woff2|ttf|svg)[^"]*)"/,
                exclude: [],
                type: "asset/resource",
                dependency: {not: ["url"]},
            },
            {
                test: /[^)]+?\.(woff|eot|woff2|ttf|svg)[^"]*/,
                exclude: [],
                type: "asset/resource",
                dependency: {not: ["url"]},
            },
            {
                test: /[^)]+?\.(svg|png|jpg|gif)[^"]*/,
                exclude: [/fonts/],
                type: "asset/resource",
            },
            {
                test: /[^)]+?\.(svg|png|jpg|gif)[^"]*/,
                exclude: [/images/],
                type: "asset/resource",
            },
        ],
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "renderer.js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json", ".styl", ".css"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "YT Grabber",
            template: "public/index.html",
        }),
        new ProgressPlugin(reportProgress),
        new ESLintPlugin({
            extensions: ["js", "jsx", "ts", "tsx"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "./src/resources/",
                    to: "resources",
                    noErrorOnMissing: true,
                    force: false,
                },
            ],
        }),
        new MiniCssExtractPlugin({filename: "bundle.css"}),
        new I18nextScannerWebpackPlugin({
            extensions: [".ts", ".tsx"],
            dest: path.resolve("./"),
            src: [path.resolve("./src")],
            options: {
                locales: ["en-GB", "de-DE", "pl-PL"],
                sort: true,
                verbose: false,
                failOnWarnings: false,
                pluralSeparator: "_",
                output: path.resolve("./src/resources/locales/$LOCALE/$NAMESPACE.json"),
                indentation: 4,
                i18nextOptions: {
                    debug: false,
                    fallbackLng: false,
                    returnEmptyString: false
                }
            }
        }),
    ],
    externals: [WebpackNodeExternals()],
};

export default [mainConfig, renderConfig];
