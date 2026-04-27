import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

const LocationAutocomplete = ({ value, onChange, placeholder }: LocationAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=in&addressdetails=1`
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setNoResults(data.length === 0);
      } catch {
        setSuggestions([]);
        setNoResults(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion: NominatimResult) => {
    // Use a short readable name from the result
    const shortName = suggestion.display_name.split(",").slice(0, 3).join(",").trim();
    setInputValue(shortName);
    onChange(suggestion.display_name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("", undefined, undefined);
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // If user typed but never selected a suggestion, revert to last confirmed value
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setIsLoading(false);
      setInputValue(value); // revert to parent's confirmed value
    }, 200);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => (suggestions.length > 0 || isLoading) && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pr-10 truncate"
          autoComplete="off"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <ul
          className="absolute w-full mt-1 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {isLoading ? (
            <li className="px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Searching...
            </li>
          ) : noResults ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No locations found
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 px-4 py-3 cursor-pointer hover:bg-secondary transition-colors border-b border-border/50 last:border-0"
                onMouseDown={() => handleSelect(s)}
              >
                <span className="mt-0.5 shrink-0 text-base">📍</span>
                <span className="text-sm leading-snug">{s.display_name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;