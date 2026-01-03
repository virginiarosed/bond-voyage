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
}

interface DayAnalysis {
  day: Day;
  optimizedActivities: Activity[];
  routeAnalysis: RouteAnalysis;
  isLoading?: boolean;
}

// Add MapInstance interface
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

  // Debounce timer ref
  const optimizationTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track optimization requests to prevent duplicates
  const pendingOptimizationsRef = useRef<Set<string>>(new Set());

  // Use the optimize route mutation
  const { mutate: optimizeRoute, isPending: isOptimizing } = useOptimizeRoute();

  // Get days with meaningful locations - memoized
  const daysWithMeaningfulLocations = useMemo(
    () =>
      itineraryDays.filter(
        (d) =>
          d.activities.filter((a) => isMeaningfulLocation(a.location)).length >=
          2
      ),
    [itineraryDays]
  );

  // Get coordinates for a location
  const getCoordinates = (location: string): [number, number] | null => {
    if (!isMeaningfulLocation(location)) {
      console.log("Location too short:", location);
      return null;
    }

    const normalizedLocation = location.toLowerCase().trim().split(",")[0];

    // Direct match
    if (LOCATION_COORDS[normalizedLocation]) {
      return LOCATION_COORDS[normalizedLocation];
    }

    // Partial match
    for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
      if (
        normalizedLocation.includes(key) ||
        key.includes(normalizedLocation)
      ) {
        return coords;
      }
    }

    console.log("No coordinates found for:", location);
    return null;
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    coord1: [number, number],
    coord2: [number, number]
  ): number => {
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
  };

  // Calculate travel time in minutes (assuming 40km/h average speed)
  const calculateTravelTime = (distance: number): number => {
    return Math.round((distance / 40) * 60);
  };

  // Validate optimization data before sending
  const validateOptimizationData = (data: any): boolean => {
    if (!data || !data.activities || !Array.isArray(data.activities)) {
      console.error("Invalid data structure: missing activities array");
      return false;
    }

    if (data.activities.length < 2) {
      console.error("Not enough activities:", data.activities.length);
      return false;
    }

    for (const activity of data.activities) {
      // Check for required id field (string)
      if (typeof activity.id !== "string" || !activity.id.trim()) {
        console.error("Missing or invalid id in activity:", activity);
        return false;
      }

      // Check for required coordinate fields
      if (
        typeof activity.lat !== "number" ||
        typeof activity.lng !== "number"
      ) {
        console.error("Invalid coordinates in activity:", activity);
        return false;
      }
    }

    return true;
  };

  // Prepare data for API request
  const prepareRouteOptimizationData = (activities: Activity[]) => {
    const meaningfulActivities = activities.filter((a) =>
      isMeaningfulLocation(a.location)
    );
    if (meaningfulActivities.length < 2) {
      console.log(
        "Not enough activities with meaningful locations:",
        meaningfulActivities.length
      );
      return null;
    }

    const formattedActivities = [];
    let firstCoords: [number, number] | null = null;
    let lastCoords: [number, number] | null = null;

    for (let i = 0; i < meaningfulActivities.length; i++) {
      const activity = meaningfulActivities[i];
      const coords = getCoordinates(activity.location);
      if (!coords) {
        console.log("Could not get coordinates for:", activity.location);
        continue;
      }

      // Generate an ID if not present
      const activityId = activity.id || `activity-${Date.now()}-${i}`;

      formattedActivities.push({
        id: activityId,
        lat: coords[0],
        lng: coords[1],
        name: activity.title,
        location: activity.location,
        time: activity.time || null,
      });

      // Store first and last coordinates
      if (formattedActivities.length === 1) {
        firstCoords = coords;
      }
      lastCoords = coords;
    }

    if (formattedActivities.length < 2) {
      console.log("Not enough valid coordinates:", formattedActivities.length);
      return null;
    }

    console.log("Preparing optimization data for API:", {
      activitiesCount: formattedActivities.length,
    });

    return {
      activities: formattedActivities,
      origin: firstCoords
        ? { lat: firstCoords[0], lng: firstCoords[1] }
        : undefined,
      destination: lastCoords
        ? { lat: lastCoords[0], lng: lastCoords[1] }
        : undefined,
    };
  };

  // Calculate original route distance
  const calculateOriginalRouteDistance = (activities: Activity[]): number => {
    let totalDistance = 0;
    const activitiesWithLocations = activities.filter((a) =>
      isMeaningfulLocation(a.location)
    );

    for (let i = 0; i < activitiesWithLocations.length - 1; i++) {
      const coord1 = getCoordinates(activitiesWithLocations[i].location);
      const coord2 = getCoordinates(activitiesWithLocations[i + 1].location);

      if (coord1 && coord2) {
        totalDistance += calculateDistance(coord1, coord2);
      }
    }

    return totalDistance;
  };

  // Process API response to get optimized activities order
  const processOptimizationResponse = (
    response: any,
    originalActivities: Activity[]
  ): Activity[] => {
    console.log("Processing API response:", response);

    if (response) {
      // If response has optimizedOrder array directly
      if (response.optimizedOrder && Array.isArray(response.optimizedOrder)) {
        return response.optimizedOrder.map(
          (index: number) => originalActivities[index]
        );
      }

      // If response has data.optimizedOrder array
      if (
        response.data?.optimizedOrder &&
        Array.isArray(response.data.optimizedOrder)
      ) {
        return response.data.optimizedOrder.map(
          (index: number) => originalActivities[index]
        );
      }

      // If response has optimized activities with IDs
      if (response.activities && Array.isArray(response.activities)) {
        return response.activities.map((activityData: any) => {
          // Try to find by ID first
          const original = originalActivities.find(
            (a) => a.id === activityData.id
          );
          if (original) return original;

          // Try to find by location as fallback
          const byLocation = originalActivities.find(
            (a) => a.location === activityData.location
          );
          if (byLocation) return byLocation;

          // Create a new activity from response data
          return {
            id: activityData.id || `opt-${Date.now()}`,
            time: activityData.time || "",
            title: activityData.name || activityData.title || "",
            location: activityData.location || "",
            description: activityData.description || "",
          };
        });
      }

      // If response has data.activities in optimized order
      if (
        response.data?.activities &&
        Array.isArray(response.data.activities)
      ) {
        return response.data.activities.map((activityData: any) => {
          // Try to find by ID first
          const original = originalActivities.find(
            (a) => a.id === activityData.id
          );
          if (original) return original;

          // Try to find by location as fallback
          const byLocation = originalActivities.find(
            (a) => a.location === activityData.location
          );
          if (byLocation) return byLocation;

          // Create a new activity from response data
          return {
            id: activityData.id || `opt-${Date.now()}`,
            time: activityData.time || "",
            title: activityData.name || activityData.title || "",
            location: activityData.location || "",
            description: activityData.description || "",
          };
        });
      }
    }

    console.log(
      "No valid optimization data in response, using local optimization"
    );
    return optimizeRouteLocally(originalActivities);
  };

  // Local fallback optimization (nearest neighbor algorithm)
  const optimizeRouteLocally = (activities: Activity[]): Activity[] => {
    if (activities.length <= 2) return activities;

    const activitiesWithLocations = activities.filter((a) =>
      isMeaningfulLocation(a.location)
    );
    if (activitiesWithLocations.length <= 2) return activities;

    // Keep first and last activities fixed
    const firstActivity = activitiesWithLocations[0];
    const lastActivity =
      activitiesWithLocations[activitiesWithLocations.length - 1];
    const middleActivities = activitiesWithLocations.slice(1, -1);

    if (middleActivities.length === 0) return activitiesWithLocations;

    // Optimize middle activities using nearest neighbor
    const optimized: Activity[] = [firstActivity];
    const remaining = [...middleActivities];

    let current = firstActivity;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let shortestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const coord1 = getCoordinates(current.location);
        const coord2 = getCoordinates(remaining[i].location);

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
    return optimized;
  };

  // Debounced function to send optimization request
  const sendOptimizationRequest = useCallback(
    (day: Day, dayId: string) => {
      // Clear any existing timer
      if (optimizationTimerRef.current) {
        clearTimeout(optimizationTimerRef.current);
      }

      // Check if already optimizing this day
      if (pendingOptimizationsRef.current.has(dayId)) {
        console.log("Already optimizing day:", dayId);
        return;
      }

      // Set new timer with 1.5 second delay
      optimizationTimerRef.current = setTimeout(() => {
        const originalActivities = day.activities.filter((a) =>
          isMeaningfulLocation(a.location)
        );

        if (originalActivities.length < 2) {
          console.log(
            "Not enough meaningful locations after delay for day:",
            dayId
          );
          return;
        }

        // Mark this day as being optimized
        pendingOptimizationsRef.current.add(dayId);

        // Calculate original distance
        const originalDistance =
          calculateOriginalRouteDistance(originalActivities);

        // Prepare data for API request
        const optimizationData =
          prepareRouteOptimizationData(originalActivities);

        // Fallback to local optimization if API data is invalid
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

        // Update state to show loading
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

        // Call API for optimization
        optimizeRoute(optimizationData, {
          onSuccess: (response) => {
            const optimizedActivities = processOptimizationResponse(
              response,
              originalActivities
            );
            const optimizedDistance =
              calculateOriginalRouteDistance(optimizedActivities);
            const timeSaved =
              calculateTravelTime(originalDistance) -
              calculateTravelTime(optimizedDistance);

            // Update the analysis
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
                  },
                  isLoading: false,
                });
              }
              return updated;
            });

            pendingOptimizationsRef.current.delete(dayId);
          },
          onError: (error: any) => {
            // Get error message
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Could not optimize route";

            toast.error("Optimization Failed", {
              description: `${errorMessage}. Using local optimization.`,
            });

            setDayAnalyses((prev) => {
              const updated = new Map(prev);
              const current = updated.get(dayId);
              if (current) {
                updated.set(dayId, {
                  ...current,
                  isLoading: false,
                });
              }
              return updated;
            });

            pendingOptimizationsRef.current.delete(dayId);
          },
        });
      }, 1500);
    },
    [optimizeRoute]
  );

  useEffect(() => {
    const initializeAnalyses = () => {
      if (daysWithMeaningfulLocations.length === 0) return;

      const newAnalyses = new Map<string, DayAnalysis>();

      for (const day of daysWithMeaningfulLocations) {
        const originalActivities = day.activities.filter((a) =>
          isMeaningfulLocation(a.location)
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
        daysWithMeaningfulLocations.find((d) => d.id === selectedDayId)
      ) {
        setActiveTab(selectedDayId);
      } else if (
        !activeTab ||
        !daysWithMeaningfulLocations.find((d) => d.id === activeTab)
      ) {
        setActiveTab(daysWithMeaningfulLocations[0]?.id || "");
      }
    };

    initializeAnalyses();

    // Cleanup timers on unmount
    return () => {
      if (optimizationTimerRef.current) {
        clearTimeout(optimizationTimerRef.current);
      }
      pendingOptimizationsRef.current.clear();
    };
  }, [
    daysWithMeaningfulLocations,
    selectedDayId,
    activeTab,
    sendOptimizationRequest,
  ]);

  // Cleanup on component unmount
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
        description: `Day ${analysis.day.day} reordered. You'll save ~${analysis.routeAnalysis.timeSaved} minutes!`,
      });
    }
  };

  // [The rest of your component remains the same - initializeMap, updateMapRoutes, and UI rendering]
  // ... (Keep all the existing map and UI code, just use the updated variable names)

  // For example, update the condition to show the panel:
  if (daysWithMeaningfulLocations.length === 0) {
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
            Add at least 2 activities with meaningful locations (3+ characters)
            to any day and I'll analyze the most efficient routes for you.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB]">
            <Info className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-xs text-[#64748B]">
              Saves time by reordering activities based on location proximity
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ... (Rest of the UI code remains the same, but update references from daysWithLocations to daysWithMeaningfulLocations)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6]">
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

      {/* Multi-day Tabs */}
      {daysWithMeaningfulLocations.length > 1 && (
        <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] bg-gradient-to-br from-[rgba(10,122,255,0.02)] to-transparent">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto flex-nowrap">
              {daysWithMeaningfulLocations.map((day) => {
                const analysis = dayAnalyses.get(day.id);
                const hasSavings =
                  analysis && analysis.routeAnalysis.timeSaved > 5;
                const isLoading = analysis?.isLoading;

                return (
                  <TabsTrigger
                    key={day.id}
                    value={day.id}
                    className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A7AFF] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white rounded-lg px-4 py-2 transition-all whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Day {day.day}
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

      {/* Tab Content */}
      <div className="p-5">
        {daysWithMeaningfulLocations.map((day) => {
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
              {/* Day Title and rest of the UI remains the same */}
              {/* ... (Keep all the existing UI code) */}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
