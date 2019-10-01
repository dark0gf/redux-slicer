import { get, set } from 'lodash';
import { Store } from 'redux';

const GENERIC_ACTION_PREFIX = 'GENERIC';

let store: Store;
const dispatchQ: any[] = [];

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
  initialState?: StateType;

  /**
   * Initialize selector for redux store
   *
   * @param selector - locator for store, used for dispatch to pass only part of state, supports get syntax from
   *                  `lodash` library
   * @param initialState - optional initial state, used for first initialization and reset back if needed
   * @param typeName -  optional type name for redux action, if passed then action name prefix will be named by this
   *                    string with 'GENERIC_' prefix, if this is not passed then name is generated from selector
   *                    (ex: if selector = 'foo.bar.someobject', then type = GENERIC_FOO_BAR_SOMEOBJECT)
   */
  constructor(selector: string, initialState?: StateType, typeName?: string) {
    this.selector = selector;
    this.initialState = initialState;
    if (typeName) {
      this.actionTypeNamePrefix = typeName;
    } else {
      this.actionTypeNamePrefix = crateValidTypeName(selector);
    }
    this.resetState();
  }

  /**
   * Dispatch action like function
   *
   * @param func - reducer function, part state is passed to this function
   * @param typeName - custom type name for redux
   */
  dispatch = (func: (state: StateType) => StateType, typeName?: string) => {
    let actionName;
    if (typeName) {
      actionName = `${this.actionTypeNamePrefix}_${typeName}`;
    } else {
      actionName = this.actionTypeNamePrefix;
    }
    return genericNamedDispatch(actionName, this.selector, func);
  };

  /**
   * Select part of state, utility function to be used with `react-redux/connect`
   *
   * @param state - global redux state, returns part state by selector from constructor
   */
  getState = (state: any): StateType => {
    return get(state, this.selector);
  };

  /**
   * Dispatch action function with initial state (if initial state is defined)
   */
  resetState = () => {
    if (this.initialState == null) {
      return;
    }
    this.dispatch(() => this.initialState!);
  };

}

/**
 * Connect redux-slicer to store, used to dispatch actions from slicer to redux, mandatory function
 *
 * @param s - store object from your application
 */
const connectStore = (s: Store) => {
  store = s;
  dispatchQ.forEach((data) => {
    genericNamedDispatch(data.type, data.selector, data.func);
  });
};

/**
 * Redux global reducer wrapper, used to catch slicer GENERIC_* action types, mandatory function
 *
 * @param reducer
 */
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
