import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Package,
  MapPin,
  Compass,
  TreePine,
  Building2,
  Ship,
  Train,
  Coffee,
  ShoppingBag,
  Music,
  Sunset,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  FileText,
  Waves,
  Mountain,
  Palmtree,
  Tent,
  Bike,
  Bus,
  Anchor,
  Film,
  Ticket,
  Wine,
  IceCream,
  Pizza,
  Fish,
  Salad,
  Utensils,
  Home,
  Landmark,
  Church,
  Castle,
  Globe,
  Backpack,
  Luggage,
  Umbrella,
  Sun,
  Moon,
  Star,
  Heart,
  Gift,
  ShoppingCart,
  Search,
  Route,
  Zap,
  TrendingDown,
  ChevronRight,
  ArrowRight,
  MapPinned,
  Info,
  Map as MapIcon,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { ImageUploadField } from "../components/ImageUploadField";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { AITravelAssistant } from "../components/AITravelAssistant";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useBookingDetail, useUpdateBooking } from "../hooks/useBookings";
import { queryKeys } from "../utils/lib/queryKeys";
import { useDebounce } from "../hooks/useDebounce";
import { usePlacesSearch } from "../hooks/useLocations";
import { Place } from "../types/types";
import { RouteOptimizationPanel } from "../components/RouteOptimizationPanel";

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
  day: number;
  title: string;
  activities: Activity[];
}

interface RequestedBookingFormData {
  customerName: string;
  email: string;
  mobile: string;
  destination: string;
  travelDateFrom: string;
  travelDateTo: string;
  travelers: string;
  totalAmount: string;
}

const ICON_OPTIONS = [
  // Transportation
  { value: "Plane", label: "Plane / Flight", icon: Plane },
  { value: "Car", label: "Car / Drive", icon: Car },
  { value: "Bus", label: "Bus", icon: Bus },
  { value: "Train", label: "Train", icon: Train },
  { value: "Ship", label: "Ship / Ferry", icon: Ship },
  { value: "Anchor", label: "Boat / Anchor", icon: Anchor },
  { value: "Bike", label: "Bike / Cycling", icon: Bike },

  // Accommodation
  { value: "Hotel", label: "Hotel / Lodging", icon: Hotel },
  { value: "Home", label: "Home / Villa", icon: Home },
  { value: "Tent", label: "Camping / Tent", icon: Tent },

  // Food & Dining
  { value: "UtensilsCrossed", label: "Restaurant", icon: UtensilsCrossed },
  { value: "Utensils", label: "Dining", icon: Utensils },
  { value: "Coffee", label: "Coffee / Cafe", icon: Coffee },
  { value: "Wine", label: "Wine / Bar", icon: Wine },
  { value: "IceCream", label: "Dessert / Ice Cream", icon: IceCream },
  { value: "Pizza", label: "Pizza / Fast Food", icon: Pizza },
  { value: "Fish", label: "Seafood", icon: Fish },
  { value: "Salad", label: "Healthy Food", icon: Salad },

  // Activities & Attractions
  { value: "Camera", label: "Photography / Sightseeing", icon: Camera },
  { value: "Waves", label: "Beach / Swimming", icon: Waves },
  { value: "Mountain", label: "Mountain / Hiking", icon: Mountain },
  { value: "Palmtree", label: "Tropical / Island", icon: Palmtree },
  { value: "TreePine", label: "Nature / Forest", icon: TreePine },
  { value: "Landmark", label: "Landmark / Monument", icon: Landmark },
  { value: "Church", label: "Church / Temple", icon: Church },
  { value: "Castle", label: "Castle / Palace", icon: Castle },
  { value: "Film", label: "Movies / Shows", icon: Film },
  { value: "Music", label: "Music / Entertainment", icon: Music },
  { value: "Ticket", label: "Event / Tickets", icon: Ticket },
  { value: "ShoppingBag", label: "Shopping", icon: ShoppingBag },
  { value: "ShoppingCart", label: "Market / Shopping", icon: ShoppingCart },

  // Navigation & Travel
  { value: "MapPin", label: "Location / Map Pin", icon: MapPin },
  { value: "Compass", label: "Compass / Navigate", icon: Compass },
  { value: "Globe", label: "World / Global", icon: Globe },
  { value: "Backpack", label: "Backpacking / Adventure", icon: Backpack },
  { value: "Luggage", label: "Luggage / Travel", icon: Luggage },

  // Misc
  { value: "Package", label: "Package / Tour", icon: Package },
  { value: "Building2", label: "Building / City", icon: Building2 },
  { value: "Sunset", label: "Sunset / Sunrise", icon: Sunset },
  { value: "Sun", label: "Sun / Day", icon: Sun },
  { value: "Moon", label: "Moon / Night", icon: Moon },
  { value: "Star", label: "Star / Featured", icon: Star },
  { value: "Umbrella", label: "Umbrella / Beach", icon: Umbrella },
  { value: "Heart", label: "Love / Favorite", icon: Heart },
  { value: "Gift", label: "Gift / Souvenir", icon: Gift },
];

// Generic location suggestions for autocomplete
const GENERIC_LOCATIONS = [
  "City Center",
  "Main Airport",
  "Central Station",
  "Downtown Area",
  "Shopping District",
  "Historic Old Town",
  "Beachfront",
  "Mountain Viewpoint",
  "National Park Entrance",
  "Tourist Information Center",
  "Convention Center",
  "University Campus",
  "Hospital District",
  "Business District",
  "Art Museum",
  "Science Museum",
  "Botanical Gardens",
  "Zoo Entrance",
  "Amusement Park",
  "Sports Stadium",
  "Concert Hall",
  "Theater District",
  "Fine Dining Restaurant",
  "Local Market",
  "Farmers Market",
  "Harbor Front",
  "Marina",
  "Ski Resort",
  "Hot Springs",
  "Wildlife Sanctuary",
  "Observation Deck",
  "Cable Car Station",
  "Ferry Terminal",
  "Bus Terminal",
  "Train Station",
  "Hotel District",
  "Resort Area",
  "Camping Ground",
  "Hiking Trailhead",
  "Bike Rental Station",
  "Car Rental Office",
  "Tour Bus Pickup",
  "Cruise Ship Port",
  "Island Ferry Dock",
  "Mountain Pass",
  "Valley Viewpoint",
  "Waterfall Trail",
  "Cave Entrance",
  "Desert Outpost",
  "Rainforest Center",
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find((opt) => opt.value === iconName);
  return iconOption ? iconOption.icon : Clock;
};

