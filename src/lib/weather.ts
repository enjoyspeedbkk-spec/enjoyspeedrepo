// ========================================
// Weather Monitoring Service
// Uses OpenWeatherMap API to check forecasts
// for upcoming ride sessions at Skylane (Suvarnabhumi area)
// ========================================

// Skylane (Happy and Healthy Bike Lane) — near Suvarnabhumi Airport
const TRACK_LAT = 13.6900;
const TRACK_LON = 100.7501;

const API_KEY = process.env.OPENWEATHER_API_KEY || "";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ── Types ─────────────────────────────────────

export interface WeatherForecast {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Morning (06:00-09:00) forecast */
  morning: PeriodForecast;
  /** Evening (15:00-19:00) forecast */
  evening: PeriodForecast;
  /** Overall assessment for the day */
  overall: WeatherAssessment;
}

export interface PeriodForecast {
  /** Average temperature in Celsius */
  tempC: number;
  /** Probability of precipitation (0-100%) */
  rainChance: number;
  /** Expected rain volume in mm (3h window) */
  rainMm: number;
  /** Wind speed in km/h */
  windKmh: number;
  /** Weather condition (clear, clouds, rain, thunderstorm, drizzle) */
  condition: string;
  /** Human-readable description */
  description: string;
  /** Humidity percentage */
  humidity: number;
}

export type WeatherSeverity = "clear" | "watch" | "warning" | "severe";

export interface WeatherAssessment {
  severity: WeatherSeverity;
  /** Short label for the weather status */
  label: string;
  /** Detailed explanation for notifications */
  message: string;
  /** Whether riding is recommended */
  rideRecommended: boolean;
}

// ── Thresholds ────────────────────────────────

const THRESHOLDS = {
  /** Rain chance % that triggers a "watch" (heads-up) */
  WATCH_RAIN_CHANCE: 40,
  /** Rain chance % that triggers a "warning" (likely rain) */
  WARNING_RAIN_CHANCE: 60,
  /** Rain chance % that triggers "severe" (cancel recommended) */
  SEVERE_RAIN_CHANCE: 80,
  /** Rain volume (mm) that triggers warning */
  WARNING_RAIN_MM: 5,
  /** Rain volume (mm) that triggers severe */
  SEVERE_RAIN_MM: 15,
  /** Wind speed (km/h) that's concerning for cycling */
  WARNING_WIND_KMH: 35,
  /** Thunderstorm always triggers at least warning */
  THUNDERSTORM_CONDITION: "Thunderstorm",
} as const;

// ── API Fetching ──────────────────────────────

interface OWMForecastEntry {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number; // m/s
  };
  pop: number; // probability of precipitation 0-1
  rain?: {
    "3h"?: number;
  };
}

/**
 * Fetch 5-day / 3-hour forecast from OpenWeatherMap.
 * Free tier: 1,000 calls/day — more than enough for 2-4 daily checks.
 */
async function fetchForecast(): Promise<OWMForecastEntry[]> {
  if (!API_KEY) {
    console.warn("[Weather] No OPENWEATHER_API_KEY configured — skipping forecast");
    return [];
  }

  const url = `${BASE_URL}/forecast?lat=${TRACK_LAT}&lon=${TRACK_LON}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Weather] API error ${res.status}: ${text}`);
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();
  return data.list || [];
}

// ── Forecast Processing ───────────────────────

/**
 * Extract forecast for a specific date and time period.
 * OpenWeatherMap gives 3-hour blocks; we average the relevant ones.
 */
function extractPeriod(
  entries: OWMForecastEntry[],
  date: string,
  startHour: number,
  endHour: number
): PeriodForecast {
  const periodEntries = entries.filter((e) => {
    const entryDate = e.dt_txt.split(" ")[0];
    const entryHour = parseInt(e.dt_txt.split(" ")[1].split(":")[0], 10);
    return entryDate === date && entryHour >= startHour && entryHour <= endHour;
  });

  if (periodEntries.length === 0) {
    return {
      tempC: 0,
      rainChance: 0,
      rainMm: 0,
      windKmh: 0,
      condition: "unknown",
      description: "No forecast data available",
      humidity: 0,
    };
  }

  // Use worst-case for rain, average for temp
  const avgTemp =
    periodEntries.reduce((sum, e) => sum + e.main.temp, 0) / periodEntries.length;
  const maxRainChance = Math.max(...periodEntries.map((e) => e.pop * 100));
  const totalRainMm = periodEntries.reduce(
    (sum, e) => sum + (e.rain?.["3h"] || 0),
    0
  );
  const maxWind = Math.max(
    ...periodEntries.map((e) => e.wind.speed * 3.6) // m/s → km/h
  );
  const avgHumidity =
    periodEntries.reduce((sum, e) => sum + e.main.humidity, 0) /
    periodEntries.length;

  // Use the worst weather condition in the period
  const conditions = periodEntries.map((e) => e.weather[0]?.main || "Clear");
  const worstCondition = conditions.includes("Thunderstorm")
    ? "Thunderstorm"
    : conditions.includes("Rain")
      ? "Rain"
      : conditions.includes("Drizzle")
        ? "Drizzle"
        : conditions.includes("Clouds")
          ? "Clouds"
          : "Clear";

  const descriptions = periodEntries.map(
    (e) => e.weather[0]?.description || "clear"
  );
  // Pick the most descriptive (longest) one
  const bestDescription = descriptions.sort((a, b) => b.length - a.length)[0];

  return {
    tempC: Math.round(avgTemp * 10) / 10,
    rainChance: Math.round(maxRainChance),
    rainMm: Math.round(totalRainMm * 10) / 10,
    windKmh: Math.round(maxWind),
    condition: worstCondition,
    description: bestDescription,
    humidity: Math.round(avgHumidity),
  };
}

