import ElectronStore from "electron-store";

import {IStore} from "../common/Store";

declare global {
    var store: ElectronStore<IStore>;
}
