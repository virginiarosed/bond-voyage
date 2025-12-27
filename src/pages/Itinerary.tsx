import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Package,
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  BookOpen,
  Clock,
  GripVertical,
  Save,
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
  AlertCircle,
  Sparkles,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Mail,
  Phone,
  User,
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
  Send,
} from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  SearchFilterToolbar,
  SortOrder,
} from "../components/SearchFilterToolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { StandardItineraryDetailView } from "../components/StandardItineraryDetailView";
import { BookingListCard } from "../components/BookingListCard";
import { BookingDetailView } from "../components/BookingDetailView";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  useDeleteTourPackage,
  useTourPackageDetail,
  useTourPackages,
} from "../hooks/useTourPackages";
import { toast } from "sonner@2.0.3";
import { TourPackage } from "../types/types";
import { queryKeys } from "../utils/lib/queryKeys";

interface RequestedItineraryBooking {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  itinerary: string;
  dates: string;
  travelers: number;
  totalAmount: string;
  paid: string;
  bookedDate: string;
  status: "pending" | "in-progress" | "completed";
  sentStatus: "sent" | "unsent";
  confirmStatus?: "confirmed" | "unconfirmed";
}

interface ItineraryActivity {
  time: string;
  icon: any;
  title: string;
  description: string;
  location?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

interface BookingFormData {
  customerName: string;
  email: string;
  mobile: string;
  travelDateFrom: string;
  travelDateTo: string;
  travelers: string;
  tourType: "Joiner" | "Private";
}

interface ItineraryProps {
  onCreateBooking?: (bookingData: any) => void;
  requestedBookingsFromBookings?: any[];
  newStandardItineraries?: any[];
  drafts?: any[];
  onNavigateToCreateStandard?: () => void;
  onNavigateToCreateRequested?: () => void;
  onEditItinerary?: (itinerary: any) => void;
  onEditRequestedBooking?: (booking: any) => void;
  onEditRequestedDraft?: (draft: any) => void;
  onEditStandardDraft?: (draft: any) => void;
  onDeleteDraft?: (draftId: string) => void;
}

// Icon mapping helper
const ICON_MAP: Record<string, any> = {
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
};

const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || Clock;
};

// Helper to get icon name from component
const getIconName = (iconComponent: any): string => {
  if (typeof iconComponent === "string") return iconComponent;

  // Find the icon name by matching the component
  for (const [name, component] of Object.entries(ICON_MAP)) {
    if (component === iconComponent) return name;
  }
  return "Clock"; // default
};

// Serialize itinerary data for navigation (convert icon components to strings)
const serializeItineraryData = (data: any) => {
  if (!data) return data;

  const serialized = { ...data };

  if (data.itineraryDetails || data.itineraryDays) {
    const details = data.itineraryDetails || data.itineraryDays;
    serialized.itineraryDetails = details.map((day: any) => ({
      ...day,
      activities: day.activities.map((activity: any) => ({
        ...activity,
        icon: getIconName(activity.icon),
      })),
    }));
    if (data.itineraryDays) {
      serialized.itineraryDays = serialized.itineraryDetails;
    }
  }

  return serialized;
};

// Transform API tour package to standard itinerary format
const transformTourPackageToItinerary = (
  tourPackage: TourPackage,
  index: number
) => {
  return {
    id: tourPackage.id,
    title: tourPackage.title,
    destination: tourPackage.destination,
    days: tourPackage.duration,
    category: "Standard",
    pricePerPax: tourPackage.price,
    image: tourPackage.thumbUrl,
    description: tourPackage.description,
    apiSource: true, // Mark as API sourced
  };
};

// Transform API days to itinerary details format
const transformApiDaysToItineraryDetails = (days: any[]): ItineraryDay[] => {
  if (!days || days.length === 0) return [];

  return days.map((day: any, index: number) => ({
    day: index + 1,
    title: day.title || `Day ${index + 1}`,
    activities: (day.activities || []).map((activity: any) => ({
      time: activity.time || "TBD",
      icon: getIconComponent(activity.icon || "Clock"),
      title: activity.title || "Activity",
      description: activity.description || "",
      location: activity.location || "",
    })),
  }));
};

