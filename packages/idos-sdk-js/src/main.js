import { ethers } from "ethers";

import { idOS } from "./lib";

document.addEventListener("DOMContentLoaded", async () => {
  const web3provider = new ethers.BrowserProvider(window.ethereum);
  await web3provider.send("eth_requestAccounts", []);
  const idos = new idOS({ url: "https://nodes.idos.network" });

  console.log("idOS SDK initialized");

  await web3provider.send("eth_requestAccounts", []);
  await idos.auth.setWalletSigner(await web3provider.getSigner());
  const attributes = await idos.data.list("attributes", { attribute_key: "BAR" });
  console.log(attributes);
});
