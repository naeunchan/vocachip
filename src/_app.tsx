import "./appsInToss/runtimeInit";

import { AppsInToss } from "@apps-in-toss/framework";
import type { InitialProps } from "@granite-js/react-native";
import type { PropsWithChildren } from "react";

import { context } from "../require.context";
import { debugLog } from "./appsInToss/debug";

debugLog("src/_app module evaluated");

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
    debugLog("AppContainer rendered");
    return <>{children}</>;
}

export default AppsInToss.registerApp(AppContainer, { context });
