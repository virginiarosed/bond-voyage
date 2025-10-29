import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Navigation, AlertCircle, CheckCircle2, Clock, ArrowRight, Maximize2, Minimize2, Route, Sparkles, Zap, TrendingDown, Calendar, ChevronRight, MapPinned, Info, Map as MapIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";

interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  description?: string;
}

interface Day {
  id: string;
  day: number;
  title: string;
  activities: Activity[];
}

interface RouteOptimizationPanelProps {
  itineraryDays: Day[];
  selectedDayId?: string;
  onAcceptOptimization?: (dayId: string, optimizedActivities: Activity[]) => void;
}

interface RouteAnalysis {
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  warnings: string[];
}

interface DayAnalysis {
  day: Day;
  optimizedActivities: Activity[];
  routeAnalysis: RouteAnalysis;
  showOptimized: boolean;
}

// Philippine location coordinates
const LOCATION_COORDS: { [key: string]: [number, number] } = {
  manila: [14.5995, 120.9842],
  quezon: [14.6760, 121.0437],
  makati: [14.5547, 121.0244],
  boracay: [11.9674, 121.9248],
  cebu: [10.3157, 123.8854],
  bohol: [9.8500, 124.1435],
  palawan: [9.8349, 118.7384],
  "el nido": [11.1949, 119.4013],
  coron: [12.0067, 120.2070],
  baguio: [16.4023, 120.5960],
  davao: [7.1907, 125.4553],
  siargao: [9.8600, 126.0460],
  tagaytay: [14.1088, 120.9618],
  batangas: [13.7565, 121.0583],
  vigan: [17.5747, 120.3869],
  iloilo: [10.7202, 122.5621],
  bacolod: [10.6560, 122.9500],
  dumaguete: [9.3068, 123.3054],
  "puerto princesa": [9.7392, 118.7353],
  banaue: [16.9265, 121.0571],
  sagada: [17.0831, 120.9022],
  "la union": [16.6159, 120.3209],
  subic: [14.8203, 120.2728],
  "taal volcano": [14.0021, 120.9933],
  "chocolate hills": [9.7999, 124.1658],
  "kawasan falls": [9.8132, 123.3763],
  oslob: [9.5134, 123.3908],
  moalboal: [9.9477, 123.3963],
  "mayon volcano": [13.2577, 123.6856],
  "hundred islands": [16.1992, 119.9327],
  "cloud 9": [9.8170, 126.0339],
  intramuros: [14.5900, 120.9750],
  bgc: [14.5507, 121.0494],
  taguig: [14.5176, 121.0509],
  caticlan: [11.9279, 121.9526],
  "white beach": [11.9608, 121.9263],
  "d'mall": [11.9642, 121.9272],
  "rizal park": [14.5832, 120.9794],
  mactan: [10.3115, 123.9621],
  tagbilaran: [9.6472, 123.8530],
  panglao: [9.5833, 123.7667],
  pagudpud: [18.5594, 120.7850],
  camiguin: [9.1733, 124.7297],
  batanes: [20.4486, 121.9700],
  pangasinan: [15.8949, 120.2863],
};

