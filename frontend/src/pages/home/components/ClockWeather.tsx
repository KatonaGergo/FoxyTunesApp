import React, { useEffect, useState } from "react";

interface ClockWeatherProps {
  country: string | null;
  localTime: string;
  loading: boolean;
  coords?: { lat: number; lon: number } | null;
}

const DEFAULT_CITY = "Kuala Lumpur";

const getCityFromCountry = (country: string | null): string => {
  if (!country) return DEFAULT_CITY;
  if (country === "Hungary") return "Budapest";
  if (country === "Malaysia") return "Kuala Lumpur";
  // For all other countries, always use DEFAULT_CITY
  return DEFAULT_CITY;
};

const ClockWeather: React.FC<ClockWeatherProps> = ({ country, localTime, loading, coords }) => {
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const apiKey = import.meta.env.VITE_WEATHERAPI_KEY;

  useEffect(() => {
    setWeatherLoading(true);
    let query = "";
    if (coords && typeof coords.lat === "number" && typeof coords.lon === "number") {
      query = `${coords.lat},${coords.lon}`;
    } else {
      query = getCityFromCountry(country);
    }
    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=no`
    )
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setWeatherLoading(false);
      })
      .catch(() => setWeatherLoading(false));
  }, [coords, country, apiKey]);

  return (
    <div className="flex flex-col items-center px-4 py-2 bg-dark-black rounded-xl shadow border border-zinc-700 min-w-[140px]">
      <div className="text-2xl font-mono font-bold text-pink-200 leading-none">
        {loading ? "Locating..." : localTime}
      </div>
      {country && !loading && (
        <div className="text-xs text-zinc-400 mt-1">{country}</div>
      )}
      <div className="mt-2 w-full flex flex-col items-center gap-1">
        {weatherLoading ? (
          <div className="text-xs text-zinc-400">Loading weather...</div>
        ) : weather && weather.current ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span role="img" aria-label="Temperature">🌡️</span>
              <span>{Math.round(weather.current.temp_c)}°C</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span role="img" aria-label="Wind">💨</span>
              <span>{Math.round(weather.current.wind_kph / 3.6)} m/s</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span role="img" aria-label="Humidity">💧</span>
              <span>{weather.current.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span role="img" aria-label="Weather">{weather.current.condition.text.includes("Clear") ? "☀️" : weather.current.condition.text.includes("Cloud") ? "☁️" : weather.current.condition.text.includes("Rain") ? "🌧️" : "🌤️"}</span>
              <span>{weather.current.condition.text}</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-zinc-400">No weather data</div>
        )}
      </div>
    </div>
  );
};

export default ClockWeather; 