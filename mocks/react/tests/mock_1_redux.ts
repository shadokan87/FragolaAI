import { type TaskType, taskState, approvalState } from "../../../dist/Task/Task";
export const isolate: TaskType[] = [
  {
    "title": "Create counterSlice",
    "simpleDescription": "Create a counter slice",
    "filePath": "/src/features/counter/counterSlice.ts",
    "prompt": "Create a basic counter slice using createSlice from redux toolkit. The slice should have the following properties:\\\\n- name: 'counter'\\\\n- initialState: an object with a single property 'value' initialized to 0\\\\n- reducers:\\\\n    - increment: a reducer that increments the 'value' property by 1\\\\n    - decrement: a reducer that decrements the 'value' property by 1",
    "otherPathsDependencies": [],
    "type": "create",
    "id": 0,
    "approvalState": approvalState.NONE,
    "taskState": taskState.NONE
  }
];

export const mock_1_redux: TaskType[] = [
  {
    "title": "Setup Redux Toolkit",
    "simpleDescription": "Install redux toolkit and react-redux",
    "filePath": "",
    "prompt": "Install the following packages: \\n- @reduxjs/toolkit\\n- react-redux",
    "otherPathsDependencies": [],
    "type": "command",
    "id": 0,
    "approvalState": approvalState.NONE,
    "taskState": taskState.NONE
  },
  {
    "title": "Create counterSlice",
    "simpleDescription": "Create a counter slice",
    "filePath": "/src/features/counter/counterSlice.ts",
    "prompt": "Create a basic counter slice using createSlice from redux toolkit. The slice should have the following properties:\\\\n- name: 'counter'\\\\n- initialState: an object with a single property 'value' initialized to 0\\\\n- reducers:\\\\n    - increment: a reducer that increments the 'value' property by 1\\\\n    - decrement: a reducer that decrements the 'value' property by 1",
    "otherPathsDependencies": [],
    "type": "create",
    "id": 1,
    "approvalState": approvalState.NONE,
    "taskState": taskState.NONE
  },
  {
    "title": "Create Redux store",
    "simpleDescription": "Create redux store",
    "filePath": "/src/app/store.ts",
    "prompt": "Import the configureStore function from redux toolkit and the counterReducer from the counterSlice.\\\\\\\\n\\\\\\\\nCreate a store using configureStore. The store should contain the counterReducer in a slice called 'counter'.",
    "otherPathsDependencies": [
      "/src/features/counter/counterSlice.ts"
    ],
    "type": "create",
    "id": 2,
    "approvalState": approvalState.NONE,
    "taskState": taskState.NONE
  },
  {
    "title": "Provide Redux store",
    "simpleDescription": "Provide Redux store to the application",
    "filePath": "/src/main.tsx",
    "prompt": "Import the Provider component from react-redux and the store.\\\\\\\\\\\\\\\\n\\\\\\\\\\\\\\\\nWrap the entire application within the Provider component and pass the store as a prop.",
    "otherPathsDependencies": [
      "/src/app/store.ts"
    ],
    "type": "update",
    "id": 3,
    "approvalState": approvalState.NONE,
    "taskState": taskState.NONE
  }
]
