import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  RotateCcw,
  ChevronLeft,
  Phone,
  Mail,
  CreditCard,
  Clock,
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Pencil,
  Check,
  X,
  Loader2,
  AlertCircle as AlertCircleIcon,
  RefreshCw,
} from "lucide-react";
import { BookingDetailView } from "../components/BookingDetailView";
import { ContentCard } from "../components/ContentCard";
import { Pagination } from "../components/Pagination";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { capitalize } from "../utils/helpers/capitalize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useBreadcrumbs } from "../components/BreadcrumbContext";
import { BookingListCard } from "../components/BookingListCard";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useAdminBookings,
  useBookingDetail,
  useUpdateBookingStatus,
  useUpdateBooking,
} from "../hooks/useBookings";
import { queryKeys } from "../utils/lib/queryKeys";

// Add media query hook for responsive design
import { useMediaQuery } from "react-responsive";
import { Booking } from "../types/types";

const transformBookingForCard = (booking: any) => {
  // Ensure consistent resolution status handling
  const isResolved = Boolean(booking.isResolved);
  const resolutionStatus = isResolved ? "resolved" : "unresolved";

  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    customer: booking.customer,
    email: booking.email,
    mobile: booking.mobile,
    destination: booking.destination,
    startDate: booking.startDate,
    endDate: booking.endDate,
    travelers: booking.travelers,
    total: `₱${booking.totalAmount.toLocaleString()}`,
    totalAmount: booking.totalAmount,
    paid: booking.paid || 0,
    paymentStatus: booking.paymentStatus,
    bookedDate: booking.bookedDate,
    status: booking.status,
    bookingType: booking.bookingType,
    tourType: booking.tourType,
    rejectionReason: booking.rejectionReason,
    rejectionResolution: booking.rejectionResolution,
    isResolved: isResolved,
    resolutionStatus: resolutionStatus,
    sentStatus: booking.sentStatus,
  };
};

interface ApprovalsProps {
  onApprovalsCountChange?: (count: number) => void;
}

