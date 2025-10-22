import {assign} from "lodash-es";

import {StateCreator} from "../states/State";

export const reduce = <TState extends object>(state = StateCreator.create<TState>(), stateChange: Partial<TState>) => {
    return assign({}, state, stateChange);
};
