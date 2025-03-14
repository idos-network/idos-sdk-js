import { createWebKwilClient, getUserProfile, hasProfile } from "@idos-network/core";
import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const run = async () => {
      const client = await createWebKwilClient({
        nodeUrl: "https://nodes.playground.idos.network",
      });
      const hasAProfile = await hasProfile(client, account.address?.toString() ?? "");
      const profile = await getUserProfile(client);
      console.log(hasAProfile, profile);
    };

    run();
  }, [account.address]);

  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button key={connector.uid} onClick={() => connect({ connector })} type="button">
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  );
}

export default App;
