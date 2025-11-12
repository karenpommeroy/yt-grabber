import {assign, get} from "lodash-es";

import {Theme} from "@mui/material";
import {grey} from "@mui/material/colors";

const themes: Record<string, Partial<Theme | any>> = {
    basic: {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "light",
                background: {
                    default: "#dadada",
                    paper: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
                contrastThreshold: 4.5,
            },
            dark: {
                type: "light",
                background: {
                    default: "#dadada",
                    paper: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
        },
    },
    "basic-dark": {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "dark",
                default: {
                    main: grey[400],
                    light: grey[300],
                    dark: grey[700],
                },
            },
            dark: {
                type: "dark",
                default: {
                    main: grey[400],
                    light: grey[300],
                    dark: grey[700],
                },
            },
        },
    },
    "sandy-beach": {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "light",
                background: {
                    default: "#e1e1e6",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#ffd966",
                    main: "#ffc107",
                    dark: "#ffa520",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#626578",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
            dark: {
                type: "dark",
                background: {
                    default: "#3b3b3f",
                    paper: "#3b3b3f",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#ffd966",
                    main: "#ffc107",
                    dark: "#ffa520",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#626578",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
        },
        shape: {
            borderRadius: 4,
        },
    },
    "mellow-pastel": {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "light",
                background: {
                    default: "#e1e1e6",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#aed581",
                    main: "#8bc34a",
                    dark: "#74a838",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#626578",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
            dark: {
                type: "dark",
                background: {
                    default: "#3b3b3f",
                    paper: "#3b3b3f",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#aed581",
                    main: "#8bc34a",
                    dark: "#74a838",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#626578",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
        },
        shape: {
            borderRadius: 4,
        },
    },
    "purple-rain": {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "light",
                background: {
                    default: "#e1e1e6",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#ff8fa3",
                    main: "#ff6d89",
                    dark: "#d81b60",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#626578",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
                contrastThreshold: 2.26,
            },
            dark: {
                type: "dark",
                background: {
                    default: "#3b3b3f",
                    paper: "#3b3b3f",
                },
                primary: {
                    light: "#a6acd4",
                    main: "#7f85a7",
                    dark: "#4c527d",
                },
                secondary: {
                    light: "#ff8fa3",
                    main: "#ff6d89",
                    dark: "#d81b60",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#e6eaf5",
                    secondary: "#e0dede",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
                contrastThreshold: 2.26,
            },
        },
        shape: {
            borderRadius: 4,
        },
    },
    "cloudy-sky": {
        typography: {
            fontFamily: "Lato",
        },
        palette: {
            light: {
                type: "light",
                background: {
                    default: "#e1e7ea",
                },
                primary: {
                    light: "#71a9da",
                    main: "#3380c3",
                    dark: "#255d8e",
                },
                secondary: {
                    light: "#a5b7c0",
                    main: "#698796",
                    dark: "#4f6772",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#5c7486",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
            dark: {
                type: "dark",
                background: {
                    default: "#e1e7ea",
                },
                primary: {
                    light: "#71a9da",
                    main: "#3380c3",
                    dark: "#255d8e",
                },
                secondary: {
                    light: "#a5b7c0",
                    main: "#698796",
                    dark: "#4f6772",
                    contrastText: "#ffffff",
                },
                text: {
                    primary: "#5c7486",
                    secondary: "#9e9e9e",
                    icon: "#ffffff",
                },
                default: {
                    main: grey[800],
                    light: grey[500],
                    dark: grey[900],
                },
            },
        },
        shape: {
            borderRadius: 4,
        },
    },
};

export const getThemeDefinition = (name: string, mode: "light" | "dark") => {
    const theme = themes[name];

    return assign({}, theme, { palette: get(theme, `palette.${mode}`) });
};
