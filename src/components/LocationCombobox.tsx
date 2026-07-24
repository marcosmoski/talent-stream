import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CITY_OPTIONS, normalizeLocation } from "@/lib/locations";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Location picker with autocomplete over a curated, Portugal-first city list.
 * Selecting a suggestion stores its canonical spelling; typing a place we don't
 * list is still allowed (press Enter) and gets alias-normalized on the way in.
 */
export function LocationCombobox({ value, onChange, placeholder = "Search a city…" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  function commit(next: string) {
    onChange(normalizeLocation(next));
    setQuery("");
    setOpen(false);
  }

  const canAddCustom =
    query.trim().length > 0 &&
    !CITY_OPTIONS.some((c) => c.toLowerCase() === query.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("flex items-center gap-2 truncate", !value && "text-muted-foreground")}>
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
            {value || "Select location"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAddCustom) {
                e.preventDefault();
                commit(query);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No city found. Press Enter to use it as typed.</CommandEmpty>
            {canAddCustom && (
              <CommandGroup heading="Use custom">
                <CommandItem value={`custom-${query}`} onSelect={() => commit(query)}>
                  Use “{query.trim()}”
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Cities">
              {filtered.map((city) => (
                <CommandItem key={city} value={city} onSelect={() => commit(city)}>
                  <Check className={cn("mr-2 h-4 w-4", value === city ? "opacity-100" : "opacity-0")} />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
