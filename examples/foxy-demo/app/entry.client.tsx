import { Buffer } from "buffer/";
import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

globalThis.Buffer = Buffer as unknown as BufferConstructor;

ReactDOM.hydrateRoot(
  document,
  <React.StrictMode>
    <HydratedRouter />
  </React.StrictMode>,
);
