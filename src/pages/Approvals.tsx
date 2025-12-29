import { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { ItineraryDetailDisplay } from "../components/ItineraryDetailDisplay";
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
import { useNavigate, useLocation } from "react-router-dom";
import {
  useAdminBookings,
  useBookingDetail,
  useUpdateBookingStatus,
  useUpdateBooking,
} from "../hooks/useBookings";
import { queryKeys } from "../utils/lib/queryKeys";

interface ApprovalsProps {
  onApprovalsCountChange?: (count: number) => void;
}

export function Approvals({ onApprovalsCountChange }: ApprovalsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const bookingRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // API query params
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    status: activeTab === "rejected" ? "REJECTED" : "PENDING",
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
      queryKey: [queryKeys.bookings.detail],
    });

  // Mutations
  const updateBookingStatus = useUpdateBookingStatus(selectedBookingId || "");
  const updateBooking = useUpdateBooking(selectedBookingId || "");

  const highlightAnimation = `
    @keyframes highlight {
      0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.08); transform: scale(1); }
      50% { box-shadow: 0 0 0 3px rgba(10, 122, 255, 0.3), 0 4px 6px rgba(10, 122, 255, 0.1); transform: scale(1.005); }
    }
    .highlight-animation { animation: highlight 2s ease-in-out; border-radius: 1rem; }
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
    // Parse dates - handle both date strings and "YYYY-MM-DD - YYYY-MM-DD" format
    let startDate, endDate, formattedDates;

    if (
      apiBooking.dates &&
      typeof apiBooking.dates === "string" &&
      apiBooking.dates.includes(" - ")
    ) {
      // Format: "2025-07-01 - 2025-07-05"
      const [start, end] = apiBooking.dates.split(" - ");
      startDate = start;
      endDate = end;
      formattedDates = apiBooking.dates;
    } else if (apiBooking.startDate && apiBooking.endDate) {
      // Individual date fields
      startDate = new Date(apiBooking.startDate).toISOString().split("T")[0];
      endDate = new Date(apiBooking.endDate).toISOString().split("T")[0];
      formattedDates = `${new Date(
        apiBooking.startDate
      ).toLocaleDateString()} - ${new Date(
        apiBooking.endDate
      ).toLocaleDateString()}`;
    } else {
      // Fallback
      startDate = new Date().toISOString().split("T")[0];
      endDate = new Date().toISOString().split("T")[0];
      formattedDates = "Date not available";
    }

    // Parse booked date
    let bookedDate;
    if (apiBooking.bookedDate) {
      bookedDate = new Date(apiBooking.bookedDate).toISOString().split("T")[0];
    } else if (apiBooking.createdAt) {
      bookedDate = new Date(apiBooking.createdAt).toISOString().split("T")[0];
    } else {
      bookedDate = new Date().toISOString().split("T")[0];
    }

    // Parse total amount
    const totalAmount = parseFloat(
      apiBooking.total || apiBooking.totalPrice || 0
    );

    return {
      id: apiBooking.id,
      customer:
        apiBooking.customer ||
        `${apiBooking.user?.firstName || ""} ${
          apiBooking.user?.lastName || ""
        }`.trim() ||
        "Unknown Customer",
      email: apiBooking.email || apiBooking.user?.email || "",
      mobile: apiBooking.mobile || apiBooking.user?.phone || "N/A",
      destination: apiBooking.destination,
      dates: formattedDates,
      startDate: startDate,
      endDate: endDate,
      travelers: apiBooking.travelers,
      total: `₱${totalAmount.toLocaleString()}`,
      totalAmount: totalAmount,
      bookedDate: bookedDate,
      status: apiBooking.statusBadges || apiBooking.status,
      bookingType: apiBooking.bookingType || apiBooking.type,
      tourType: apiBooking.tourType || "Private",
      rejectionReason: apiBooking.rejectionReason,
      rejectionResolution: apiBooking.rejectionResolution,
      resolutionStatus:
        apiBooking.resolutionStatus ||
        (apiBooking.isResolved ? "resolved" : "unresolved"),
      itineraryDetails:
        apiBooking.itinerary?.map((day: any) => ({
          day: day.dayNumber,
          title: `Day ${day.dayNumber}`,
          activities:
            day.activities?.map((act: any) => ({
              time: act.time,
              icon: getActivityIcon(act.title),
              title: act.title,
              description: act.description || "",
              location: act.location || "",
            })) || [],
        })) || [],
    };
  };

  const bookings = bookingsData?.data?.map(transformBooking) || [];
  const selectedBooking = useMemo(() => {
    return bookingDetailData?.data
      ? transformBooking(bookingDetailData.data)
      : null;
  }, [bookingDetailData?.data?.id]);

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
        { label: `Booking ${selectedBooking.id.substring(0, 8)}` },
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
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
    setEditingTotalAmount(false);
    setEditedTotalAmount("");
  };

  const handleRejectClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setRejectionReason("");
    setRejectionResolution("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (
      !selectedBookingId ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    )
      return;

    try {
      await updateBookingStatus.mutateAsync({
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        rejectionResolution: rejectionResolution.trim(),
      });
      toast.success("Booking rejected successfully");
      setIsRejectDialogOpen(false);
      setSelectedBookingId(null);
      setRejectionReason("");
      setRejectionResolution("");
      refetch();
      if (viewMode === "detail") handleBackToList();
    } catch (error) {
      toast.error("Failed to reject booking");
    }
  };

  const handleApproveClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setIsApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedBookingId) return;

    try {
      await updateBookingStatus.mutateAsync({ status: "CONFIRMED" });
      toast.success("Booking approved successfully");
      setIsApproveDialogOpen(false);
      const approvedBookingId = selectedBookingId;
      setSelectedBookingId(null);
      refetch();
      if (viewMode === "detail") handleBackToList();
      setTimeout(
        () =>
          navigate("/bookings", {
            state: { scrollToId: approvedBookingId, highlightBooking: true },
          }),
        1500
      );
    } catch (error) {
      toast.error("Failed to approve booking");
    }
  };

  const handleMarkAsResolved = async (bookingId: string) => {
    try {
      setSelectedBookingId(bookingId);
      await updateBooking.mutateAsync({ isResolved: true });
      toast.success("Marked as resolved");
      refetch();
    } catch (error) {
      toast.error("Failed to update resolution status");
    }
  };

  const handleMarkAsUnresolvedClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setRejectionReason(booking.rejectionReason || "");
    setRejectionResolution(booking.rejectionResolution || "");
    setIsUnresolveDialogOpen(true);
  };

  const handleUnresolveConfirm = async () => {
    if (
      !selectedBookingId ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    )
      return;

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
      refetch();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const handleReviewForApprovalClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setIsReviewForApprovalDialogOpen(true);
  };

  const handleReconsiderApproval = async () => {
    if (!selectedBookingId) return;

    try {
      await updateBookingStatus.mutateAsync({ status: "PENDING" });
      toast.success("Moved back to pending approvals");
      setIsReviewForApprovalDialogOpen(false);
      const movedBookingId = selectedBookingId;
      setSelectedBookingId(null);
      refetch();
      if (viewMode === "detail") handleBackToList();
      setTimeout(() => {
        setActiveTab("all");
        setCurrentPage(1);
        setTimeout(() => scrollToBooking(movedBookingId), 100);
      }, 300);
    } catch (error) {
      toast.error("Failed to move booking");
    }
  };

  const handleStartEditTotalAmount = (currentTotal: string) => {
    setEditedTotalAmount(
      currentTotal.replace("₱", "").replace(/,/g, "").trim()
    );
    setEditingTotalAmount(true);
  };

  const handleSaveTotalAmount = async () => {
    if (!editedTotalAmount || parseFloat(editedTotalAmount) <= 0) {
      toast.error("Invalid Amount");
      return;
    }
    if (!selectedBookingId) return;

    try {
      await updateBooking.mutateAsync({
        totalPrice: parseFloat(editedTotalAmount),
      });
      setEditingTotalAmount(false);
      setEditedTotalAmount("");
      toast.success("Total Amount Updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update total amount");
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A7AFF]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircleIcon className="w-12 h-12 text-[#FF6B6B] mb-4" />
        <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
          Failed to load bookings
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
          <AlertCircleIcon className="w-12 h-12 text-[#FF6B6B] mb-4" />
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

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: highlightAnimation }} />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="w-10 h-10 rounded-xl bg-white border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#64748B]" />
            </button>
            <div>
              <h2 className="text-[#1A2B4F] font-semibold">
                {selectedBooking.destination}
              </h2>
            </div>
          </div>

          {/* Booking Header Card */}
          <div className="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-semibold">
                    {selectedBooking.destination}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-lg">{selectedBooking.destination}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Booking ID</p>
                <p className="text-2xl font-semibold">
                  {selectedBooking.id.substring(0, 8)}...
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Calendar className="w-5 h-5 mb-2 text-white/80" />
                <p className="text-white/80 text-xs mb-1">Travel Dates</p>
                <p className="font-medium">
                  {formatDateRange(
                    selectedBooking.startDate,
                    selectedBooking.endDate
                  )}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Users className="w-5 h-5 mb-2 text-white/80" />
                <p className="text-white/80 text-xs mb-1">Travelers</p>
                <p className="font-medium">
                  {selectedBooking.travelers}{" "}
                  {selectedBooking.travelers > 1 ? "People" : "Person"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <CreditCard className="w-5 h-5 mb-2 text-white/80" />
                <p className="text-white/80 text-xs mb-1">Total Amount</p>
                {editingTotalAmount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-sm">₱</span>
                    <input
                      type="number"
                      value={editedTotalAmount}
                      onChange={(e) => setEditedTotalAmount(e.target.value)}
                      className="w-24 h-8 px-2 rounded-lg bg-white/20 border border-white/30 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveTotalAmount();
                        } else if (e.key === "Escape") {
                          setEditingTotalAmount(false);
                          setEditedTotalAmount("");
                        }
                      }}
                    />
                    <button
                      onClick={handleSaveTotalAmount}
                      className="w-7 h-7 rounded-lg bg-[#10B981] hover:bg-[#059669] flex items-center justify-center transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTotalAmount(false);
                        setEditedTotalAmount("");
                      }}
                      className="w-7 h-7 rounded-lg bg-[#FF6B6B] hover:bg-[#EF4444] flex items-center justify-center transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedBooking.total}</p>
                    <button
                      onClick={() =>
                        handleStartEditTotalAmount(selectedBooking.total)
                      }
                      className="w-6 h-6 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors group"
                      title="Edit Total Amount"
                    >
                      <Pencil className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Clock className="w-5 h-5 mb-2 text-white/80" />
                <p className="text-white/80 text-xs mb-1">Booked On</p>
                <p className="font-medium">{selectedBooking.bookedDate}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1A2B4F]">
                      Customer Information
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Full Name</p>
                    <p className="text-[#1A2B4F] font-medium">
                      {selectedBooking.customer}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Email Address</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0A7AFF]" />
                      <p className="text-[#334155]">{selectedBooking.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Mobile Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#14B8A6]" />
                      <p className="text-[#334155]">{selectedBooking.mobile}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Info */}
              {activeTab === "rejected" &&
                selectedBooking.rejectionReason &&
                selectedBooking.rejectionResolution && (
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF5252] flex items-center justify-center shadow-lg">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-[#FF6B6B]">
                          Rejection Details
                        </h3>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
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
                      <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                        <p className="text-xs font-semibold text-[#64748B]">
                          Client Action Status:
                        </p>
                        {selectedBooking.resolutionStatus === "resolved" ? (
                          <button
                            onClick={() =>
                              handleMarkAsUnresolvedClick(selectedBooking)
                            }
                            className="px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#10B981] text-xs font-medium border border-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.15)] transition-all"
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Resolved - Click to mark Unresolved
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleMarkAsResolved(selectedBooking.id)
                            }
                            className="px-3 py-1.5 rounded-lg bg-[rgba(255,152,0,0.1)] text-[#FF9800] text-xs font-medium border border-[rgba(255,152,0,0.2)] hover:bg-[rgba(255,152,0,0.15)] transition-all"
                          >
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            Unresolved - Click to mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
                {activeTab !== "rejected" && (
                  <>
                    <button
                      onClick={() => handleApproveClick(selectedBooking)}
                      className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Booking
                    </button>
                    <button
                      onClick={() => handleRejectClick(selectedBooking)}
                      className="w-full h-11 px-4 rounded-xl border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Booking
                    </button>
                  </>
                )}
                {activeTab === "rejected" &&
                  selectedBooking.resolutionStatus === "resolved" && (
                    <button
                      onClick={() =>
                        handleReviewForApprovalClick(selectedBooking)
                      }
                      className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review for Approval
                    </button>
                  )}
                <button
                  onClick={handleBackToList}
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-[#334155] font-medium transition-all"
                >
                  Back to List
                </button>
              </div>
            </div>

            {/* Right Column - Itinerary */}
            <div className="col-span-2">
              {selectedBooking.itineraryDetails &&
              selectedBooking.itineraryDetails.length > 0 ? (
                <ItineraryDetailDisplay
                  itinerary={selectedBooking.itineraryDetails}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
                  <MapPin className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                    No Itinerary Available
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    The itinerary details for this booking are not yet
                    available.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dialogs for Detail View */}
          <ConfirmationModal
            open={isApproveDialogOpen}
            onOpenChange={setIsApproveDialogOpen}
            title="Approve Booking"
            description="This booking will be moved to active bookings."
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            iconGradient="bg-gradient-to-br from-[#10B981] to-[#34D399]"
            iconShadow="shadow-[#10B981]/20"
            contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.12)]"
            contentBorder="border-[rgba(16,185,129,0.2)]"
            content={
              <p className="text-sm text-[#334155]">
                Approve booking for{" "}
                <span className="font-semibold text-[#10B981]">
                  {selectedBooking.customer}
                </span>
                ?
              </p>
            }
            onConfirm={handleApproveConfirm}
            onCancel={() => setIsApproveDialogOpen(false)}
            confirmText="Approve Booking"
            cancelText="Cancel"
            confirmVariant="success"
          />

          <Dialog
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8787] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  Reject Booking
                </DialogTitle>
                <DialogDescription>
                  Provide a reason for rejection and specify what the client
                  must do to resolve this issue.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 px-8 py-6">
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
                    className="min-h-[80px] border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
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
                    className="min-h-[80px] border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
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
                  }}
                  className="border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectConfirm}
                  disabled={
                    !rejectionReason.trim() || !rejectionResolution.trim()
                  }
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF3B3B]"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isUnresolveDialogOpen}
            onOpenChange={setIsUnresolveDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#FFB84D] flex items-center justify-center shadow-lg shadow-[#FF9800]/20">
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
                    className="min-h-[80px] border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
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
                    className="min-h-[80px] border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
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
                  }}
                  className="border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUnresolveConfirm}
                  disabled={
                    !rejectionReason.trim() || !rejectionResolution.trim()
                  }
                  className="bg-gradient-to-r from-[#FF9800] to-[#FFB84D] hover:from-[#FF8C00] hover:to-[#FFA836]"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark Unresolved
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ConfirmationModal
            open={isReviewForApprovalDialogOpen}
            onOpenChange={setIsReviewForApprovalDialogOpen}
            title="Review for Approval"
            description="Move this resolved rejected booking back to pending approvals for reconsideration."
            icon={<RotateCcw className="w-5 h-5 text-white" />}
            iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
            iconShadow="shadow-[#0A7AFF]/20"
            contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)]"
            contentBorder="border-[rgba(10,122,255,0.2)]"
            content={
              <p className="text-sm text-[#334155]">
                Move booking for{" "}
                <span className="font-semibold text-[#0A7AFF]">
                  {selectedBooking.customer}
                </span>{" "}
                back to pending approvals?
              </p>
            }
            onConfirm={handleReconsiderApproval}
            onCancel={() => setIsReviewForApprovalDialogOpen(false)}
            confirmText="Review for Approval"
            cancelText="Cancel"
            confirmVariant="default"
          />
        </div>
      </>
    );
  }

  // List view
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: highlightAnimation }} />
      <div>
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB]">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-5 h-11 text-sm transition-colors ${
              activeTab === "all"
                ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
                : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange("byDate")}
            className={`px-5 h-11 text-sm transition-colors ${
              activeTab === "byDate"
                ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
                : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
            }`}
          >
            By Date
          </button>
          <button
            onClick={() => handleTabChange("rejected")}
            className={`px-5 h-11 text-sm transition-colors ${
              activeTab === "rejected"
                ? "font-semibold text-[#FF6B6B] border-b-[3px] border-[#FF6B6B] -mb-[2px]"
                : "font-medium text-[#64748B] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)]"
            }`}
          >
            Rejected Bookings
          </button>
        </div>

        <ContentCard
          title={
            activeTab === "rejected"
              ? `Rejected Bookings (${totalItems})`
              : `Pending Approvals (${totalItems})`
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
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#64748B]">
                  {activeTab === "rejected"
                    ? "No rejected bookings"
                    : "No pending bookings to display"}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking, index) => (
                <div
                  key={`${booking.id}-${index}`}
                  ref={(el) => (bookingRefs.current[booking.id] = el)}
                  className="p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(10,122,255,0.1)] cursor-pointer"
                  onClick={() => handleViewDetails(booking.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center">
                        <span className="text-white text-lg">🎫</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg text-[#1A2B4F] font-semibold">
                            Booking #{booking.id.substring(0, 8)}...
                          </h3>
                          {booking.bookingType && (
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                                booking.bookingType === "CUSTOMIZED"
                                  ? "bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border-[rgba(139,92,246,0.2)]"
                                  : booking.bookingType === "STANDARD"
                                  ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]"
                                  : "bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]"
                              }`}
                            >
                              {capitalize(booking.bookingType)}
                            </span>
                          )}
                          {booking.tourType && (
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                                booking.tourType === "Joiner"
                                  ? "bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]"
                                  : "bg-[rgba(167,139,250,0.1)] text-[#A78BFA] border-[rgba(167,139,250,0.2)]"
                              }`}
                            >
                              {capitalize(booking.tourType)}
                            </span>
                          )}
                          {activeTab === "rejected" && (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] text-xs font-medium border border-[rgba(255,107,107,0.2)]">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                              {booking.resolutionStatus === "resolved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] text-xs font-medium border border-[rgba(16,185,129,0.2)]">
                                  <CheckCircle className="w-3 h-3" />
                                  Resolved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(255,152,0,0.1)] text-[#FF9800] text-xs font-medium border border-[rgba(255,152,0,0.2)]">
                                  <AlertTriangle className="w-3 h-3" />
                                  Unresolved
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <span>{booking.customer}</span>
                          <span>•</span>
                          <span>{booking.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(booking.id);
                      }}
                      className="h-9 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFB] hover:border-[#0A7AFF] text-[#334155] flex items-center gap-2 text-sm font-medium transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-5 gap-4 pt-4 border-t border-[#E5E7EB]">
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
                          {formatDateRange(booking.startDate, booking.endDate)}
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
                      <CreditCard className="w-4 h-4 text-[#10B981]" />
                      <div>
                        <p className="text-xs text-[#64748B]">Total Amount</p>
                        <p className="text-sm text-[#334155] font-medium">
                          {booking.total}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#64748B]" />
                      <div>
                        <p className="text-xs text-[#64748B]">Booked On</p>
                        <p className="text-sm text-[#334155] font-medium">
                          {booking.bookedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ContentCard>

        {/* Dialogs */}
        <ConfirmationModal
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
          title="Approve Booking"
          description="This booking will be moved to active bookings."
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#10B981] to-[#34D399]"
          iconShadow="shadow-[#10B981]/20"
          contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.12)]"
          contentBorder="border-[rgba(16,185,129,0.2)]"
          content={
            selectedBooking && (
              <p className="text-sm text-[#334155]">
                Approve booking for{" "}
                <span className="font-semibold text-[#10B981]">
                  {selectedBooking.customer}
                </span>
                ?
              </p>
            )
          }
          onConfirm={handleApproveConfirm}
          onCancel={() => setIsApproveDialogOpen(false)}
          confirmText="Approve Booking"
          cancelText="Cancel"
          confirmVariant="success"
        />
      </div>
    </>
  );
}
