# Long Tour

## Cold start journey

Let's go over the journey that a brand new user to idOS goes through.

### Initial acquaintance
- User arrives at the Consumer's app
- Consumer's app is configured (knows the url for the idOs nodes, where to put the idOS Enclave, etc)
- Consumer's app asks the User to connect their wallet. The User connects their wallet.
- Consumer's app consults idOS to check if the connected wallet's address has a profile.
- Since the User is new, idOS tells the app that it doesn't recognize the wallet address.
- Consumer's app redirects the User to its Issuer for the User to be onboarded.

### User idOS onboarding
- Issuer's app also notices idOS doesn't recognize the wallet, and offers to create a Profile.
- User signs a message to prove wallet ownership.
- Issuer's app request that idOS Enclave discovers the User's encryption public key.
- User inputs their password in idOS Enclave.
- idOS Enclave communicates the User's encryption public key back to Issuer's app.
- Issuer's app instructs Issuer's server to create a Profile for the User on idOS with their current wallet address and encryption public key.
- Issuer collects and verifies User's information (perhaps with the help of an Identity verifier)
- Issuer then has two choices:
    - If the verification is near instantaneous, ask the user to encrypt and store the credential in their idOS Profile.
        - Additionally, for Issuers who don't want to store User data themselves, they can also ask for an Access Grant, so that the Issuer can access a copy of the inserted data later on and without requiring user interaction.
    - If the verification might take a while, Issuer asks for a Delegated Write Grant. It's a message signed by User that delegates to Issuer the power to both insert a credential to the user's idOS Profile (cyphered for User), a credential copy (cyphered for Issuer), and the respective Access Grant (with the appropriate timelock).
- User waits until the Issuer is done verifying the data and inserting a credential to the User's idOS Profile.
- User gets directed to go back to the Consumer's app

### Acquiring an access grant to the right credential
- User arrives to the Consumer's app, which now recognizes the user as having a Profile on idOS.
- Consumer's app asks the User to log in their idOS Profile. User signs a message to demonstrate consent.
- Consumer's app lists the access grants that were given to it, and realizes there are none.
- Consumer's app uses the idOS Client SDK to list the credentials that match the Consumer's compliance requirements. Common examples of filtering are:
  - Issuer's authentication public key on the credential
  - Fields in the credential's public notes, according to what the Issuer puts there (e.g., check if the credential certifies proof of identity, proof of residence, etc)
  - Fields in the credential's encrypted contents, according to what the Issuer puts there (e.g., check if the user lives is/isn't from a specific country, etc)
    - This happens on the idOS Enclave. Consumer's app doesn't have access to these fields.
- If we don't find any Credential that fits our purposes, we need to direct the User to the Issuer to create one. This shouldn't be the case, since we just came back from Issuer.
- Consumer's app asks for an access grant, with the correct timelock, for the target credential.
- User grants it. This entails:
  - User gets the request credential from idOS
  - User re-encrypts the credential's contents, for Consumer's encryption public key, into a new credential.
  - User inserts this new credential as being a copy of the original, and inserts the access grant pointing at the Consumer's credential copy.
- Consumer's app is now able to see it has an access grant.
- Consumer's app asks Consumer's server to confirm that everything about the access grant and the credential copy is as expected.
- If Consumer's server is happy, we're all done!

This last step might seem redundant. However, please note that we're trusting that the user didn't manipulate their own computer to produce false results. To be sure that the credential we were shared with has the right content, we should validate it on a computation environment that User can't interfere with: the Consumer's servers.

### Consumer access to the granted credential
- Consumer's server get the access grant data_id from Consumer's app (or discovers it through another means, e.g., listing the access grants gotten from a specific user to display in a back-office)
- Consumer's server asks for the access grant from idOS
- Consumer's server gets the data_id from the access grant
- Consumer's server asks the credentials with id=data_id from idOS
- Consumer's server uses their encryption private key to decrypt the credential's contents.
- Consumer's server confirms that the decrypted contents were signed by the Issuer, and that the contents are as expected.
- Consumer's server returns a "success" response to Consumer's app (or whichever "success" action might be appropriate, e.g., show a green seal when rendering the credential on a back-office)

## Warmer start journeys

As you've seen in the previous journey, there is a lot of things to set up. Here's the ladder of setup:
- User has already been onboarded to idOS
- User has a matching credential
- User has provided an access grant with an adequate timelock

After having gone through all of this, if another Consumer comes along that happens to have compliance needs compatible with the credential User already has, we only need three steps:
- User unlocks idOS Enclave
- User creates the recyphered credential copy
- User create an access grant for that copy to the second Consumer.

That's it. And just like that, with 3 steps, we become ready to serve the user compliantly! 🥳