export function Itinerary({
  onCreateBooking,
  requestedBookingsFromBookings = [],
  newStandardItineraries = [],
  drafts = [],
  onEditItinerary,
  onEditRequestedBooking,
  onEditRequestedDraft,
  onEditStandardDraft,
  onDeleteDraft,
}: ItineraryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const standardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const requestedRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [selectedCategory, setSelectedCategory] = useState<
    "Standard" | "Requested"
  >("Standard");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch tour packages from API using the hook
  const {
    data: tourPackagesResponse,
    isLoading: isLoadingPackages,
    error: packagesError,
    refetch: refetchTourPackages,
  } = useTourPackages({ isActive: true });

  // Delete tour package mutation
  const { mutate: deleteTourPackage, isPending } = useDeleteTourPackage({});

  const handleDeleteTourPackage = (id: string) => {
    deleteTourPackage(
      { id },
      {
        onSuccess: () => {
          toast.success("Tour package deleted successfully!");
          refetchTourPackages();
        },
        onError: () => {
          toast.error("Failed to delete tour package");
        },
      }
    );
  };

  const tourPackages: TourPackage[] = useMemo(() => {
    if (!tourPackagesResponse?.data) return [];
    return Array.isArray(tourPackagesResponse.data)
      ? tourPackagesResponse.data
      : [];
  }, [tourPackagesResponse?.data]);

  // Standard itinerary states
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(
    null
  );

  // Requested itinerary states
  const [requestedViewMode, setRequestedViewMode] = useState<"list" | "detail">(
    "list"
  );
  const [selectedRequestedId, setSelectedRequestedId] = useState<string | null>(
    null
  );

  // Booking modal states
  const [standardBookingModalOpen, setStandardBookingModalOpen] =
    useState(false);
  const [selectedStandardForBooking, setSelectedStandardForBooking] = useState<
    string | null
  >(null);
  const [requestedBookingModalOpen, setRequestedBookingModalOpen] =
    useState(false);
  const [selectedRequestedForBooking, setSelectedRequestedForBooking] =
    useState<string | null>(null);

  // Booking form data
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    customerName: "",
    email: "",
    mobile: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelers: "1",
    tourType: "" as any,
  });

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "api" | "local";
    title?: string;
    destination?: string;
  } | null>(null);

  // Delete draft states
  const [deleteDraftConfirmOpen, setDeleteDraftConfirmOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<any | null>(null);

  // State for standard itinerary updates from edit page
  const [standardItineraryUpdates, setStandardItineraryUpdates] = useState<
    Record<string, any>
  >({});
  const [requestedBookingUpdates, setRequestedBookingUpdates] = useState<
    Record<string, any>
  >({});

  // Confirmation modal for creating booking
  const [createBookingConfirmOpen, setCreateBookingConfirmOpen] =
    useState(false);

  // Requested bookings state
  const [requestedBookings, setRequestedBookings] = useState<
    RequestedItineraryBooking[]
  >([]);

  // Fetch detailed tour package when one is selected
  const { data: selectedTourPackageDetail } = useTourPackageDetail(
    selectedStandardId || "",
    {
      enabled: !!selectedStandardId,
      queryKey: [queryKeys.tourPackages.detail],
    }
  );

  // Transform API tour package to standard itinerary format
  const transformTourPackageToItinerary = (
    tourPackage: TourPackage,
    index: number
  ) => {
    return {
      id: tourPackage.id,
      title: tourPackage.title,
      destination: tourPackage.destination,
      days: tourPackage.duration,
      category: "Standard",
      pricePerPax: tourPackage.price,
      image: tourPackage.thumbUrl || "/placeholder-image.jpg",
      description: tourPackage.description,
      apiSource: true, // Mark as API sourced
      isActive: tourPackage.isActive,
    };
  };

  // Transform API days to itinerary details format
  const transformApiDaysToItineraryDetails = (days: any[]): ItineraryDay[] => {
    if (!days || days.length === 0) return [];

    return days.map((day: any, index: number) => ({
      day: index + 1,
      title: day.title || `Day ${index + 1}`,
      activities: (day.activities || []).map((activity: any) => ({
        time: activity.time || "TBD",
        icon: getIconComponent(activity.icon || "Clock"),
        title: activity.title || "Activity",
        description: activity.description || "",
        location: activity.location || "",
      })),
    }));
  };

  // Combine API itineraries with newly created ones
  const apiItineraries = useMemo(() => {
    return tourPackages.map((pkg, index) =>
      transformTourPackageToItinerary(pkg, index)
    );
  }, [tourPackages]);

  // Filter only active packages
  const activeApiItineraries = useMemo(() => {
    return apiItineraries.filter((itinerary) => itinerary.isActive !== false);
  }, [apiItineraries]);

  // Combine API itineraries with newly created ones
  const templates = useMemo(() => {
    const combined = [...activeApiItineraries, ...newStandardItineraries];
    return combined.map((t) => standardItineraryUpdates[t.id] || t);
  }, [activeApiItineraries, newStandardItineraries, standardItineraryUpdates]);

  // Standard Itinerary Details Data - now includes API data
  const [standardItineraryDetails, setStandardItineraryDetails] = useState<
    Record<string, ItineraryDay[]>
  >({});

  // Update itinerary details when tour package detail is fetched
  useEffect(() => {
    if (selectedTourPackageDetail?.data) {
      const pkg = selectedTourPackageDetail.data;
      const days = Array.isArray(pkg.days) ? pkg.days : [];
      const details = transformApiDaysToItineraryDetails(days);

      if (pkg.id) {
        setStandardItineraryDetails((prev) => ({
          ...prev,
          [pkg.id]: details,
        }));
      }
    }
  }, [selectedTourPackageDetail]);

  // Load itinerary details for newly created itineraries
  useEffect(() => {
    const newDetails: Record<string, ItineraryDay[]> = {};

    newStandardItineraries.forEach((itinerary) => {
      if (itinerary.itineraryDetails) {
        newDetails[itinerary.id] = itinerary.itineraryDetails;
      }
    });

    // Apply updates from edit page
    Object.keys(standardItineraryUpdates).forEach((id) => {
      if (standardItineraryUpdates[id]?.itineraryDetails) {
        newDetails[id] = standardItineraryUpdates[id].itineraryDetails;
      }
    });

    if (Object.keys(newDetails).length > 0) {
      setStandardItineraryDetails((prev) => ({ ...prev, ...newDetails }));
    }
  }, [newStandardItineraries, standardItineraryUpdates]);

  // Merge requested bookings from Bookings page with existing ones
  useEffect(() => {
    if (
      requestedBookingsFromBookings &&
      requestedBookingsFromBookings.length > 0
    ) {
      const convertedBookings: any[] = requestedBookingsFromBookings.map(
        (booking) => ({
          id: booking.id,
          customer: booking.customer,
          email: booking.email,
          mobile: booking.mobile,
          destination: booking.destination,
          itinerary: booking.itinerary,
          dates: formatDateRange(booking.startDate, booking.endDate),
          travelers: booking.travelers,
          totalAmount: booking.totalAmount
            ? typeof booking.totalAmount === "number"
              ? `₱${booking.totalAmount.toLocaleString()}`
              : booking.totalAmount
            : "₱0",
          paid: booking.paid
            ? typeof booking.paid === "number"
              ? `₱${booking.paid.toLocaleString()}`
              : booking.paid
            : "₱0",
          bookedDate: booking.bookedDate,
          status: "pending",
          sentStatus: booking.sentStatus || "unsent",
          confirmStatus: booking.confirmStatus || "unconfirmed",
          ...(booking.itineraryDetails && {
            itineraryDetails: booking.itineraryDetails,
          }),
        })
      );

      setRequestedBookings((prev) => {
        const existingIds = prev.map((b) => b.id);
        const newBookings = convertedBookings.filter(
          (b) => !existingIds.includes(b.id)
        );
        return [...newBookings, ...prev];
      });
    }
  }, [requestedBookingsFromBookings]);

  // Handle navigation back from edit pages with updates
  useEffect(() => {
    if (location.state?.scrollToId) {
      const { scrollToId, category, updatedItinerary, updatedBooking } =
        location.state;

      if (category === "Standard" && updatedItinerary) {
        setStandardItineraryUpdates((prev) => ({
          ...prev,
          [updatedItinerary.id]: updatedItinerary,
        }));
        setSelectedCategory("Standard");
        setViewMode("grid");

        setTimeout(() => {
          const element = standardRefs.current[scrollToId];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.style.animation = "highlight 2s ease-in-out";
          }
        }, 300);
      }

      if (category === "Requested" && updatedBooking) {
        setRequestedBookingUpdates((prev) => ({
          ...prev,
          [updatedBooking.id]: updatedBooking,
        }));
        setSelectedCategory("Requested");
        setRequestedViewMode("list");

        setTimeout(() => {
          const element = requestedRefs.current[scrollToId];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.style.animation = "highlight 2s ease-in-out";
          }
        }, 300);
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    };

    return `${formatDate(start)} – ${formatDate(end)}`;
  };

  const handleDeleteItinerary = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "api") {
      handleDeleteTourPackage(itemToDelete.id);
    } else {
      if (onDeleteDraft) {
        onDeleteDraft(itemToDelete.id);
        toast.success("Draft deleted successfully!");
      }
    }

    setItemToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // Handle delete confirmation for both API and local items
  const confirmDelete = (item: {
    id: string;
    type: "api" | "local";
    title?: string;
    destination?: string;
  }) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  // Export functions
  const handleExportPDF = () => {
    console.log("Exporting itineraries as PDF...");
    toast.info("PDF export functionality coming soon");
  };

  const handleExportExcel = () => {
    console.log("Exporting itineraries as Excel...");
    toast.info("Excel export functionality coming soon");
  };

  // Filter and sort templates
  const getFilteredAndSortedTemplates = () => {
    let filtered = templates.filter((t) => t.category === selectedCategory);

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortOrder === "newest") {
      filtered = [...filtered].reverse();
    } else if (sortOrder === "oldest") {
      filtered = [...filtered];
    }

    return filtered;
  };

  // Filter requested bookings
  const getFilteredRequestedBookings = () => {
    const updatedBookings = requestedBookings.map(
      (b) => requestedBookingUpdates[b.id] || b
    );
    let filtered = updatedBookings;

    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.itinerary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortOrder === "newest") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.bookedDate);
        const dateB = new Date(b.bookedDate);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortOrder === "oldest") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.bookedDate);
        const dateB = new Date(b.bookedDate);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return filtered;
  };

  const filteredTemplates = getFilteredAndSortedTemplates();
  const filteredRequestedBookings = getFilteredRequestedBookings();

  const selectedStandard = selectedStandardId
    ? templates.find((t) => t.id === selectedStandardId)
    : null;

  const selectedRequestedBase = selectedRequestedId
    ? requestedBookings.find((b) => b.id === selectedRequestedId)
    : null;
  const selectedRequested = selectedRequestedBase
    ? requestedBookingUpdates[selectedRequestedBase.id] || selectedRequestedBase
    : null;

  // Handle showing confirmation modal for booking
  const handleShowBookingConfirmation = () => {
    if (
      !selectedStandardForBooking ||
      !bookingFormData.customerName ||
      !bookingFormData.email ||
      !bookingFormData.mobile ||
      !bookingFormData.travelDateFrom ||
      !bookingFormData.travelDateTo
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreateBookingConfirmOpen(true);
  };

  // Handle booking from standard itinerary
  const handleBookStandardItinerary = () => {
    if (!selectedStandardForBooking) return;

    const standard = templates.find((t) => t.id === selectedStandardForBooking);
    if (!standard) return;

    const newBookingId = `BK-2024-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, "0")}`;
    const travelers = parseInt(bookingFormData.travelers);
    const totalAmount = standard.pricePerPax
      ? standard.pricePerPax * travelers
      : 0;
    const itineraryDetails = standardItineraryDetails[standard.id] || [];

    const newBooking = {
      id: newBookingId,
      customer: bookingFormData.customerName,
      email: bookingFormData.email,
      mobile: bookingFormData.mobile,
      destination: standard.destination,
      itinerary: standard.title,
      startDate: bookingFormData.travelDateFrom,
      endDate: bookingFormData.travelDateTo,
      travelers: travelers,
      totalAmount: totalAmount,
      paid: 0,
      paymentStatus: "Unpaid",
      bookedDate: new Date().toISOString().split("T")[0],
      bookedDateObj: new Date(),
      status: "pending",
      bookingType: "Standard" as const,
      tourType: bookingFormData.tourType,
      itineraryDetails: itineraryDetails,
    };

    if (onCreateBooking) {
      onCreateBooking(newBooking);
    }

    setBookingFormData({
      customerName: "",
      email: "",
      mobile: "",
      travelDateFrom: "",
      travelDateTo: "",
      travelers: "1",
      tourType: "" as any,
    });
    setCreateBookingConfirmOpen(false);
    setStandardBookingModalOpen(false);
    setSelectedStandardForBooking(null);

    toast.success("Standard Booking Created!", {
      description: `Booking ${newBookingId} for ${bookingFormData.customerName} has been successfully created.`,
    });
  };

  // Render Standard Itinerary Grid View
  const renderStandardGridView = () => {
    if (isLoadingPackages) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#0A7AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#64748B]">Loading itineraries...</p>
          </div>
        </div>
      );
    }

    if (packagesError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-[#FF6B6B] mx-auto mb-4" />
          <p className="text-[#64748B] text-lg mb-2">
            Failed to load itineraries
          </p>
          <button
            onClick={() => refetchTourPackages()}
            className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0A6AE8] transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (filteredTemplates.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B] text-lg mb-2">No itineraries found</p>
          <p className="text-[#94A3B8] text-sm">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Create your first itinerary to get started"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            ref={(el) => {
              standardRefs.current[template.id] = el;
            }}
            onClick={() => {
              setSelectedStandardId(template.id);
              setViewMode("detail");
            }}
            className="group rounded-2xl border-2 border-[#E5E7EB] overflow-hidden bg-white transition-all duration-200 hover:border-[#0A7AFF] hover:shadow-[0_8px_20px_rgba(10,122,255,0.15)] hover:-translate-y-1 cursor-pointer"
          >
            <div className="h-[180px] relative overflow-hidden">
              <ImageWithFallback
                src={template.image}
                alt={template.destination}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {template.apiSource && (
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(16,185,129,0.9)] text-white border border-white/20 shadow-lg">
                    Live Package
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="mb-2">
                <h3 className="text-lg text-[#1A2B4F] font-semibold mb-1 group-hover:text-[#0A7AFF] transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-[#64748B] line-clamp-1">
                  {template.destination}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#F8FAFB] text-xs text-[#334155] font-medium">
                  {template.days} Days
                </span>
                <span className="px-3 py-1 rounded-full bg-[rgba(10,122,255,0.1)] text-xs text-[#0A7AFF] font-medium">
                  {template.category}
                </span>
                {template.pricePerPax && (
                  <span className="px-3 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-xs text-[#10B981] font-medium">
                    ₱{template.pricePerPax.toLocaleString()}/pax
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStandardId(template.id);
                      setViewMode("detail");
                    }}
                    className="flex-1 h-9 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFB] hover:border-[#0A7AFF] text-[#334155] flex items-center justify-center gap-2 text-sm font-medium transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStandardForBooking(template.id);
                      setStandardBookingModalOpen(true);
                    }}
                    className="flex-1 h-9 rounded-xl border border-[#14B8A6] bg-gradient-to-r from-[#14B8A6] to-[#10B981] hover:from-[#12A594] hover:to-[#0EA574] text-white flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    Book This Trip
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {template.apiSource ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tour-packages/edit/${template.id}`);
                        }}
                        className="flex-1 h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-sm text-[#334155] font-medium transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        Edit in Admin
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete({
                            id: template.id,
                            type: "api",
                            title: template.title,
                            destination: template.destination,
                          });
                        }}
                        className="h-9 w-9 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] flex items-center justify-center transition-all group/delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#64748B] group-hover/delete:text-[#FF6B6B]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const itineraryData = {
                            ...template,
                            itineraryDetails:
                              standardItineraryDetails[template.id] || [],
                            itineraryDays:
                              standardItineraryDetails[template.id] || [],
                          };
                          const serializedData =
                            serializeItineraryData(itineraryData);
                          navigate(`/itinerary/edit-standard/${template.id}`, {
                            state: { itineraryData: serializedData },
                          });
                        }}
                        className="flex-1 h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-sm text-[#334155] font-medium transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete({
                            id: template.id,
                            type: "local",
                            title: template.title,
                            destination: template.destination,
                          });
                        }}
                        className="h-9 w-9 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.1)] flex items-center justify-center transition-all group/delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#64748B] group-hover/delete:text-[#FF6B6B]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Requested Itinerary List View (keep existing)
  const renderRequestedListView = () => (
    <div className="space-y-4">
      {filteredRequestedBookings.map((booking) => (
        <div
          key={booking.id}
          className="relative"
          ref={(el) => {
            requestedRefs.current[booking.id] = el;
          }}
        >
          <BookingListCard
            booking={{
              id: booking.id,
              customer: booking.customer,
              email: booking.email,
              mobile: booking.mobile,
              destination: booking.destination,
              dates: booking.dates,
              travelers: booking.travelers,
              total: booking.totalAmount,
              bookedDate: booking.bookedDate,
            }}
            onViewDetails={() => {
              setSelectedRequestedId(booking.id);
              setRequestedViewMode("detail");
            }}
            additionalBadges={
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    booking.sentStatus === "sent"
                      ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                      : "bg-[rgba(100,116,139,0.1)] text-[#64748B] border border-[rgba(100,116,139,0.2)]"
                  }`}
                >
                  {booking.sentStatus === "sent" ? "Sent" : "Unsent"}
                </span>
                {booking.sentStatus === "sent" && booking.confirmStatus && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      booking.confirmStatus === "confirmed"
                        ? "bg-[rgba(10,122,255,0.1)] text-[#0A7AFF] border border-[rgba(10,122,255,0.2)]"
                        : "bg-[rgba(255,193,7,0.1)] text-[#FFC107] border border-[rgba(255,193,7,0.2)]"
                    }`}
                  >
                    {booking.confirmStatus === "confirmed"
                      ? "Confirmed"
                      : "Unconfirmed"}
                  </span>
                )}
              </div>
            }
          />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {selectedCategory === "Standard" &&
      viewMode === "detail" &&
      selectedStandard ? (
        <StandardItineraryDetailView
          itinerary={selectedStandard}
          itineraryDetails={standardItineraryDetails[selectedStandard.id] || []}
          onBack={() => setViewMode("grid")}
          onEdit={() => {
            if (selectedStandard.apiSource) {
              navigate(`/tour-packages/edit/${selectedStandard.id}`);
            } else {
              const itineraryData = {
                ...selectedStandard,
                itineraryDetails:
                  standardItineraryDetails[selectedStandard.id] || [],
                itineraryDays:
                  standardItineraryDetails[selectedStandard.id] || [],
              };
              const serializedData = serializeItineraryData(itineraryData);
              navigate(`/itinerary/edit-standard/${selectedStandard.id}`, {
                state: { itineraryData: serializedData },
              });
            }
          }}
          onDelete={() => {
            confirmDelete({
              id: selectedStandard.id,
              type: selectedStandard.apiSource ? "api" : "local",
              title: selectedStandard.title,
              destination: selectedStandard.destination,
            });
          }}
        />
      ) : selectedCategory === "Requested" &&
        requestedViewMode === "detail" &&
        selectedRequested ? (
        <BookingDetailView
          booking={{
            id: selectedRequested.id,
            customer: selectedRequested.customer,
            email: selectedRequested.email,
            mobile: selectedRequested.mobile,
            destination: selectedRequested.destination,
            itinerary: selectedRequested.itinerary,
            dates: selectedRequested.dates,
            travelers: selectedRequested.travelers,
            total: selectedRequested.totalAmount,
            bookedDate: selectedRequested.bookedDate,
          }}
          itinerary={[]}
          onBack={() => setRequestedViewMode("list")}
          actionButtons={<div />}
          breadcrumbPage="Requested"
          isRequestedItinerary={true}
        />
      ) : (
        <ContentCard
          title={
            selectedCategory === "Standard"
              ? `Standard Itineraries (${filteredTemplates.length})`
              : `Requested Itineraries (${filteredRequestedBookings.length})`
          }
          action={
            <button
              onClick={() => setCreateModalOpen(true)}
              className="h-10 px-5 rounded-[20px] text-white text-sm font-medium shadow-[0_2px_8px_rgba(10,122,255,0.25)] flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, #0A7AFF, #14B8A6)`,
              }}
            >
              <Plus className="w-4 h-4" />
              Create New Itinerary
            </button>
          }
        >
          <SearchFilterToolbar
            searchPlaceholder={
              selectedCategory === "Standard"
                ? "Search standard itineraries..."
                : "Search requested itineraries..."
            }
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            showFilter={false}
            filterOpen={false}
            onFilterOpenChange={() => {}}
            filterContent={null}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />

          <div className="flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB]">
            <button
              onClick={() => {
                setSelectedCategory("Standard");
                setViewMode("grid");
              }}
              className={`px-5 h-11 text-sm transition-colors ${
                selectedCategory === "Standard"
                  ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
                  : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => {
                setSelectedCategory("Requested");
                setRequestedViewMode("list");
              }}
              className={`px-5 h-11 text-sm transition-colors ${
                selectedCategory === "Requested"
                  ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
                  : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
              }`}
            >
              Requested
            </button>
          </div>

          {selectedCategory === "Standard"
            ? renderStandardGridView()
            : renderRequestedListView()}
        </ContentCard>
      )}

      {/* Delete Confirmation Modal (Unified for both API and local) */}
      <ConfirmationModal
        open={deleteConfirmOpen}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === "api"
            ? "Delete Tour Package"
            : "Delete Itinerary"
        }
        description={
          itemToDelete?.type === "api"
            ? "Are you sure you want to delete this tour package? This will remove it from the system."
            : "Are you sure you want to delete this itinerary? This action cannot be undone."
        }
        icon={<Trash2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
        iconShadow="shadow-[#FF6B6B]/30"
        contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-[rgba(255,82,82,0.05)]"
        contentBorder="border-[rgba(255,107,107,0.2)]"
        content={
          itemToDelete ? (
            <div className="space-y-3">
              {itemToDelete.title && (
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm text-[#64748B]">Title:</span>
                  <span className="text-sm font-medium text-[#1A2B4F]">
                    {itemToDelete.title}
                  </span>
                </div>
              )}
              {itemToDelete.destination && (
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm text-[#64748B]">Destination:</span>
                  <span className="text-sm font-medium text-[#1A2B4F]">
                    {itemToDelete.destination}
                  </span>
                </div>
              )}
              <p className="text-xs text-[#64748B] pt-2">
                {itemToDelete.type === "api"
                  ? "This will remove the package from your tour packages list."
                  : "This will permanently remove the itinerary from your list."}
              </p>
            </div>
          ) : null
        }
        onConfirm={handleDeleteItinerary}
        onCancel={() => {
          setItemToDelete(null);
          setDeleteConfirmOpen(false);
        }}
        confirmText={isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        confirmVariant="destructive"
      />

      {/* ... keep all other existing modals (Create, Booking, etc.) ... */}
    </div>
  );
}
