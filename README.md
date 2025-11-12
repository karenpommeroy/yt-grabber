<img src="public/banner.png" alt="YT Grabber Banner" width="800">

---

**YT Grabber** is a robust desktop application designed to retrieve multimedia from YouTube and YouTube Music services.

It provides responsive UI to manage your downloads and automation features improve and accelerate download process.

It provides support for downloading:

-   videos
-   audio tracks
-   playlists
-   music albums
-   full discographies

Various formats and quality options are available for both - audio and video.

Each download can be customized to your needs for easy workflow automation.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Screenshots](#screenshots)
- [Usage](#usage)
- [Development](#development)
- [Running](#running)
- [Packaging](#packaging)
- [Testing](#testing)
- [Debugging](#debugging)
- [License](#license)
- [Legal Disclaimer](#legal-disclaimer)
- [Support Disclaimer](#support-disclaimer)


## Features

* Download video, audio, playlists, songs, albums and complete artist discographies

* Multiple output formats (mp3, m4a, flac, wav, mp4, mkv, mov, avi, mpeg, gif)

* Customizable audio and video quality

* Trimming video and audio (multiple parts)

* Batch multimedia download

* Autodetecting download type

* Metadata (tags) embedding

* Filterable artist discography downloads by release type (album, single, ep) or release year

* Generating animated GIF's from videos (with embedding customizable top and/or bottom text)

* Configurable output

* Multiple language support (English, German, Polish out of the box)

* Light/Dark theme

* Responsive and clean UI


## Screenshots

<img src="public/screenshots/main.png" alt="Main" width="600">

*Main window*

<img src="public/screenshots/main-info.png" alt="Main: Loading Info" width="600">

*Displaying multimedia info*

<img src="public/screenshots/main-downloading.png" alt="Main: Downloading Files" width="600">

*Downloading multimedia*

<img src="public/screenshots/settings.png" alt="Settings" width="600">

*Settings*

## Usage

Download and run latest release installer from [here](https://github.com/karenpommeroy/yt-grabber/releases).

## Development

To build **yt-grabber** follow these steps:

1. Clone this repository
2. Install dependencies using `npm install` or `yarn install` command
3. If using `yarn` with Visual Studio Code also run `yarn dlx @yarnpkg/sdks vscode`
4. Run `npm build` or `yarn build` command to build

## Running

Run `npm start` or `yarn start` to run the app for development.
This will start webpack development server that will watch for changes to source code and reload the application automatically.

## Packaging

To prepare release application package run `npm dist` or `yarn dist` command.

## Testing

There are two types of tests avalable:
- *unit tests* (using Jest)
- *end2end tests* (using Playwright)

To execute unit tests run `npm test` or `yarn test` command (unit tests are also run when packaging the applciation).

To execute end2end tests run `npm playwright test` or `yarn playwright test` command.

## Debugging

Logs are written to `init.log` and `application.log` files.
By default only errors are logged.
To get more detailed logs run the application with `--debug-mode` arguments.

## License

This project is licensed under the [MIT License](LICENSE).

## Legal Disclaimer

All music files downloaded through this software must be legally owned and purchased by the user. By downloading music via this software, you represent that you have purchased and fully own the rights to any downloaded content or an active subscription to YouTube Music. Downloading or distributing pirated or illegal music copies is strictly prohibited. I claim no ownership rights to any downloaded music files - all such rights remain with the content owner. I accept no liability for the illegal use of any files downloaded through this software.

## Support Disclaimer

In the era of greedy services like Spotify, omnipresent AI slop and other bs it is very difficult, especially for younger, less recognizable creators to make money off of their creations. There are a lot of talented people who struggle with that (and their number is growing).
If you like certain artists and value their content please show them your support.
Thank You!