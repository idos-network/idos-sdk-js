import { idOSGrantee } from "@/grantee.config";

interface InvokeRequestParams {
  // Service info
  service_url: string;
  service_api_key: string;
  // DAG info
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

const validateParams = (body: InvokeRequestParams) => {
  const requiredFields: (keyof InvokeRequestParams)[] = [
    "service_url",
    "service_api_key",
    "dag_owner_wallet_identifier",
    "dag_grantee_wallet_identifier",
    "dag_data_id",
    "dag_locked_until",
    "dag_content_hash",
  ];

  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof body.dag_locked_until !== "number") {
    throw new Error("dag_locked_until must be a number");
  }

  if (!body.service_url.startsWith("http")) {
    throw new Error("service_url must be a valid URL");
  }
};

export async function POST(request: Request) {
  try {
    const body: InvokeRequestParams = await request.json();

    validateParams(body);

    const response = await fetch(body.service_url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${body.service_api_key}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.error) throw new Error(result.error);

    const grantee = await idOSGrantee();
    const credential = await grantee.getReusableCredentialCompliantly(body.dag_data_id);

    if (!credential) {
      return new Response(
        JSON.stringify({
          message: "Credential not found",
        }),
        {
          status: 404,
        },
      );
    }

    return new Response(JSON.stringify({ credential }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
}
