import { getNoahAccounts } from "~/providers/noah.server";

export async function loader() {
  try {
    const accounts = await getNoahAccounts();
    return Response.json(accounts);
  } catch (error) {
    console.error("Error fetching Noah accounts:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
