import { createRecipient } from "~/providers/due.server";
import type { Route } from "./+types/recipient";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const { accountId, ...recipientPayload } = payload ?? {};

    const dueAccountId = accountId;

    // Check if this is a SEPA recipient (has IBAN) or ACH recipient (has accountNumber/routingNumber)
    const isSepa = "IBAN" in recipientPayload.details && recipientPayload.details.IBAN;
    const isAch =
      "accountNumber" in recipientPayload.details && "routingNumber" in recipientPayload.details;

    if (isSepa) {
      // Handle SEPA recipient
      const { accountType, firstName, lastName, companyName, IBAN } =
        recipientPayload.details ?? {};

      if (!accountType || !IBAN) {
        return Response.json(
          { error: "name, accountType, and IBAN are required for SEPA recipients." },
          { status: 400 },
        );
      }

      // Validate individual account has firstName and lastName
      if (accountType === "individual" && (!firstName || !lastName)) {
        return Response.json(
          { error: "firstName and lastName are required for individual accounts." },
          { status: 400 },
        );
      }

      // Validate business account has companyName
      if (accountType === "business" && !companyName) {
        return Response.json(
          { error: "companyName is required for business accounts." },
          { status: 400 },
        );
      }

      // Normalize IBAN: remove spaces and convert to uppercase
      const normalizedIban = IBAN.trim().replace(/\s/g, "").toUpperCase();

      // Build details: accountType, firstName, lastName, companyName (optional), IBAN, schema
      const details: {
        schema: "bank_sepa";
        accountType: "individual" | "business";
        IBAN: string;
        firstName?: string;
        lastName?: string;
        companyName?: string;
      } = {
        schema: "bank_sepa",
        accountType: accountType as "individual" | "business",
        IBAN: normalizedIban,
      };

      if (accountType === "individual") {
        details.firstName = firstName.trim();
        details.lastName = lastName.trim();
      }
      if (companyName?.trim()) {
        details.companyName = companyName.trim();
      }

      const recipientRequest = {
        details,
        isExternal: true,
      };

      const recipient = await createRecipient(dueAccountId, {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        details: recipientRequest.details,
        isExternal: true,
      });

      return Response.json(recipient);
    }

    if (isAch) {
      // Handle ACH recipient
      const {
        name,
        accountType,
        firstName,
        lastName,
        companyName,
        bankName,
        accountName,
        accountNumber,
        routingNumber,
        beneficiaryAddress,
      } = recipientPayload.details ?? {};

      if (
        !name ||
        !accountType ||
        !bankName ||
        !accountNumber ||
        !routingNumber ||
        !beneficiaryAddress
      ) {
        return Response.json(
          {
            error:
              "name, accountType, bankName, accountNumber, routingNumber, and beneficiaryAddress are required for ACH recipients.",
          },
          { status: 400 },
        );
      }

      // Validate individual account has firstName and lastName
      if (accountType === "individual" && (!firstName || !lastName)) {
        return Response.json(
          { error: "firstName and lastName are required for individual accounts." },
          { status: 400 },
        );
      }

      // Validate business account has companyName
      if (accountType === "business" && !companyName) {
        return Response.json(
          { error: "companyName is required for business accounts." },
          { status: 400 },
        );
      }

      // Convert state to ISO3166-2 format (US-XX)
      const stateIso = beneficiaryAddress.state.startsWith("US-")
        ? beneficiaryAddress.state
        : `US-${beneficiaryAddress.state}`;

      // Convert country to ISO3166-1 alpha-3 (USA)
      const countryIso = beneficiaryAddress.country === "US" ? "USA" : beneficiaryAddress.country;

      const recipient = await createRecipient(dueAccountId, {
        name,
        details: {
          schema: "bank_us",
          accountType: accountType as "individual" | "business",
          bankName: bankName.trim(), // Required per Due API documentation
          ...(accountName && { accountName: accountName.trim() }),
          accountNumber,
          routingNumber,
          ...(firstName?.trim() && { firstName: firstName.trim() }),
          ...(lastName?.trim() && { lastName: lastName.trim() }),
          ...(companyName?.trim() && { companyName: companyName.trim() }),
          beneficiaryAddress: {
            street_line_1: beneficiaryAddress.line1,
            ...(beneficiaryAddress.line2 && { street_line_2: beneficiaryAddress.line2 }),
            city: beneficiaryAddress.city,
            ...(stateIso && { state: stateIso }),
            postal_code: beneficiaryAddress.postalCode,
            country: countryIso,
          },
        },
        isExternal: true,
      });

      return Response.json(recipient);
    }

    return Response.json(
      {
        error:
          "Invalid recipient data. Must include either SEPA fields (iban) or ACH fields (accountNumber, routingNumber, beneficiaryAddress).",
      },
      { status: 400 },
    );
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
