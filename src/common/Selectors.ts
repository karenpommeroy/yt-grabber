import $_ from "lodash";

export const Css: any = {
    ReactAppElement: "#react-app",
};

export const XPath: any = {};

export const getInput = (attribute: string, value: string) => `input[${attribute} = "${value}"]`;

export const getInputByName = (name: string) => `input[name="${name}"]`;

export const getInputByType = (type: string) => `input[type="${name}"]`;

export const getDivByTitle = (title: string) => `div[title="${title}"]`;

export const getElement = (tag: string, attributes: { [key: string]: string }) =>
    `${tag}${$_.join(
        $_.map(attributes, (v, k) => `[${k}="${v}"]`),
        "",
    )}`;
