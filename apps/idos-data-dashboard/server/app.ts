// server/app.ts
import * as build from "virtual:react-router/server-build";
import { createRequestHandler, RouterContextProvider } from "react-router";

const handler = createRequestHandler(build);

export default (req: Request) => handler(req, new RouterContextProvider());