/**
 * Assess the weather severity for a time period.
 */
function assessPeriod(period: PeriodForecast): WeatherAssessment {
  const { rainChance, rainMm, windKmh, condition } = period;

  // Thunderstorm = at least warning
  if (condition === THRESHOLDS.THUNDERSTORM_CONDITION) {
    if (rainChance >= THRESHOLDS.SEVERE_RAIN_CHANCE || rainMm >= THRESHOLDS.SEVERE_RAIN_MM) {
      return {
        severity: "severe",
        label: "Thunderstorm — Cancel",
        message: `Thunderstorm expected with ${rainChance}% chance of heavy rain (${rainMm}mm). Cancellation recommended for safety.`,
        rideRecommended: false,
      };
    }
    return {
      severity: "warning",
      label: "Thunderstorm possible",
      message: `Thunderstorm possible (${rainChance}% rain chance). Conditions may change — we're monitoring closely.`,
      rideRecommended: false,
    };
  }

  // Severe conditions
  if (
    rainChance >= THRESHOLDS.SEVERE_RAIN_CHANCE ||
    rainMm >= THRESHOLDS.SEVERE_RAIN_MM
  ) {
    return {
      severity: "severe",
      label: "Heavy rain expected",
      message: `${rainChance}% chance of rain with ${rainMm}mm expected. Track will likely be unsafe. Cancellation recommended.`,
      rideRecommended: false,
    };
  }

  // Warning conditions
  if (
    rainChance >= THRESHOLDS.WARNING_RAIN_CHANCE ||
    rainMm >= THRESHOLDS.WARNING_RAIN_MM ||
    windKmh >= THRESHOLDS.WARNING_WIND_KMH
  ) {
    const reasons: string[] = [];
    if (rainChance >= THRESHOLDS.WARNING_RAIN_CHANCE) reasons.push(`${rainChance}% rain chance`);
    if (rainMm >= THRESHOLDS.WARNING_RAIN_MM) reasons.push(`${rainMm}mm rain expected`);
    if (windKmh >= THRESHOLDS.WARNING_WIND_KMH) reasons.push(`${windKmh} km/h winds`);

    return {
      severity: "warning",
      label: "Rain likely",
      message: `Weather warning: ${reasons.join(", ")}. Ride may be affected — we'll update you.`,
      rideRecommended: false,
    };
  }

  // Watch conditions
  if (rainChance >= THRESHOLDS.WATCH_RAIN_CHANCE) {
    return {
      severity: "watch",
      label: "Rain possible",
      message: `${rainChance}% chance of rain. Conditions are changeable — bring rain gear just in case. We'll update you if it worsens.`,
      rideRecommended: true,
    };
  }

  // All clear
  return {
    severity: "clear",
    label: "Good conditions",
    message: `Clear weather expected. ${period.tempC}°C, ${period.humidity}% humidity. Great riding conditions!`,
    rideRecommended: true,
  };
}

// ── Public API ────────────────────────────────

/**
 * Get weather forecast for a specific date.
 * Returns morning + evening period forecasts and overall assessment.
 */
export async function getWeatherForDate(date: string): Promise<WeatherForecast> {
  const entries = await fetchForecast();

  // Morning rides: 06:00 - 09:00
  const morning = extractPeriod(entries, date, 6, 9);
  // Evening rides: 15:00 - 19:00
  const evening = extractPeriod(entries, date, 15, 19);

  // Overall = worst of morning and evening
  const morningAssessment = assessPeriod(morning);
  const eveningAssessment = assessPeriod(evening);

  const severityRank: Record<WeatherSeverity, number> = {
    clear: 0,
    watch: 1,
    warning: 2,
    severe: 3,
  };

  const overall =
    severityRank[morningAssessment.severity] >= severityRank[eveningAssessment.severity]
      ? morningAssessment
      : eveningAssessment;

  return { date, morning, evening, overall };
}

/**
 * Get forecasts for the next N days (default 3).
 * Useful for the admin dashboard.
 */
export async function getUpcomingForecasts(
  days: number = 3
): Promise<WeatherForecast[]> {
  const forecasts: WeatherForecast[] = [];
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    try {
      const forecast = await getWeatherForDate(dateStr);
      forecasts.push(forecast);
    } catch (err) {
      console.warn(`[Weather] Failed to get forecast for ${dateStr}:`, err);
    }
  }

  return forecasts;
}

/**
 * Assess weather for a specific ride session time slot.
 * Returns the relevant period's assessment based on slot timing.
 */
export function assessForSlot(
  forecast: WeatherForecast,
  timeSlotId: string
): { period: PeriodForecast; assessment: WeatherAssessment } {
  // Morning slots: A1 (06:15-08:15), A2 (06:30-08:30)
  // Evening slots: B (16:15-18:15)
  const isMorning = timeSlotId.startsWith("A");
  const period = isMorning ? forecast.morning : forecast.evening;
  const assessment = assessPeriod(period);
  return { period, assessment };
}
