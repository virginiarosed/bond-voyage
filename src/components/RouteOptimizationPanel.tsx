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
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

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

      return null;
    },
    []
  );

  const calculateDistance = useCallback(
    (coord1: [number, number], coord2: [number, number]): number => {
      const R = 6371;
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
      return false;
    }

    if (data.activities.length < 2) {
      return false;
    }

    for (const activity of data.activities) {
      if (typeof activity.id !== "string" || !activity.id.trim()) {
        return false;
      }

      if (
        typeof activity.lat !== "number" ||
        typeof activity.lng !== "number"
      ) {
        return false;
      }
    }

    return true;
  }, []);

  const prepareRouteOptimizationData = useCallback(
    (activities: Activity[]) => {
      const meaningfulActivities = activities.filter(
        (a) =>
          isMeaningfulLocation(a.location) &&
          a.locationData &&
          typeof a.locationData.lat === "number" &&
          typeof a.locationData.lng === "number"
      );

      if (meaningfulActivities.length < 4) {
        return null;
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
          continue;
        }

        const activityId = activity.id || `activity-${Date.now()}-${i}`;
        const activityTime = activity.time || "";

        formattedActivities.push({
          id: activityId,
          lat: coords[0],
          lng: coords[1],
          name: activity.title,
          location: activity.location,
          time: activityTime,
        });

        if (formattedActivities.length === 1) {
          firstCoords = coords;
        }
        lastCoords = coords;
      }

      if (formattedActivities.length < 4) {
        return null;
      }

      if (!firstCoords || !lastCoords) {
        return null;
      }

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
      if (
        response?.data?.activities &&
        Array.isArray(response.data.activities)
      ) {
        const optimizedActivities = response.data.activities
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
          routeData: {
            geometry: response.data.routeGeometry,
            totalDistance: response.data.optimizedDistance,
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

      return {
        optimizedActivities: optimizeRouteLocally(originalActivities),
        routeData: undefined,
      };
    },
    [optimizeRouteLocally]
  );

  const sendOptimizationRequest = useCallback(
    (day: Day, dayId: string) => {
      if (pendingOptimizationsRef.current.has(dayId)) {
        return;
      }

      const existing = optimizationTimerRef.current.get(dayId);
      if (existing) {
        clearTimeout(existing);
      }

      const hasValidLocations =
        day.activities.filter(
          (a) =>
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        ).length >= 2;

      if (!hasValidLocations) {
        const stale = optimizationTimerRef.current.get(dayId);
        if (stale) {
          clearTimeout(stale);
          optimizationTimerRef.current.delete(dayId);
        }
        return;
      }

      const timer = setTimeout(() => {
        optimizationTimerRef.current.delete(dayId);

        const originalActivities = day.activities.filter(
          (a) =>
            isMeaningfulLocation(a.location) &&
            a.locationData &&
            typeof a.locationData.lat === "number" &&
            typeof a.locationData.lng === "number"
        );

        const originalDistance =
          calculateOriginalRouteDistance(originalActivities);

        if (originalActivities.length < 4) {
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
          return;
        }

        pendingOptimizationsRef.current.add(dayId);

        const optimizationData =
          prepareRouteOptimizationData(originalActivities);

        if (!optimizationData || !validateOptimizationData(optimizationData)) {
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
              ? routeData.totalDistance
              : calculateOriginalRouteDistance(optimizedActivities);

            const optimizedTime = routeData?.totalTime
              ? Math.round(routeData.totalTime / 60)
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

  const initializeMap = async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      setIsMapLoading(true);

      const map = L.map(mapContainerRef.current, {
        preferCanvas: true,
        zoomControl: true,
      }).setView([12.8797, 121.774], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = {
        map,
        L,
        originalMarkers: [],
        optimizedMarkers: [],
        originalPolyline: null,
        optimizedPolyline: null,
      };

      setTimeout(() => {
        if (mapRef.current?.map) {
          mapRef.current.map.invalidateSize();
          updateMapRoutes();
        }
        setIsMapLoading(false);
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsMapLoading(false);
      toast.error("Map Error", {
        description: "Could not load map. Please try again.",
      });
    }
  };

  const updateMapRoutes = () => {
    if (!mapRef.current || !activeTab || !mapRef.current.map) {
      return;
    }

    const { map, L } = mapRef.current;
    const analysis = dayAnalyses.get(activeTab);

    if (!analysis) {
      return;
    }

    mapRef.current.originalMarkers?.forEach((marker: any) => marker.remove());
    mapRef.current.optimizedMarkers?.forEach((marker: any) => marker.remove());

    if (mapRef.current.originalPolyline) {
      mapRef.current.originalPolyline.remove();
    }

    if (mapRef.current.optimizedPolyline) {
      mapRef.current.optimizedPolyline.remove();
    }

    mapRef.current.originalMarkers = [];
    mapRef.current.optimizedMarkers = [];
    mapRef.current.originalPolyline = null;
    mapRef.current.optimizedPolyline = null;

    const originalActivities = analysis.day.activities.filter(
      (a) => a.location && a.locationData
    );
    const optimizedActivities = analysis.optimizedActivities;

    if (originalActivities.length === 0) return;

    const allCoords: [number, number][] = [];

    if (showOriginalRoute) {
      const originalCoords: [number, number][] = [];
      const newOriginalMarkers: any[] = [];

      originalActivities.forEach((activity, index) => {
        const coord = getCoordinates(
          activity.locationData ?? activity.location
        );
        if (!coord) return;

        originalCoords.push(coord);
        allCoords.push(coord);

        const icon = L.divIcon({
          html: `<div style="background: #0A7AFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${
            index + 1
          }</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(coord, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 4px;">
            <strong style="color: #0A7AFF;">🔵 Original Route</strong><br/>
            <strong style="color: #1A2B4F;">${activity.title}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${
              activity.location
            }</span>
            ${
              activity.time
                ? `<br/><span style="color: #0A7AFF; font-size: 12px;">⏰ ${activity.time}</span>`
                : ""
            }
          </div>
        `);

        newOriginalMarkers.push(marker);
      });

      if (originalCoords.length > 1) {
        const polyline = L.polyline(originalCoords, {
          color: "#0A7AFF",
          weight: 4,
          opacity: 0.7,
          dashArray: "12, 8",
        }).addTo(map);

        mapRef.current.originalPolyline = polyline;
      }

      mapRef.current.originalMarkers = newOriginalMarkers;
    }

    if (showOptimizedRoute && analysis.routeAnalysis.timeSaved > 0) {
      if (analysis.routeAnalysis.routeGeometry?.coordinates) {
        const coords = analysis.routeAnalysis.routeGeometry.coordinates;

        if (Array.isArray(coords) && coords.length > 0) {
          const lineStrings = coords.map((lineString: number[][]) =>
            lineString.map(
              (point: number[]) => [point[1], point[0]] as [number, number]
            )
          );

          lineStrings.forEach((lineString: [number, number][]) => {
            const polyline = L.polyline(lineString, {
              color: "#10B981",
              weight: 5,
              opacity: 0.8,
            }).addTo(map);

            if (!mapRef.current!.optimizedPolyline) {
              mapRef.current!.optimizedPolyline = polyline;
            }
          });
        }
      } else {
        const optimizedCoords: [number, number][] = [];
        optimizedActivities.forEach((activity) => {
          const coord = getCoordinates(
            activity.locationData ?? activity.location
          );
          if (coord) optimizedCoords.push(coord);
        });

        if (optimizedCoords.length > 1) {
          const polyline = L.polyline(optimizedCoords, {
            color: "#10B981",
            weight: 5,
            opacity: 0.8,
          }).addTo(map);

          mapRef.current.optimizedPolyline = polyline;
        }
      }

      const newOptimizedMarkers: any[] = [];
      optimizedActivities.forEach((activity, index) => {
        const coord = getCoordinates(
          activity.locationData ?? activity.location
        );
        if (!coord) return;

        if (!showOriginalRoute) allCoords.push(coord);

        const icon = L.divIcon({
          html: `<div style="background: #10B981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; border: 3px solid white; box-shadow: 0 3px 10px rgba(16,185,129,0.5);">${
            index + 1
          }</div>`,
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(coord, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 4px;">
            <strong style="color: #10B981;">🟢 Optimized Route</strong><br/>
            <strong style="color: #1A2B4F;">${activity.title}</strong><br/>
            <span style="color: #64748B; font-size: 12px;">${
              activity.location
            }</span>
            ${
              activity.time
                ? `<br/><span style="color: #10B981; font-size: 12px;">⏰ ${activity.time}</span>`
                : ""
            }
          </div>
        `);

        newOptimizedMarkers.push(marker);
      });

      mapRef.current.optimizedMarkers = newOptimizedMarkers;
    }

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

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
    if (mapView === "map") {
      if (!mapRef.current) {
        initializeMap();
      } else if (mapRef.current.map) {
        try {
          const container = mapRef.current.map.getContainer();
          if (!container || !document.body.contains(container)) {
            if (mapRef.current.map) {
              mapRef.current.map.remove();
            }
            mapRef.current = null;
            initializeMap();
          } else {
            setTimeout(() => {
              if (mapRef.current?.map) {
                mapRef.current.map.invalidateSize();
                updateMapRoutes();
              }
            }, 50);
          }
        } catch (error) {
          console.warn("Map container error, reinitializing:", error);
          if (mapRef.current?.map) {
            try {
              mapRef.current.map.remove();
            } catch (e) {}
          }
          mapRef.current = null;
          initializeMap();
        }
      }
    }
  }, [mapView, activeTab, dayAnalyses, showOriginalRoute, showOptimizedRoute]);

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
      {/* Header */}
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
          </div>
        </div>
      </div>

      {/* Multi-day Tabs */}
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

      {/* Tab Content */}
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
              {/* Day Title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-[#64748B]">
                    Day {day.dayNumber}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <h4 className="text-lg text-[#1A2B4F]">
                  {day.title || `Day ${day.dayNumber}`}
                </h4>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-linear-to-br from-[#E0F2FE] to-[#BAE6FD] border border-[#0A7AFF]/20 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                      <Route className="w-4 h-4 text-[#0A7AFF]" />
                    </div>
                    <span className="text-xs text-[#0369A1]">Original</span>
                  </div>
                  <p className="text-xl text-[#0A7AFF]">
                    {analysis.routeAnalysis.originalDistance.toFixed(1)} km
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-linear-to-br from-[#D1FAE5] to-[#A7F3D0] border border-[#10B981]/20 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <span className="text-xs text-[#065F46]">Optimized</span>
                  </div>
                  <p className="text-xl text-[#10B981]">
                    {analysis.routeAnalysis.optimizedDistance.toFixed(1)} km
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-xl ${
                    analysis.routeAnalysis.timeSaved > 5
                      ? "bg-linear-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#FFB84D]/20"
                      : "bg-linear-to-br from-[#F1F5F9] to-[#E2E8F0] border border-[#CBD5E1]/20"
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                      {analysis.routeAnalysis.timeSaved > 5 ? (
                        <Zap className="w-4 h-4 text-[#FFB84D]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#64748B]" />
                      )}
                    </div>
                    <span className="text-xs text-[#78350F]">Time Saved</span>
                  </div>
                  <p
                    className={`text-xl ${
                      analysis.routeAnalysis.timeSaved > 5
                        ? "text-[#FFB84D]"
                        : "text-[#64748B]"
                    }`}
                  >
                    {analysis.routeAnalysis.timeSaved > 0
                      ? `~${analysis.routeAnalysis.timeSaved} min`
                      : "Minimal"}
                  </p>
                </motion.div>
              </div>

              {/* View Toggle */}
              <div className="mb-6 flex items-center gap-2 p-1 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB] w-fit">
                <button
                  onClick={() => setMapView("list")}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    mapView === "list"
                      ? "bg-white text-[#0A7AFF] shadow-sm"
                      : "text-[#64748B] hover:text-[#1A2B4F]"
                  }`}
                >
                  <Route className="w-4 h-4 inline mr-2" />
                  List View
                </button>
                <button
                  onClick={() => setMapView("map")}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    mapView === "map"
                      ? "bg-white text-[#0A7AFF] shadow-sm"
                      : "text-[#64748B] hover:text-[#1A2B4F]"
                  }`}
                >
                  <MapIcon className="w-4 h-4 inline mr-2" />
                  Map View
                </button>
              </div>

              {/* Route Visualization */}
              <div className="mb-6 p-5 rounded-xl bg-linear-to-br from-[#F8FAFB] to-white border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm text-[#1A2B4F]">
                    Route Visualization
                  </h5>
                  <div className="flex items-center gap-3">
                    {mapView === "map" &&
                      analysis.routeAnalysis.timeSaved > 0 && (
                        <>
                          <button
                            onClick={() =>
                              setShowOriginalRoute(!showOriginalRoute)
                            }
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                              showOriginalRoute
                                ? "bg-[#0A7AFF] border-[#0A7AFF] text-white"
                                : "bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF]"
                            }`}
                          >
                            {showOriginalRoute ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <div className="w-3 h-3 rounded-full bg-[#0A7AFF] border-2 border-white"></div>
                            <span className="text-xs">Original</span>
                          </button>
                          <button
                            onClick={() =>
                              setShowOptimizedRoute(!showOptimizedRoute)
                            }
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                              showOptimizedRoute
                                ? "bg-[#10B981] border-[#10B981] text-white"
                                : "bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#10B981]"
                            }`}
                          >
                            {showOptimizedRoute ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <div className="w-3 h-3 rounded-full bg-[#10B981] border-2 border-white"></div>
                            <span className="text-xs">Optimized</span>
                          </button>
                        </>
                      )}
                  </div>
                </div>

                {/* List View */}
                {mapView === "list" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-[#0A7AFF]/20 bg-linear-to-br from-[rgba(10,122,255,0.05)] to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0A7AFF] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              A
                            </span>
                          </div>
                          <span className="text-sm font-medium text-[#0A7AFF]">
                            Current Route
                          </span>
                        </div>
                        <span className="text-xs text-[#64748B]">
                          {analysis.routeAnalysis.originalDistance.toFixed(1)}{" "}
                          km
                        </span>
                      </div>
                      <div className="space-y-2">
                        {day.activities
                          .filter((a) => a.location && a.locationData)
                          .map((activity, idx, arr) => (
                            <div key={activity.id}>
                              <div className="flex items-start gap-3 text-sm">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[#0A7AFF] text-white flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-[#1A2B4F] font-medium">
                                    {activity.title}
                                  </p>
                                  <p className="text-xs text-[#64748B]">
                                    {activity.location}
                                  </p>
                                </div>
                              </div>
                              {idx < arr.length - 1 && (
                                <div className="flex items-center gap-2 py-1 px-8">
                                  <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
                                  <span className="text-xs text-[#94A3B8]">
                                    {(() => {
                                      const coord1 = getCoordinates(
                                        activity.locationData ??
                                          activity.location
                                      );
                                      const coord2 = getCoordinates(
                                        arr[idx + 1].locationData ??
                                          arr[idx + 1].location
                                      );
                                      if (coord1 && coord2) {
                                        return (
                                          calculateDistance(
                                            coord1,
                                            coord2
                                          ).toFixed(1) + " km"
                                        );
                                      }
                                      return "-- km";
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {analysis.routeAnalysis.timeSaved > 0 && (
                      <div className="p-4 rounded-xl border-2 border-[#10B981]/20 bg-linear-to-br from-[rgba(16,185,129,0.05)] to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-[#10B981]">
                              Suggested Route
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-xs text-[#10B981] font-medium">
                              -{analysis.routeAnalysis.timeSaved} min
                            </span>
                          </div>
                          <span className="text-xs text-[#64748B]">
                            {analysis.routeAnalysis.optimizedDistance.toFixed(
                              1
                            )}{" "}
                            km
                          </span>
                        </div>
                        <div className="space-y-2">
                          {analysis.optimizedActivities.map(
                            (activity, idx, arr) => (
                              <div key={activity.id}>
                                <div className="flex items-start gap-3 text-sm">
                                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-[#1A2B4F] font-medium">
                                      {activity.title}
                                    </p>
                                    <p className="text-xs text-[#64748B]">
                                      {activity.location}
                                    </p>
                                  </div>
                                </div>
                                {idx < arr.length - 1 && (
                                  <div className="flex items-center gap-2 py-1 px-8">
                                    <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-xs text-[#94A3B8]">
                                      {(() => {
                                        const coord1 = getCoordinates(
                                          activity.locationData ??
                                            activity.location
                                        );
                                        const coord2 = getCoordinates(
                                          arr[idx + 1].locationData ??
                                            arr[idx + 1].location
                                        );
                                        if (coord1 && coord2) {
                                          return (
                                            calculateDistance(
                                              coord1,
                                              coord2
                                            ).toFixed(1) + " km"
                                          );
                                        }
                                        return "-- km";
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {analysis.routeAnalysis.timeSaved <= 0 && (
                      <div className="p-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] text-center">
                        <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
                        <p className="text-sm text-[#1A2B4F] font-medium mb-1">
                          Route Already Optimized!
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Your current route is the most efficient path.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Map View */}
                {mapView === "map" && (
                  <div className="relative">
                    <div
                      ref={mapContainerRef}
                      className="w-full h-112.5 rounded-xl overflow-hidden border-2 border-[#E5E7EB]"
                      style={{ background: "#F8FAFB" }}
                    />
                    {isMapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <MapIcon className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm text-[#64748B]">
                            Loading map...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Map Legend */}
                    {mapRef.current?.map &&
                      analysis.routeAnalysis.timeSaved > 0 && (
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-[#E5E7EB] z-1000">
                          <p className="text-xs text-[#64748B] mb-2">
                            Route Comparison
                          </p>
                          {showOriginalRoute && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-4 h-0.5 bg-[#0A7AFF] border-dashed border-2 border-[#0A7AFF]"></div>
                              <span className="text-xs text-[#1A2B4F]">
                                Original (
                                {analysis.routeAnalysis.originalDistance.toFixed(
                                  1
                                )}{" "}
                                km)
                              </span>
                            </div>
                          )}
                          {showOptimizedRoute && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-1 bg-[#10B981] rounded"></div>
                              <span className="text-xs text-[#1A2B4F]">
                                Optimized (
                                {analysis.routeAnalysis.optimizedDistance.toFixed(
                                  1
                                )}{" "}
                                km)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Apply Button */}
              {analysis.routeAnalysis.timeSaved > 0 && (
                <button
                  onClick={() => handleAcceptOptimization(day.id)}
                  disabled={isLoading}
                  className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#14B8A6] hover:from-[#0EA574] hover:to-[#12A594] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Apply Optimized Route
                    </>
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
