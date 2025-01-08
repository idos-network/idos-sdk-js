# Dashboard for dApps / Issuers

This dashboard enabled both dApps and Issuers to inspect the data they have access to on idOS.

Deployed at <https://dashboard-for-dapps.vercel.app/>.

> 🛑 DANGER 🛑
>
> This is a very bare-bones application, and it will ask for your encryption secret. This is only suitable for development, and not for production use.
>
> If you want to use this app for production data, we encourage you to fork it and implement content decryption in a way that's compliant with your threat model.

## Using a non-browser wallet

This app supports using Reown (formerly WalletConnect). This can be leveraged to have your wallet anywhere, including your own server. Be sure to check [their WalletKit documentation](https://docs.reown.com/walletkit/overview) to learn more.

If you want a quick web-only demo, you can use <https://react-wallet.walletconnect.com/> to try things out.