// Time conversion helpers
const convertTo24Hour = (time12h: string): string => {
  if (!time12h) return "";

  // If already in 24-hour format (HH:MM), return as is
  if (
    /^\d{1,2}:\d{2}$/.test(time12h) &&
    !time12h.includes("AM") &&
    !time12h.includes("PM")
  ) {
    return time12h;
  }

  // Parse 12-hour format
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12h;

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

const convertTo12Hour = (time24h: string): string => {
  if (!time24h) return "";

  // If already in 12-hour format, return as is
  if (time24h.includes("AM") || time24h.includes("PM")) {
    return time24h;
  }

  const [hoursStr, minutes] = time24h.split(":");
  let hours = parseInt(hoursStr);

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
};

export function EditRequestedItinerary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const passedItineraryData = location.state?.itineraryData;

  const [formData, setFormData] = useState<RequestedBookingFormData>({
    customerName: "",
    email: "",
    mobile: "",
    destination: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelers: "1",
    totalAmount: "",
  });

  const { data: bookingDetailResponse, isLoading: isLoadingBooking } =
    useBookingDetail(id || "", {
      enabled: !!id,
      queryKey: queryKeys.bookings.detail(id!),
    });

  const { mutate: updateBooking, isPending: isUpdatingBooking } =
    useUpdateBooking(id || "", {
      onSuccess: () => {
        toast.success("Requested Itinerary Updated!", {
          description: `Requested itinerary for ${formData.customerName} has been successfully updated.`,
        });

        setHasUnsavedChanges(false);
        setSaveConfirmOpen(false);

        navigate("/itinerary", {
          state: {
            scrollToId: id,
            category: "Requested",
          },
        });
      },
      onError: (error: any) => {
        toast.error("Failed to update booking", {
          description:
            error.response?.data?.message || "Please try again later",
        });
      },
    });

  const [itineraryDays, setItineraryDays] = useState<Day[]>([]);
  const [initialFormData, setInitialFormData] =
    useState<RequestedBookingFormData | null>(null);
  const [initialItineraryDays, setInitialItineraryDays] = useState<
    Day[] | null
  >(null);

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [deleteActivityConfirm, setDeleteActivityConfirm] = useState<{
    dayId: string;
    activityId: string;
  } | null>(null);
  const [currentActivityForIcon, setCurrentActivityForIcon] = useState<{
    dayId: string;
    activityId: string;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [reduceDaysConfirm, setReduceDaysConfirm] = useState<{
    newDayCount: number;
    daysToRemove: number;
  } | null>(null);
  const [pendingDateChange, setPendingDateChange] = useState<{
    field: "travelDateFrom" | "travelDateTo";
    value: string;
  } | null>(null);
  const [pendingDaysChange, setPendingDaysChange] = useState<number | null>(
    null
  );

  // Location enrichment states
  const [isEnrichingLocations, setIsEnrichingLocations] = useState(false);
  const [enrichmentQueue, setEnrichmentQueue] = useState<
    Array<{
      dayId: string;
      activityId: string;
      location: string;
    }>
  >([]);
  const [currentEnrichmentIndex, setCurrentEnrichmentIndex] = useState(0);
  const enrichmentCompleted = useRef(false);
  const enrichmentStarted = useRef(false);

  const currentEnrichment = enrichmentQueue[currentEnrichmentIndex];

  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [activeLocationInput, setActiveLocationInput] = useState<{
    dayId: string;
    activityId: string;
  } | null>(null);

  // Icon search state
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Location autocomplete + route optimization helpers
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const debouncedValue = useDebounce(locationSearchQuery);
  const { data: placesData, isLoading: isLoadingPlaces } = usePlacesSearch(
    debouncedValue.length >= 2
      ? {
          text: debouncedValue,
          limit: 10,
        }
      : undefined,
    {
      enabled: debouncedValue.length >= 2,
      queryKey: queryKeys.places.search(debouncedValue),
    }
  );

  // Enrichment search query
  const {
    data: enrichmentPlacesData,
    isLoading: isEnrichmentSearching,
    isFetching: isEnrichmentFetching,
  } = usePlacesSearch(
    currentEnrichment
      ? { text: currentEnrichment.location.split(",")[0].trim(), limit: 1 }
      : undefined,
    {
      enabled: !!currentEnrichment && isEnrichingLocations,
      queryKey: ["enrichment", currentEnrichment?.location],
      staleTime: 0,
      gcTime: 0,
    }
  );

  const placesSuggestions = placesData?.data || [];

  const [selectedDayForRoute, setSelectedDayForRoute] = useState<string | null>(
    null
  );

  // Route optimization state
  const [activeOptimizationTab, setActiveOptimizationTab] =
    useState<string>("");
  const [dayOptimizations, setDayOptimizations] = useState<
    Map<
      string,
      {
        originalDistance: number;
        optimizedDistance: number;
        timeSaved: number;
        optimizedActivities: Activity[];
        showOptimized: boolean;
      }
    >
  >(new Map());
  const [mapView, setMapView] = useState<"list" | "map">("list");
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const generateId = () =>
    `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle enrichment process
  useEffect(() => {
    if (
      !isEnrichingLocations ||
      !currentEnrichment ||
      isEnrichmentSearching ||
      isEnrichmentFetching
    ) {
      return;
    }

    const place = enrichmentPlacesData?.data?.[0];

    if (place) {
      setItineraryDays((prev) =>
        prev.map((day) =>
          day.id === currentEnrichment.dayId
            ? {
                ...day,
                activities: day.activities.map((activity) =>
                  activity.id === currentEnrichment.activityId
                    ? { ...activity, locationData: place }
                    : activity
                ),
              }
            : day
        )
      );
    }

    if (currentEnrichmentIndex < enrichmentQueue.length - 1) {
      setTimeout(() => {
        setCurrentEnrichmentIndex((prev) => prev + 1);
      }, 300);
    } else {
      setIsEnrichingLocations(false);
      enrichmentCompleted.current = true;
      toast.success("Location Enrichment Complete", {
        description: `Enhanced ${enrichmentQueue.length} activities with coordinates`,
      });
    }
  }, [
    enrichmentPlacesData,
    isEnrichmentSearching,
    isEnrichmentFetching,
    currentEnrichment,
    currentEnrichmentIndex,
    enrichmentQueue.length,
    isEnrichingLocations,
  ]);

  // Start enrichment when itinerary loads
  useEffect(() => {
    if (
      !itineraryDays.length ||
      enrichmentCompleted.current ||
      enrichmentStarted.current ||
      isEnrichingLocations
    ) {
      return;
    }

    const activitiesToEnrich: Array<{
      dayId: string;
      activityId: string;
      location: string;
    }> = [];

    itineraryDays.forEach((day) => {
      day.activities.forEach((activity) => {
        if (activity.location && !activity.locationData) {
          activitiesToEnrich.push({
            dayId: day.id,
            activityId: activity.id,
            location: activity.location,
          });
        }
      });
    });

    if (activitiesToEnrich.length > 0) {
      enrichmentStarted.current = true;
      setEnrichmentQueue(activitiesToEnrich);
      setCurrentEnrichmentIndex(0);
      setIsEnrichingLocations(true);

      toast.info("Enriching Activity Locations", {
        description: `Finding coordinates for ${activitiesToEnrich.length} activities...`,
        duration: 3000,
      });
    } else {
      enrichmentCompleted.current = true;
    }
  }, [itineraryDays, isEnrichingLocations]);

  // Route Optimization Functions
  const calculateDistance = (location1: string, location2: string): number => {
    // Simplified distance calculation - in real app would use actual coordinates
    const commonRoutes: { [key: string]: number } = {
      "city-center-airport": 25,
      "airport-hotel": 20,
      "hotel-downtown": 5,
      "downtown-station": 3,
      "station-museum": 2,
      "museum-park": 1.5,
      "park-restaurant": 2,
      "restaurant-hotel": 3,
    };

    const key = `${location1.toLowerCase().split(",")[0].trim()}-${location2
      .toLowerCase()
      .split(",")[0]
      .trim()}`;
    const reverseKey = `${location2
      .toLowerCase()
      .split(",")[0]
      .trim()}-${location1.toLowerCase().split(",")[0].trim()}`;

    return (
      commonRoutes[key] || commonRoutes[reverseKey] || Math.random() * 50 + 10
    );
  };

  const calculateTravelTime = (distance: number): number => {
    return Math.round((distance / 40) * 60);
  };

  const optimizeRoute = (activities: Activity[]): Activity[] => {
    if (activities.length <= 2) return activities;

    const activitiesWithLocations = activities.filter((a) => a.location);
    if (activitiesWithLocations.length <= 2) return activities;

    const optimized: Activity[] = [];
    const remaining = [...activitiesWithLocations];

    let current = remaining.shift()!;
    optimized.push(current);

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let shortestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(
          current.location,
          remaining[i].location
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = i;
        }
      }

      current = remaining.splice(nearestIndex, 1)[0];
      optimized.push(current);
    }

    return optimized;
  };

  // Analyze days with route optimization - memoized
  const daysWithLocations = useMemo(
    () =>
      itineraryDays.filter(
        (d) => d.activities.filter((a) => a.location).length >= 2
      ),
    [itineraryDays]
  );

  useEffect(() => {
    if (daysWithLocations.length > 0) {
      const newOptimizations = new Map();

      daysWithLocations.forEach((day) => {
        const originalActivities = day.activities.filter((a) => a.location);
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

        const timeSaved =
          calculateTravelTime(originalDistance) -
          calculateTravelTime(optimizedDistance);

        newOptimizations.set(day.id, {
          originalDistance,
          optimizedDistance,
          timeSaved,
          optimizedActivities: optimized,
          showOptimized: false,
        });
      });

      setDayOptimizations(newOptimizations);

      // Set initial active tab
      if (!activeOptimizationTab && daysWithLocations.length > 0) {
        setActiveOptimizationTab(daysWithLocations[0].id);
      }
    }
  }, [daysWithLocations, activeOptimizationTab]);

  const handleAcceptOptimization = (dayId: string) => {
    const optimization = dayOptimizations.get(dayId);
    if (!optimization) return;

    setItineraryDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, activities: optimization.optimizedActivities }
          : day
      )
    );

    toast.success("Route Optimized!", {
      description: `Activities reordered. You'll save ~${optimization.timeSaved} minutes!`,
    });
    setHasUnsavedChanges(true);
  };

  const handleShowOptimizedRoute = (dayId: string) => {
    setDayOptimizations((prev) => {
      const newMap = new Map(prev);
      const opt = newMap.get(dayId);
      if (opt) {
        newMap.set(dayId, { ...opt, showOptimized: true });
      }
      return newMap;
    });
  };

  const handleKeepCurrentRoute = (dayId: string) => {
    setDayOptimizations((prev) => {
      const newMap = new Map(prev);
      const opt = newMap.get(dayId);
      if (opt) {
        newMap.set(dayId, { ...opt, showOptimized: false });
      }
      return newMap;
    });
  };

  // Location coordinates for map
  const LOCATION_COORDS: { [key: string]: [number, number] } = {
    "city center": [40.7128, -74.006],
    airport: [40.6413, -73.7781],
    downtown: [40.7589, -73.9851],
    station: [40.7506, -73.9776],
    hotel: [40.7614, -73.9776],
    museum: [40.7794, -73.9632],
    park: [40.7851, -73.9683],
    restaurant: [40.761, -73.982],
    beach: [40.5795, -73.9822],
    mountain: [40.6635, -74.1953],
    university: [40.8075, -73.9626],
    stadium: [40.6825, -73.9756],
    harbor: [40.7029, -74.014],
  };

  const getCoordinates = (location: string): [number, number] | null => {
    const normalizedLocation = location.toLowerCase().trim().split(",")[0];

    if (LOCATION_COORDS[normalizedLocation]) {
      return LOCATION_COORDS[normalizedLocation];
    }

    for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
      if (
        normalizedLocation.includes(key) ||
        key.includes(normalizedLocation)
      ) {
        return coords;
      }
    }

    return [
      40.7128 + (Math.random() - 0.5) * 0.5,
      -74.006 + (Math.random() - 0.5) * 0.5,
    ];
  };

  const cleanupMap = () => {
    if (mapRef.current) {
      try {
        const {
          map,
          originalMarkers,
          optimizedMarkers,
          originalPolyline,
          optimizedPolyline,
        } = mapRef.current;

        originalMarkers.forEach((marker: any) => marker.remove());
        optimizedMarkers.forEach((marker: any) => marker.remove());
        if (originalPolyline) originalPolyline.remove();
        if (optimizedPolyline) optimizedPolyline.remove();

        map.remove();

        mapRef.current = null;
      } catch (error) {
        console.error("Error cleaning up map:", error);
      }
    }
  };

  const initializeMap = async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const L = await import("leaflet");

      if (!document.getElementById("leaflet-styles")) {
        const style = document.createElement("style");
        style.id = "leaflet-styles";
        style.textContent = `
          .leaflet-container {
            font-family: inherit;
          }
        `;
        document.head.appendChild(style);
      }

      const map = L.map(mapContainerRef.current, {
        center: [40.7128, -74.006],
        zoom: 12,
        zoomControl: true,
      });

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
        if (mapRef.current) {
          mapRef.current.map.invalidateSize();
          updateMapRoutes();
        }
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Map Error", {
        description: "Could not load map. Please try again.",
      });
    }
  };

  const updateMapRoutes = () => {
    if (!mapRef.current || !activeOptimizationTab) return;

    const {
      map,
      L,
      originalMarkers,
      optimizedMarkers,
      originalPolyline,
      optimizedPolyline,
    } = mapRef.current;
    const optimization = dayOptimizations.get(activeOptimizationTab);
    const day = daysWithLocations.find((d) => d.id === activeOptimizationTab);

    if (!optimization || !day) return;

    originalMarkers.forEach((marker: any) => marker.remove());
    optimizedMarkers.forEach((marker: any) => marker.remove());
    if (originalPolyline) originalPolyline.remove();
    if (optimizedPolyline) optimizedPolyline.remove();

    mapRef.current.originalMarkers = [];
    mapRef.current.optimizedMarkers = [];
    mapRef.current.originalPolyline = null;
    mapRef.current.optimizedPolyline = null;

    const originalActivities = day.activities.filter((a) => a.location);
    const optimizedActivities = optimization.optimizedActivities;

    if (originalActivities.length === 0) return;

    const allCoords: [number, number][] = [];

    if (showOriginalRoute) {
      const originalCoords: [number, number][] = [];
      const newOriginalMarkers: any[] = [];

      originalActivities.forEach((activity, index) => {
        const coord = getCoordinates(activity.location);
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

    if (showOptimizedRoute && optimization.timeSaved > 0) {
      const optimizedCoords: [number, number][] = [];
      const newOptimizedMarkers: any[] = [];

      optimizedActivities.forEach((activity, index) => {
        const coord = getCoordinates(activity.location);
        if (!coord) return;

        optimizedCoords.push(coord);
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

      if (optimizedCoords.length > 1) {
        const polyline = L.polyline(optimizedCoords, {
          color: "#10B981",
          weight: 5,
          opacity: 0.8,
        }).addTo(map);

        mapRef.current.optimizedPolyline = polyline;
      }

      mapRef.current.optimizedMarkers = newOptimizedMarkers;
    }

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Initialize map when switching to map view
  useEffect(() => {
    if (mapView === "map") {
      if (mapContainerRef.current && !mapRef.current) {
        initializeMap();
      } else if (mapRef.current && activeOptimizationTab) {
        updateMapRoutes();
      }
    } else {
      cleanupMap();
    }

    return () => {
      if (mapView !== "map") {
        cleanupMap();
      }
    };
  }, [mapView, activeOptimizationTab, showOriginalRoute, showOptimizedRoute]);

  // Update map when optimization changes
  useEffect(() => {
    if (mapView === "map" && mapRef.current) {
      updateMapRoutes();
    }
  }, [dayOptimizations, activeOptimizationTab]);

  const getIconNameFromComponent = (iconComponent: any): string => {
    if (!iconComponent) return "Clock";
    if (typeof iconComponent === "string") return iconComponent;

    const iconMatch = ICON_OPTIONS.find((opt) => {
      try {
        return (
          opt.icon === iconComponent || opt.icon.name === iconComponent.name
        );
      } catch {
        return false;
      }
    });

    if (iconMatch) return iconMatch.value;
    return "Clock";
  };

  // Load itinerary data
  useEffect(() => {
    if (!id) {
      navigate("/itinerary");
      return;
    }

    if (bookingDetailResponse?.data) {
      const bookingData = bookingDetailResponse.data;

      const loadedFormData: RequestedBookingFormData = {
        customerName: bookingData.customerName || "",
        email: bookingData.customerEmail || "",
        mobile: bookingData.customerMobile || "",
        destination: bookingData.destination || "",
        travelDateFrom: bookingData.startDate
          ? new Date(bookingData.startDate).toISOString().split("T")[0]
          : "",
        travelDateTo: bookingData.endDate
          ? new Date(bookingData.endDate).toISOString().split("T")[0]
          : "",
        travelers: bookingData.travelers?.toString() || "1",
        totalAmount: bookingData.totalPrice?.toString() || "",
      };

      setFormData(loadedFormData);
      setInitialFormData(loadedFormData);

      if (
        bookingData.itinerary?.days &&
        Array.isArray(bookingData.itinerary.days)
      ) {
        const convertedItinerary = bookingData.itinerary.days.map(
          (day: any, index: number) => ({
            id: day.id || generateId(),
            day: day.dayNumber || index + 1,
            title: day.title || `Day ${day.dayNumber || index + 1}`,
            activities: (day.activities || []).map(
              (activity: any, actIdx: number) => ({
                id: activity.id || generateId(),
                time: activity.time || "",
                icon: activity.icon || "Clock",
                title: activity.title || "",
                description: activity.description || "",
                location: activity.location || "",
                locationData: activity.locationData || undefined,
                order: activity.order !== undefined ? activity.order : actIdx,
              })
            ),
          })
        );
        setItineraryDays(convertedItinerary);
        setInitialItineraryDays(JSON.parse(JSON.stringify(convertedItinerary)));
      }
      return;
    }

    if (!passedItineraryData && !isLoadingBooking) {
      toast.error("Booking not found");
      navigate("/itinerary");
      return;
    }

    // Parse dates from booking
    let startDate = "";
    let endDate = "";

    if (passedItineraryData.startDate && passedItineraryData.endDate) {
      startDate = passedItineraryData.startDate;
      endDate = passedItineraryData.endDate;
    } else if (
      passedItineraryData.dates &&
      typeof passedItineraryData.dates === "string"
    ) {
      const dateMatch = passedItineraryData.dates.match(
        /([\w\s,]+)\s*[-–]\s*([\w\s,]+)/
      );
      if (dateMatch) {
        const start = new Date(dateMatch[1] + " 12:00:00");
        const end = new Date(dateMatch[2] + " 12:00:00");

        startDate = `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(end.getDate()).padStart(2, "0")}`;
      }
    }

    let parsedAmount = "";
    if (passedItineraryData.totalAmount) {
      const numericValue = passedItineraryData.totalAmount
        .replace(/[₱$,]/g, "")
        .trim();
      parsedAmount = numericValue;
    } else if (passedItineraryData.total) {
      const numericValue = passedItineraryData.total
        .replace(/[₱$,]/g, "")
        .trim();
      parsedAmount = numericValue;
    }

    const loadedFormData: RequestedBookingFormData = {
      customerName:
        passedItineraryData.customer || passedItineraryData.customerName || "",
      email: passedItineraryData.email || "",
      mobile: passedItineraryData.mobile || "",
      destination: passedItineraryData.destination || "",
      travelDateFrom: startDate,
      travelDateTo: endDate,
      travelers: passedItineraryData.travelers?.toString() || "1",
      totalAmount: parsedAmount,
    };

    setFormData(loadedFormData);
    setInitialFormData(loadedFormData);

    if (
      passedItineraryData.itineraryDetails &&
      Array.isArray(passedItineraryData.itineraryDetails)
    ) {
      const convertedItinerary = passedItineraryData.itineraryDetails.map(
        (day: any) => ({
          ...day,
          id: day.id || generateId(),
          activities: day.activities.map((activity: any) => ({
            ...activity,
            id: activity.id || generateId(),
            icon: getIconNameFromComponent(activity.icon),
            order: activity.order || 0,
          })),
        })
      );
      setItineraryDays(convertedItinerary);
      setInitialItineraryDays(JSON.parse(JSON.stringify(convertedItinerary)));
    } else if (
      passedItineraryData.itineraryDays &&
      Array.isArray(passedItineraryData.itineraryDays)
    ) {
      const convertedItinerary = passedItineraryData.itineraryDays.map(
        (day: any) => ({
          ...day,
          id: day.id || generateId(),
          activities: day.activities.map((activity: any) => ({
            ...activity,
            id: activity.id || generateId(),
            icon: getIconNameFromComponent(activity.icon),
            order: activity.order || 0,
          })),
        })
      );
      setItineraryDays(convertedItinerary);
      setInitialItineraryDays(JSON.parse(JSON.stringify(convertedItinerary)));
    } else {
      const dayCount =
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      const days: Day[] = [];
      for (let i = 1; i <= (dayCount > 0 ? dayCount : 1); i++) {
        days.push({
          id: generateId(),
          day: i,
          title: "",
          activities: [],
        });
      }
      setItineraryDays(days);
      setInitialItineraryDays(JSON.parse(JSON.stringify(days)));
    }
  }, [
    id,
    bookingDetailResponse,
    passedItineraryData,
    navigate,
    isLoadingBooking,
  ]);

  // Track changes
  useEffect(() => {
    if (!initialFormData || !initialItineraryDays) {
      setHasUnsavedChanges(false);
      return;
    }

    const formChanged =
      formData.customerName !== initialFormData.customerName ||
      formData.email !== initialFormData.email ||
      formData.mobile !== initialFormData.mobile ||
      formData.destination !== initialFormData.destination ||
      formData.travelDateFrom !== initialFormData.travelDateFrom ||
      formData.travelDateTo !== initialFormData.travelDateTo ||
      formData.travelers !== initialFormData.travelers ||
      formData.totalAmount !== initialFormData.totalAmount;

    const itineraryChanged =
      JSON.stringify(itineraryDays) !== JSON.stringify(initialItineraryDays);

    setHasUnsavedChanges(formChanged || itineraryChanged);
  }, [formData, itineraryDays, initialFormData, initialItineraryDays]);

  // Adjust days when dates change
  useEffect(() => {
    if (
      formData.travelDateFrom &&
      formData.travelDateTo &&
      !pendingDateChange &&
      !pendingDaysChange
    ) {
      const start = new Date(formData.travelDateFrom);
      const end = new Date(formData.travelDateTo);

      if (end < start) return;

      const dayCount =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      if (dayCount > 0 && dayCount !== itineraryDays.length) {
        if (dayCount > itineraryDays.length) {
          const newDays: Day[] = [];
          for (let i = itineraryDays.length + 1; i <= dayCount; i++) {
            newDays.push({
              id: generateId(),
              day: i,
              title: "",
              activities: [],
            });
          }
          setItineraryDays((prev) => [...prev, ...newDays]);
        } else {
          const daysToRemove = itineraryDays.slice(dayCount);
          const hasContent = daysToRemove.some(
            (day) => day.title || day.activities.length > 0
          );

          if (!hasContent) {
            setItineraryDays((prev) => prev.slice(0, dayCount));
          } else {
            setPendingDaysChange(dayCount);
            setReduceDaysConfirm({
              newDayCount: dayCount,
              daysToRemove: itineraryDays.length - dayCount,
            });
          }
        }
      }
    }
  }, [
    formData.travelDateFrom,
    formData.travelDateTo,
    pendingDateChange,
    pendingDaysChange,
    itineraryDays,
  ]);

  // Handle location search
  const handleLocationSearch = (
    searchTerm: string,
    dayId: string,
    activityId: string
  ) => {
    updateActivity(dayId, activityId, "location", searchTerm);
    setLocationSearchQuery(searchTerm);
    if (searchTerm.length >= 2) {
      const filtered = GENERIC_LOCATIONS.filter((location) =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setActiveLocationInput({ dayId, activityId });
    } else {
      setLocationSuggestions([]);
      setActiveLocationInput(null);
    }
  };

  // Select location suggestion
  const selectLocationSuggestion = (
    placeOrName: string | Place,
    dayId: string,
    activityId: string
  ) => {
    if (typeof placeOrName === "string") {
      updateActivity(dayId, activityId, "location", placeOrName);
    } else {
      updateActivity(dayId, activityId, "location", placeOrName.name);
      updateActivity(dayId, activityId, "locationData", placeOrName);
    }
    setLocationSuggestions([]);
    setActiveLocationInput(null);
  };

  // Handle form data changes
  const handleFormChange = (
    field: keyof RequestedBookingFormData,
    value: string
  ) => {
    if (field === "travelDateFrom" || field === "travelDateTo") {
      const tempData = { ...formData, [field]: value };

      if (tempData.travelDateFrom && tempData.travelDateTo) {
        const start = new Date(tempData.travelDateFrom);
        const end = new Date(tempData.travelDateTo);

        if (end < start) {
          toast.error("Invalid Date Range", {
            description: "End date cannot be before start date",
          });
          return;
        }

        const newDayCount =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        const currentDayCount = itineraryDays.length;

        if (newDayCount > 0 && newDayCount < currentDayCount) {
          const daysToRemove = itineraryDays.slice(newDayCount);
          const hasContent = daysToRemove.some(
            (day) => day.title || day.activities.length > 0
          );

          if (hasContent) {
            setPendingDateChange({ field, value });
            setReduceDaysConfirm({
              newDayCount,
              daysToRemove: currentDayCount - newDayCount,
            });
            return;
          }
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Confirm reduce days
  const handleConfirmReduceDays = () => {
    if (reduceDaysConfirm) {
      if (pendingDateChange) {
        setFormData((prev) => ({
          ...prev,
          [pendingDateChange.field]: pendingDateChange.value,
        }));
      } else if (pendingDaysChange !== null) {
        setFormData((prev) => ({
          ...prev,
          days: pendingDaysChange,
        }));
      }

      setItineraryDays((prev) => prev.slice(0, reduceDaysConfirm.newDayCount));

      toast.success("Travel Dates Updated", {
        description: `${reduceDaysConfirm.daysToRemove} ${
          reduceDaysConfirm.daysToRemove === 1 ? "day" : "days"
        } removed from itinerary.`,
      });
    }

    setReduceDaysConfirm(null);
    setPendingDateChange(null);
    setPendingDaysChange(null);
  };

  // Cancel reduce days
  const handleCancelReduceDays = () => {
    setReduceDaysConfirm(null);
    setPendingDateChange(null);
    setPendingDaysChange(null);
  };

  // Update day title
  const updateDayTitle = (dayId: string, title: string) => {
    setItineraryDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, title } : day))
    );
    setHasUnsavedChanges(true);
  };

  // Add activity to a day
  const addActivity = (dayId: string) => {
    const day = itineraryDays.find((d) => d.id === dayId);
    const newActivity: Activity = {
      id: generateId(),
      time: "",
      icon: "",
      title: "",
      description: "",
      location: "",
      order: day ? day.activities.length : 0,
    };

    setItineraryDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, activities: [...day.activities, newActivity] }
          : day
      )
    );

    toast.success("Activity Added", {
      description: "A new activity slot has been created.",
    });
    setHasUnsavedChanges(true);
  };

  // Remove activity from a day
  const confirmDeleteActivity = (dayId: string, activityId: string) => {
    setDeleteActivityConfirm({ dayId, activityId });
  };

  const removeActivity = () => {
    if (!deleteActivityConfirm) return;

    const { dayId, activityId } = deleteActivityConfirm;
    setItineraryDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities
                .filter((a) => a.id !== activityId)
                .map((a, idx) => ({ ...a, order: idx })),
            }
          : day
      )
    );

    setDeleteActivityConfirm(null);
    toast.success("Activity Removed", {
      description: "The activity has been deleted.",
    });
    setHasUnsavedChanges(true);
  };

  // Update activity
  const updateActivity = (
    dayId: string,
    activityId: string,
    field: keyof Activity,
    value: string | Place
  ) => {
    if (field === "time" && value) {
      const day = itineraryDays.find((d) => d.id === dayId);
      if (day) {
        const timeExists = day.activities.some(
          (activity) => activity.id !== activityId && activity.time === value
        );

        if (timeExists) {
          toast.error("Time Overlap Detected", {
            description: `The time ${value} is already used by another activity on Day ${day.day}. Please choose a different time.`,
          });
          return;
        }

        const activityIndex = day.activities.findIndex(
          (a) => a.id === activityId
        );
        if (activityIndex > 0) {
          const previousActivity = day.activities[activityIndex - 1];
          if (previousActivity.time && value <= previousActivity.time) {
            toast.error("Invalid Time Sequence", {
              description: `Activity time must be later than the previous activity (${previousActivity.time}) on Day ${day.day}.`,
            });
            return;
          }
        }
      }
    }

    setItineraryDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.map((activity) =>
                activity.id === activityId
                  ? { ...activity, [field]: value }
                  : activity
              ),
            }
          : day
      )
    );
    setHasUnsavedChanges(true);
  };

  // Move activity up
  const moveActivityUp = (dayId: string, activityIndex: number) => {
    if (activityIndex === 0) return;

    setItineraryDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const newActivities = [...day.activities];
          [newActivities[activityIndex], newActivities[activityIndex - 1]] = [
            newActivities[activityIndex - 1],
            newActivities[activityIndex],
          ];
          return {
            ...day,
            activities: newActivities.map((a, idx) => ({ ...a, order: idx })),
          };
        }
        return day;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Move activity down
  const moveActivityDown = (dayId: string, activityIndex: number) => {
    setItineraryDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId && activityIndex < day.activities.length - 1) {
          const newActivities = [...day.activities];
          [newActivities[activityIndex], newActivities[activityIndex + 1]] = [
            newActivities[activityIndex + 1],
            newActivities[activityIndex],
          ];
          return {
            ...day,
            activities: newActivities.map((a, idx) => ({ ...a, order: idx })),
          };
        }
        return day;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Open icon picker
  const openIconPicker = (dayId: string, activityId: string) => {
    setCurrentActivityForIcon({ dayId, activityId });
    setIconPickerOpen(true);
  };

  // Select icon
  const selectIcon = (iconValue: string) => {
    if (currentActivityForIcon) {
      updateActivity(
        currentActivityForIcon.dayId,
        currentActivityForIcon.activityId,
        "icon",
        iconValue
      );
    }
    setIconPickerOpen(false);
    setCurrentActivityForIcon(null);
  };

  // Handle save
  const handleSaveClick = () => {
    const errors = [];

    if (!formData.customerName.trim()) {
      errors.push("Customer Name");
    }
    if (!formData.email.trim()) {
      errors.push("Email Address");
    }
    if (!formData.mobile.trim()) {
      errors.push("Mobile Number");
    }
    if (!formData.destination.trim()) {
      errors.push("Destination");
    }
    if (!formData.travelDateFrom) {
      errors.push("Travel Start Date");
    }
    if (!formData.travelDateTo) {
      errors.push("Travel End Date");
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      errors.push("Valid Total Amount");
    }

    if (errors.length > 0) {
      toast.error("Missing Required Fields", {
        description: `Please fill in: ${errors.join(", ")}`,
      });
      return;
    }

    for (const day of itineraryDays) {
      if (!day.title.trim()) {
        toast.error(`Day ${day.day} Incomplete`, {
          description: `Please enter a title for Day ${day.day}.`,
        });
        return;
      }

      const times = day.activities.map((a) => a.time).filter(Boolean);
      const uniqueTimes = new Set(times);
      if (times.length !== uniqueTimes.size) {
        toast.error(`Time Conflict on Day ${day.day}`, {
          description: "Multiple activities have the same time.",
        });
        return;
      }
    }

    setSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (!id) return;

    const enrichedActivities = itineraryDays.flatMap((day) =>
      day.activities.map((activity, activityIndex) => ({
        dayNumber: day.day,
        time: activity.time || "00:00",
        title: activity.title,
        description: activity.description || "",
        location: activity.location || "",
        locationData: activity.locationData || null,
        icon: activity.icon || null,
        order: activity.order !== undefined ? activity.order : activityIndex,
      }))
    );

    const updatePayload = {
      destination: formData.destination,
      customerName: formData.customerName,
      customerEmail: formData.email,
      customerMobile: formData.mobile,
      startDate: new Date(formData.travelDateFrom).toISOString(),
      endDate: new Date(formData.travelDateTo).toISOString(),
      travelers: parseInt(formData.travelers),
      totalPrice: parseFloat(formData.totalAmount),
      version: 1,
      itinerary: [
        {
          title: `${itineraryDays.length}-Day ${formData.destination} Trip`,
          destination: formData.destination,
          dayNumber: 1,
          days: itineraryDays.map((day, index) => ({
            dayNumber: day.day,
            date: new Date(
              new Date(formData.travelDateFrom).getTime() +
                index * 24 * 60 * 60 * 1000
            ).toISOString(),
            title: day.title,
          })),
          activities: enrichedActivities,
          type: "CUSTOMIZED",
          status: "DRAFT",
          tourType: "PRIVATE",
          requestedStatus: "DRAFT",
        },
      ],
    };

    updateBooking(updatePayload);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setBackConfirmOpen(true);
    } else {
      navigate("/itinerary");
    }
  };

  const handleConfirmBack = () => {
    setBackConfirmOpen(false);
    navigate("/itinerary");
  };

  const handleApplyOptimizedRoute = (
    dayId: string,
    optimizedActivities: Activity[]
  ) => {
    setItineraryDays((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, activities: optimizedActivities } : day
      )
    );
    setHasUnsavedChanges(true);
    toast.success("Route Optimized!", {
      description: "Activities have been reordered for optimal travel.",
    });
  };

  if (isLoadingBooking && !passedItineraryData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0A7AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ paddingBottom: 45 }}>
      {/* Enrichment Progress Banner */}
      {isEnrichingLocations && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ContentCard>
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#0A7AFF]" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[#1A2B4F] mb-1">
                  Enriching Activity Locations
                </h3>
                <p className="text-xs text-[#64748B]">
                  Finding coordinates for activities...{" "}
                  {currentEnrichmentIndex + 1} of {enrichmentQueue.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] transition-all duration-300"
                    style={{
                      width: `${
                        ((currentEnrichmentIndex + 1) /
                          enrichmentQueue.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[#64748B] font-medium">
                  {Math.round(
                    ((currentEnrichmentIndex + 1) / enrichmentQueue.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </ContentCard>
        </motion.div>
      )}

      {/* Header */}
      <ContentCard>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackClick}
            className="w-11 h-11 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] bg-white hover:bg-[rgba(10,122,255,0.05)] flex items-center justify-center transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#0A7AFF] transition-colors" />
          </button>
          <div className="flex-1">
            <h1 className="text-[#1A2B4F] mb-1">Edit Requested Booking</h1>
            <p className="text-sm text-[#64748B]">
              Update the requested booking details and day-by-day activities
            </p>
          </div>
          {isEnrichingLocations && (
            <div className="flex items-center gap-2 text-sm text-[#0A7AFF]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Enriching locations... {currentEnrichmentIndex + 1}/
                {enrichmentQueue.length}
              </span>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Customer & Booking Information */}
      <ContentCard>
        <div className="mb-6">
          <h2 className="text-lg text-[#1A2B4F] font-semibold">
            Customer & Booking Information
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="customerName" className="text-[#1A2B4F] mb-2 block">
              Customer Name <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                disabled
                id="customerName"
                placeholder="e.g., John Smith"
                value={formData.customerName}
                onChange={(e) =>
                  handleFormChange("customerName", e.target.value)
                }
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-[#1A2B4F] mb-2 block">
              Email Address <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="email"
                type="email"
                disabled
                placeholder="john.smith@email.com"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile" className="text-[#1A2B4F] mb-2 block">
              Mobile Number <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="mobile"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.mobile}
                disabled
                onChange={(e) => handleFormChange("mobile", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="destination" className="text-[#1A2B4F] mb-2 block">
              Destination <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="destination"
                placeholder="e.g., New York City"
                value={formData.destination}
                onChange={(e) =>
                  handleFormChange("destination", e.target.value)
                }
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="travelDateFrom"
              className="text-[#1A2B4F] mb-2 block"
            >
              Travel Start Date <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelDateFrom"
                type="date"
                value={formData.travelDateFrom}
                onChange={(e) =>
                  handleFormChange("travelDateFrom", e.target.value)
                }
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelDateTo" className="text-[#1A2B4F] mb-2 block">
              Travel End Date <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelDateTo"
                type="date"
                value={formData.travelDateTo}
                onChange={(e) =>
                  handleFormChange("travelDateTo", e.target.value)
                }
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelers" className="text-[#1A2B4F] mb-2 block">
              Number of Travelers <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelers"
                type="number"
                min="1"
                placeholder="2"
                value={formData.travelers}
                onChange={(e) => handleFormChange("travelers", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalAmount" className="text-[#1A2B4F] mb-2 block">
              Total Amount ($) <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">
                $
              </span>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter Total Amount"
                value={formData.totalAmount}
                onChange={(e) =>
                  handleFormChange("totalAmount", e.target.value)
                }
                className="h-12 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Route Optimization Section */}
      {daysWithLocations.length > 0 ? (
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
              </div>
            </div>
          </div>

          {daysWithLocations.length > 1 && (
            <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] bg-linear-to-br from-[rgba(10,122,255,0.02)] to-transparent">
              <Tabs
                value={activeOptimizationTab}
                onValueChange={setActiveOptimizationTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto flex-nowrap">
                  {daysWithLocations.map((day) => {
                    const optimization = dayOptimizations.get(day.id);
                    const hasSavings =
                      optimization && optimization.timeSaved > 5;
                    return (
                      <TabsTrigger
                        key={day.id}
                        value={day.id}
                        className="relative data-[state=active]:bg-linear-to-r data-[state=active]:from-[#0A7AFF] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white rounded-lg px-4 py-2 transition-all whitespace-nowrap"
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

          <div className="p-5">
            {daysWithLocations.map((day) => {
              const optimization = dayOptimizations.get(day.id);
              if (!optimization || day.id !== activeOptimizationTab)
                return null;

              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#64748B]">
                        Day {day.day}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                    </div>
                    <h4 className="text-lg text-[#1A2B4F]">
                      {day.title || `Day ${day.day}`}
                    </h4>
                  </div>

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
                        {optimization.originalDistance.toFixed(1)} km
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
                        <span className="text-xs text-[#065F46]">
                          Optimized
                        </span>
                      </div>
                      <p className="text-xl text-[#10B981]">
                        {optimization.optimizedDistance.toFixed(1)} km
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-xl ${
                        optimization.timeSaved > 5
                          ? "bg-linear-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#FFB84D]/20"
                          : "bg-linear-to-br from-[#F1F5F9] to-[#E2E8F0] border border-[#CBD5E1]/20"
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                          {optimization.timeSaved > 5 ? (
                            <Zap className="w-4 h-4 text-[#FFB84D]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#64748B]" />
                          )}
                        </div>
                        <span className="text-xs text-[#78350F]">
                          Time Saved
                        </span>
                      </div>
                      <p
                        className={`text-xl ${
                          optimization.timeSaved > 5
                            ? "text-[#FFB84D]"
                            : "text-[#64748B]"
                        }`}
                      >
                        {optimization.timeSaved > 0
                          ? `~${optimization.timeSaved} min`
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
                        {mapView === "map" && optimization.timeSaved > 0 && (
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
                              {optimization.originalDistance.toFixed(1)} km
                            </span>
                          </div>
                          <div className="space-y-2">
                            {day.activities
                              .filter((a) => a.location)
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
                                        {calculateDistance(
                                          activity.location,
                                          arr[idx + 1].location
                                        ).toFixed(1)}{" "}
                                        km
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>

                        {optimization.timeSaved > 0 && (
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
                                  -{optimization.timeSaved} min
                                </span>
                              </div>
                              <span className="text-xs text-[#64748B]">
                                {optimization.optimizedDistance.toFixed(1)} km
                              </span>
                            </div>
                            <div className="space-y-2">
                              {optimization.optimizedActivities.map(
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
                                          {calculateDistance(
                                            activity.location,
                                            arr[idx + 1].location
                                          ).toFixed(1)}{" "}
                                          km
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {optimization.timeSaved <= 0 && (
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
                        {!mapRef.current && (
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
                        {mapRef.current && optimization.timeSaved > 0 && (
                          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-[#E5E7EB] z-1000">
                            <p className="text-xs text-[#64748B] mb-2">
                              Route Comparison
                            </p>
                            {showOriginalRoute && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-4 h-0.5 bg-[#0A7AFF] border-dashed border-2 border-[#0A7AFF]"></div>
                                <span className="text-xs text-[#1A2B4F]">
                                  Original (
                                  {optimization.originalDistance.toFixed(1)} km)
                                </span>
                              </div>
                            )}
                            {showOptimizedRoute && (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-[#10B981] rounded"></div>
                                <span className="text-xs text-[#1A2B4F]">
                                  Optimized (
                                  {optimization.optimizedDistance.toFixed(1)}{" "}
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
                  {optimization.timeSaved > 0 && (
                    <button
                      onClick={() => handleAcceptOptimization(day.id)}
                      className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#14B8A6] hover:from-[#0EA574] hover:to-[#12A594] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#10B981]/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Apply Optimized Route
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
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
              Add at least 2 activities with locations to any day and I'll
              analyze the most efficient routes for you.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFB] border border-[#E5E7EB]">
              <Info className="w-4 h-4 text-[#14B8A6]" />
              <span className="text-xs text-[#64748B]">
                Saves time by reordering activities based on location proximity
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Route Optimization Panel */}
      <RouteOptimizationPanel
        itineraryDays={itineraryDays}
        selectedDayId={selectedDayForRoute}
        onAcceptOptimization={handleApplyOptimizedRoute}
      />

      {/* Day-by-Day Itinerary */}
      <ContentCard>
        <div className="mb-6">
          <h2 className="text-lg text-[#1A2B4F] font-semibold">
            Day-by-Day Itinerary ({itineraryDays.length} Days)
          </h2>
        </div>
        <div className="space-y-6">
          {itineraryDays.map((day, dayIndex) => (
            <div
              key={day.id}
              className="p-6 rounded-2xl border-2 border-[#E5E7EB] bg-linear-to-br from-[rgba(10,122,255,0.02)] to-[rgba(20,184,166,0.02)] hover:border-[#0A7AFF]/30 transition-all"
            >
              {/* Day Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                  <span className="text-white font-bold">D{day.day}</span>
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor={`day-${day.id}-title`}
                    className="text-[#1A2B4F] mb-2 block text-sm font-medium"
                  >
                    Day {day.day} Title{" "}
                    <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id={`day-${day.id}-title`}
                    placeholder="e.g., Arrival & City Tour"
                    value={day.title}
                    onChange={(e) => updateDayTitle(day.id, e.target.value)}
                    className="h-11 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => addActivity(day.id)}
                  className="h-11 px-5 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center gap-2 text-sm font-medium shadow-lg shadow-[#0A7AFF]/20 hover:shadow-xl hover:shadow-[#0A7AFF]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </div>

              {/* Activities */}
              <div className="space-y-4">
                {day.activities.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl bg-white">
                    <div className="w-14 h-14 rounded-xl bg-[#F8FAFB] flex items-center justify-center mx-auto mb-3">
                      <Package className="w-7 h-7 text-[#CBD5E1]" />
                    </div>
                    <p className="text-sm text-[#64748B] mb-1">
                      No activities yet for Day {day.day}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      Click "Add Activity" to start building this day
                    </p>
                  </div>
                ) : (
                  day.activities.map((activity, activityIndex) => {
                    const IconComponent = getIconComponent(activity.icon);
                    const hasCoordinates =
                      activity.locationData &&
                      typeof activity.locationData.lat === "number" &&
                      typeof activity.locationData.lng === "number";

                    return (
                      <div
                        key={activity.id}
                        className="relative p-4 rounded-xl border-2 border-[#E5E7EB] bg-white hover:border-[#0A7AFF] transition-all group"
                      >
                        {/* Activity number badge */}
                        <div className="absolute -left-3 -top-3 w-7 h-7 rounded-lg bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-md text-white text-xs font-bold">
                          {activityIndex + 1}
                        </div>

                        {/* Coordinate Status Badge */}
                        {activity.location && (
                          <div className="absolute -right-3 -top-3">
                            {hasCoordinates ? (
                              <div
                                className="w-7 h-7 rounded-lg bg-[#10B981] flex items-center justify-center shadow-md"
                                title="Coordinates found"
                              >
                                <MapPin className="w-4 h-4 text-white" />
                              </div>
                            ) : isEnrichingLocations &&
                              currentEnrichment?.activityId === activity.id ? (
                              <div
                                className="w-7 h-7 rounded-lg bg-[#FF9800] flex items-center justify-center shadow-md"
                                title="Searching for coordinates"
                              >
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Drag Handle */}
                          <div className="flex flex-col gap-1 pt-2">
                            <button
                              onClick={() =>
                                moveActivityUp(day.id, activityIndex)
                              }
                              disabled={activityIndex === 0}
                              className="w-7 h-7 rounded-lg hover:bg-[rgba(10,122,255,0.1)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Move Up"
                            >
                              <GripVertical className="w-4 h-4 text-[#CBD5E1] rotate-90" />
                            </button>
                            <button
                              onClick={() =>
                                moveActivityDown(day.id, activityIndex)
                              }
                              disabled={
                                activityIndex === day.activities.length - 1
                              }
                              className="w-7 h-7 rounded-lg hover:bg-[rgba(10,122,255,0.1)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Move Down"
                            >
                              <GripVertical className="w-4 h-4 text-[#CBD5E1] -rotate-90" />
                            </button>
                          </div>

                          {/* Form Fields */}
                          <div className="flex-1 grid grid-cols-12 gap-4">
                            {/* Time */}
                            <div className="col-span-2">
                              <Label className="text-xs text-[#64748B] mb-1 block">
                                Time
                              </Label>
                              <Input
                                type="time"
                                value={convertTo24Hour(activity.time)}
                                onChange={(e) =>
                                  updateActivity(
                                    day.id,
                                    activity.id,
                                    "time",
                                    convertTo12Hour(e.target.value)
                                  )
                                }
                                className="h-9 rounded-lg border-[#E5E7EB] text-sm"
                              />
                            </div>

                            {/* Icon */}
                            <div className="col-span-2">
                              <Label className="text-xs text-[#64748B] mb-1 block">
                                Icon
                              </Label>
                              <button
                                onClick={() =>
                                  openIconPicker(day.id, activity.id)
                                }
                                className="w-full h-9 rounded-lg border-2 border-[#E5E7EB] hover:border-[#0A7AFF] bg-white flex items-center justify-center transition-all"
                              >
                                <IconComponent className="w-4 h-4 text-[#0A7AFF]" />
                              </button>
                            </div>

                            {/* Title */}
                            <div className="col-span-8">
                              <Label className="text-xs text-[#64748B] mb-1 block">
                                Activity Title *
                              </Label>
                              <Input
                                placeholder="e.g., Arrival at the Hotel"
                                value={activity.title}
                                onChange={(e) =>
                                  updateActivity(
                                    day.id,
                                    activity.id,
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="h-9 rounded-lg border-[#E5E7EB] text-sm"
                              />
                            </div>

                            {/* Location */}
                            <div className="col-span-12 relative">
                              <Label className="text-xs text-[#64748B] mb-1 block">
                                Location
                                {hasCoordinates && (
                                  <span className="ml-2 text-xs text-[#10B981]">
                                    ✓ Coordinates found
                                  </span>
                                )}
                              </Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                                {isLoadingPlaces &&
                                  activeLocationInput?.dayId === day.id &&
                                  activeLocationInput?.activityId ===
                                    activity.id && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A7AFF] animate-spin z-10" />
                                  )}
                                <Input
                                  placeholder="Search location..."
                                  value={activity.location}
                                  onChange={(e) => {
                                    updateActivity(
                                      day.id,
                                      activity.id,
                                      "location",
                                      e.target.value
                                    );
                                    handleLocationSearch(
                                      e.target.value,
                                      day.id,
                                      activity.id
                                    );
                                  }}
                                  onFocus={() => {
                                    if (activity.location.length >= 2) {
                                      handleLocationSearch(
                                        activity.location,
                                        day.id,
                                        activity.id
                                      );
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setLocationSuggestions([]);
                                      setActiveLocationInput(null);
                                    }, 200);
                                  }}
                                  className="h-9 pl-9 pr-9 rounded-lg border-[#E5E7EB] text-sm"
                                />
                              </div>

                              {/* Location Suggestions Dropdown */}
                              {activeLocationInput?.dayId === day.id &&
                                activeLocationInput?.activityId ===
                                  activity.id &&
                                (placesSuggestions.length > 0 ||
                                  locationSuggestions.length > 0) && (
                                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border-2 border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {placesSuggestions.length > 0
                                      ? placesSuggestions.map(
                                          (place: any, idx: number) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() =>
                                                selectLocationSuggestion(
                                                  place,
                                                  day.id,
                                                  activity.id
                                                )
                                              }
                                              className="w-full px-4 py-3 text-left hover:bg-[rgba(10,122,255,0.05)] hover:text-[#0A7AFF] transition-colors border-b border-[#F1F5F9] last:border-0 group"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[rgba(10,122,255,0.1)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(10,122,255,0.15)] transition-colors">
                                                  <MapPin className="w-4 h-4 text-[#0A7AFF]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-[#334155] group-hover:text-[#0A7AFF] transition-colors truncate">
                                                    {place.name}
                                                  </p>
                                                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                                                    {place.address}
                                                  </p>
                                                </div>
                                              </div>
                                            </button>
                                          )
                                        )
                                      : locationSuggestions.map(
                                          (suggestion, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() =>
                                                selectLocationSuggestion(
                                                  suggestion,
                                                  day.id,
                                                  activity.id
                                                )
                                              }
                                              className="w-full px-4 py-2.5 text-left text-sm text-[#334155] hover:bg-[rgba(10,122,255,0.05)] hover:text-[#0A7AFF] transition-colors flex items-center gap-2 border-b border-[#F1F5F9] last:border-0"
                                            >
                                              <MapPin className="w-3.5 h-3.5 text-[#0A7AFF] shrink-0" />
                                              <span className="truncate">
                                                {suggestion}
                                              </span>
                                            </button>
                                          )
                                        )}
                                  </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="col-span-12">
                              <Label className="text-xs text-[#64748B] mb-1 block">
                                Description
                              </Label>
                              <Textarea
                                placeholder="Add activity details..."
                                value={activity.description}
                                onChange={(e) =>
                                  updateActivity(
                                    day.id,
                                    activity.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="rounded-lg border-[#E5E7EB] text-sm resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() =>
                              confirmDeleteActivity(day.id, activity.id)
                            }
                            className="w-9 h-9 rounded-lg border-2 border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center transition-all group/delete mt-1 shrink-0"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-4 h-4 text-[#64748B] group-hover/delete:text-[#FF6B6B] transition-colors" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* AI Travel Assistant */}
      <AITravelAssistant
        itineraryDays={itineraryDays}
        destination={formData.destination}
      />

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-20 right-0 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-350 mx-auto px-8 h-18 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">
              {hasUnsavedChanges ? (
                <>
                  <AlertCircle className="w-4 h-4 inline mr-1 text-[#FF9800]" />
                  You have unsaved changes
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-[#10B981]" />
                  All changes saved
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="h-11 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFB] text-[#334155] font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="h-11 px-8 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] hover:from-[#0865CC] hover:to-[#12A594] text-white flex items-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 transition-all"
              disabled={isUpdatingBooking}
            >
              <Save className="w-4 h-4" />
              {isUpdatingBooking ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      <Dialog open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
        <DialogContent className="sm:max-w-175 max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Choose an Icon</DialogTitle>
            <DialogDescription>
              Select an icon that best represents the activity
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              placeholder="Search icons..."
              value={iconSearchQuery}
              onChange={(e) => setIconSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-100 pr-4">
            <div className="grid grid-cols-4 gap-3">
              {ICON_OPTIONS.filter((opt) =>
                opt.label.toLowerCase().includes(iconSearchQuery.toLowerCase())
              ).map((iconOption) => {
                const Icon = iconOption.icon;
                return (
                  <button
                    key={iconOption.value}
                    onClick={() => selectIcon(iconOption.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] transition-all group"
                  >
                    <Icon className="w-6 h-6 text-[#64748B] group-hover:text-[#0A7AFF] transition-colors" />
                    <span className="text-xs text-center text-[#64748B] group-hover:text-[#0A7AFF] transition-colors">
                      {iconOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="Save Changes"
        icon={<Save className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
        iconShadow="shadow-[#10B981]/20"
        contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-[rgba(20,184,166,0.05)]"
        contentBorder="border-[rgba(16,185,129,0.2)]"
        content={
          <div className="text-card-foreground">
            <p>
              Are you sure you want to save changes to this requested booking?
            </p>
          </div>
        }
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveConfirmOpen(false)}
        confirmText="Save Changes"
        confirmVariant="success"
      />

      {/* Back Confirmation Modal */}
      <Dialog open={backConfirmOpen} onOpenChange={setBackConfirmOpen}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#FFB84D] to-[#FF9800] flex items-center justify-center shadow-lg shadow-[#FFB84D]/20">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="pb-4">
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-[#64748B]">
              Your booking has unsaved changes. You can continue editing or
              discard the changes.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => setBackConfirmOpen(false)}
                className="w-full h-12 px-6 rounded-xl border-2 border-transparent 
                           bg-linear-to-br from-[#FFB84D] to-[#FF9800] 
                           hover:opacity-90 text-white font-medium 
                           transition-all flex items-center justify-center 
                           shadow-md shadow-[#FFB84D]/20"
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmBack}
                className="w-full h-12 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] text-[#334155] hover:text-[#FF6B6B] font-medium transition-all flex items-center justify-center"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Confirmation Modal */}
      <ConfirmationModal
        open={deleteActivityConfirm !== null}
        onOpenChange={(open) => !open && setDeleteActivityConfirm(null)}
        title="Delete Activity"
        icon={<Trash2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
        iconShadow="shadow-[#FF6B6B]/20"
        contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-transparent"
        contentBorder="border-[rgba(255,107,107,0.2)]"
        content={
          <div className="text-card-foreground">
            <p>
              Are you sure you want to delete this activity? This action cannot
              be undone.
            </p>
          </div>
        }
        onConfirm={removeActivity}
        onCancel={() => setDeleteActivityConfirm(null)}
        confirmText="Delete Activity"
        confirmVariant="destructive"
      />

      {/* Reduce Days Confirmation Modal */}
      <ConfirmationModal
        open={reduceDaysConfirm !== null}
        onOpenChange={(open) => !open && handleCancelReduceDays()}
        title="Remove Days from Itinerary?"
        icon={<AlertCircle className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF9800] to-[#FFB84D]"
        iconShadow="shadow-[#FF9800]/30"
        contentGradient="bg-gradient-to-br from-[rgba(255,152,0,0.05)] to-transparent"
        contentBorder="border-[#FFB84D]/20"
        content={
          reduceDaysConfirm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Current Days:</span>
                <span className="text-sm text-[#1A2B4F] font-medium">
                  {itineraryDays.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">New Days:</span>
                <span className="text-sm text-[#1A2B4F] font-medium">
                  {reduceDaysConfirm.newDayCount}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#FFB84D]/20">
                <span className="text-sm text-[#64748B]">Days to Remove:</span>
                <span className="text-sm text-[#FF9800] font-bold">
                  {reduceDaysConfirm.daysToRemove}
                </span>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[#FF6B6B]/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64748B]">
                    Day {reduceDaysConfirm.newDayCount + 1} through Day{" "}
                    {itineraryDays.length} will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )
        }
        onConfirm={handleConfirmReduceDays}
        onCancel={handleCancelReduceDays}
        confirmText="Yes, Remove Days"
        cancelText="Keep All Days"
        confirmVariant="destructive"
      />
    </div>
  );
}