export function Approvals({ onApprovalsCountChange }: ApprovalsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const bookingRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [activeTab, setActiveTab] = useState<"all" | "byDate" | "rejected">(
    "all"
  );
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isUnresolveDialogOpen, setIsUnresolveDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isReviewForApprovalDialogOpen, setIsReviewForApprovalDialogOpen] =
    useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionResolution, setRejectionResolution] = useState("");
  const [editingTotalAmount, setEditingTotalAmount] = useState(false);
  const [editedTotalAmount, setEditedTotalAmount] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Loading states for actions
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMarkingResolved, setIsMarkingResolved] = useState(false);
  const [isMarkingUnresolved, setIsMarkingUnresolved] = useState(false);
  const [isReconsidering, setIsReconsidering] = useState(false);
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // API query params
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    status: activeTab === "rejected" ? "REJECTED" : "PENDING",
    sortOrder: "createdAt:desc",
  });

  // Fetch bookings
  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch,
  } = useAdminBookings(queryParams);

  // Fetch detailed booking
  const { data: bookingDetailData, isLoading: isLoadingDetail } =
    useBookingDetail(selectedBookingId || "", {
      enabled: !!selectedBookingId && viewMode === "detail",
      queryKey: queryKeys.bookings.detail(selectedBookingId!),
    });

  // Mutations
  const updateBookingStatus = useUpdateBookingStatus(selectedBookingId || "");
  const updateBooking = useUpdateBooking(selectedBookingId || "");

  // Helper to reset all loading states
  const resetLoadingStates = () => {
    setIsApproving(false);
    setIsRejecting(false);
    setIsMarkingResolved(false);
    setIsMarkingUnresolved(false);
    setIsReconsidering(false);
    setIsUpdatingAmount(false);
    setIsRefreshing(false);
    setActionError(null);
  };

  const highlightAnimation = `
    @keyframes highlight {
      0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.08); transform: scale(1); }
      50% { box-shadow: 0 0 0 3px rgba(10, 122, 255, 0.3), 0 4px 6px rgba(10, 122, 255, 0.1); transform: scale(1.005); }
    }
    .highlight-animation { animation: highlight 2s ease-in-out; border-radius: 1rem; }
    
    @keyframes skeleton-loading {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200px 100%;
      animation: skeleton-loading 1.5s infinite;
    }
  `;

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

  const transformBooking = (apiBooking: any) => {
    const totalAmount = parseFloat(apiBooking.totalPrice) || 0;
    const startDate = apiBooking.startDate || apiBooking.itinerary?.startDate;
    const endDate = apiBooking.endDate || apiBooking.itinerary?.endDate;
    const customerName = apiBooking.customerName || "Unknown Customer";
    const customerEmail = apiBooking.customerEmail || "";
    const customerMobile = apiBooking.customerMobile || "N/A";

    // Properly handle resolution status - prioritize isResolved boolean
    const isResolved = Boolean(apiBooking.isResolved);
    const resolutionStatus = isResolved ? "resolved" : "unresolved";

    return {
      id: apiBooking.id,
      bookingCode: apiBooking.bookingCode,
      customer: customerName,
      email: customerEmail,
      mobile: customerMobile,
      destination: apiBooking.destination || apiBooking.itinerary?.destination,
      itinerary: apiBooking.destination || apiBooking.itinerary?.destination,
      startDate: startDate,
      endDate: endDate,
      travelers: apiBooking.travelers || apiBooking.itinerary?.travelers || 1,
      totalAmount: totalAmount,
      paid: 0,
      totalPaid: 0,
      paymentStatus: apiBooking.paymentStatus || "PENDING",
      bookedDate: apiBooking.bookedDateDisplay,
      bookedDateObj: new Date(apiBooking.bookedDate || apiBooking.createdAt),
      status: apiBooking.status,
      bookingType: apiBooking.type,
      tourType:
        apiBooking.tourType || apiBooking.itinerary?.tourType || "PRIVATE",
      rejectionReason: apiBooking.rejectionReason,
      rejectionResolution: apiBooking.rejectionResolution,
      isResolved: isResolved,
      resolutionStatus: resolutionStatus,
      paymentHistory: [],
      bookingSource: apiBooking.type,
      itineraryDetails: [],
    };
  };

  const bookings = bookingsData?.data?.map(transformBooking) || [];
  const selectedBooking = useMemo(() => {
    // Only return booking data if it matches the currently selected booking ID
    // This prevents showing stale data when switching between bookings
    if (
      bookingDetailData?.data &&
      bookingDetailData.data.id === selectedBookingId
    ) {
      return transformBooking(bookingDetailData.data);
    }
    return null;
  }, [bookingDetailData?.data, selectedBookingId]);

  useEffect(() => {
    setQueryParams({
      page: currentPage,
      limit: itemsPerPage,
      status: activeTab === "rejected" ? "REJECTED" : "PENDING",
    });
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (onApprovalsCountChange && bookingsData?.meta?.total) {
      onApprovalsCountChange(bookingsData.meta.total);
    }
  }, [bookingsData?.meta?.total, onApprovalsCountChange]);

  useEffect(() => {
    if (viewMode === "detail" && selectedBooking) {
      setBreadcrumbs([
        { label: "Home", path: "/" },
        { label: "Approvals", path: "/approvals" },
        { label: `Booking ${selectedBooking.bookingCode}` },
      ]);
    } else {
      resetBreadcrumbs();
    }
  }, [viewMode, selectedBooking?.id, setBreadcrumbs, resetBreadcrumbs]);

  const scrollToBooking = (bookingId: string) => {
    const element = bookingRefs.current[bookingId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-animation");
      setTimeout(() => element?.classList.remove("highlight-animation"), 2000);
    }
  };

  useEffect(() => {
    if (location.state?.scrollToId) {
      const { scrollToId, tab } = location.state;
      if (tab) setActiveTab(tab);
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => scrollToBooking(scrollToId), 300);
    }
  }, [location.state, navigate, location.pathname]);

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setViewMode("detail");
    resetLoadingStates();
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
    setEditingTotalAmount(false);
    setEditedTotalAmount("");
    resetLoadingStates();
  };

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Approvals refreshed");
    } catch (error) {
      toast.error("Failed to refresh approvals");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleRejectClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setRejectionReason("");
    setRejectionResolution("");
    setIsRejectDialogOpen(true);
    setActionError(null);
  };

  const handleRejectConfirm = async () => {
    if (
      !selectedBookingId ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    )
      return;

    setIsRejecting(true);
    setActionError(null);

    try {
      await updateBooking.mutateAsync({
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        rejectionResolution: rejectionResolution.trim(),
        isResolved: false,
      });
      toast.success("Booking rejected successfully");
      setIsRejectDialogOpen(false);
      setSelectedBookingId(null);
      setRejectionReason("");
      setRejectionResolution("");
      await refetch();
      if (viewMode === "detail") handleBackToList();
    } catch (error: any) {
      console.error("Failed to reject booking:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to reject booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setIsApproveDialogOpen(true);
    setActionError(null);
  };

  const handleApproveConfirm = async () => {
    if (!selectedBookingId) return;

    setIsApproving(true);
    setActionError(null);

    try {
      await updateBookingStatus.mutateAsync({ status: "CONFIRMED" });
      toast.success("Booking approved successfully");
      setIsApproveDialogOpen(false);
      const approvedBookingId = selectedBookingId;
      setSelectedBookingId(null);
      await refetch();
      if (viewMode === "detail") handleBackToList();
      setTimeout(
        () =>
          navigate("/bookings", {
            state: { scrollToId: approvedBookingId, highlightBooking: true },
          }),
        1500
      );
    } catch (error: any) {
      console.error("Failed to approve booking:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to approve booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  const handleMarkAsResolved = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsMarkingResolved(true);
    setActionError(null);

    try {
      await updateBooking.mutateAsync({
        isResolved: true,
      });
      toast.success("Marked as resolved");
      await refetch();
    } catch (error: any) {
      console.error("Failed to mark as resolved:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update resolution status";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsMarkingResolved(false);
    }
  };

  const handleMarkAsUnresolvedClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setRejectionReason(booking.rejectionReason || "");
    setRejectionResolution(booking.rejectionResolution || "");
    setIsUnresolveDialogOpen(true);
    setActionError(null);
  };

  const handleUnresolveConfirm = async () => {
    if (
      !selectedBookingId ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    )
      return;

    setIsMarkingUnresolved(true);
    setActionError(null);

    try {
      await updateBooking.mutateAsync({
        rejectionReason: rejectionReason.trim(),
        rejectionResolution: rejectionResolution.trim(),
        isResolved: false,
      });
      toast.success("Booking marked as unresolved");
      setIsUnresolveDialogOpen(false);
      setSelectedBookingId(null);
      setRejectionReason("");
      setRejectionResolution("");
      await refetch();
    } catch (error: any) {
      console.error("Failed to update booking:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsMarkingUnresolved(false);
    }
  };

  const handleReviewForApprovalClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setIsReviewForApprovalDialogOpen(true);
    setActionError(null);
  };

  const handleReconsiderApproval = async () => {
    if (!selectedBookingId) return;

    setIsReconsidering(true);
    setActionError(null);

    try {
      await updateBookingStatus.mutateAsync({ status: "PENDING" });
      toast.success("Moved back to pending approvals");
      setIsReviewForApprovalDialogOpen(false);
      const movedBookingId = selectedBookingId;
      setSelectedBookingId(null);
      await refetch();
      if (viewMode === "detail") handleBackToList();
      setTimeout(() => {
        setActiveTab("all");
        setCurrentPage(1);
        setTimeout(() => scrollToBooking(movedBookingId), 100);
      }, 300);
    } catch (error: any) {
      console.error("Failed to move booking:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to move booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsReconsidering(false);
    }
  };

  const handleStartEditTotalAmount = (currentTotal: string) => {
    setEditedTotalAmount(
      currentTotal.replace("₱", "").replace(/,/g, "").trim()
    );
    setEditingTotalAmount(true);
    setActionError(null);
  };

  const handleSaveTotalAmount = async () => {
    if (!editedTotalAmount || parseFloat(editedTotalAmount) <= 0) {
      toast.error("Invalid Amount");
      return;
    }
    if (!selectedBookingId) return;

    setIsUpdatingAmount(true);
    setActionError(null);

    try {
      await updateBooking.mutateAsync({
        totalPrice: parseFloat(editedTotalAmount),
      });
      setEditingTotalAmount(false);
      setEditedTotalAmount("");
      toast.success("Total Amount Updated");
      await refetch();
    } catch (error: any) {
      console.error("Failed to update total amount:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update total amount";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];
    if (activeTab === "byDate") {
      filtered = filtered.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }
    return filtered;
  };

  const filteredBookings = getFilteredBookings();
  const totalItems = bookingsData?.meta?.total || 0;
  const totalPages = bookingsData?.meta?.totalPages || 1;
  const apiCurrentPage = bookingsData?.meta?.page || 1;
  const indexOfFirstBooking = (apiCurrentPage - 1) * itemsPerPage + 1;
  const indexOfLastBooking = Math.min(
    apiCurrentPage * itemsPerPage,
    totalItems
  );

  const handleTabChange = (tab: "all" | "byDate" | "rejected") => {
    setActiveTab(tab);
    setCurrentPage(1);
    resetLoadingStates();
  };

  // Main loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#0A7AFF]" />
        <p className="text-[#64748B]">Loading approvals...</p>
        <div className="w-64 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A7AFF] animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center p-6">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,107,107,0.1)] flex items-center justify-center mb-4">
          <AlertCircleIcon className="w-10 h-10 text-[#FF6B6B]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
          Failed to load approvals
        </h3>
        <p className="text-sm text-[#64748B] mb-6 max-w-md">
          We couldn't load your approvals. This might be due to network issues
          or server problems.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC] flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFB] flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "detail") {
    // Show loading state while fetching or when data doesn't match selected ID yet
    if (isLoadingDetail || (selectedBookingId && !selectedBooking)) {
      return (
        <div className="space-y-6">
          {/* Back button skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl skeleton"></div>
            <div>
              <div className="h-6 w-48 skeleton rounded mb-2"></div>
              <div className="h-4 w-32 skeleton rounded"></div>
            </div>
          </div>

          {/* Header skeleton */}
          <div className="rounded-2xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-3">
                <div className="h-8 w-64 bg-white/20 rounded skeleton"></div>
                <div className="h-4 w-48 bg-white/20 rounded skeleton"></div>
              </div>
              <div className="h-8 w-32 bg-white/20 rounded skeleton"></div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="h-5 w-5 bg-white/20 rounded-full skeleton mb-2"></div>
                  <div className="h-3 w-16 bg-white/20 rounded skeleton mb-1"></div>
                  <div className="h-4 w-24 bg-white/20 rounded skeleton"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-6"
                >
                  <div className="h-6 w-32 skeleton rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-3 w-20 skeleton rounded"></div>
                        <div className="h-4 w-40 skeleton rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="h-6 w-40 skeleton rounded mb-6"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="h-4 w-24 skeleton rounded mb-2"></div>
                    <div className="space-y-2">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="h-12 skeleton rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // If we're not loading but still don't have a booking, show error
    if (!selectedBooking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-100 text-center p-6">
          <div className="w-20 h-20 rounded-full bg-[rgba(255,184,77,0.1)] flex items-center justify-center mb-4">
            <AlertCircleIcon className="w-10 h-10 text-[#FFB84D]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
            Booking not found
          </h3>
          <p className="text-sm text-[#64748B] mb-6">
            The approval you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC] transition-colors"
          >
            Back to List
          </button>
        </div>
      );
    }

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: highlightAnimation }} />
        <BookingDetailView
          booking={{
            id: selectedBooking.id,
            bookingCode: selectedBooking.bookingCode,
            customer: selectedBooking.customer,
            email: selectedBooking.email,
            mobile: selectedBooking.mobile,
            destination: selectedBooking.destination,
            itinerary: selectedBooking.itinerary || selectedBooking.destination,
            dates: formatDateRange(
              selectedBooking.startDate,
              selectedBooking.endDate
            ),
            travelers: selectedBooking.travelers,
            total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
            totalAmount: selectedBooking.totalAmount,
            paid: selectedBooking.paid || selectedBooking.totalPaid || 0,
            paymentStatus: selectedBooking.paymentStatus,
            bookedDate: selectedBooking.bookedDate,
            tripStatus: selectedBooking.status,
            rejectionReason: selectedBooking.rejectionReason || "",
            rejectionResolution: selectedBooking.rejectionResolution || "",
            resolutionStatus: selectedBooking.resolutionStatus || "unresolved",
          }}
          itinerary={bookingDetailData?.data?.itinerary!}
          onBack={handleBackToList}
          headerVariant="approval"
          breadcrumbPage="Approvals"
          isRequestedItinerary={false}
          useBackButtonHeader={true}
          backButtonSubtitle="Approval Details"
          useBreadcrumbs={false}
          actionButtons={
            <div className="space-y-3">
              {/* Error Display */}
              {actionError && (
                <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                  <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{actionError}</span>
                  </div>
                </div>
              )}
              {/* Total Amount Edit Section */}
              <div className="bg-linear-to-br from-[#F8FAFB] to-white rounded-xl p-4 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#64748B]">
                    Total Amount
                  </span>
                  {!editingTotalAmount && (
                    <button
                      onClick={() =>
                        handleStartEditTotalAmount(
                          selectedBooking.totalAmount.toString()
                        )
                      }
                      className="p-1.5 rounded-lg hover:bg-white/60 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Total Amount"
                      disabled={isUpdatingAmount}
                    >
                      {isUpdatingAmount ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#64748B]" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0A7AFF]" />
                      )}
                    </button>
                  )}
                </div>
                {editingTotalAmount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#64748B]">₱</span>
                    <input
                      type="number"
                      value={editedTotalAmount}
                      onChange={(e) => setEditedTotalAmount(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#E5E7EB] text-[#1A2B4F] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7AFF]/20 focus:border-[#0A7AFF] disabled:opacity-50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveTotalAmount();
                        } else if (e.key === "Escape") {
                          setEditingTotalAmount(false);
                          setEditedTotalAmount("");
                        }
                      }}
                      disabled={isUpdatingAmount}
                    />
                    <button
                      onClick={handleSaveTotalAmount}
                      className="w-8 h-8 rounded-lg bg-[#10B981] hover:bg-[#059669] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save"
                      disabled={isUpdatingAmount}
                    >
                      {isUpdatingAmount ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTotalAmount(false);
                        setEditedTotalAmount("");
                      }}
                      className="w-8 h-8 rounded-lg bg-[#FF6B6B] hover:bg-[#EF4444] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel"
                      disabled={isUpdatingAmount}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-[#1A2B4F]">
                    ₱{selectedBooking.totalAmount.toLocaleString()}
                  </p>
                )}
              </div>
              {/* Rejection Info for Rejected Tab */}
              {activeTab === "rejected" &&
                selectedBooking.rejectionReason &&
                selectedBooking.rejectionResolution && (
                  <div className="bg-linear-to-br from-[rgba(255,107,107,0.05)] to-white rounded-xl p-4 border border-[rgba(255,107,107,0.2)]">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                      <h4 className="font-semibold text-[#FF6B6B] text-sm">
                        Rejection Details
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[#FF6B6B] mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-[#334155]">
                          {selectedBooking.rejectionReason}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#FF6B6B] mb-1">
                          Required Action:
                        </p>
                        <p className="text-sm text-[#334155]">
                          {selectedBooking.rejectionResolution}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,107,107,0.2)]">
                        <p className="text-xs font-semibold text-[#64748B]">
                          Client Action Status:
                        </p>
                        {/* FIX: Properly check resolution status */}
                        {selectedBooking.resolutionStatus === "resolved" ||
                        selectedBooking.isResolved === true ? (
                          <button
                            onClick={() =>
                              handleMarkAsUnresolvedClick(selectedBooking)
                            }
                            className="px-2.5 py-1 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#10B981] text-xs font-medium border border-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isMarkingUnresolved}
                          >
                            {isMarkingUnresolved ? (
                              <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                            )}
                            {isMarkingUnresolved ? "Updating..." : "Resolved"}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleMarkAsResolved(selectedBooking.id)
                            }
                            className="px-2.5 py-1 rounded-lg bg-[rgba(255,152,0,0.1)] text-[#FF9800] text-xs font-medium border border-[rgba(255,152,0,0.2)] hover:bg-[rgba(255,152,0,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isMarkingResolved}
                          >
                            {isMarkingResolved ? (
                              <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                            )}
                            {isMarkingResolved
                              ? "Marking..."
                              : "Mark as Resolved"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              <>
                <button
                  onClick={() => handleApproveClick(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  disabled={isApproving || isLoadingDetail}
                >
                  {isApproving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isApproving ? "Approving..." : "Approve Booking"}
                </button>
                <button
                  onClick={() => handleRejectClick(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isRejecting || isLoadingDetail}
                >
                  {isRejecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {isRejecting ? "Rejecting..." : "Reject Booking"}
                </button>
              </>
              <button
                onClick={() => handleReviewForApprovalClick(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isReconsidering || isLoadingDetail}
              >
                {isReconsidering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {isReconsidering ? "Moving..." : "Review for Approval"}
              </button>
              <button
                onClick={handleBackToList}
                className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-[#334155] font-medium transition-all"
              >
                Back to List
              </button>
            </div>
          }
        />

        {/* Modals with loading states */}
        <ConfirmationModal
          open={isApproveDialogOpen}
          onOpenChange={(open) => {
            setIsApproveDialogOpen(open);
            if (!open) setActionError(null);
          }}
          title="Approve Booking"
          description="This booking will be moved to active bookings."
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#10B981] to-[#34D399]"
          iconShadow="shadow-[#10B981]/20"
          contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.12)]"
          contentBorder="border-[rgba(16,185,129,0.2)]"
          isLoading={isApproving}
          content={
            selectedBooking && (
              <div>
                {actionError && (
                  <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] mb-4">
                    <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{actionError}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-[#334155] leading-relaxed mb-4">
                  Are you sure you want to approve the booking for{" "}
                  <span className="font-semibold text-[#10B981]">
                    {selectedBooking.customer}
                  </span>
                  ?
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(16,185,129,0.2)]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                    <p className="text-sm font-semibold text-[#0A7AFF]">
                      {selectedBooking.bookingCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Destination</p>
                    <p className="text-sm font-medium text-[#334155]">
                      {selectedBooking.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Travelers</p>
                    <p className="text-sm font-medium text-[#334155]">
                      {selectedBooking.travelers}{" "}
                      {selectedBooking.travelers > 1 ? "People" : "Person"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                    <p className="text-sm font-semibold text-[#1A2B4F]">
                      ₱{selectedBooking.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          onConfirm={handleApproveConfirm}
          onCancel={() => {
            setIsApproveDialogOpen(false);
            setActionError(null);
          }}
          confirmText={isApproving ? "Approving..." : "Approve Booking"}
          cancelText="Cancel"
          confirmVariant="success"
        />

        <Dialog
          open={isRejectDialogOpen}
          onOpenChange={(open: any) => {
            setIsRejectDialogOpen(open);
            if (!open) {
              setActionError(null);
              setRejectionReason("");
              setRejectionResolution("");
            }
          }}
        >
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#FF6B6B] to-[#FF8787] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                Reject Booking
              </DialogTitle>
              <DialogDescription>
                Provide a reason for rejection and specify what the client must
                do to resolve this issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-8 py-6">
              {actionError && (
                <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                  <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{actionError}</span>
                  </div>
                </div>
              )}
              <div>
                <Label
                  htmlFor="rejection-reason"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Rejection Reason *
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g., Incomplete payment documentation, Invalid travel dates..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-20 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                  disabled={isRejecting}
                />
              </div>
              <div>
                <Label
                  htmlFor="rejection-resolution"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Required Action / Resolution *
                </Label>
                <Textarea
                  id="rejection-resolution"
                  placeholder="e.g., Please submit proof of payment or valid payment method..."
                  value={rejectionResolution}
                  onChange={(e) => setRejectionResolution(e.target.value)}
                  className="min-h-20 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                  disabled={isRejecting}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason("");
                  setRejectionResolution("");
                  setActionError(null);
                }}
                className="border-[#E5E7EB]"
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={
                  !rejectionReason.trim() ||
                  !rejectionResolution.trim() ||
                  isRejecting
                }
                className="bg-linear-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF3B3B]"
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {isRejecting ? "Rejecting..." : "Reject Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isUnresolveDialogOpen}
          onOpenChange={(open: any) => {
            setIsUnresolveDialogOpen(open);
            if (!open) {
              setActionError(null);
              setRejectionReason("");
              setRejectionResolution("");
            }
          }}
        >
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#FF9800] to-[#FFB84D] flex items-center justify-center shadow-lg shadow-[#FF9800]/20">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                Mark as Unresolved
              </DialogTitle>
              <DialogDescription>
                Update the rejection information and mark this booking as
                unresolved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-8 py-6">
              {actionError && (
                <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                  <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{actionError}</span>
                  </div>
                </div>
              )}
              <div>
                <Label
                  htmlFor="unresolve-reason"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Rejection Reason *
                </Label>
                <Textarea
                  id="unresolve-reason"
                  placeholder="e.g., Incomplete payment documentation..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-20 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                  disabled={isMarkingUnresolved}
                />
              </div>
              <div>
                <Label
                  htmlFor="unresolve-resolution"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Required Action / Resolution *
                </Label>
                <Textarea
                  id="unresolve-resolution"
                  placeholder="e.g., Please submit proof of payment..."
                  value={rejectionResolution}
                  onChange={(e) => setRejectionResolution(e.target.value)}
                  className="min-h-20 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                  disabled={isMarkingUnresolved}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUnresolveDialogOpen(false);
                  setRejectionReason("");
                  setRejectionResolution("");
                  setActionError(null);
                }}
                className="border-[#E5E7EB]"
                disabled={isMarkingUnresolved}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnresolveConfirm}
                disabled={
                  !rejectionReason.trim() ||
                  !rejectionResolution.trim() ||
                  isMarkingUnresolved
                }
                className="bg-linear-to-r from-[#FF9800] to-[#FFB84D] hover:from-[#FF8C00] hover:to-[#FFA836]"
              >
                {isMarkingUnresolved ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                {isMarkingUnresolved ? "Updating..." : "Mark Unresolved"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmationModal
          open={isReviewForApprovalDialogOpen}
          onOpenChange={(open) => {
            setIsReviewForApprovalDialogOpen(open);
            if (!open) setActionError(null);
          }}
          title="Review for Approval"
          description="Move this resolved rejected booking back to pending approvals for reconsideration."
          icon={<RotateCcw className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
          iconShadow="shadow-[#0A7AFF]/20"
          contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)]"
          contentBorder="border-[rgba(10,122,255,0.2)]"
          isLoading={isReconsidering}
          content={
            selectedBooking && (
              <div>
                {actionError && (
                  <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] mb-4">
                    <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{actionError}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-[#334155]">
                  Move booking for{" "}
                  <span className="font-semibold text-[#0A7AFF]">
                    {selectedBooking.customer}
                  </span>{" "}
                  back to pending approvals?
                </p>
              </div>
            )
          }
          onConfirm={handleReconsiderApproval}
          onCancel={() => {
            setIsReviewForApprovalDialogOpen(false);
            setActionError(null);
          }}
          confirmText={isReconsidering ? "Moving..." : "Review for Approval"}
          cancelText="Cancel"
          confirmVariant="default"
        />
      </>
    );
  }

  // List view
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: highlightAnimation }} />
      <div>
        {/* Tabs - Responsive Design */}
        <div
          className={`flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB] ${
            isMobile ? "flex-col md:flex-row" : ""
          }`}
        >
          <div
            className={`flex ${
              isMobile ? "w-full justify-between" : "items-center gap-1"
            }`}
          >
            <button
              onClick={() => handleTabChange("all")}
              disabled={isLoading}
              className={`${
                isMobile ? "flex-1 px-3" : "px-5"
              } h-11 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "all"
                  ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-0.5"
                  : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
              }`}
            >
              {isMobile ? "All" : "All"}
            </button>
            <button
              onClick={() => handleTabChange("byDate")}
              disabled={isLoading}
              className={`${
                isMobile ? "flex-1 px-3" : "px-5"
              } h-11 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "byDate"
                  ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-0.5"
                  : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
              }`}
            >
              {isMobile ? "By Date" : "By Date"}
            </button>
            <button
              onClick={() => handleTabChange("rejected")}
              disabled={isLoading}
              className={`${
                isMobile ? "flex-1 px-3" : "px-5"
              } h-11 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "rejected"
                  ? "font-semibold text-[#FF6B6B] border-b-[3px] border-[#FF6B6B] -mb-0.5"
                  : "font-medium text-[#64748B] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)]"
              }`}
            >
              {isMobile ? "Rejected" : "Rejected Bookings"}
            </button>
          </div>
          <div
            className={`ml-auto ${
              isMobile ? "mt-2 w-full flex justify-end" : ""
            }`}
          >
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className={`${
                isMobile ? "px-4 py-2" : "px-3 py-2"
              } rounded-lg hover:bg-[#F8FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              title="Refresh approvals"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#64748B]" />
              ) : (
                <RefreshCw className="w-4 h-4 text-[#64748B]" />
              )}
              {isMobile && (
                <span className="text-sm text-[#64748B]">Refresh</span>
              )}
            </button>
          </div>
        </div>

        <ContentCard
          title={
            <div className="flex flex-col md:flex-row md:items-center md:gap-2">
              <span>
                {activeTab === "rejected"
                  ? `Rejected Bookings (${totalItems})`
                  : `Pending Approvals (${totalItems})`}
              </span>
              {isMobile && totalItems > 0 && (
                <span className="text-xs text-[#64748B] mt-1 md:hidden">
                  Showing {indexOfFirstBooking}-{indexOfLastBooking} of{" "}
                  {totalItems}
                </span>
              )}
            </div>
          }
          footer={
            totalItems > 0 ? (
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                showingStart={indexOfFirstBooking}
                showingEnd={indexOfLastBooking}
              />
            ) : undefined
          }
        >
          {isLoading ? (
            // Skeleton loading for bookings list
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border-2 border-[#E5E7EB] animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl skeleton"></div>
                      <div className="space-y-2">
                        <div className="h-6 w-48 skeleton rounded"></div>
                        <div className="h-4 w-32 skeleton rounded"></div>
                      </div>
                    </div>
                    <div className="h-9 w-28 skeleton rounded-xl"></div>
                  </div>
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-3 w-16 skeleton rounded"></div>
                          <div className="h-4 w-24 skeleton rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-[#F8FAFB] to-[#E5E7EB] rounded-full flex items-center justify-center">
                {activeTab === "rejected" ? (
                  <XCircle className="w-8 h-8 text-[#FF6B6B]" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-[#0A7AFF]" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                {activeTab === "rejected"
                  ? "No rejected bookings"
                  : "All clear!"}
              </h3>
              <p className="text-sm text-[#64748B]">
                {activeTab === "rejected"
                  ? "No rejected bookings to review at the moment."
                  : "No pending approvals. All bookings have been reviewed."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <div
                    key={`${booking.id}-${index}`}
                    ref={(el) => (bookingRefs.current[booking.id] = el)}
                  >
                    <BookingListCard
                      booking={transformBookingForCard(booking)}
                      onViewDetails={handleViewDetails}
                      context={
                        activeTab === "rejected" ? "rejected" : "approvals"
                      }
                      activeTab={activeTab}
                      showViewDetailsButton={true}
                      highlightOnClick={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </>
  );
}
