import { ethers } from "ethers";

import { idOS } from "./lib";

document.addEventListener("DOMContentLoaded", async () => {
  const web3provider = new ethers.BrowserProvider(window.ethereum);
  await web3provider.send("eth_requestAccounts", []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const idos = new idOS({ url: "https://nodes.idos.network" });

  console.log("idOS SDK initialized");
});
