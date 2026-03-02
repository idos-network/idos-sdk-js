import { getNoahCountries } from "~/providers/noah.server";

export async function loader() {
  try {
    const countries = await getNoahCountries();
    return Response.json(countries);
  } catch (error) {
    console.error("Error fetching Noah countries:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
