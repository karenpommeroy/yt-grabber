import ElectronStore from "electron-store";

import {ILogger} from "../common/Logger";
import {IStore} from "../common/Store";

declare global {
    var store: ElectronStore<IStore>;
    var logger: ILogger;
    interface Global {
    [key: string]: any;
  }
}
