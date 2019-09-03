import { get, set } from 'lodash';
import { Store } from 'redux';

const GENERIC_ACTION_PREFIX = 'GENERIC';

let store: Store;
const dispatchQ: any[] = [];

// const genericDispatch = (selector: string, func: Function) => {
//   if (store) {
//     store.dispatch({
//       type: GENERIC_ACTION_PREFIX,
//       selector,
//       func,
//     });
//   } else {
//     dispatchQ.push({type: GENERIC_ACTION_PREFIX, selector, func});
//   }
// };


// const genericDispatchFactory = (selector: string) => {
//   return (func: Function) => {
//     return () => genericDispatch(selector, func);
//   };
// };

const crateValidTypeName = (str: string) => {
  return str.replace(/[^\w!?]/g, '_').toUpperCase();
};

const genericNamedDispatch = <StateType>(typeName: string, selector: string, func: Function) => {
  const type = `${GENERIC_ACTION_PREFIX}_${typeName}`;
  if (store) {
    store.dispatch({
      type,
      selector,
      func,
    });
  } else {
    dispatchQ.push({type: typeName, selector, func});
  }
};

class StoreSlicer<StateType> {
  selector: string;
  actionTypeNamePrefix: string;

  constructor(selector: string, typeName?: string) {
    this.selector = selector;
    if (typeName) {
      this.actionTypeNamePrefix = typeName;
    } else {
      this.actionTypeNamePrefix = crateValidTypeName(selector);
    }
  }

  dispatch(func: (state: StateType) => StateType, typeName?: string) {
    let actionName;
    if (typeName) {
      actionName = `${this.actionTypeNamePrefix}_${typeName}`;
    } else {
      actionName = this.actionTypeNamePrefix;
    }
    return genericNamedDispatch(actionName, this.selector, func);
  }

  // getState(): StateType  {
  //   return store.getState();
  // }
  //
  // selectFromStore<T>(s: string): T {
  //   const state = get(store.getState(), this.selector);
  //   if (s) {
  //     return get(state, s);
  //   }
  //   return state;
  // }
}

const connectStore = (s: Store) => {
  store = s;
  dispatchQ.forEach((data) => {
    genericNamedDispatch(data.type, data.selector, data.func);
  });
};

const wrapReducer = (reducer: any) => {
  return (state: any, action: any) => {
    if (
      (action.type === GENERIC_ACTION_PREFIX || action.type.startsWith(`${GENERIC_ACTION_PREFIX}_`)) &&
      action.func &&
      action.selector
    ) {
      return genericReducer(state, action.func, action.selector);
    }
    return reducer(state, action);
  };
};

const genericReducer = (state: any, actionFunction: Function, selector: string) => {
  const statePart = get(state, selector);
  const newStatePart = actionFunction(statePart);
  const newState = {...state};
  set(newState, selector, newStatePart);
  return newState;
};

export {StoreSlicer, connectStore, wrapReducer};
