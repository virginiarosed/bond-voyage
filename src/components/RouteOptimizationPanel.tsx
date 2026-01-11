import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Route,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ChevronRight,
  MapPinned,
  Info,
  Map as MapIcon,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useOptimizeRoute } from "../hooks/useOptimizeRoute";
import { isMeaningfulLocation } from "../utils/helpers/isMeaningFulLocation";
import { LOCATION_COORDS } from "../utils/constants/constants";
import type { Place } from "../types/types";

interface Activity {
  id: string;
  time: string;
  icon: string;
  title: string;
  description: string;
  location: string;
  locationData?: Place;
  order: number;
}

interface Day {
  id: string;
  dayNumber: number;
  title?: string;
  activities: Activity[];
}

interface RouteOptimizationPanelProps {
  itineraryDays: Day[];
  selectedDayId?: string;
  onAcceptOptimization?: (
    dayId: string,
    optimizedActivities: Activity[]
  ) => void;
}

interface RouteAnalysis {
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  optimizedOrder?: number[];
  routeGeometry?: {
    type: string;
    coordinates: number[][][];
  };
  totalTime?: number;
}

interface DayAnalysis {
  day: Day;
  optimizedActivities: Activity[];
  routeAnalysis: RouteAnalysis;
  isLoading?: boolean;
}

interface MapInstance {
  map: any;
  L: any;
  originalMarkers: any[];
  optimizedMarkers: any[];
  originalPolyline: any;
  optimizedPolyline: any;
}

