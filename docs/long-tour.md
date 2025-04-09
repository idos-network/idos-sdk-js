# Long Tour

This document will take you on a long tour that'll encompass most of idOS's concepts and components. It assumes you don't need Passporting.

We strongly recommend you read [idOS System Overview](./README.md) first.

> 🚧 Will change soon 🚧
>
> We'll add a Passporting journey soon.


## Cold Start Journey

The journey of a brand-new user to idOS begins with several key steps that ensure a smooth onboarding process and compliance with the system's requirements.

### Initial Acquaintance

The journey starts when a user arrives at the Consumer's app. At this stage, the Consumer's app is already configured with the necessary details, such as the URLs for the idOS nodes and the location to deploy the idOS Enclave. The app prompts the user to connect their wallet, and once the user does so, the app consults idOS to check if the connected wallet's address has an existing profile.

If the user is new to idOS, the system informs the app that it does not recognize the wallet address. Consequently, the Consumer's app redirects the user to its Issuer for onboarding.

### User idOS Onboarding

At the Issuer's app, the system also detects that the wallet is unrecognized and offers to create a Profile for the user. To proceed, the user signs a message to prove ownership of the wallet. The Issuer's app then requests the idOS Enclave to discover the user's encryption public key. The user inputs their password into the idOS Enclave, which communicates the encryption public key back to the Issuer's app.

With this information, the Issuer's app instructs its server to create a Profile for the user on idOS, associating it with the user's wallet address and encryption public key. The Issuer collects and verifies the user's information, potentially with the help of an identity verifier.

At this point, the Issuer has two options:
1. If the verification process is near-instantaneous, the Issuer can ask the user to encrypt and store the credential in their idOS Profile. Additionally, Issuers who prefer not to store user data themselves can request an Access Grant, allowing them to access a copy of the inserted data later without requiring further user interaction.
2. If the verification process might take longer, the Issuer requests a Delegated Write Grant. This is a message signed by the user that delegates to the Issuer the authority to insert a credential into the user's idOS Profile (encrypted for the user), a credential copy (encrypted for the Issuer), and the corresponding Access Grant with an appropriate timelock.

Once the verification is complete and the credential is inserted into the user's idOS Profile, the user is directed back to the Consumer's app.

### Acquiring an Access Grant to the Right Credential

When the user returns to the Consumer's app, the app recognizes that the user now has a Profile on idOS. The app prompts the user to log in to their idOS Profile, and the user signs a message to demonstrate consent.

The Consumer's app then lists the access grants it has received from the user. If no access grants are found, the app uses the idOS Client SDK to search for credentials that meet its compliance requirements. This filtering process can involve checking:
- The Issuer's authentication public key on the credential.
- Fields in the credential's public notes, such as signaling it contains proof of identity or residence.
- Fields in the credential's encrypted contents, such as the user's country of residence. This filtering occurs within the idOS Enclave, ensuring that the Consumer's app does not have direct access to these fields.

If no suitable credential is found, the user should be directed back to the Issuer to create one. However, given the journey so far, the user is expected to have a suitable credential.

Once a suitable credential is identified, the Consumer's app requests an access grant with the appropriate timelock for the target credential. The user grants this request by:
1. Retrieving the requested credential from idOS.
2. Re-encrypting the credential's contents for the Consumer's encryption public key, creating a new credential.
3. Inserting the new credential as a copy of the original and adding an access grant pointing to the Consumer's credential copy.

With the access grant in place, the Consumer's app confirms its validity with the Consumer's server. If the server is satisfied with the access grant and the credential copy, the process is complete.

It is important to note that this final step ensures the integrity of the credential. By validating it on the Consumer's servers, the system mitigates the risk of user interference or manipulation.

### Consumer Access to the Granted Credential

Once the access grant is in place, the Consumer's server retrieves the access grant data ID from the Consumer's app request (or through other means, such as listing access grants obtained from a specific user for back-office purposes). The server then requests the access grant from idOS and retrieves the data ID from it.

Using the data ID, the server requests the corresponding credential from idOS. The server decrypts the credential's contents using its encryption private key and verifies that the decrypted contents were signed by the Issuer. It also ensures that the contents meet the expected criteria.

If everything checks out, the server returns a "success" response to the Consumer's app (or performs an appropriate success action, such as displaying a green seal when rendering the credential in a back-office interface).

## Warmer Start Journeys

For users who have already been onboarded to idOS, the process becomes significantly simpler. If a user has a matching credential and has already provided an access grant with an adequate timelock, the steps to serve the user are minimal.

When another Consumer with compatible compliance needs comes along, the user only needs to:
1. Logging in to idOS.
2. Unlock the idOS Enclave.
3. Create a re-encrypted credential copy.
4. Create an access grant for the copy to the second Consumer.

With just these four steps, the system is ready to serve the user compliantly, streamlining the process and providing the best user experience we could image. Let us know if you have any ideas on how to make it even more magical! 🧙
