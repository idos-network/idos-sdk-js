import { HStack, IconButton, Input, type InputProps } from "@chakra-ui/react";
import { LuSearch, LuX } from "react-icons/lu";
import { InputGroup } from "./input-group";

interface SearchFieldProps extends InputProps {
  onClear: () => void;
}

export function SearchField({ value, onChange, onClear }: SearchFieldProps) {
  return (
    <HStack gap="2" width="full">
      <InputGroup
        flex="1"
        startElement={<LuSearch />}
        endElement={
          value ? (
            <IconButton
              aria-label="Clear current search"
              title="Clear current search"
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <LuX />
            </IconButton>
          ) : null
        }
      >
        <Input variant="subtle" placeholder="Search" value={value} onChange={onChange} />
      </InputGroup>
    </HStack>
  );
}