export function RouteOptimizationPanel({ 
  itineraryDays, 
  selectedDayId,
  onAcceptOptimization 
}: RouteOptimizationPanelProps) {
  const [dayAnalyses, setDayAnalyses] = useState<Map<string, DayAnalysis>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [mapView, setMapView] = useState<"list" | "map">("list");
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const analysisHashRef = useRef<string>("");

  // Get days with locations - memoized to avoid recalculation
  const daysWithLocations = useMemo(() => 
    itineraryDays.filter(d => d.activities.filter(a => a.location).length >= 2),
    [itineraryDays]
  );

  // Create a hash of itinerary data to detect actual changes
  const itineraryHash = useMemo(() => {
    return JSON.stringify(
      itineraryDays.map(day => ({
        id: day.id,
        activities: day.activities.map(a => ({
          id: a.id,
          location: a.location,
          time: a.time
        }))
      }))
    );
  }, [itineraryDays]);

  useEffect(() => {
    if (daysWithLocations.length > 0) {
      // Set initial active tab
      if (selectedDayId && daysWithLocations.find(d => d.id === selectedDayId)) {
        setActiveTab(selectedDayId);
      } else if (!activeTab || !daysWithLocations.find(d => d.id === activeTab)) {
        setActiveTab(daysWithLocations[0].id);
      }

      // Only analyze if the itinerary data has actually changed
      if (itineraryHash !== analysisHashRef.current) {
        analysisHashRef.current = itineraryHash;
        analyzeDays(daysWithLocations);
      }
    }
  }, [daysWithLocations, selectedDayId, itineraryHash]);

  // Initialize map when switching to map view
  useEffect(() => {
    if (mapView === "map" && mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
    
    if (mapView === "map" && mapRef.current && activeTab) {
      updateMapRoutes();
    }
  }, [mapView, activeTab, dayAnalyses, showOriginalRoute, showOptimizedRoute]);

  // Get coordinates for a location
  const getCoordinates = (location: string): [number, number] | null => {
    const normalizedLocation = location.toLowerCase().trim().split(',')[0];
    
    // Check exact match
    if (LOCATION_COORDS[normalizedLocation]) {
      return LOCATION_COORDS[normalizedLocation];
    }
    
    // Check partial match
    for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
      if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
        return coords;
      }
    }
    
    // Default to Manila area with random offset for demo purposes
    return [14.5995 + (Math.random() - 0.5) * 0.5, 120.9842 + (Math.random() - 0.5) * 0.5];
  };

  // Initialize Leaflet map
  const initializeMap = async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Dynamically import Leaflet
      const L = await import('leaflet');
      
      // Create map
      const map = L.map(mapContainerRef.current).setView([12.8797, 121.7740], 6);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = { map, L, originalMarkers: [], optimizedMarkers: [], originalPolyline: null, optimizedPolyline: null };
      
      // Update routes after map is initialized
      setTimeout(() => updateMapRoutes(), 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Map Error", {
        description: "Could not load map. Please try again.",
      });
    }
  };

  // Update map with current routes - showing BOTH routes simultaneously
  const updateMapRoutes = () => {
    if (!mapRef.current || !activeTab) return;

    const { map, L, originalMarkers, optimizedMarkers, originalPolyline, optimizedPolyline } = mapRef.current;
    const analysis = dayAnalyses.get(activeTab);
    
    if (!analysis) return;

    // Clear existing markers and polylines
    originalMarkers.forEach((marker: any) => marker.remove());
    optimizedMarkers.forEach((marker: any) => marker.remove());
    if (originalPolyline) originalPolyline.remove();
    if (optimizedPolyline) optimizedPolyline.remove();
    
    mapRef.current.originalMarkers = [];
    mapRef.current.optimizedMarkers = [];
    mapRef.current.originalPolyline = null;
    mapRef.current.optimizedPolyline = null;

    const originalActivities = analysis.day.activities.filter(a => a.location);
    const optimizedActivities = analysis.optimizedActivities;

    if (originalActivities.length === 0) return;

    const allCoords: [number, number][] = [];

    // Draw ORIGINAL route (Blue - Dashed)
    if (showOriginalRoute) {
      const originalCoords: [number, number][] = [];
      const newOriginalMarkers: any[] = [];

      originalActivities.forEach((activity, index) => {
        const coord = getCoordinates(activity.location);
        if (!coord) return;

        originalCoords.push(coord);
        allCoords.push(coord);

        // Create blue marker for original route
        const icon = L.divIcon({
          html: `<div style="background: #0A7AFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(coord, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 4px;">
            <strong style="color: #0A7AFF;">🔵 Original Route</strong><br/>
            <strong style="color: #1A2B4F;">${activity.title}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${activity.location}</span>
            ${activity.time ? `<br/><span style="color: #0A7AFF; font-size: 12px;">⏰ ${activity.time}</span>` : ''}
          </div>
        `);
        
        newOriginalMarkers.push(marker);
      });

      // Draw blue dashed polyline for original route
      if (originalCoords.length > 1) {
        const polyline = L.polyline(originalCoords, {
          color: '#0A7AFF',
          weight: 4,
          opacity: 0.7,
          dashArray: '12, 8',
        }).addTo(map);
        
        mapRef.current.originalPolyline = polyline;
      }

      mapRef.current.originalMarkers = newOriginalMarkers;
    }

    // Draw OPTIMIZED route (Green - Solid)
    if (showOptimizedRoute && analysis.routeAnalysis.timeSaved > 0) {
      const optimizedCoords: [number, number][] = [];
      const newOptimizedMarkers: any[] = [];

      optimizedActivities.forEach((activity, index) => {
        const coord = getCoordinates(activity.location);
        if (!coord) return;

        optimizedCoords.push(coord);
        if (!showOriginalRoute) allCoords.push(coord);

        // Create green marker for optimized route
        const icon = L.divIcon({
          html: `<div style="background: #10B981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; border: 3px solid white; box-shadow: 0 3px 10px rgba(16,185,129,0.5);">${index + 1}</div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(coord, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 4px;">
            <strong style="color: #10B981;">🟢 Optimized Route</strong><br/>
            <strong style="color: #1A2B4F;">${activity.title}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${activity.location}</span>
            ${activity.time ? `<br/><span style="color: #10B981; font-size: 12px;">⏰ ${activity.time}</span>` : ''}
          </div>
        `);
        
        newOptimizedMarkers.push(marker);
      });

      // Draw green solid polyline for optimized route
      if (optimizedCoords.length > 1) {
        const polyline = L.polyline(optimizedCoords, {
          color: '#10B981',
          weight: 5,
          opacity: 0.8,
        }).addTo(map);
        
        mapRef.current.optimizedPolyline = polyline;
      }

      mapRef.current.optimizedMarkers = newOptimizedMarkers;
    }

    // Fit map to show all markers
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Calculate approximate distance between two Philippine locations
  const calculateDistance = (location1: string, location2: string): number => {
    const commonRoutes: { [key: string]: number } = {
      "boracay-manila": 350,
      "manila-baguio": 250,
      "manila-cebu": 570,
      "cebu-bohol": 70,
      "manila-palawan": 580,
      "palawan-coron": 180,
      "cebu-siargao": 250,
      "manila-tagaytay": 60,
      "manila-batangas": 110,
      "cebu-oslob": 120,
    };

    const key = `${location1.toLowerCase().split(',')[0].trim()}-${location2.toLowerCase().split(',')[0].trim()}`;
    const reverseKey = `${location2.toLowerCase().split(',')[0].trim()}-${location1.toLowerCase().split(',')[0].trim()}`;
    
    if (commonRoutes[key]) return commonRoutes[key];
    if (commonRoutes[reverseKey]) return commonRoutes[reverseKey];
    
    // Use coordinates for distance calculation
    const coord1 = getCoordinates(location1);
    const coord2 = getCoordinates(location2);
    
    if (coord1 && coord2) {
      // Haversine formula
      const R = 6371; // Radius of Earth in km
      const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
      const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    
    return Math.random() * 50 + 10;
  };

  // Calculate travel time in minutes
  const calculateTravelTime = (distance: number): number => {
    return Math.round((distance / 40) * 60);
  };

  // Validate time between activities
  const validateActivityTimes = (activities: Activity[], dayNumber: number): string[] => {
    const warnings: string[] = [];
    
    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];
      
      if (!current.location || !next.location) continue;
      if (!current.time || !next.time) continue;

      const distance = calculateDistance(current.location, next.location);
      const requiredTravelTime = calculateTravelTime(distance);
      
      const currentEndTime = parseTime(current.time);
      const nextStartTime = parseTime(next.time);
      
      if (currentEndTime && nextStartTime) {
        const availableTime = (nextStartTime - currentEndTime) / (1000 * 60);
        
        if (availableTime < requiredTravelTime) {
          warnings.push(
            `${current.title} → ${next.title}: needs ${requiredTravelTime} min, only ${Math.round(availableTime)} min available`
          );
        }
      }
    }
    
    return warnings;
  };

  // Parse time string to Date object
  const parseTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch {
      return null;
    }
  };

  // Simple TSP approximation using nearest neighbor
  const optimizeRoute = (activities: Activity[]): Activity[] => {
    if (activities.length <= 2) return activities;

    const activitiesWithLocations = activities.filter(a => a.location);
    if (activitiesWithLocations.length <= 2) return activities;

    const optimized: Activity[] = [];
    const remaining = [...activitiesWithLocations];
    
    let current = remaining.shift()!;
    optimized.push(current);

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let shortestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(current.location, remaining[i].location);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = i;
        }
      }

      current = remaining.splice(nearestIndex, 1)[0];
      optimized.push(current);
    }

    const result = [...activities];
    let optimizedIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].location && optimizedIndex < optimized.length) {
        result[i] = optimized[optimizedIndex];
        optimizedIndex++;
      }
    }

    return result;
  };

  // Analyze all days - only runs when itinerary actually changes
  const analyzeDays = (days: Day[]) => {
    const newAnalyses = new Map<string, DayAnalysis>();

    days.forEach(day => {
      const originalActivities = day.activities.filter(a => a.location);
      if (originalActivities.length < 2) return;

      const optimized = optimizeRoute([...originalActivities]);

      let originalDistance = 0;
      let optimizedDistance = 0;

      for (let i = 0; i < originalActivities.length - 1; i++) {
        originalDistance += calculateDistance(
          originalActivities[i].location,
          originalActivities[i + 1].location
        );
      }

      for (let i = 0; i < optimized.length - 1; i++) {
        optimizedDistance += calculateDistance(
          optimized[i].location,
          optimized[i + 1].location
        );
      }

      const timeSaved = calculateTravelTime(originalDistance) - calculateTravelTime(optimizedDistance);
      const warnings = validateActivityTimes(originalActivities, day.day);

      newAnalyses.set(day.id, {
        day,
        optimizedActivities: optimized,
        routeAnalysis: {
          originalDistance,
          optimizedDistance,
          timeSaved,
          warnings,
        },
        showOptimized: false,
      });
    });

    setDayAnalyses(newAnalyses);
  };

  const handleShowOptimizedRoute = (dayId: string) => {
    setDayAnalyses(prev => {
      const newMap = new Map(prev);
      const analysis = newMap.get(dayId);
      if (analysis) {
        newMap.set(dayId, { ...analysis, showOptimized: true });
      }
      return newMap;
    });
    
    toast.success("Optimized Route Displayed", {
      description: "Green highlights show the optimized path.",
    });
  };

  const handleKeepCurrentRoute = (dayId: string) => {
    setDayAnalyses(prev => {
      const newMap = new Map(prev);
      const analysis = newMap.get(dayId);
      if (analysis) {
        newMap.set(dayId, { ...analysis, showOptimized: false });
      }
      return newMap;
    });
    
    toast.info("Current Route Kept", {
      description: "Your original route order has been maintained.",
    });
  };

  const handleAcceptSuggestion = (dayId: string) => {
    const analysis = dayAnalyses.get(dayId);
    if (analysis && analysis.optimizedActivities.length > 0 && onAcceptOptimization) {
      onAcceptOptimization(dayId, analysis.optimizedActivities);
      
      // Reset show optimized
      setDayAnalyses(prev => {
        const newMap = new Map(prev);
        newMap.set(dayId, { ...analysis, showOptimized: false });
        return newMap;
      });
      
      toast.success("Route Optimized!", {
        description: `Day ${analysis.day.day} reordered. You'll save ~${analysis.routeAnalysis.timeSaved} minutes!`,
      });
    }
  };

  if (daysWithLocations.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-gradient-to-br from-[rgba(10,122,255,0.02)] to-[rgba(20,184,166,0.02)]"
      >
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A7AFF]/10 to-[#14B8A6]/10 flex items-center justify-center mb-4">
            <MapPinned className="w-8 h-8 text-[#0A7AFF]" />
          </div>
          <h3 className="text-[#1A2B4F] mb-2">Route Optimization Ready</h3>
          <p className="text-sm text-[#64748B] mb-4">
            Add at least 2 activities with locations to any day and I'll analyze the most efficient routes for you.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB]">
            <Info className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-xs text-[#64748B]">Saves time by reordering activities based on location proximity</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentAnalysis = activeTab ? dayAnalyses.get(activeTab) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white flex items-center gap-2">
                Route Optimization
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-xs text-white/80">AI-powered route planning with real-time visualization</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-all duration-200"
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Multi-day Tabs */}
            {daysWithLocations.length > 1 && (
              <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] bg-gradient-to-br from-[rgba(10,122,255,0.02)] to-transparent">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto flex-nowrap">
                    {daysWithLocations.map((day) => {
                      const analysis = dayAnalyses.get(day.id);
                      const hasSavings = analysis && analysis.routeAnalysis.timeSaved > 5;
                      
                      return (
                        <TabsTrigger
                          key={day.id}
                          value={day.id}
                          className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A7AFF] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white rounded-lg px-4 py-2 transition-all whitespace-nowrap"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Day {day.day}
                          {hasSavings && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white animate-pulse" />
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-5">
              {currentAnalysis && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Day Title */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#64748B]">Day {currentAnalysis.day.day}</span>
                      <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                    </div>
                    <h4 className="text-lg text-[#1A2B4F]">{currentAnalysis.day.title}</h4>
                  </div>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border border-[#0A7AFF]/20 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                          <Route className="w-4 h-4 text-[#0A7AFF]" />
                        </div>
                        <span className="text-xs text-[#0369A1]">Original</span>
                      </div>
                      <p className="text-xl text-[#0A7AFF]">{currentAnalysis.routeAnalysis.originalDistance.toFixed(1)} km</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border border-[#10B981]/20 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <span className="text-xs text-[#065F46]">Optimized</span>
                      </div>
                      <p className="text-xl text-[#10B981]">{currentAnalysis.routeAnalysis.optimizedDistance.toFixed(1)} km</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-xl ${
                        currentAnalysis.routeAnalysis.timeSaved > 5
                          ? 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#FFB84D]/20'
                          : 'bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0] border border-[#CBD5E1]/20'
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                          {currentAnalysis.routeAnalysis.timeSaved > 5 ? (
                            <Zap className="w-4 h-4 text-[#FFB84D]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#64748B]" />
                          )}
                        </div>
                        <span className="text-xs text-[#78350F]">Time Saved</span>
                      </div>
                      <p className={`text-xl ${
                        currentAnalysis.routeAnalysis.timeSaved > 5 ? 'text-[#FFB84D]' : 'text-[#64748B]'
                      }`}>
                        {currentAnalysis.routeAnalysis.timeSaved > 0 
                          ? `~${currentAnalysis.routeAnalysis.timeSaved} min` 
                          : 'Minimal'}
                      </p>
                    </motion.div>
                  </div>

                  {/* View Toggle */}
                  <div className="mb-6 flex items-center gap-2 p-1 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB] w-fit">
                    <button
                      onClick={() => setMapView("list")}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        mapView === "list"
                          ? 'bg-white text-[#0A7AFF] shadow-sm'
                          : 'text-[#64748B] hover:text-[#1A2B4F]'
                      }`}
                    >
                      <Route className="w-4 h-4 inline mr-2" />
                      List View
                    </button>
                    <button
                      onClick={() => setMapView("map")}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        mapView === "map"
                          ? 'bg-white text-[#0A7AFF] shadow-sm'
                          : 'text-[#64748B] hover:text-[#1A2B4F]'
                      }`}
                    >
                      <MapIcon className="w-4 h-4 inline mr-2" />
                      Map View
                    </button>
                  </div>

                  {/* Visual Route Comparison */}
                  <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-[#F8FAFB] to-white border border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm text-[#1A2B4F]">Route Visualization</h5>
                      <div className="flex items-center gap-3">
                        {mapView === "map" && currentAnalysis.routeAnalysis.timeSaved > 0 && (
                          <>
                            <button
                              onClick={() => setShowOriginalRoute(!showOriginalRoute)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                showOriginalRoute 
                                  ? 'bg-[#0A7AFF] border-[#0A7AFF] text-white' 
                                  : 'bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF]'
                              }`}
                            >
                              {showOriginalRoute ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <div className="w-3 h-3 rounded-full bg-[#0A7AFF] border-2 border-white"></div>
                              <span className="text-xs">Original</span>
                            </button>
                            <button
                              onClick={() => setShowOptimizedRoute(!showOptimizedRoute)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                showOptimizedRoute 
                                  ? 'bg-[#10B981] border-[#10B981] text-white' 
                                  : 'bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#10B981]'
                              }`}
                            >
                              {showOptimizedRoute ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <div className="w-3 h-3 rounded-full bg-[#10B981] border-2 border-white"></div>
                              <span className="text-xs">Optimized</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {mapView === "list" ? (
                      /* Activities List */
                      <div className="space-y-2">
                        {(currentAnalysis.showOptimized 
                          ? currentAnalysis.optimizedActivities 
                          : currentAnalysis.day.activities.filter(a => a.location)
                        ).map((activity, index, arr) => (
                          <div key={activity.id}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                currentAnalysis.showOptimized
                                  ? 'bg-gradient-to-r from-[#ECFDF5] to-white border border-[#10B981]/30'
                                  : 'bg-white border border-[#E5E7EB]'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${
                                currentAnalysis.showOptimized
                                  ? 'bg-gradient-to-br from-[#10B981] to-[#14B8A6]'
                                  : 'bg-gradient-to-br from-[#0A7AFF] to-[#0284C7]'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#1A2B4F] truncate">{activity.title}</p>
                                <p className="text-xs text-[#64748B] truncate">{activity.location}</p>
                              </div>
                              {activity.time && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60">
                                  <Clock className="w-3 h-3 text-[#64748B]" />
                                  <span className="text-xs text-[#64748B]">{activity.time}</span>
                                </div>
                              )}
                            </motion.div>
                            
                            {index < arr.length - 1 && (
                              <div className="flex items-center gap-2 py-1 px-11">
                                <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
                                <span className="text-xs text-[#94A3B8]">
                                  {calculateDistance(activity.location, arr[index + 1].location).toFixed(1)} km
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Interactive Map - Shows BOTH routes */
                      <div className="relative">
                        <div 
                          ref={mapContainerRef}
                          className="w-full h-[450px] rounded-xl overflow-hidden border-2 border-[#E5E7EB]"
                          style={{ background: '#F8FAFB' }}
                        />
                        {!mapRef.current && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center mx-auto mb-2 animate-pulse">
                                <MapIcon className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-sm text-[#64748B]">Loading map...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Map Legend */}
                        {mapRef.current && currentAnalysis.routeAnalysis.timeSaved > 0 && (
                          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-[#E5E7EB] z-[1000]">
                            <p className="text-xs text-[#64748B] mb-2">Route Comparison</p>
                            {showOriginalRoute && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-4 h-0.5 bg-[#0A7AFF] border-dashed border-2 border-[#0A7AFF]"></div>
                                <span className="text-xs text-[#1A2B4F]">Original ({currentAnalysis.routeAnalysis.originalDistance.toFixed(1)} km)</span>
                              </div>
                            )}
                            {showOptimizedRoute && (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-[#10B981] rounded"></div>
                                <span className="text-xs text-[#1A2B4F]">Optimized ({currentAnalysis.routeAnalysis.optimizedDistance.toFixed(1)} km)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {currentAnalysis.routeAnalysis.warnings.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] border border-[#FFB84D]/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-[#FFB84D]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#1A2B4F] mb-2">⚠️ Travel Time Alerts</p>
                          <ul className="space-y-1.5">
                            {currentAnalysis.routeAnalysis.warnings.map((warning, index) => (
                              <li key={index} className="text-xs text-[#78350F] flex items-start gap-2">
                                <span className="text-[#FFB84D] mt-0.5">•</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Optimization Suggestion */}
                  {currentAnalysis.routeAnalysis.timeSaved > 5 && !currentAnalysis.showOptimized && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] border-2 border-[#10B981]/30 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center flex-shrink-0 shadow-lg">
                          <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#1A2B4F] mb-1">
                            🎯 We found a more efficient route that saves you{" "}
                            <span className="font-semibold text-[#10B981]">{currentAnalysis.routeAnalysis.timeSaved} minutes</span> of travel time!
                          </p>
                          <p className="text-xs text-[#064E3B]">
                            Reduces distance from {currentAnalysis.routeAnalysis.originalDistance.toFixed(1)} km to{" "}
                            {currentAnalysis.routeAnalysis.optimizedDistance.toFixed(1)} km using smart routing.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!currentAnalysis.showOptimized && currentAnalysis.routeAnalysis.timeSaved > 5 ? (
                      <Button
                        onClick={() => handleShowOptimizedRoute(activeTab)}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white hover:shadow-lg hover:shadow-[#10B981]/30 transition-all"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Show Optimized Route
                      </Button>
                    ) : currentAnalysis.showOptimized ? (
                      <>
                        <Button
                          onClick={() => handleKeepCurrentRoute(activeTab)}
                          variant="outline"
                          className="flex-1 h-12 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] transition-all"
                        >
                          Keep Current
                        </Button>
                        <Button
                          onClick={() => handleAcceptSuggestion(activeTab)}
                          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white hover:shadow-lg hover:shadow-[#0A7AFF]/30 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Apply Optimization
                        </Button>
                      </>
                    ) : (
                      <div className="flex-1 p-4 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB] text-center">
                        <p className="text-sm text-[#64748B]">
                          ✓ Your current route is already optimal!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
