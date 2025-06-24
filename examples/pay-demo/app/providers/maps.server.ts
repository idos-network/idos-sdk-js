type NominatimResult = {
  address: {
    state?: string;
    country_code?: string;
    "ISO3166-2-lvl4"?: string;
  };
};

export async function getISORegionCodeFromNominatim(address: string): Promise<string> {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "idOS-Pay-Demo/1.0 (jan@idos.network)",
    },
  });

  if (!res.ok) {
    throw new Error(`Open street map no results for '${address}'`);
  }

  const data: NominatimResult[] = await res.json();

  if (!data || data.length === 0) {
    throw new Error(`Open street map no results for '${address}'`);
  }

  const result: string[] = data
    .map((x) => x.address["ISO3166-2-lvl4"]?.split("-")[1] ?? "")
    .filter((x) => x.length > 0);

  if (result.length === 0) {
    throw new Error(`Open street map no ISO3166-2-lvl6 for '${address}'`);
  }

  return result[0];
}
