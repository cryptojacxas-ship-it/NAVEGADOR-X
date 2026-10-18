import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, MapPin, Clock, Sparkles, Check, ChevronDown, Compass, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type ThemeType = 'Dark Space' | 'Light Aura';
export type SwitchMode = 'auto_time' | 'auto_geo' | 'manual';

interface ThemeSelectorProps {
  currentTheme: ThemeType;
  switchMode: SwitchMode;
  onThemeChange: (theme: ThemeType, mode: SwitchMode) => void;
}

interface GeoData {
  latitude: number | null;
  longitude: number | null;
  sunriseStr: string | null;
  sunsetStr: string | null;
  isDaytime: boolean | null;
  locationName: string | null;
  loading: boolean;
  error: string | null;
}

// Simple approximation for sunrise/sunset based on latitude & day of year
function calculateSunriseSunset(lat: number, lng: number, date: Date) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  // Hour angle
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);
  
  // Clamped for polar days/nights
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = Math.acos(clampedCos) * (180 / Math.PI);

  const solarNoonUtcMinutes = 720 - (lng * 4); // 12:00 UTC offset by longitude
  const dayLengthMinutes = (hourAngle / 180) * 720;

  const sunriseUtcMinutes = solarNoonUtcMinutes - (dayLengthMinutes / 2);
  const sunsetUtcMinutes = solarNoonUtcMinutes + (dayLengthMinutes / 2);

  // Convert to local time
  const timezoneOffsetMinutes = -date.getTimezoneOffset(); // in minutes
  const localSunriseMinutes = (sunriseUtcMinutes + timezoneOffsetMinutes + 1440) % 1440;
  const localSunsetMinutes = (sunsetUtcMinutes + timezoneOffsetMinutes + 1440) % 1440;

  const formatMinutes = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60) % 24;
    const mins = Math.floor(totalMinutes % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const currentLocalMinutes = date.getHours() * 60 + date.getMinutes();
  const isDaytime = currentLocalMinutes >= localSunriseMinutes && currentLocalMinutes < localSunsetMinutes;

  return {
    sunriseStr: formatMinutes(localSunriseMinutes),
    sunsetStr: formatMinutes(localSunsetMinutes),
    isDaytime
  };
}

