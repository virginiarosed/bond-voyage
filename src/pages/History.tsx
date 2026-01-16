import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  MapPin,
  BookOpen,
  Briefcase,
  FileCheck,
  ClipboardList,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Users,
  Clock,
  CreditCard,
  Mail,
  Phone,
  User,
  Download,
  Eye,
} from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import {
  SearchFilterToolbar,
  SortOrder,
} from "../components/SearchFilterToolbar";
import { HistoryFilterContent } from "../components/filters/HistoryFilterContent";
import { StatCard } from "../components/StatCard";
import { Pagination } from "../components/Pagination";
import { ItineraryDetailDisplay } from "../components/ItineraryDetailDisplay";
import { useAdminBookings, useBookingDetail } from "../hooks/useBookings";
import { queryKeys } from "../utils/lib/queryKeys";
import {
  exportToPDF,
  exportToExcel,
  exportBookingDetailToPDF,
  exportBookingDetailToExcel,
} from "../utils/exportUtils";
import { formatDateRange } from "../App";
import { capitalize } from "../utils/helpers/capitalize";
import { toast } from "sonner";
import { useBreadcrumbs } from "../components/BreadcrumbContext";
import { Itinerary, Booking } from "../types/types";
import { useMediaQuery } from "react-responsive";

interface HistoryProps {
  onHistoryCountChange?: (count: number) => void;
}

interface ProcessedBooking {
  id: string;
  bookingCode: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  travelers: number;
  totalAmount: number;
  bookedDate: string;
  bookedDateObj: Date;
  status: string;
  bookingType?: string;
  itineraryDetails?: {
    day: number;
    title: string;
    activities: {
      time: string;
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description: string;
      location: string;
    }[];
  }[];
  itinerary?: Itinerary;
  updatedAtDisplay?: string;
}

