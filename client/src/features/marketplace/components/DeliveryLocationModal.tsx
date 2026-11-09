import { useState, useMemo } from "react";
import { MapPin, Search, X, Check, Globe } from "lucide-react";
import {
  type DeliveryLocation,
  getAllCountries,
  POPULAR_COUNTRIES,
  setDeliveryLocation,
} from "../utils/deliveryLocation";
import { ModalPortal } from "@/components/ui/ds-components";

interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: DeliveryLocation | null;
}

export const DeliveryLocationModal = ({
  isOpen,
  onClose,
  currentLocation,
}: DeliveryLocationModalProps) => {
  const [search, setSearch] = useState("");
  const allCountries = useMemo(() => getAllCountries(), []);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [allCountries, search]);

  if (!isOpen) return null;

  const handleSelectCountry = (country: { code: string; name: string; flag: string }) => {
    setDeliveryLocation({
      countryCode: country.code,
      countryName: country.name,
      flag: country.flag,
    });
    onClose();
  };

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <MapPin className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Choose your location
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select destination for delivery & shipping options
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Current Selection Banner */}
          {currentLocation && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-orange-50/40 px-4 py-2.5 text-xs text-slate-700 dark:border-zinc-800/60 dark:bg-orange-950/20 dark:text-slate-300">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Current destination:
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="text-base leading-none">{currentLocation.flag}</span>
                <span>{currentLocation.countryName}</span>
                <span className="text-[10px] text-slate-400">({currentLocation.countryCode})</span>
              </span>
            </div>
          )}

          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or region..."
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Countries Quick Chips */}
          {!search && (
            <div className="border-b border-slate-100 p-3 bg-slate-50/30 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Popular Destinations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_COUNTRIES.slice(0, 8).map((pc) => {
                  const isSelected = currentLocation?.countryCode === pc.code;
                  return (
                    <button
                      key={pc.code}
                      onClick={() => handleSelectCountry(pc)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "border-orange-500 bg-orange-50 text-orange-900 shadow-2xs dark:bg-orange-950/40 dark:text-orange-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span className="text-sm leading-none">{pc.flag}</span>
                      <span>{pc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Countries List */}
          <div className="flex-1 overflow-y-auto p-2 ds-scroll">
            <span className="px-2 py-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {search ? `Matching countries (${filteredCountries.length})` : "All Countries & Territories"}
            </span>

            {filteredCountries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Globe className="mx-auto size-8 opacity-40 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No country found</p>
                <p className="mt-1 text-[11px]">Try checking your spelling.</p>
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {filteredCountries.map((country) => {
                  const isSelected = currentLocation?.countryCode === country.code;
                  return (
                    <button
                      key={country.code}
                      onClick={() => handleSelectCountry(country)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-orange-50 font-bold text-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
                          : "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg leading-none shrink-0" aria-hidden="true">
                          {country.flag}
                        </span>
                        <span className="truncate">{country.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({country.code})
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="size-4 text-orange-600 dark:text-orange-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-3 bg-slate-50/80 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-800/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Prices, taxes & delivery fees adapt automatically.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer dark:bg-slate-100 dark:text-slate-900"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
