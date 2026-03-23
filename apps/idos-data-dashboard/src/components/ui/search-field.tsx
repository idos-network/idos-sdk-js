import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchField({
  value,
  onChange,
  onClear,
  placeholder = "Search for credentials, issuers, etc.",
}: SearchFieldProps) {
  return (
    <div className="relative w-full">
      <SearchIcon
        size={16}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-9 h-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Clear search"
          onClick={onClear}
        >
          <XIcon size={14} />
        </Button>
      )}
    </div>
  );
}
