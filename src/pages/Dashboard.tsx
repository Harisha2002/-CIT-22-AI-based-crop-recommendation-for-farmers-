import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Cloud, Droplets, Thermometer, Wind, Sun, CloudRain, Loader2, Wheat } from "lucide-react";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  daily: { tempMax: number[]; tempMin: number[]; precipSum: number[]; dates: string[] };
}

const weatherDescriptions: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Foggy", icon: Cloud },
  51: { label: "Light drizzle", icon: CloudRain },
  61: { label: "Slight rain", icon: CloudRain },
  63: { label: "Moderate rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  80: { label: "Rain showers", icon: CloudRain },
};

const getWeatherInfo = (code: number) => weatherDescriptions[code] || { label: "Unknown", icon: Cloud };

const Dashboard = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("New Delhi");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Default coordinates for New Delhi
        let lat = 28.6139;
        let lon = 77.209;

        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            setLocation("Your Location");
          } catch {
            // Use default
          }
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
        );
        const data = await res.json();
        setWeather({
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          daily: {
            tempMax: data.daily.temperature_2m_max,
            tempMin: data.daily.temperature_2m_min,
            precipSum: data.daily.precipitation_sum,
            dates: data.daily.time,
          },
        });
      } catch (err) {
        console.error("Weather fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const info = weather ? getWeatherInfo(weather.weatherCode) : null;
  const WeatherIcon = info?.icon || Sun;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Hello, {user?.user_metadata?.full_name || "Farmer"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your farming overview for today</p>
      </div>

      {/* Weather Card */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Weather — {location}</h2>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>

        {weather ? (
          <>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                <WeatherIcon className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <p className="text-4xl font-bold text-foreground">{Math.round(weather.temperature)}°C</p>
                <p className="text-muted-foreground">{info?.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass-card rounded-xl p-4 text-center">
                <Droplets className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="font-semibold">{weather.humidity}%</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Wind className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-sm text-muted-foreground">Wind</p>
                <p className="font-semibold">{weather.windSpeed} km/h</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Thermometer className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-sm text-muted-foreground">Feels Like</p>
                <p className="font-semibold">{Math.round(weather.temperature)}°C</p>
              </div>
            </div>

            {/* 7-day forecast */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">7-Day Forecast</h3>
            <div className="grid grid-cols-7 gap-2">
              {weather.daily.dates.map((date, i) => {
                const d = new Date(date);
                return (
                  <div key={date} className="text-center glass-card rounded-lg p-2">
                    <p className="text-xs font-medium text-muted-foreground">{dayNames[d.getDay()]}</p>
                    <p className="text-sm font-bold mt-1">{Math.round(weather.daily.tempMax[i])}°</p>
                    <p className="text-xs text-muted-foreground">{Math.round(weather.daily.tempMin[i])}°</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <Droplets className="w-3 h-3 text-primary" />
                      <span className="text-xs">{weather.daily.precipSum[i]}mm</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : !loading ? (
          <p className="text-muted-foreground">Unable to load weather data</p>
        ) : null}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <QuickCard title="Crop Advisor" desc="Get AI-powered crop suggestions" href="/crops" color="gradient-primary" />
        <QuickCard title="Disease Scanner" desc="Upload leaf images for diagnosis" href="/scan" color="gradient-gold" />
        <QuickCard title="Market Prices" desc="Check latest crop market rates" href="/market" color="gradient-earth" />
      </div>
    </div>
  );
};

const QuickCard = ({ title, desc, href, color }: { title: string; desc: string; href: string; color: string }) => (
  <a href={href} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-pointer group">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <Wheat className="w-6 h-6 text-primary-foreground" />
    </div>
    <h3 className="font-display font-bold text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
  </a>
);

export default Dashboard;
