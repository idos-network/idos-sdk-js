import { effect } from "@preact/signals";
import { render } from "preact";
import { Route, Switch } from "wouter-preact";

import { MessageListenerContext, createMessageListener } from "./message-listener.provider";
import { Layout } from "./routes/_layout";
import { AuthRoute } from "./routes/auth/auth.route";
import "./styles.css";

const enclave = window.opener;
if (enclave.origin !== window.origin) throw new Error("Bad origin");

const root = document.getElementById("app");

if (!root) throw new Error("Root element not found.");

function App() {
  effect(() => {
    // @todo: add theme.
    window.dispatchEvent(new Event("secure-enclave:ready"));
  });

  return (
    <MessageListenerContext.Provider value={createMessageListener()}>
      <Layout>
        <Switch>
          <Route path="/auth" component={AuthRoute} />
        </Switch>
      </Layout>
    </MessageListenerContext.Provider>
  );
}

render(<App />, root);
