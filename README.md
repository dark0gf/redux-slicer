# redux-slicer
Tiny and simple library to control redux state without constants, action, action creators, switch statements, weird selectors. Strongly typed: inside reducer function you will get exact type for your part state. Can be used with other actions.

###  Connect to redux
1. Install  library to you project.
2. Wrap you reducer: 
    ```javascript
    import { wrapReducer } from 'redux-slicer';
 
    const store = createStore(
      wrapReducer(someReducer)
    );
    
    ```

3. Connect to store:
    ```javascript
    import { connectStore } from 'redux-slicer';

    connectStore(store);
    ```
    
### Usage

Asume that you have such state:
```javascript
{
  foo: {
    bar: {
      someData: [
        'value 1',
        'value 2',
        'value 3'
      ]
    }
  }
}
```

###### First create slicer:
```javascript
  interface ISlicerData {
    someData: Array
  }
  const slicer = new StoreSlicer<ISlicerData>('foo.bar');
```

###### Then connect slicer state to some component:
```javascript
  connect(slicer.getState)(SomeComponent);
``` 
Or if you need to mix slicer with other data:
```javascript
  connect((state) => ({
    data: slicer.getState(state),
    otherData: {}
  }))(SomeComponent);
```
In this cases `SomeComponent` will get 
`props.someData[0] == 'value 1'` 
or 
`props.data.someData[0] == 'value 1''`

NOTE: `props.someData` or `props.data.someData`  will have type `ISlicerData`

###### Dispatch action to change state:
```javascript
    slicer.dispatch((state) => {
      //NOTE: state will have type ISlicerData and function have strong type 
      // to return ISlicerData, so it will be hard to mess with data inside store
      return {
        ...state,
        {someData: [...state.someData, 'value 4']}
      };
    }, 'ADD_VALUE');
```
Action type name will be such: `GENERIC_FOO_BAR_ADD_VALUE`



