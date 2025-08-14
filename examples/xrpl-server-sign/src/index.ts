import { XrplCredentialsCreate } from "@idos-network/utils/xrpl-credentials";

/**
 * Example application demonstrating XRPL credential creation using idOS SDK
 */
async function main() {
  try {
    const service = new XrplCredentialsCreate(
      "wss://s.devnet.rippletest.net:51233",
      "sEdTmMwbLmdqbhAhs2ZxroQvExhuxVb",
    );

    // const credential = await issuer.createCredentialForOriginal({
    //   credId: "741a9caf-ec53-42c7-aed6-519950dcded5",
    //   credType: "KYC",
    //   userAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
    // });

    // console.log(credential);

    const credentialCopy = await service.createCredentialForCopy({
      credId: "741a9caf-ec53-42c7-aed6-519950dcded6",
      credType: "KYC",
      userAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
      timelockYears: 1,
      origCredIssuerAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    });

    console.log(credentialCopy);
  } catch (error) {
    console.error(error);
  }
}

// Run the application
main().catch(console.error);
