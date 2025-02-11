import {createTheme, Shadows} from "@mui/material/styles";

const defaultTheme = createTheme();

export const shadows: Shadows = [
    ...defaultTheme.shadows,
] as Shadows;

export default shadows;