export function RouteOptimizationPanel({
  itineraryDays,
  selectedDayId,
  onAcceptOptimization,
}: RouteOptimizationPanelProps) {
  const [dayAnalyses, setDayAnalyses] = useState<Map<string, DayAnalysis>>(
    new Map()
  );
  const [activeTab, setActiveTab] = useState<string>("");
  const [mapView, setMapView] = useState<"list" | "map">("list");
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapRef = useRef<MapInstance | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const optimizationTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingOptimizationsRef = useRef<Set<string>>(new Set());

  const { mutate: optimizeRoute, isPending: isOptimizing } = useOptimizeRoute();

  // Filter to only include days with valid Philippine locations
  const daysWithValidLocations = useMemo(
    () =>
      itineraryDays.filter((d) => {
        const validLocations = d.activities.filter(
          (a) =>
            isMeaningfulLocation(a.location) &&
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        );
        return validLocations.length >= 2;
      }),
    [itineraryDays]
  );

  const getCoordinates = useCallback(
    (locationOrPlace: string | Place): [number, number] | null => {
      if (!locationOrPlace) return null;

      // If a Place object is provided, prefer its lat/lng
      if (
        typeof locationOrPlace === "object" &&
        typeof (locationOrPlace as Place).lat === "number" &&
        typeof (locationOrPlace as Place).lng === "number"
      ) {
        const p = locationOrPlace as Place;
        return [p.lat, p.lng];
      }

      const location = locationOrPlace as string;
      if (!isMeaningfulLocation(location)) {
        console.log("Location too short:", location);
        return null;
      }

      const normalizedLocation = location.toLowerCase().trim().split(",")[0];

      if (LOCATION_COORDS[normalizedLocation]) {
        return LOCATION_COORDS[normalizedLocation] as [number, number];
      }

      for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
        if (
          normalizedLocation.includes(key) ||
          key.includes(normalizedLocation)
        ) {
          return coords as [number, number];
        }
      }

      console.log("No coordinates found for:", location);
      return null;
    },
    []
  );

  const calculateDistance = useCallback(
    (coord1: [number, number], coord2: [number, number]): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
      const dLon = ((coord2[1] - coord1[1]) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coord1[0] * Math.PI) / 180) *
          Math.cos((coord2[0] * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const calculateTravelTime = useCallback((distance: number): number => {
    return Math.round((distance / 40) * 60);
  }, []);

  const validateOptimizationData = useCallback((data: any): boolean => {
    if (!data || !data.activities || !Array.isArray(data.activities)) {
      console.error("Invalid data structure: missing activities array");
      return false;
    }

    if (data.activities.length < 2) {
      console.error("Not enough activities:", data.activities.length);
      return false;
    }

    for (const activity of data.activities) {
      if (typeof activity.id !== "string" || !activity.id.trim()) {
        console.error("Missing or invalid id in activity:", activity);
        return false;
      }

      if (
        typeof activity.lat !== "number" ||
        typeof activity.lng !== "number"
      ) {
        console.error("Invalid coordinates in activity:", activity);
        return false;
      }
    }

    return true;
  }, []);

  const prepareRouteOptimizationData = useCallback(
    (activities: Activity[]) => {
      // Filter for meaningful activities with valid locations and coordinates
      const meaningfulActivities = activities.filter(
        (a) =>
          isMeaningfulLocation(a.location) &&
          a.locationData &&
          typeof a.locationData.lat === "number" &&
          typeof a.locationData.lng === "number"
      );

      // Check if we have enough activities for the API (minimum 4)
      if (meaningfulActivities.length < 4) {
        console.log(
          "Not enough activities with valid locations for API optimization:",
          meaningfulActivities.length
        );
        return null; // Will fall back to local optimization
      }

      const formattedActivities = [];
      let firstCoords: [number, number] | null = null;
      let lastCoords: [number, number] | null = null;

      for (let i = 0; i < meaningfulActivities.length; i++) {
        const activity = meaningfulActivities[i];
        const coords = getCoordinates(
          activity.locationData ?? activity.location
        );
        if (!coords) {
          console.log("Could not get coordinates for:", activity.location);
          continue;
        }

        const activityId = activity.id || `activity-${Date.now()}-${i}`;

        // Ensure time is a string (not null) - use empty string if null
        const activityTime = activity.time || "";

        formattedActivities.push({
          id: activityId,
          lat: coords[0],
          lng: coords[1],
          name: activity.title,
          location: activity.location,
          time: activityTime, // Always a string
        });

        if (formattedActivities.length === 1) {
          firstCoords = coords;
        }
        lastCoords = coords;
      }

      // Final check - need at least 4 activities for API
      if (formattedActivities.length < 4) {
        console.log(
          "Not enough valid coordinates for API optimization:",
          formattedActivities.length
        );
        return null; // Will fall back to local optimization
      }

      console.log("Preparing optimization data for API:", {
        activitiesCount: formattedActivities.length,
        hasTimeFields: formattedActivities.every(
          (a) => typeof a.time === "string"
        ),
      });

      // Ensure we always have origin and destination
      if (!firstCoords || !lastCoords) {
        console.error("Missing origin or destination coordinates");
        return null;
      }

      // Format coordinates as strings "lat,lng"
      const originString = `${firstCoords[0]},${firstCoords[1]}`;
      const destinationString = `${lastCoords[0]},${lastCoords[1]}`;

      return {
        activities: formattedActivities,
        origin: originString,
        destination: destinationString,
      };
    },
    [getCoordinates]
  );

  const calculateOriginalRouteDistance = useCallback(
    (activities: Activity[]): number => {
      let totalDistance = 0;
      const activitiesWithValidLocations = activities.filter(
        (a) =>
          isMeaningfulLocation(a.location) &&
          a.locationData &&
          typeof a.locationData.lat === "number" &&
          typeof a.locationData.lng === "number"
      );

      for (let i = 0; i < activitiesWithValidLocations.length - 1; i++) {
        const coord1 = getCoordinates(
          activitiesWithValidLocations[i].locationData ??
            activitiesWithValidLocations[i].location
        );
        const coord2 = getCoordinates(
          activitiesWithValidLocations[i + 1].locationData ??
            activitiesWithValidLocations[i + 1].location
        );

        if (coord1 && coord2) {
          totalDistance += calculateDistance(coord1, coord2);
        }
      }

      return totalDistance;
    },
    [getCoordinates, calculateDistance]
  );

  const optimizeRouteLocally = useCallback(
    (activities: Activity[]): Activity[] => {
      if (activities.length <= 2) return activities;

      const activitiesWithLocations = activities.filter(
        (a) =>
          isMeaningfulLocation(a.location) &&
          a.locationData &&
          typeof a.locationData.lat === "number" &&
          typeof a.locationData.lng === "number"
      );
      if (activitiesWithLocations.length <= 2) return activities;

      const firstActivity = activitiesWithLocations[0];
      const lastActivity =
        activitiesWithLocations[activitiesWithLocations.length - 1];
      const middleActivities = activitiesWithLocations.slice(1, -1);

      if (middleActivities.length === 0) return activitiesWithLocations;

      const optimized: Activity[] = [firstActivity];
      const remaining = [...middleActivities];

      let current = firstActivity;

      while (remaining.length > 0) {
        let nearestIndex = 0;
        let shortestDistance = Infinity;

        for (let i = 0; i < remaining.length; i++) {
          const coord1 = getCoordinates(
            current.locationData ?? current.location
          );
          const coord2 = getCoordinates(
            remaining[i].locationData ?? remaining[i].location
          );

          if (coord1 && coord2) {
            const distance = calculateDistance(coord1, coord2);
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestIndex = i;
            }
          }
        }

        current = remaining.splice(nearestIndex, 1)[0];
        optimized.push(current);
      }

      optimized.push(lastActivity);

      return optimized.map((activity, index) => ({
        ...activity,
        order: index,
      }));
    },
    [getCoordinates, calculateDistance]
  );

  const processOptimizationResponse = useCallback(
    (
      response: any,
      originalActivities: Activity[]
    ): { optimizedActivities: Activity[]; routeData?: any } => {
      console.log("Processing API response:", response);

      if (
        response?.data?.activities &&
        Array.isArray(response.data.activities)
      ) {
        // Map the optimized order back to original activities by ID
        const optimizedActivities = response.data.activities
          .map((activityData: any) => {
            const original = originalActivities.find(
              (a) => a.id === activityData.id
            );
            if (original) return original;

            console.warn(
              "Could not find original activity for:",
              activityData.id
            );
            return originalActivities[0]; // Fallback
          })
          .filter(Boolean);

        return {
          optimizedActivities,
          routeData: {
            geometry: response.data.routeGeometry,
            totalDistance: response.data.totalDistance,
            totalTime: response.data.totalTime,
          },
        };
      }

      if (response?.activities && Array.isArray(response.activities)) {
        const optimizedActivities = response.activities
          .map((activityData: any) => {
            const original = originalActivities.find(
              (a) => a.id === activityData.id
            );
            if (original) return original;
            return originalActivities[0];
          })
          .filter(Boolean);

        return {
          optimizedActivities,
          routeData: response.routeGeometry
            ? {
                geometry: response.routeGeometry,
                totalDistance: response.totalDistance,
                totalTime: response.totalTime,
              }
            : undefined,
        };
      }

      console.log(
        "No valid optimization data in response, using local optimization"
      );
      return {
        optimizedActivities: optimizeRouteLocally(originalActivities),
        routeData: undefined,
      };
    },
    [optimizeRouteLocally]
  );

  const sendOptimizationRequest = useCallback(
    (day: Day, dayId: string) => {
      // prevent duplicate concurrent optimizations
      if (pendingOptimizationsRef.current.has(dayId)) {
        console.log("Already optimizing day:", dayId);
        return;
      }

      // clear any existing timer for this specific day
      const existing = optimizationTimerRef.current.get(dayId);
      if (existing) {
        clearTimeout(existing);
      }

      // if this day doesn't have at least 2 activities with coordinates, don't schedule
      const hasValidLocations =
        day.activities.filter(
          (a) =>
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        ).length >= 2;

      if (!hasValidLocations) {
        // ensure we don't leave a stale timer
        const stale = optimizationTimerRef.current.get(dayId);
        if (stale) {
          clearTimeout(stale);
          optimizationTimerRef.current.delete(dayId);
        }
        return;
      }

      const timer = setTimeout(() => {
        // remove scheduled timer reference immediately
        optimizationTimerRef.current.delete(dayId);
        // In your sendOptimizationRequest function, add this check:
        const originalActivities = day.activities.filter(
          (a) =>
            isMeaningfulLocation(a.location) &&
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        );

        const originalDistance =
          calculateOriginalRouteDistance(originalActivities);

        // Check if we have enough activities for API optimization (minimum 4)
        if (originalActivities.length < 4) {
          console.log(
            "Not enough activities for API optimization, using local optimization"
          );
          const optimized = optimizeRouteLocally(originalActivities);
          const optimizedDistance = calculateOriginalRouteDistance(optimized);
          const timeSaved =
            calculateTravelTime(originalDistance) -
            calculateTravelTime(optimizedDistance);

          setDayAnalyses((prev) => {
            const updated = new Map(prev);
            const current = updated.get(dayId);
            if (current) {
              updated.set(dayId, {
                ...current,
                optimizedActivities: optimized,
                routeAnalysis: {
                  originalDistance,
                  optimizedDistance,
                  timeSaved,
                },
                isLoading: false,
              });
            }
            return updated;
          });

          pendingOptimizationsRef.current.delete(dayId);
          return;
        }

        if (originalActivities.length < 2) {
          console.log("Not enough valid locations after delay for day:", dayId);
          return;
        }

        pendingOptimizationsRef.current.add(dayId);

        const optimizationData =
          prepareRouteOptimizationData(originalActivities);

        if (!optimizationData || !validateOptimizationData(optimizationData)) {
          console.log("Invalid optimization data for day", dayId);
          const optimized = optimizeRouteLocally(originalActivities);
          const optimizedDistance = calculateOriginalRouteDistance(optimized);
          const timeSaved =
            calculateTravelTime(originalDistance) -
            calculateTravelTime(optimizedDistance);

          setDayAnalyses((prev) => {
            const updated = new Map(prev);
            const current = updated.get(dayId);
            if (current) {
              updated.set(dayId, {
                ...current,
                optimizedActivities: optimized,
                routeAnalysis: {
                  originalDistance,
                  optimizedDistance,
                  timeSaved,
                },
                isLoading: false,
              });
            }
            return updated;
          });

          pendingOptimizationsRef.current.delete(dayId);
          return;
        }

        setDayAnalyses((prev) => {
          const updated = new Map(prev);
          const current = updated.get(dayId);
          if (current) {
            updated.set(dayId, {
              ...current,
              isLoading: true,
            });
          }
          return updated;
        });

        optimizeRoute(optimizationData, {
          onSuccess: (response) => {
            const { optimizedActivities, routeData } =
              processOptimizationResponse(response, originalActivities);

            const optimizedDistance = routeData?.totalDistance
              ? routeData.totalDistance / 1000 // Convert meters to km
              : calculateOriginalRouteDistance(optimizedActivities);

            const optimizedTime = routeData?.totalTime
              ? Math.round(routeData.totalTime / 60) // Convert seconds to minutes
              : calculateTravelTime(optimizedDistance);

            const timeSaved =
              calculateTravelTime(originalDistance) - optimizedTime;

            setDayAnalyses((prev) => {
              const updated = new Map(prev);
              const current = updated.get(dayId);
              if (current) {
                updated.set(dayId, {
                  ...current,
                  optimizedActivities,
                  routeAnalysis: {
                    ...current.routeAnalysis,
                    optimizedDistance,
                    timeSaved,
                    routeGeometry: routeData?.geometry,
                    totalTime: optimizedTime,
                  },
                  isLoading: false,
                });
              }
              return updated;
            });

            pendingOptimizationsRef.current.delete(dayId);
          },
          onError: (error: any) => {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Could not optimize route";

            toast.error("Optimization Failed", {
              description: `${errorMessage}. Using local optimization.`,
            });

            const optimized = optimizeRouteLocally(originalActivities);
            const optimizedDistance = calculateOriginalRouteDistance(optimized);
            const timeSaved =
              calculateTravelTime(originalDistance) -
              calculateTravelTime(optimizedDistance);

            setDayAnalyses((prev) => {
              const updated = new Map(prev);
              const current = updated.get(dayId);
              if (current) {
                updated.set(dayId, {
                  ...current,
                  optimizedActivities: optimized,
                  routeAnalysis: {
                    originalDistance,
                    optimizedDistance,
                    timeSaved,
                  },
                  isLoading: false,
                });
              }
              return updated;
            });

            pendingOptimizationsRef.current.delete(dayId);
          },
        });
      }, 1500);

      // store per-day timer so subsequent changes for other days don't cancel this one
      optimizationTimerRef.current.set(dayId, timer);
    },
    [
      optimizeRoute,
      calculateOriginalRouteDistance,
      prepareRouteOptimizationData,
      validateOptimizationData,
      optimizeRouteLocally,
      processOptimizationResponse,
      calculateTravelTime,
    ]
  );

  useEffect(() => {
    const initializeAnalyses = () => {
      if (daysWithValidLocations.length === 0) {
        setDayAnalyses(new Map());
        setActiveTab("");
        return;
      }

      const newAnalyses = new Map<string, DayAnalysis>();

      for (const day of daysWithValidLocations) {
        const originalActivities = day.activities.filter(
          (a) =>
            isMeaningfulLocation(a.location) &&
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        );
        if (originalActivities.length < 2) continue;

        const originalDistance =
          calculateOriginalRouteDistance(originalActivities);

        const locallyOptimized = optimizeRouteLocally(originalActivities);
        const localOptimizedDistance =
          calculateOriginalRouteDistance(locallyOptimized);
        const localTimeSaved =
          calculateTravelTime(originalDistance) -
          calculateTravelTime(localOptimizedDistance);

        newAnalyses.set(day.id, {
          day,
          optimizedActivities: locallyOptimized,
          routeAnalysis: {
            originalDistance,
            optimizedDistance: localOptimizedDistance,
            timeSaved: localTimeSaved,
          },
          isLoading: false,
        });

        sendOptimizationRequest(day, day.id);
      }

      setDayAnalyses(newAnalyses);

      if (
        selectedDayId &&
        daysWithValidLocations.find((d) => d.id === selectedDayId)
      ) {
        setActiveTab(selectedDayId);
      } else if (
        !activeTab ||
        !daysWithValidLocations.find((d) => d.id === activeTab)
      ) {
        setActiveTab(daysWithValidLocations[0]?.id || "");
      }
    };

    initializeAnalyses();

    return () => {
      // clear all pending timers
      for (const t of optimizationTimerRef.current.values()) {
        clearTimeout(t);
      }
      optimizationTimerRef.current.clear();
      pendingOptimizationsRef.current.clear();
    };
  }, [
    daysWithValidLocations,
    selectedDayId,
    calculateOriginalRouteDistance,
    optimizeRouteLocally,
    calculateTravelTime,
    sendOptimizationRequest,
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current?.map) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleAcceptOptimization = (dayId: string) => {
    const analysis = dayAnalyses.get(dayId);
    if (
      analysis &&
      analysis.optimizedActivities.length > 0 &&
      onAcceptOptimization
    ) {
      onAcceptOptimization(dayId, analysis.optimizedActivities);
      toast.success("Route Optimized!", {
        description: `Day ${analysis.day.dayNumber} reordered. You'll save ~${analysis.routeAnalysis.timeSaved} minutes!`,
      });
    }
  };

  if (daysWithValidLocations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-linear-to-br from-[rgba(10,122,255,0.02)] to-[rgba(20,184,166,0.02)]"
      >
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#0A7AFF]/10 to-[#14B8A6]/10 flex items-center justify-center mb-4">
            <MapPinned className="w-8 h-8 text-[#0A7AFF]" />
          </div>
          <h3 className="text-[#1A2B4F] mb-2">Route Optimization Ready</h3>
          <p className="text-sm text-[#64748B] mb-4">
            Add at least 4 activities with valid Philippine locations from the
            location suggestions to any day for AI-powered optimization. For 2-3
            activities, basic local optimization will be used.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB]">
            <Info className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-xs text-[#64748B]">
              AI optimization (4+ activities) • Local optimization (2-3
              activities)
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
    >
      <div className="p-5 bg-linear-to-r from-[#0A7AFF] to-[#14B8A6]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Route className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white flex items-center gap-2">
              Route Optimization
              <Sparkles className="w-4 h-4" />
            </h3>
            <p className="text-xs text-white/80">
              AI-powered route planning to save travel time
            </p>
            {isOptimizing && (
              <div className="flex items-center gap-2 mt-2 text-xs text-white/90">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing routes...
              </div>
            )}
          </div>
        </div>
      </div>

      {daysWithValidLocations.length > 1 && (
        <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] bg-linear-to-br from-[rgba(10,122,255,0.02)] to-transparent">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto flex-nowrap">
              {daysWithValidLocations.map((day) => {
                const analysis = dayAnalyses.get(day.id);
                const hasSavings =
                  analysis && analysis.routeAnalysis.timeSaved > 5;
                const isLoading = analysis?.isLoading;

                return (
                  <TabsTrigger
                    key={day.id}
                    value={day.id}
                    className="relative data-[state=active]:bg-linear-to-r data-[state=active]:from-[#0A7AFF] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white rounded-lg px-4 py-2 transition-all whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Day {day.dayNumber}
                    {isLoading && (
                      <Loader2 className="w-3 h-3 ml-2 animate-spin" />
                    )}
                    {!isLoading && hasSavings && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white animate-pulse" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="p-5">
        {daysWithValidLocations.map((day) => {
          const analysis = dayAnalyses.get(day.id);
          if (!analysis || day.id !== activeTab) return null;

          const isLoading = analysis.isLoading;

          return (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {/* Route Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-linear-to-br from-[#0A7AFF]/5 to-[#0A7AFF]/10 border border-[#0A7AFF]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-4 h-4 text-[#0A7AFF]" />
                      <span className="text-xs text-[#64748B]">Distance</span>
                    </div>
                    <p className="text-2xl font-bold text-[#1A2B4F]">
                      {analysis.routeAnalysis.optimizedDistance.toFixed(1)} km
                    </p>
                    {analysis.routeAnalysis.optimizedDistance <
                      analysis.routeAnalysis.originalDistance && (
                      <p className="text-xs text-[#10B981] mt-1">
                        ↓{" "}
                        {(
                          analysis.routeAnalysis.originalDistance -
                          analysis.routeAnalysis.optimizedDistance
                        ).toFixed(1)}{" "}
                        km saved
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-linear-to-br from-[#14B8A6]/5 to-[#14B8A6]/10 border border-[#14B8A6]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#14B8A6]" />
                      <span className="text-xs text-[#64748B]">Time</span>
                    </div>
                    <p className="text-2xl font-bold text-[#1A2B4F]">
                      {analysis.routeAnalysis.totalTime ||
                        calculateTravelTime(
                          analysis.routeAnalysis.optimizedDistance
                        )}{" "}
                      min
                    </p>
                    {analysis.routeAnalysis.timeSaved > 0 && (
                      <p className="text-xs text-[#10B981] mt-1">
                        ↓ {analysis.routeAnalysis.timeSaved} min saved
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-linear-to-br from-[#10B981]/5 to-[#10B981]/10 border border-[#10B981]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#10B981]" />
                      <span className="text-xs text-[#64748B]">Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold text-[#1A2B4F]">
                      {analysis.routeAnalysis.originalDistance > 0
                        ? Math.round(
                            (1 -
                              analysis.routeAnalysis.optimizedDistance /
                                analysis.routeAnalysis.originalDistance) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">improvement</p>
                  </div>
                </div>

                {/* Optimized Route List */}
                <div className="bg-linear-to-br from-[rgba(10,122,255,0.02)] to-transparent rounded-xl border border-[#E5E7EB] p-4">
                  <h4 className="text-sm font-medium text-[#1A2B4F] mb-3 flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-[#0A7AFF]" />
                    Optimized Route Order
                  </h4>
                  <div className="space-y-2">
                    {analysis.optimizedActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#0A7AFF]/30 transition-colors"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A2B4F] truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {activity.location}
                          </p>
                        </div>
                        {index < analysis.optimizedActivities.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => handleAcceptOptimization(day.id)}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Optimizing Route...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Apply Optimized Route
                      {analysis.routeAnalysis.timeSaved > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          Save {analysis.routeAnalysis.timeSaved} min
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
