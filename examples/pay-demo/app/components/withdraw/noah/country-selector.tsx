import { Globe, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useCheckout } from "~/contexts/checkout-context";
import type { CountriesResponse } from "~/lib/types/noah";
import type { Country } from "~/lib/types/shared";

// Country mapping with flags (simplified version - can be expanded)
const countryMapping: Record<string, { name: string; flag: string }> = {
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  ES: { name: "Spain", flag: "🇪🇸" },
  IT: { name: "Italy", flag: "🇮🇹" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  BE: { name: "Belgium", flag: "🇧🇪" },
  AT: { name: "Austria", flag: "🇦🇹" },
  CH: { name: "Switzerland", flag: "🇨🇭" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  AR: { name: "Argentina", flag: "🇦🇷" },
  CO: { name: "Colombia", flag: "🇨🇴" },
  MX: { name: "Mexico", flag: "🇲🇽" },
  // Add more countries as needed
};

function mapCountriesResponseToCountries(response: CountriesResponse): Country[] {
  return Object.keys(response)
    .filter((code) => countryMapping[code])
    .map((code) => ({
      code,
      name: countryMapping[code].name,
      flag: countryMapping[code].flag,
      currency: response[code][0] || "USD",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function CountrySelector() {
  const { country, setCountry } = useCheckout();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/app/noah/countries");
        if (response.ok) {
          const data: CountriesResponse = await response.json();
          const mappedCountries = mapCountriesResponseToCountries(data);
          setCountries(mappedCountries);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-15 shrink-0 items-center gap-2">
        <div className="flex h-full flex-1 items-center gap-4 rounded-lg bg-input/30 px-6 py-3">
          <Loader2Icon className="size-5 shrink-0 animate-spin" />
          <span className="text-sm">Loading countries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-15 shrink-0 items-center gap-2">
      <Select
        value={country?.code}
        onValueChange={(value) => {
          const selectedCountry = countries.find((c) => c.code === value);
          if (selectedCountry) {
            setCountry(selectedCountry);
          }
        }}
      >
        <SelectTrigger className="w-full rounded-lg border-none bg-input/30 pr-4 pl-6">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <div className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {country && (
        <div
          aria-label={`${country.name} flag`}
          className="flex h-full w-16 place-content-center items-center gap-4 rounded-lg bg-input/30 px-6 py-3"
          role="img"
        >
          {country.flag ? (
            <span aria-hidden="true" className="text-2xl">
              {country.flag}
            </span>
          ) : (
            <Globe aria-hidden="true" className="size-4" />
          )}
        </div>
      )}
    </div>
  );
}
