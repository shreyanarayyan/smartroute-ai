import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

const mockSuggestions = [
  { address: "Hazratganj, Lucknow, Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { address: "Gomti Nagar, Lucknow, Uttar Pradesh", lat: 26.8587, lng: 81.0119 },
  { address: "Charbagh Railway Station, Lucknow, Uttar Pradesh", lat: 26.8318, lng: 80.9158 },
  { address: "Connaught Place, New Delhi, Delhi", lat: 28.6304, lng: 77.2177 },
  { address: "India Gate, New Delhi, Delhi", lat: 28.6129, lng: 77.2295 },
  { address: "Red Fort, New Delhi, Delhi", lat: 28.6562, lng: 77.2410 },
  { address: "Marine Drive, Mumbai, Maharashtra", lat: 18.9440, lng: 72.8236 },
  { address: "Gateway of India, Mumbai, Maharashtra", lat: 18.9220, lng: 72.8347 },
  { address: "Chhatrapati Shivaji Terminus, Mumbai, Maharashtra", lat: 18.9398, lng: 72.8354 },
];

const LocationAutocomplete = ({ value, onChange, placeholder }: LocationAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<typeof mockSuggestions>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val.length > 2) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.address.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: typeof mockSuggestions[0]) => {
    setInputValue(suggestion.address);
    onChange(suggestion.address, suggestion.lat, suggestion.lng);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onChange(inputValue);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => inputValue.length > 2 && setSuggestions(mockSuggestions.filter(s => s.address.toLowerCase().includes(inputValue.toLowerCase())))}
        placeholder={placeholder}
        className="pr-10"
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          onClick={() => {
            setInputValue("");
            onChange("");
            setShowSuggestions(false);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{suggestion.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;