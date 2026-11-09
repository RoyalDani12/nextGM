export type DeliveryLocation = {
  countryCode: string;
  countryName: string;
  flag: string;
};

const STORAGE_KEY = "nextgm_delivery_country";
const EVENT_NAME = "nextgm_delivery_location_changed";

// Generate emoji flag from 2-letter ISO country code
export function countryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// Convert 2-letter ISO code to localized country name
export function getCountryName(countryCode: string, locale: string = "en"): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(countryCode.toUpperCase());
    return name || countryCode;
  } catch {
    return countryCode;
  }
}

// Common timezones mapped to ISO-3166-1 alpha-2 codes
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Africa
  "Africa/Addis_Ababa": "ET",
  "Africa/Asmara": "ER",
  "Africa/Cairo": "EG",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Casablanca": "MA",
  "Africa/Accra": "GH",
  "Africa/Kigali": "RW",
  "Africa/Kampala": "UG",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Khartoum": "SD",
  "Africa/Djibouti": "DJ",
  "Africa/Mogadishu": "SO",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Luanda": "AO",
  "Africa/Harare": "ZW",

  // Middle East
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Kuwait": "KW",
  "Asia/Qatar": "QA",
  "Asia/Muscat": "OM",
  "Asia/Bahrain": "BH",
  "Asia/Amman": "JO",
  "Asia/Beirut": "LB",
  "Asia/Baghdad": "IQ",
  "Asia/Jerusalem": "IL",
  "Asia/Istanbul": "TR",

  // North America
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "America/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Montreal": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Mexico_City": "MX",
  "America/Cancun": "MX",

  // Europe
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Athens": "GR",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Kiev": "UA",
  "Europe/Moscow": "RU",

  // Asia
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Kolkata": "IN",
  "Asia/Singapore": "SG",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Colombo": "LK",

  // Oceania
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",

  // South America
  "America/Sao_Paulo": "BR",
  "America/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Bogota": "CO",
  "America/Lima": "PE",
};

// Popular countries shown as quick-pick buttons
export const POPULAR_COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
];

// ISO country list for full country selector modal
const COUNTRY_CODES: string[] = [
  "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN","BG","BF","BI","CV","KH","CM","CA","CF","TD","CL","CN","CO","KM","CG","CD","CR","CI","HR","CU","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR","GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS","IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MG","MW","MY","MV","ML","MT","MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM","NA","NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PA","PG","PY","PE","PH","PL","PT","QA","RO","RU","RW","KN","LC","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK","SD","SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM","TV","UG","UA","AE","GB","US","UY","UZ","VU","VA","VE","VN","YE","ZM","ZW"
];

let cachedCountryList: Array<{ code: string; name: string; flag: string }> | null = null;

export function getAllCountries(): Array<{ code: string; name: string; flag: string }> {
  if (cachedCountryList) return cachedCountryList;
  try {
    const list = COUNTRY_CODES.map((code) => ({
      code,
      name: getCountryName(code),
      flag: countryFlag(code),
    })).sort((a, b) => a.name.localeCompare(b.name));
    cachedCountryList = list;
    return list;
  } catch {
    return POPULAR_COUNTRIES;
  }
}

// Instant synchronous browser fallback based on timezone or locale (0ms delay)
export function getBrowserInstantLocation(): DeliveryLocation {
  const locale = typeof navigator !== "undefined" ? navigator.languages?.[0] || navigator.language : "en-US";
  const localeRegion = locale?.match(/[-_]([A-Z]{2})$/i)?.[1]?.toUpperCase();

  if (localeRegion) {
    const name = getCountryName(localeRegion);
    if (name && name !== localeRegion) {
      return { countryCode: localeRegion, countryName: name, flag: countryFlag(localeRegion) };
    }
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const mapped = TIMEZONE_TO_COUNTRY[timezone];
    if (mapped) {
      return { countryCode: mapped, countryName: getCountryName(mapped), flag: countryFlag(mapped) };
    }
  } catch {
    // Ignore error
  }

  return { countryCode: "US", countryName: "United States", flag: "🇺🇸" };
}

// Retrieve saved delivery location from localStorage if available
export function getStoredDeliveryLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.countryCode === "string" && parsed.countryCode.length === 2) {
      return {
        countryCode: parsed.countryCode.toUpperCase(),
        countryName: parsed.countryName || getCountryName(parsed.countryCode),
        flag: countryFlag(parsed.countryCode),
      };
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return null;
}

// Save delivery location manually selected by user
export function setDeliveryLocation(location: DeliveryLocation): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: location }));
  } catch (err) {
    console.error("Failed to persist delivery location:", err);
  }
}

// Silent automatic IP-based detection (NO browser geolocation prompts!)
export async function autoDetectDeliveryLocation(): Promise<DeliveryLocation> {
  // 1. If previously saved or detected, return instantly
  const stored = getStoredDeliveryLocation();
  if (stored) return stored;

  // 2. Initial instant baseline from browser timezone/locale
  const fallback = getBrowserInstantLocation();

  // 3. Silent IP lookup in background
  try {
    // Fast lightweight IP-to-country API (CORS enabled, free, no keys, 0 permission required)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch("https://api.country.is", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      if (data?.country && data.country.length === 2) {
        const code = data.country.toUpperCase();
        const detected: DeliveryLocation = {
          countryCode: code,
          countryName: getCountryName(code),
          flag: countryFlag(code),
        };
        setDeliveryLocation(detected);
        return detected;
      }
    }
  } catch {
    // Attempt secondary silent fallback via ipwho.is
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch("https://ipwho.is/", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as { success?: boolean; country_code?: string; country?: string };
        if (data?.success && data?.country_code) {
          const code = data.country_code.toUpperCase();
          const detected: DeliveryLocation = {
            countryCode: code,
            countryName: data.country || getCountryName(code),
            flag: countryFlag(code),
          };
          setDeliveryLocation(detected);
          return detected;
        }
      }
    } catch {
      // Background IP services unreachable; preserve timezone-based detection
    }
  }

  // Fallback to timezone estimate and cache it
  setDeliveryLocation(fallback);
  return fallback;
}

export { EVENT_NAME as DELIVERY_LOCATION_EVENT };