export function History({ onHistoryCountChange }: HistoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [activeTab, setActiveTab] = useState<"completed" | "cancelled">(
    "completed"
  );
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );

  // API query params
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    status: "COMPLETED" as "COMPLETED" | "CANCELLED",
  });

  // Fetch bookings with server-side filtering
  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch,
  } = useAdminBookings(queryParams);

  // Fetch detailed booking when in detail view
  const { data: bookingDetailData, isLoading: isLoadingDetail } =
    useBookingDetail(selectedBookingId || "", {
      enabled: !!selectedBookingId && viewMode === "detail",
      queryKey: [queryKeys.bookings.detail(selectedBookingId!)],
    });

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(
    null
  );

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [completedDateFrom, setCompletedDateFrom] = useState("");
  const [completedDateTo, setCompletedDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Pending filters
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingCompletedDateFrom, setPendingCompletedDateFrom] = useState("");
  const [pendingCompletedDateTo, setPendingCompletedDateTo] = useState("");
  const [pendingMinAmount, setPendingMinAmount] = useState("");
  const [pendingMaxAmount, setPendingMaxAmount] = useState("");

  // Filter helper
  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setPendingDateFrom(dateFrom);
      setPendingDateTo(dateTo);
      setPendingCompletedDateFrom(completedDateFrom);
      setPendingCompletedDateTo(completedDateTo);
      setPendingMinAmount(minAmount);
      setPendingMaxAmount(maxAmount);
    }
    setFilterOpen(open);
  };

  // Get activity icon based on title
  const getActivityIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("flight") || lowerTitle.includes("arrival"))
      return Plane;
    if (lowerTitle.includes("hotel") || lowerTitle.includes("check-in"))
      return Hotel;
    if (lowerTitle.includes("photo") || lowerTitle.includes("view"))
      return Camera;
    if (
      lowerTitle.includes("lunch") ||
      lowerTitle.includes("dinner") ||
      lowerTitle.includes("breakfast")
    )
      return UtensilsCrossed;
    if (lowerTitle.includes("transfer") || lowerTitle.includes("drive"))
      return Car;
    return MapPin;
  };

  // Transform booking data for list view
  const transformBooking = (apiBooking: any): ProcessedBooking => {
    return {
      id: apiBooking.id,
      bookingCode: apiBooking.bookingCode,
      customer: apiBooking.customerName || "Unknown Customer",
      email: apiBooking.customerEmail || "",
      mobile: apiBooking.customerMobile || "N/A",
      destination: apiBooking.destination || apiBooking.itinerary?.destination,
      startDate: apiBooking.startDate || apiBooking.itinerary?.startDate,
      endDate: apiBooking.endDate || apiBooking.itinerary?.endDate,
      travelers: apiBooking.travelers || apiBooking.itinerary?.travelers || 1,
      totalAmount: parseFloat(apiBooking.totalPrice) || 0,
      bookedDate: apiBooking.bookedDate || apiBooking.createdAt,
      bookedDateObj: new Date(apiBooking.bookedDate || apiBooking.createdAt),
      status: apiBooking.status,
      bookingType: apiBooking.type,
    };
  };

  // Transform detailed booking data for detail view
  const transformDetailedBooking = (apiBooking: Booking): ProcessedBooking => {
    const processed: ProcessedBooking = {
      id: apiBooking.id,
      bookingCode: apiBooking.bookingCode,
      customer: apiBooking.customerName || "Unknown Customer",
      email: apiBooking.customerEmail || "",
      mobile: apiBooking.customerMobile || "N/A",
      destination: apiBooking.destination || apiBooking.itinerary?.destination,
      startDate: apiBooking.startDate || apiBooking.itinerary?.startDate,
      endDate: apiBooking.endDate || apiBooking.itinerary?.endDate,
      travelers: apiBooking.travelers || apiBooking.itinerary?.travelers || 1,
      totalAmount: parseFloat(apiBooking.totalPrice.toString()) || 0,
      bookedDate: apiBooking.bookedDate || apiBooking.createdAt,
      bookedDateObj: new Date(apiBooking.bookedDate || apiBooking.createdAt),
      status: apiBooking.status,
      bookingType: apiBooking.type,
      itinerary: apiBooking.itinerary,
      updatedAtDisplay: apiBooking.updatedAtDisplay,
    };

    // Process itinerary details if available
    if (apiBooking.itinerary?.days) {
      processed.itineraryDetails = apiBooking.itinerary.days.map((day) => ({
        day: day.dayNumber,
        title: day.title || `Day ${day.dayNumber}`,
        activities: day.activities.map((activity) => ({
          time: activity.time,
          icon: getActivityIcon(activity.title),
          title: activity.title,
          description: activity.description || "",
          location: activity.location || "",
        })),
      }));
    }

    return processed;
  };

  const bookings = bookingsData?.data?.map(transformBooking) || [];
  const selectedBooking = useMemo(() => {
    return bookingDetailData?.data
      ? transformDetailedBooking(bookingDetailData.data)
      : null;
  }, [bookingDetailData?.data]);

  // Update breadcrumbs
  useEffect(() => {
    if (viewMode === "detail" && selectedBooking) {
      setBreadcrumbs([
        { label: "Home", path: "/" },
        { label: "History", path: "/history" },
        {
          label: `${
            selectedBooking.status === "COMPLETED" ? "Completed" : "Cancelled"
          } Booking ${selectedBooking.bookingCode}`,
        },
      ]);
    } else {
      resetBreadcrumbs();
    }
  }, [
    viewMode,
    selectedBooking?.id,
    selectedBooking?.status,
    selectedBooking?.bookingCode,
    setBreadcrumbs,
    resetBreadcrumbs,
  ]);

  // Update history count
  useEffect(() => {
    if (onHistoryCountChange && bookingsData?.meta?.total) {
      onHistoryCountChange(bookingsData.meta.total);
    }
  }, [bookingsData?.meta?.total, onHistoryCountChange]);

  // Build API query params based on filters and active tab
  useEffect(() => {
    const params: any = {
      page: 1,
      limit: 10,
      status: activeTab === "completed" ? "COMPLETED" : "CANCELLED",
    };

    // Search query
    if (searchQuery) {
      params.q = searchQuery;
    }

    // Booking type filter
    if (selectedTypeFilter) {
      params.type = selectedTypeFilter;
    }

    // Booked date range filter
    if (dateFrom && dateTo) {
      params.dateFrom = dateFrom;
      params.dateTo = dateTo;
    }

    // Sort
    if (sortOrder === "newest") {
      params.sort = "createdAt:desc";
    } else if (sortOrder === "oldest") {
      params.sort = "createdAt:asc";
    }

    setQueryParams(params);
  }, [searchQuery, selectedTypeFilter, dateFrom, dateTo, sortOrder, activeTab]);

  // Client-side filtering
  const getFilteredBookings = () => {
    let filtered = bookings;

    // Completed/cancelled date filter
    if (completedDateFrom || completedDateTo) {
      filtered = filtered.filter((b) => {
        const statusDate =
          b.status === "COMPLETED" ? completedDateFrom : completedDateTo;
        if (!statusDate) return false;
        const date = new Date(statusDate);
        if (completedDateFrom && completedDateTo) {
          return (
            date >= new Date(completedDateFrom) &&
            date <= new Date(completedDateTo)
          );
        } else if (completedDateFrom) {
          return date >= new Date(completedDateFrom);
        } else if (completedDateTo) {
          return date <= new Date(completedDateTo);
        }
        return true;
      });
    }

    // Amount filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter((b) => {
        if (minAmount && maxAmount) {
          return (
            b.totalAmount >= Number(minAmount) &&
            b.totalAmount <= Number(maxAmount)
          );
        } else if (minAmount) {
          return b.totalAmount >= Number(minAmount);
        } else if (maxAmount) {
          return b.totalAmount <= Number(maxAmount);
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Pagination data
  const totalItems = bookingsData?.meta?.total || 0;
  const totalPages = bookingsData?.meta?.totalPages || 1;
  const currentPage = bookingsData?.meta?.page || 1;
  const itemsPerPage = bookingsData?.meta?.limit || 10;
  const indexOfFirstBooking = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastBooking = Math.min(currentPage * itemsPerPage, totalItems);

  // Statistics
  const customizedCount = filteredBookings.filter(
    (b) => b.bookingType === "CUSTOMIZED"
  ).length;
  const standardCount = filteredBookings.filter(
    (b) => b.bookingType === "STANDARD"
  ).length;
  const requestedCount = filteredBookings.filter(
    (b) => b.bookingType === "REQUESTED"
  ).length;

  const activeFiltersCount =
    (dateFrom || dateTo ? 1 : 0) +
    (completedDateFrom || completedDateTo ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0);

  // Handlers
  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
  };

  const handleStatCardClick = (type: string | null) => {
    setSelectedTypeFilter(selectedTypeFilter === type ? null : type);
  };

  const handleApplyFilters = () => {
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
    setCompletedDateFrom(pendingCompletedDateFrom);
    setCompletedDateTo(pendingCompletedDateTo);
    setMinAmount(pendingMinAmount);
    setMaxAmount(pendingMaxAmount);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPendingDateFrom("");
    setPendingDateTo("");
    setPendingCompletedDateFrom("");
    setPendingCompletedDateTo("");
    setPendingMinAmount("");
    setPendingMaxAmount("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[#10B981]/20";
      case "CANCELLED":
        return "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[#FF6B6B]/20";
      default:
        return "bg-[#F8FAFB] text-[#64748B] border-[#E5E7EB]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✓";
      case "CANCELLED":
        return "✗";
      default:
        return "•";
    }
  };

  // Handle tab change
  const handleTabChange = (tab: "completed" | "cancelled") => {
    setActiveTab(tab);
    setViewMode("list");
    setSelectedBookingId(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A7AFF]" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-[#FF6B6B] mb-4" />
        <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
          Failed to load history
        </h3>
        <p className="text-sm text-[#64748B] mb-4">Please try again later</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Detail view
  if (viewMode === "detail") {
    if (isLoadingDetail) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A7AFF]" />
        </div>
      );
    }

    if (!selectedBooking) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF6B6B] mb-4" />
          <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
            Booking not found
          </h3>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC]"
          >
            Back to List
          </button>
        </div>
      );
    }

    const isCompleted = selectedBooking.status === "COMPLETED";

    return (
      <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToList}
            className={`flex-shrink-0 rounded-xl bg-white border-2 border-[#E5E7EB] hover:border-[#0A7AFF] flex items-center justify-center transition-all ${
              isMobile ? "w-8 h-8" : "w-10 h-10"
            }`}
          >
            <ChevronLeft className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-[#64748B]`} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className={`text-[#1A2B4F] font-semibold ${isMobile ? "text-base" : ""}`}>
              {selectedBooking.destination}
            </h2>
            <p className={`text-[#64748B] ${isMobile ? "text-xs" : "text-sm"}`}>
              {isCompleted ? "Completed Booking" : "Cancelled Booking"}
            </p>
          </div>
        </div>

        {/* Booking Header Card - Responsive */}
        <div
          className={`rounded-2xl p-4 md:p-8 text-white shadow-lg ${
            isCompleted
              ? "bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
              : "bg-gradient-to-br from-[#FF6B6B] to-[#FF8C8C]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 md:mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className={`font-semibold mb-2 ${isMobile ? "text-xl" : "text-3xl"}`}>
                {selectedBooking.destination}
              </h1>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                <span className={isMobile ? "text-sm" : "text-lg"}>{selectedBooking.destination}</span>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className={`text-white/80 ${isMobile ? "text-xs" : "text-sm"} mb-1`}>Booking Code</p>
              <p className={`font-semibold ${isMobile ? "text-lg" : "text-2xl"}`}>
                {selectedBooking.bookingCode}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <Calendar className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mb-2 text-white/80`} />
              <p className={`text-white/80 ${isMobile ? "text-xs" : "text-xs"} mb-1`}>Travel Dates</p>
              <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                {formatDateRange(
                  selectedBooking.startDate!,
                  selectedBooking.endDate!
                )}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <Users className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mb-2 text-white/80`} />
              <p className={`text-white/80 ${isMobile ? "text-xs" : "text-xs"} mb-1`}>Travelers</p>
              <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                {selectedBooking.travelers}{" "}
                {selectedBooking.travelers > 1 ? "People" : "Person"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <CreditCard className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mb-2 text-white/80`} />
              <p className={`text-white/80 ${isMobile ? "text-xs" : "text-xs"} mb-1`}>Total Amount</p>
              <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                ₱{selectedBooking.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <Clock className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mb-2 text-white/80`} />
              <p className={`text-white/80 ${isMobile ? "text-xs" : "text-xs"} mb-1`}>Booked On</p>
              <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                {selectedBooking.bookedDateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg`}>
                    <User className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-white`} />
                  </div>
                  <h3 className={`font-semibold text-[#1A2B4F] ${isMobile ? "text-sm" : ""}`}>
                    Customer Information
                  </h3>
                </div>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <p className={`text-[#64748B] mb-1 ${isMobile ? "text-xs" : "text-xs"}`}>Full Name</p>
                  <p className={`text-[#1A2B4F] font-medium ${isMobile ? "text-sm" : ""}`}>
                    {selectedBooking.customer}
                  </p>
                </div>
                <div>
                  <p className={`text-[#64748B] mb-1 ${isMobile ? "text-xs" : "text-xs"}`}>Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-[#0A7AFF]`} />
                    <p className={`text-[#334155] ${isMobile ? "text-sm" : ""}`}>{selectedBooking.email}</p>
                  </div>
                </div>
                <div>
                  <p className={`text-[#64748B] mb-1 ${isMobile ? "text-xs" : "text-xs"}`}>Mobile Number</p>
                  <div className="flex items-center gap-2">
                    <Phone className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-[#14B8A6]`} />
                    <p className={`text-[#334155] ${isMobile ? "text-sm" : ""}`}>{selectedBooking.mobile}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div
                    className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-xl flex items-center justify-center shadow-lg ${
                      isCompleted
                        ? "bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
                        : "bg-gradient-to-br from-[#FF6B6B] to-[#FF8C8C]"
                    }`}
                  >
                    <span className={`text-white ${isMobile ? "text-base" : "text-lg"}`}>
                      {isCompleted ? "✓" : "✗"}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-[#1A2B4F] ${isMobile ? "text-sm" : ""}`}>
                    Booking Status
                  </h3>
                </div>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isCompleted
                      ? "bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)]"
                      : "bg-[rgba(255,107,107,0.05)] border-[rgba(255,107,107,0.2)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[#64748B] ${isMobile ? "text-xs" : "text-xs"}`}>Status</span>
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${
                        isMobile ? "text-xs" : "text-xs"
                      } ${
                        isCompleted
                          ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                          : "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border border-[rgba(255,107,107,0.2)]"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "✗ Cancelled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[#64748B] ${isMobile ? "text-xs" : "text-xs"}`}>
                      {isCompleted ? "Last Updated" : "Cancelled On"}
                    </span>
                    <span className={`font-medium text-[#334155] ${isMobile ? "text-xs" : "text-xs"}`}>
                      {selectedBooking.updatedAtDisplay ||
                        selectedBooking.bookedDateObj.toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                    </span>
                  </div>
                </div>
                {!isCompleted && selectedBooking.itinerary?.rejectionReason && (
                  <div className="p-4 rounded-xl border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.05)]">
                    <p className={`text-[#64748B] mb-2 ${isMobile ? "text-xs" : "text-xs"}`}>
                      Cancellation Reason
                    </p>
                    <p className={`text-[#334155] leading-relaxed ${isMobile ? "text-sm" : "text-sm"}`}>
                      {selectedBooking.itinerary.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 md:p-6 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const bookingData = {
                      id: selectedBooking.id,
                      customer: selectedBooking.customer,
                      email: selectedBooking.email,
                      mobile: selectedBooking.mobile,
                      destination: selectedBooking.destination,
                      dates: formatDateRange(
                        selectedBooking.startDate!,
                        selectedBooking.endDate!
                      ),
                      travelers: selectedBooking.travelers,
                      total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                      bookedDate:
                        selectedBooking.bookedDateObj.toLocaleDateString(),
                      status: selectedBooking.status,
                    };
                    exportBookingDetailToPDF(
                      bookingData,
                      selectedBooking.itineraryDetails || []
                    );
                    toast.success("Exporting booking as PDF...");
                  }}
                  className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#FF6B6B] font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => {
                    const bookingData = {
                      id: selectedBooking.id,
                      customer: selectedBooking.customer,
                      email: selectedBooking.email,
                      mobile: selectedBooking.mobile,
                      destination: selectedBooking.destination,
                      dates: formatDateRange(
                        selectedBooking.startDate!,
                        selectedBooking.endDate!
                      ),
                      travelers: selectedBooking.travelers,
                      total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                      bookedDate:
                        selectedBooking.bookedDateObj.toLocaleDateString(),
                      status: selectedBooking.status,
                    };
                    exportBookingDetailToExcel(
                      bookingData,
                      selectedBooking.itineraryDetails || []
                    );
                    toast.success("Exporting booking as Excel...");
                  }}
                  className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#10B981] font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>

              <button
                onClick={handleBackToList}
                className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-[#334155] font-medium transition-all"
              >
                Back to List
              </button>
            </div>
          </div>

          {/* Right Column - Itinerary */}
          <div className="col-span-1 md:col-span-2">
            {selectedBooking.itineraryDetails &&
            selectedBooking.itineraryDetails.length > 0 ? (
              <ItineraryDetailDisplay
                itinerary={selectedBooking.itineraryDetails}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 text-center">
                <MapPin className="w-10 h-10 md:w-12 md:h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className={`font-semibold text-[#1A2B4F] mb-2 ${isMobile ? "text-base" : "text-lg"}`}>
                  No Itinerary Available
                </h3>
                <p className={`text-[#64748B] ${isMobile ? "text-sm" : "text-sm"}`}>
                  The itinerary details for this booking are not yet available.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      {/* Tabs - Responsive */}
      <div className="flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB]">
        <button
          onClick={() => handleTabChange("completed")}
          className={`px-4 md:px-5 h-10 md:h-11 text-sm transition-colors ${
            activeTab === "completed"
              ? "font-semibold text-[#10B981] border-b-[3px] border-[#10B981] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
          }`}
        >
          {isMobile ? "Complete" : "Completed"}
        </button>
        <button
          onClick={() => handleTabChange("cancelled")}
          className={`px-4 md:px-5 h-10 md:h-11 text-sm transition-colors ${
            activeTab === "cancelled"
              ? "font-semibold text-[#FF6B6B] border-b-[3px] border-[#FF6B6B] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)]"
          }`}
        >
          {isMobile ? "Cancel" : "Cancelled"}
        </button>
      </div>

      {/* Booking Type Stats - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div
          onClick={() => handleStatCardClick(null)}
          className="cursor-pointer"
        >
          <StatCard
            icon={BookOpen}
            label={
              isMobile
                ? activeTab === "completed"
                  ? "Complete"
                  : "Cancel"
                : activeTab === "completed"
                ? "Completed Bookings"
                : "Cancelled Bookings"
            }
            value={filteredBookings.length}
            gradientFrom={activeTab === "completed" ? "#10B981" : "#FF6B6B"}
            gradientTo={activeTab === "completed" ? "#14B8A6" : "#FF8C8C"}
            selected={selectedTypeFilter === null}
          />
        </div>
        <div
          onClick={() => handleStatCardClick("CUSTOMIZED")}
          className="cursor-pointer"
        >
          <StatCard
            icon={Briefcase}
            label={isMobile ? "Custom" : "Customized"}
            value={customizedCount}
            gradientFrom="#0A7AFF"
            gradientTo="#3B9EFF"
            selected={selectedTypeFilter === "CUSTOMIZED"}
          />
        </div>
        <div
          onClick={() => handleStatCardClick("STANDARD")}
          className="cursor-pointer"
        >
          <StatCard
            icon={FileCheck}
            label={isMobile ? "Standard" : "Standard"}
            value={standardCount}
            gradientFrom="#10B981"
            gradientTo="#14B8A6"
            selected={selectedTypeFilter === "STANDARD"}
          />
        </div>
        <div
          onClick={() => handleStatCardClick("REQUESTED")}
          className="cursor-pointer"
        >
          <StatCard
            icon={ClipboardList}
            label={isMobile ? "Requested" : "Requested"}
            value={requestedCount}
            gradientFrom="#FFB84D"
            gradientTo="#FF9800"
            selected={selectedTypeFilter === "REQUESTED"}
          />
        </div>
      </div>

      <ContentCard
        title={`${
          activeTab === "completed" ? "Completed" : "Cancelled"
        } Bookings (${totalItems})`}
        footer={
          totalItems > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setQueryParams({ ...queryParams, page })}
              showingStart={indexOfFirstBooking}
              showingEnd={indexOfLastBooking}
            />
          ) : undefined
        }
      >
        <SearchFilterToolbar
          searchPlaceholder="Search by booking ID, customer, or destination..."
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
          }}
          sortOrder={sortOrder}
          onSortChange={(order) => {
            setSortOrder(order);
          }}
          filterOpen={filterOpen}
          onFilterOpenChange={handleFilterOpenChange}
          activeFiltersCount={activeFiltersCount}
          filterContent={
            <HistoryFilterContent
              dateFrom={pendingDateFrom}
              onDateFromChange={setPendingDateFrom}
              dateTo={pendingDateTo}
              onDateToChange={setPendingDateTo}
              completedDateFrom={pendingCompletedDateFrom}
              onCompletedDateFromChange={setPendingCompletedDateFrom}
              completedDateTo={pendingCompletedDateTo}
              onCompletedDateToChange={setPendingCompletedDateTo}
              minAmount={pendingMinAmount}
              onMinAmountChange={setPendingMinAmount}
              maxAmount={pendingMaxAmount}
              onMaxAmountChange={setPendingMaxAmount}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
            />
          }
          onExportPDF={() => {
            const exportData = filteredBookings.map((booking) => ({
              id: booking.id,
              customer: booking.customer,
              email: booking.email,
              mobile: booking.mobile,
              destination: booking.destination,
              startdate: booking.startDate
                ? new Date(booking.startDate).toLocaleDateString()
                : "N/A",
              enddate: booking.endDate
                ? new Date(booking.endDate).toLocaleDateString()
                : "N/A",
              travelers: `${booking.travelers} pax`,
              totalamount: `₱${booking.totalAmount.toLocaleString()}`,
              bookingtype: booking.bookingType || "N/A",
              status: booking.status,
              completeddate:
                booking.status === "COMPLETED" ? "Completed" : "Cancelled",
            }));
            const titleSuffix =
              activeTab === "completed"
                ? "Completed Bookings"
                : "Cancelled Bookings";
            exportToPDF(exportData, `History - ${titleSuffix}`, [
              "ID",
              "Customer",
              "Email",
              "Mobile",
              "Destination",
              "Start Date",
              "End Date",
              "Travelers",
              "Total Amount",
              "Booking Type",
              "Status",
              "Completed Date",
            ]);
            toast.success(`Exporting ${activeTab} bookings as PDF...`);
          }}
          onExportExcel={() => {
            const exportData = filteredBookings.map((booking) => ({
              id: booking.id,
              customer: booking.customer,
              email: booking.email,
              mobile: booking.mobile,
              destination: booking.destination,
              startdate: booking.startDate
                ? new Date(booking.startDate).toLocaleDateString()
                : "N/A",
              enddate: booking.endDate
                ? new Date(booking.endDate).toLocaleDateString()
                : "N/A",
              travelers: `${booking.travelers} pax`,
              totalamount: `₱${booking.totalAmount.toLocaleString()}`,
              bookingtype: booking.bookingType || "N/A",
              status: booking.status,
              completeddate:
                booking.status === "COMPLETED" ? "Completed" : "Cancelled",
            }));
            const titleSuffix =
              activeTab === "completed"
                ? "Completed Bookings"
                : "Cancelled Bookings";
            exportToExcel(exportData, `History - ${titleSuffix}`, [
              "ID",
              "Customer",
              "Email",
              "Mobile",
              "Destination",
              "Start Date",
              "End Date",
              "Travelers",
              "Total Amount",
              "Booking Type",
              "Status",
              "Completed Date",
            ]);
            toast.success(`Exporting ${activeTab} bookings as Excel...`);
          }}
        />

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">
                No {activeTab} bookings to display
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                id={`booking-${booking.id}`}
                onClick={() => handleViewDetails(booking.id)}
                className="p-4 md:p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(10,122,255,0.1)] cursor-pointer"
              >
                {/* Header - Responsive */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center ${
                        isMobile
                          ? "w-10 h-10"
                          : "w-12 h-12"
                      } rounded-xl ${
                        booking.status === "COMPLETED"
                          ? "bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
                          : "bg-gradient-to-br from-[#FF6B6B] to-[#FF8C8C]"
                      }`}
                    >
                      <span className={`text-white ${isMobile ? "text-base" : "text-lg"}`}>
                        {booking.status === "COMPLETED" ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                        <h3 className={`text-[#1A2B4F] font-semibold ${isMobile ? "text-base" : "text-lg"} truncate`}>
                          {booking.bookingCode}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1 md:mt-0">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full font-medium border whitespace-nowrap ${getStatusColor(
                              booking.status
                            )} ${isMobile ? "text-xs" : "text-xs"}`}
                          >
                            {getStatusIcon(booking.status)}{" "}
                            {booking.status === "COMPLETED"
                              ? "Completed"
                              : "Cancelled"}
                          </span>
                          {booking.bookingType && (
                            <span
                              className={`inline-flex px-2 py-1 rounded-full font-medium border whitespace-nowrap ${
                                isMobile ? "text-xs" : "text-xs"
                              } ${
                                booking.bookingType === "CUSTOMIZED"
                                  ? "bg-[rgba(255,127,110,0.1)] text-[#FF7F6E] border-[rgba(255,127,110,0.2)]"
                                  : booking.bookingType === "STANDARD"
                                  ? "bg-[rgba(139,125,107,0.1)] text-[#8B7D6B] border-[rgba(139,125,107,0.2)]"
                                  : "bg-[rgba(236,72,153,0.1)] text-[#EC4899] border-[rgba(236,72,153,0.2)]"
                              }`}
                            >
                              {isMobile ? booking.bookingType.charAt(0) + booking.bookingType.slice(1).toLowerCase() : capitalize(booking.bookingType)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* View Details Button - Desktop only */}
                  {!isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(booking.id);
                      }}
                      className="h-9 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFB] hover:border-[#0A7AFF] text-[#334155] flex items-center gap-2 text-sm font-medium transition-all"
                    >
                      View Details
                    </button>
                  )}
                </div>

                {/* Customer Info - Responsive */}
                <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Users className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-[#64748B]`} />
                      <span className={`text-[#334155] font-medium ${isMobile ? "text-sm" : "text-sm"}`}>
                        {booking.customer}
                      </span>
                    </div>
                    <span className="hidden md:inline text-sm text-[#64748B]">•</span>
                    <span className={`text-[#64748B] ${isMobile ? "text-xs" : "text-sm"} md:inline truncate`}>
                      {booking.email}
                    </span>
                    <span className="hidden md:inline text-sm text-[#64748B]">•</span>
                    <span className={`text-[#64748B] ${isMobile ? "text-xs" : "text-sm"} md:inline`}>
                      {booking.mobile}
                    </span>
                  </div>
                  {/* Mobile contact info */}
                  {isMobile && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#64748B]" />
                        <span className="text-xs text-[#64748B] truncate">{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#64748B]" />
                        <span className="text-xs text-[#64748B]">{booking.mobile}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trip Details - Responsive */}
                <div className="space-y-4 md:space-y-0">
                  {/* Mobile layout */}
                  {isMobile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#0A7AFF] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-[#64748B]">Destination</p>
                            <p className="text-sm text-[#334155] font-medium line-clamp-1">
                              {booking.destination}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-[#64748B]">Travelers</p>
                            <p className="text-sm text-[#334155] font-medium">
                              {booking.travelers} {booking.travelers > 1 ? "Pax" : "Pax"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-[#64748B]">Travel Dates</p>
                          <p className="text-sm text-[#334155] font-medium leading-tight">
                            {formatDateRange(booking.startDate!, booking.endDate!)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <span className="text-[#10B981] text-lg">₱</span>
                          <div>
                            <p className="text-xs text-[#64748B]">Total Amount</p>
                            <p className="text-sm text-[#334155] font-medium">
                              ₱{booking.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-[#64748B]">Booked On</p>
                            <p className="text-sm text-[#334155] font-medium truncate">
                              {booking.bookedDateObj.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile View Details Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(booking.id);
                        }}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#3B9EFF] text-white font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  ) : (
                    /* Desktop layout */
                    <div className="grid grid-cols-5 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0A7AFF]" />
                        <div>
                          <p className="text-xs text-[#64748B]">Destination</p>
                          <p className="text-sm text-[#334155] font-medium">
                            {booking.destination}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#14B8A6]" />
                        <div>
                          <p className="text-xs text-[#64748B]">Travel Dates</p>
                          <p className="text-sm text-[#334155] font-medium">
                            {formatDateRange(booking.startDate!, booking.endDate!)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#64748B]" />
                        <div>
                          <p className="text-xs text-[#64748B]">Travelers</p>
                          <p className="text-sm text-[#334155] font-medium">
                            {booking.travelers}{" "}
                            {booking.travelers > 1 ? "People" : "Person"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#10B981] text-lg">₱</span>
                        <div>
                          <p className="text-xs text-[#64748B]">Total Amount</p>
                          <p className="text-sm text-[#334155] font-medium">
                            ₱{booking.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#64748B]" />
                        <div>
                          <p className="text-xs text-[#64748B]">Booked On</p>
                          <p className="text-sm text-[#334155] font-medium">
                            {booking.bookedDateObj.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ContentCard>
    </div>
  );
}