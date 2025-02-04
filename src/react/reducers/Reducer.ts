import $_ from "lodash";

import { IState, StateCreator } from "../states/State";

export const reduce = <TState extends IState>(state = StateCreator.create<TState>(), stateChange: Partial<TState>) => {
    return $_.assign({}, state, stateChange);
};
