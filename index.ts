import "react-native-gesture-handler";

import { register } from "@granite-js/react-native";

import App from "./src/_app";

if (__DEV__) {
    register(App);
}

export default App;
