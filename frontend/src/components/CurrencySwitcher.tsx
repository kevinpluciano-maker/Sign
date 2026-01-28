import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CurrencySwitcherProps {
  isHomePage?: boolean;
}

const CurrencySwitcher = ({ isHomePage = false }: CurrencySwitcherProps) => {
  const { selectedCurrency, setCurrency } = useCurrency();

  const currencies = [
    {
      code: "USD",
      symbol: "$",
      flagImage: "/lovable-uploads/905c84e9-b0ba-4001-8d34-5abed67388b1.png",
      name: "US Dollar"
    },
    {
      code: "CAD", 
      symbol: "C$",
      flagImage: "/lovable-uploads/8eaab32d-d040-4d38-8f64-7cad3050e5a5.png",
      name: "Canadian Dollar"
    }
  ];

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  const buttonClasses = isHomePage
    ? "bg-black/20 border-white/20 text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
    : "bg-background border shadow-sm hover:shadow-md transition-all duration-200";

  const dropdownClasses = isHomePage
    ? "w-48 bg-black/80 backdrop-blur-md border-white/20 shadow-xl z-[100] text-white"
    : "w-48 bg-background border shadow-lg z-[100]";

  const itemClasses = isHomePage
    ? "flex items-center space-x-3 cursor-pointer hover:bg-white/20 text-white"
    : "flex items-center space-x-3 cursor-pointer hover:bg-muted";

  const textClasses = isHomePage ? "text-white drop-shadow-md" : "text-foreground";
  const mutedTextClasses = isHomePage ? "text-white/80" : "text-muted-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline" 
          size="sm"
          className={buttonClasses}
        >
          <img 
            src={currentCurrency?.flagImage} 
            alt={`${currentCurrency?.name} flag`}
            className="w-4 h-3 mr-2 object-cover rounded-sm"
          />
          <span className={`hidden sm:inline ${textClasses}`}>{selectedCurrency}</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={dropdownClasses}
      >
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => setCurrency(currency.code)}
            className={itemClasses}
          >
            <img 
              src={currency.flagImage} 
              alt={`${currency.name} flag`}
              className="w-6 h-4 object-cover rounded-sm"
            />
            <div className="flex flex-col">
              <span className={`font-medium ${textClasses}`}>{currency.code}</span>
              <span className={`text-xs ${mutedTextClasses}`}>{currency.name}</span>
            </div>
            {selectedCurrency === currency.code && (
              <div className={`ml-auto w-2 h-2 rounded-full ${isHomePage ? 'bg-white' : 'bg-primary'}`} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;