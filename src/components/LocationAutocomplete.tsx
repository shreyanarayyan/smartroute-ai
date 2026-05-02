import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  /** Whether the current value already has real coordinates (from parent state) */
  hasValidCoords?: boolean;
}

const LocationAutocomplete = ({
  value,
  onChange,
  placeholder,
  hasValidCoords = false,
}: LocationAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  // Whether the user has selected from the dropdown in this session
  const [confirmedFromDropdown, setConfirmedFromDropdown] = useState(hasValidCoords);
  // Warning to show when Enter pressed without selecting
  const [enterWarning, setEnterWarning] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. after optimization reorder)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // If parent says it has valid coords (e.g. use current location), mark confirmed
  useEffect(() => {
    if (hasValidCoords) setConfirmedFromDropdown(true);
  }, [hasValidCoords]);

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
    setEnterWarning(false);

    // User started typing manually — mark as unconfirmed
    setConfirmedFromDropdown(false);

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
    }, 400);
  };

  const handleSelect = (suggestion: NominatimResult) => {
    const shortName = suggestion.display_name.split(",").slice(0, 3).join(",").trim();
    setInputValue(shortName);
    setConfirmedFromDropdown(true);
    setEnterWarning(false);
    onChange(suggestion.display_name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && !confirmedFromDropdown) {
        // Auto-select first suggestion on Enter only if suggestions are visible
        if (showSuggestions) {
          handleSelect(suggestions[0]);
        } else {
          // Suggestions not visible — show warning
          setEnterWarning(true);
          setTimeout(() => setEnterWarning(false), 3000);
        }
      } else if (!confirmedFromDropdown && inputValue.trim()) {
        // Typed text with no suggestions visible — warn
        setEnterWarning(true);
        setTimeout(() => setEnterWarning(false), 3000);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else {
      setEnterWarning(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setConfirmedFromDropdown(false);
    setEnterWarning(false);
    onChange("", undefined, undefined);
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // If user blurs without selecting, revert display to last confirmed value
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setIsLoading(false);
      setInputValue(value); // revert to parent's confirmed value
      // If parent value has no address, mark unconfirmed
      if (!value.trim()) setConfirmedFromDropdown(false);
    }, 200);
  };

  // Derived status
  const showValid = confirmedFromDropdown && hasValidCoords && value.trim() !== "";
  const showInvalid = value.trim() !== "" && !confirmedFromDropdown && !hasValidCoords && !showSuggestions && !isLoading;

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
          className={[
            "pr-10 truncate transition-all",
            enterWarning
              ? "border-orange-400 ring-1 ring-orange-300 focus-visible:ring-orange-300"
              : showValid
              ? "border-green-400 ring-1 ring-green-200 focus-visible:ring-green-200"
              : showInvalid
              ? "border-red-300"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          autoComplete="off"
        />

        {/* Status icon — right side */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showValid && !enterWarning && (
            <CheckCircle2
              className="h-4 w-4 text-green-500 shrink-0"
              aria-label="Valid location with coordinates"
            />
          )}
          {showInvalid && !enterWarning && (
            <AlertTriangle
              className="h-4 w-4 text-red-400 shrink-0"
              aria-label="No coordinates — please select from dropdown"
            />
          )}
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
              type="button"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Enter-without-selection warning */}
      {enterWarning && (
        <p
          className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-500 animate-in fade-in slide-in-from-top-1"
          role="alert"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Please select a location from the dropdown suggestions
        </p>
      )}

      {/* Suggestions dropdown */}
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