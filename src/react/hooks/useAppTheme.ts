import {createTheme} from "@mui/material/styles";

import {getThemeDefinition} from "../../styles/MaterialThemes";
import {useAppContext} from "../contexts/AppContext";

const useAppTheme = () => {
    const { state } = useAppContext();
    const themeDefinition = getThemeDefinition(state.theme, state.mode);
    const theme = createTheme(themeDefinition, {});

    return { theme };
};

export default useAppTheme;