export function ThemeSelector({ currentTheme, switchMode, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [geoData, setGeoData] = useState<GeoData>({
    latitude: null,
    longitude: null,
    sunriseStr: null,
    sunsetStr: null,
    isDaytime: null,
    locationName: null,
    loading: false,
    error: null,
  });

  // Check local time switch condition (6:00 AM to 18:59 PM = Light Aura, 19:00 PM to 5:59 AM = Dark Space)
  const isDayByTime = () => {
    const now = new Date();
    const hrs = now.getHours();
    return hrs >= 6 && hrs < 19;
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoData((prev) => ({ ...prev, error: 'Geolocalización no soportada por el navegador' }));
      return;
    }

    setGeoData((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = new Date();
        const solar = calculateSunriseSunset(lat, lng, now);

        setGeoData({
          latitude: lat,
          longitude: lng,
          sunriseStr: solar.sunriseStr,
          sunsetStr: solar.sunsetStr,
          isDaytime: solar.isDaytime,
          locationName: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
          loading: false,
          error: null,
        });

        // Auto apply theme if mode is auto_geo
        const calculatedTheme: ThemeType = solar.isDaytime ? 'Light Aura' : 'Dark Space';
        onThemeChange(calculatedTheme, 'auto_geo');
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGeoData((prev) => ({
          ...prev,
          loading: false,
          error: 'Permiso denegado o ubicación no disponible. Usando hora local.',
        }));
        // Fallback to time-based
        const calculatedTheme: ThemeType = isDayByTime() ? 'Light Aura' : 'Dark Space';
        onThemeChange(calculatedTheme, 'auto_time');
      },
      { timeout: 8000 }
    );
  };

  // Evaluate auto theme whenever mode changes or periodically
  useEffect(() => {
    if (switchMode === 'auto_time') {
      const calculatedTheme: ThemeType = isDayByTime() ? 'Light Aura' : 'Dark Space';
      if (calculatedTheme !== currentTheme) {
        onThemeChange(calculatedTheme, 'auto_time');
      }
    } else if (switchMode === 'auto_geo') {
      if (!geoData.latitude) {
        requestGeolocation();
      } else if (geoData.isDaytime !== null) {
        const calculatedTheme: ThemeType = geoData.isDaytime ? 'Light Aura' : 'Dark Space';
        if (calculatedTheme !== currentTheme) {
          onThemeChange(calculatedTheme, 'auto_geo');
        }
      }
    }
  }, [switchMode]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer border select-none shadow-xs",
          currentTheme === 'Light Aura'
            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
        )}
        title={`Tema actual: ${currentTheme} (${switchMode === 'auto_time' ? 'Auto Hora' : switchMode === 'auto_geo' ? 'Auto Geolocalización' : 'Manual'})`}
      >
        {currentTheme === 'Light Aura' ? (
          <Sun size={12} className="text-amber-500 animate-spin-slow" />
        ) : (
          <Moon size={12} className="text-indigo-400" />
        )}
        <span className="hidden sm:inline font-mono">{currentTheme}</span>
        <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#141518] dark-aura-panel border border-white/10 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl p-3 text-xs font-sans"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-brand-cyan" />
                Selector de Tema Inteligente
              </span>
              <span className="text-brand-cyan font-mono text-[9px]">{currentTheme}</span>
            </div>

            {/* Quick Theme Selector Buttons */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  onThemeChange('Dark Space', 'manual');
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer",
                  currentTheme === 'Dark Space' && switchMode === 'manual'
                    ? "bg-indigo-500/20 border-indigo-500 text-white font-semibold"
                    : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                )}
              >
                <Moon size={14} className="text-indigo-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold truncate">Dark Space</span>
                  <span className="text-[8px] text-gray-400 font-mono">Modo Noche</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onThemeChange('Light Aura', 'manual');
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer",
                  currentTheme === 'Light Aura' && switchMode === 'manual'
                    ? "bg-amber-500/20 border-amber-500 text-white font-semibold"
                    : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                )}
              >
                <Sun size={14} className="text-amber-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold truncate">Light Aura</span>
                  <span className="text-[8px] text-gray-400 font-mono">Modo Día</span>
                </div>
              </button>
            </div>

            {/* Automatic Mode Options */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Conmutación Automática
              </span>

              {/* Time Based Option */}
              <button
                type="button"
                onClick={() => {
                  const calculatedTheme: ThemeType = isDayByTime() ? 'Light Aura' : 'Dark Space';
                  onThemeChange(calculatedTheme, 'auto_time');
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer",
                  switchMode === 'auto_time'
                    ? "bg-brand-cyan/15 border-brand-cyan text-white"
                    : "bg-white/5 border-transparent text-gray-300 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-brand-cyan shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">Por Hora del Sistema</span>
                    <span className="text-[8px] text-gray-400 font-mono">Día (06:00 - 19:00) / Noche</span>
                  </div>
                </div>
                {switchMode === 'auto_time' && <Check size={12} className="text-brand-cyan" />}
              </button>

              {/* Geolocation Based Option */}
              <button
                type="button"
                onClick={() => {
                  requestGeolocation();
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer",
                  switchMode === 'auto_geo'
                    ? "bg-purple-500/15 border-purple-500 text-white"
                    : "bg-white/5 border-transparent text-gray-300 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-purple-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">Por Geolocalización (Sol)</span>
                    <span className="text-[8px] text-gray-400 font-mono">
                      {geoData.locationName ? `Ubicación: ${geoData.locationName}` : 'Amanecer / Atardecer exacto'}
                    </span>
                  </div>
                </div>
                {geoData.loading ? (
                  <RefreshCw size={12} className="animate-spin text-purple-400" />
                ) : (
                  switchMode === 'auto_geo' && <Check size={12} className="text-purple-400" />
                )}
              </button>
            </div>

            {/* Geolocation details display */}
            {switchMode === 'auto_geo' && (
              <div className="mt-2.5 p-2 rounded bg-black/40 border border-white/5 text-[9px] font-mono space-y-1 text-gray-400">
                {geoData.loading && <p className="text-purple-300 animate-pulse">Obteniendo coordenadas de GPS...</p>}
                {geoData.error && <p className="text-rose-400">{geoData.error}</p>}
                {geoData.latitude && !geoData.loading && (
                  <>
                    <div className="flex justify-between text-gray-300">
                      <span>Coordenadas:</span>
                      <span className="text-purple-300">{geoData.latitude.toFixed(2)}°, {geoData.longitude?.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amanecer / Atardecer:</span>
                      <span className="text-amber-400">{geoData.sunriseStr} / {geoData.sunsetStr}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Estado Solar Local:</span>
                      <span className={geoData.isDaytime ? "text-amber-400" : "text-indigo-400"}>
                        {geoData.isDaytime ? '☀️ Día Sol Detectado' : '🌙 Noche Detectada'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-white/5 text-[8px] text-gray-500 font-mono text-center">
              Navegador X Sync • Cambio Dinámico
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
