import {
  Calendar,
  MapPin,
  User,
  Users,
  Eye,
  Edit,
  RotateCcw,
  X,
  CreditCard,
  CheckCircle2,
  Package,
  Clock,
  Download,
  AlertCircle,
  Loader2,
  Car,
  Briefcase,
  FileCheck,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button as ShadcnButton } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ConfirmationModal } from "../components/ConfirmationModal";
import {
  SearchFilterToolbar,
  SortOrder,
} from "../components/SearchFilterToolbar";
import { BookingFilterContent } from "../components/filters/BookingFilterContent";
import { ContentCard } from "../components/ContentCard";
import { ItineraryDetailDisplay } from "../components/ItineraryDetailDisplay";
import { StatCard } from "../components/StatCard";
import { formatDateRange } from "../App";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner";
import { useBreadcrumbs } from "../components/BreadcrumbContext";
import {
  exportToPDF,
  exportToExcel,
  exportBookingDetailToPDF,
  exportBookingDetailToExcel,
} from "../utils/exportUtils";
import {
  useAdminBookings,
  useBookingDetail,
  useUpdateBookingStatus,
  useUpdateBooking,
  useCancelBooking,
} from "../hooks/useBookings";
import { useUpdatePaymentStatus } from "../hooks/usePayments";
import { queryKeys } from "../utils/lib/queryKeys";
import { capitalize } from "../utils/helpers/capitalize";
import { BookingDetailView } from "../components/BookingDetailView";
import { BookingListCard } from "../components/BookingListCard";
import { Booking } from "../types/types";

const transformBookingForCard = (booking: any): Booking => {
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
    paid: booking.paid,
    paymentStatus: booking.paymentStatus,
    bookedDate: booking.bookedDate,
    status: booking.status,
    bookingType: booking.bookingType,
    tourType: booking.tourType,
    rejectionReason: booking.rejectionReason,
    rejectionResolution: booking.rejectionResolution,
    resolutionStatus: booking.resolutionStatus,
    sentStatus: booking.sentStatus,
  };
};

interface BookingsProps {
  onMoveToApprovals: (booking: any) => void;
  onMoveToRequested: (booking: any) => void;
  onMoveToHistory: (
    booking: any,
    status: "completed" | "cancelled",
    cancellationReason?: string
  ) => void;
  onBookingsCountChange?: (count: number) => void;
}

export function Bookings({
  onMoveToApprovals,
  onMoveToRequested,
  onMoveToHistory,
  onBookingsCountChange,
}: BookingsProps) {
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();

  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    status: "BOOKED",
  });

  const [queryParams2, setQueryParams2] = useState({
    page: 1,
    limit: 10,
    status: "CONFIRMED",
  });

  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useAdminBookings(queryParams);

  const {
    data: bookingsData2,
    isLoading: isLoadingBookings2,
    isError: isBookingsError2,
    refetch: refetchBookings2,
  } = useAdminBookings(queryParams2);

  const mergedBookingsData = useMemo(() => {
    const bookedData = bookingsData?.data || [];
    const confirmedData = bookingsData2?.data || [];

    const uniqueBookings = new Map();

    bookedData.forEach((booking: any) => {
      uniqueBookings.set(booking.id, booking);
    });

    confirmedData.forEach((booking: any) => {
      if (!uniqueBookings.has(booking.id)) {
        uniqueBookings.set(booking.id, booking);
      }
    });

    return Array.from(uniqueBookings.values());
  }, [bookingsData?.data, bookingsData2?.data]);

  const isLoadingMergedBookings = isLoadingBookings || isLoadingBookings2;
  const isMergedBookingsError = isBookingsError || isBookingsError2;

  const refetchAllBookings = async () => {
    await Promise.all([refetchBookings(), refetchBookings2()]);
  };

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );

  const {
    data: bookingDetailData,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useBookingDetail(selectedBookingId || "", {
    enabled: !!selectedBookingId && viewMode === "detail",
    queryKey: queryKeys.bookings.detail(selectedBookingId!),
  });

  // Track loading states for specific actions
  const [isCompletingBooking, setIsCompletingBooking] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [isMovingToApprovals, setIsMovingToApprovals] = useState(false);
  const [isMovingToRequested, setIsMovingToRequested] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isRejectingPayment, setIsRejectingPayment] = useState(false);

  // Add error states
  const [actionError, setActionError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelDateFrom, setTravelDateFrom] = useState("");
  const [travelDateTo, setTravelDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingTravelDateFrom, setPendingTravelDateFrom] = useState("");
  const [pendingTravelDateTo, setPendingTravelDateTo] = useState("");
  const [pendingMinAmount, setPendingMinAmount] = useState("");
  const [pendingMaxAmount, setPendingMaxAmount] = useState("");

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(
    null
  );

  // Mutation loading states

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setPendingDateFrom(dateFrom);
      setPendingDateTo(dateTo);
      setPendingTravelDateFrom(travelDateFrom);
      setPendingTravelDateTo(travelDateTo);
      setPendingMinAmount(minAmount);
      setPendingMaxAmount(maxAmount);
    }

    setFilterOpen(open);
  };

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [moveToApprovalsDialogOpen, setMoveToApprovalsDialogOpen] =
    useState(false);
  const [moveToRequestedDialogOpen, setMoveToRequestedDialogOpen] =
    useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);
  const [bookingToComplete, setBookingToComplete] = useState<any>(null);
  const [bookingToMoveToApprovals, setBookingToMoveToApprovals] =
    useState<any>(null);
  const [bookingToMoveToRequested, setBookingToMoveToRequested] =
    useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [paymentDetailModalOpen, setPaymentDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    email: "",
    mobile: "",
    destination: "",
    startDate: "",
    endDate: "",
    travelers: "1",
  });

  const updateBookingStatus = useUpdateBookingStatus(selectedBookingId || "");
  const updateBooking = useUpdateBooking(selectedBookingId || "");
  const cancelBooking = useCancelBooking(selectedBookingId || "");
  const updatePaymentStatus = useUpdatePaymentStatus(selectedPayment?.id || "");

  // Helper function to reset all loading states
  const resetLoadingStates = () => {
    setIsCompletingBooking(false);
    setIsCancellingBooking(false);
    setIsMovingToApprovals(false);
    setIsMovingToRequested(false);
    setIsSavingEdit(false);
    setIsVerifyingPayment(false);
    setIsRejectingPayment(false);
    setActionError(null);
  };

  // Handle network errors globally
  useEffect(() => {
    const handleNetworkError = () => {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      }
    };

    window.addEventListener("offline", handleNetworkError);
    return () => window.removeEventListener("offline", handleNetworkError);
  }, []);

  const transformBooking = (apiBooking: any) => {
    const totalAmount = parseFloat(apiBooking.totalPrice) || 0;

    const startDate = apiBooking.startDate || apiBooking.itinerary?.startDate;
    const endDate = apiBooking.endDate || apiBooking.itinerary?.endDate;

    const customerName = apiBooking.customerName || "Unknown Customer";
    const customerEmail = apiBooking.customerEmail || "";
    const customerMobile = apiBooking.customerMobile || "N/A";

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
      paid: parseInt(apiBooking.userBudget) || 0,
      totalPaid: parseInt(apiBooking.totalPrice),
      paymentStatus: apiBooking.paymentStatus || "PENDING",
      bookedDate: apiBooking.bookedDateDisplay,
      bookedDateObj: new Date(apiBooking.bookedDate || apiBooking.createdAt),
      status: apiBooking.status,
      bookingType: apiBooking.type,
      tourType:
        apiBooking.tourType || apiBooking.itinerary?.tourType || "PRIVATE",
      rejectionReason: apiBooking.rejectionReason,
      rejectionResolution: apiBooking.rejectionResolution,
      resolutionStatus: apiBooking.isResolved ? "resolved" : "unresolved",
      sentStatus: apiBooking.itinerary?.sentStatus || "unsent", // Add this line
      paymentHistory: [],
      bookingSource: apiBooking.type,
      itineraryDetails: [],
    };
  };

  const bookings = mergedBookingsData.map(transformBooking);
  const selectedBooking = useMemo(() => {
    return bookingDetailData?.data
      ? transformBooking(bookingDetailData.data)
      : null;
  }, [bookingDetailData?.data]);

  useEffect(() => {
    if (viewMode === "detail" && selectedBooking) {
      setBreadcrumbs([
        { label: "Home", path: "/" },
        { label: "Bookings", path: "/bookings" },
        { label: `Booking ${selectedBooking.bookingCode}` },
      ]);
    } else {
      resetBreadcrumbs();
    }
  }, [viewMode, selectedBooking?.id, setBreadcrumbs, resetBreadcrumbs]);

  useEffect(() => {
    if (onBookingsCountChange && bookingsData?.meta?.total) {
      onBookingsCountChange(bookingsData.meta.total);
    }
  }, [bookingsData?.meta?.total, onBookingsCountChange]);

  useEffect(() => {
    const params: any = {
      ...queryParams,
      page: 1,
      status: "BOOKED",
    };

    if (searchQuery) {
      params.q = searchQuery;
    } else {
      delete params.q;
    }

    if (selectedTypeFilter) {
      params.type = selectedTypeFilter;
    } else {
      delete params.type;
    }

    if (dateFrom && dateTo) {
      params.dateFrom = dateFrom;
      params.dateTo = dateTo;
    } else {
      delete params.dateFrom;
      delete params.dateTo;
    }

    if (sortOrder === "newest") {
      params.sort = "createdAt:desc";
    } else if (sortOrder === "oldest") {
      params.sort = "createdAt:asc";
    } else {
      delete params.sort;
    }

    setQueryParams(params);
  }, [searchQuery, selectedTypeFilter, dateFrom, dateTo, sortOrder]);

  const getFilteredBookings = () => {
    let filtered = bookings;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (b) => b.paymentStatus?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    if (travelDateFrom || travelDateTo) {
      filtered = filtered.filter((b) => {
        const travelDate = new Date(b.startDate);
        if (travelDateFrom && travelDateTo) {
          return (
            travelDate >= new Date(travelDateFrom) &&
            travelDate <= new Date(travelDateTo)
          );
        } else if (travelDateFrom) {
          return travelDate >= new Date(travelDateFrom);
        } else if (travelDateTo) {
          return travelDate <= new Date(travelDateTo);
        }
        return true;
      });
    }

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

  const totalItems = bookingsData?.meta?.total || 0;
  const totalPages = bookingsData?.meta?.totalPages || 1;
  const currentPage = bookingsData?.meta?.page || 1;
  const itemsPerPage = bookingsData?.meta?.limit || 10;

  const indexOfFirstBooking = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastBooking = Math.min(currentPage * itemsPerPage, totalItems);

  const currentBookings = filteredBookings;

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
    (travelDateFrom || travelDateTo ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0);

  const getPendingPaymentsCount = (booking: any) => {
    if (!booking.paymentHistory) return 0;
    return booking.paymentHistory.filter((p: any) => p.status === "pending")
      .length;
  };

  const calculatePaymentProgress = (booking: any) => {
    const totalAmount = booking.totalAmount;
    const paidAmount = booking.totalPaid || 0;
    const balance = totalAmount - paidAmount;
    const progressPercent = Math.round((paidAmount / totalAmount) * 100);

    return { totalAmount, paidAmount, balance, progressPercent };
  };

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setViewMode("detail");
    resetLoadingStates();
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
    resetLoadingStates();
  };

  const handleEditBooking = (booking: any) => {
    setBookingToEdit(booking);

    const formatDateForInput = (dateStr: string | null) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    };

    setEditFormData({
      customerName: booking.customer || booking.customerName || "",
      email: booking.email || booking.customerEmail || "",
      mobile: booking.mobile || booking.customerMobile || "",
      destination: booking.destination || "",
      startDate: formatDateForInput(booking.startDate),
      endDate: formatDateForInput(booking.endDate),
      travelers: (booking.travelers || 1).toString(),
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!bookingToEdit) return;

    setIsSavingEdit(true);
    setActionError(null);

    try {
      await updateBooking.mutateAsync({
        customerName: editFormData.customerName,
        customerEmail: editFormData.email,
        customerMobile: editFormData.mobile,
        destination: editFormData.destination,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        travelers: parseInt(editFormData.travelers),
      });

      toast.success("Booking updated successfully!");
      setEditModalOpen(false);
      setBookingToEdit(null);
      setEditFormData({
        customerName: "",
        email: "",
        mobile: "",
        destination: "",
        startDate: "",
        endDate: "",
        travelers: "1",
      });
      await refetchAllBookings();
      if (selectedBookingId) {
        await refetchDetail();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCompleteClick = (booking: any) => {
    setBookingToComplete(booking);
    setCompleteDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!bookingToComplete) return;

    setIsCompletingBooking(true);
    setActionError(null);

    try {
      setSelectedBookingId(bookingToComplete.id);
      await updateBookingStatus.mutateAsync({
        status: "COMPLETED",
      });

      onMoveToHistory(bookingToComplete, "completed");
      toast.success("Booking marked as completed!");
      setCompleteDialogOpen(false);
      setBookingToComplete(null);

      await refetchAllBookings();
      if (viewMode === "detail") {
        handleBackToList();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to complete booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsCompletingBooking(false);
    }
  };

  const handleCancelClick = (booking: any) => {
    setBookingToCancel(booking);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setIsCancellingBooking(true);
    setActionError(null);

    try {
      setSelectedBookingId(bookingToCancel.id);
      await updateBookingStatus.mutateAsync({
        status: "CANCELLED",
        rejectionReason: cancellationReason,
      });

      onMoveToHistory(bookingToCancel, "cancelled", cancellationReason);
      toast.success("Booking cancelled successfully!");
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      setCancellationReason("");

      await refetchBookings();
      if (viewMode === "detail") {
        handleBackToList();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to cancel booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleMoveToApprovalsClick = (booking: any) => {
    setBookingToMoveToApprovals(booking);
    setMoveToApprovalsDialogOpen(true);
  };

  const handleConfirmMoveToApprovals = async () => {
    if (!bookingToMoveToApprovals) return;

    setIsMovingToApprovals(true);
    setActionError(null);

    try {
      setSelectedBookingId(bookingToMoveToApprovals.id);
      await updateBooking.mutateAsync({
        status: "PENDING",
      });

      onMoveToApprovals(bookingToMoveToApprovals);
      toast.success("Booking moved to approvals!");
      setMoveToApprovalsDialogOpen(false);
      setBookingToMoveToApprovals(null);

      await refetchBookings();
      if (viewMode === "detail") {
        handleBackToList();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to move booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsMovingToApprovals(false);
    }
  };

  const handleMoveToRequestedClick = (booking: any) => {
    setBookingToMoveToRequested(booking);
    setMoveToRequestedDialogOpen(true);
  };

  const handleConfirmMoveToRequested = async () => {
    if (!bookingToMoveToRequested) return;

    setIsMovingToRequested(true);
    setActionError(null);

    try {
      setSelectedBookingId(bookingToMoveToRequested.id);
      await updateBooking.mutateAsync({
        type: "REQUESTED",
        status: "DRAFT",
        sentStatus: "Unsent",
      });

      onMoveToRequested(bookingToMoveToRequested);
      toast.success("Booking moved to requested!");
      setMoveToRequestedDialogOpen(false);
      setBookingToMoveToRequested(null);

      await refetchBookings();
      if (viewMode === "detail") {
        handleBackToList();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to move booking";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsMovingToRequested(false);
    }
  };

  const handlePaymentItemClick = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentDetailModalOpen(true);
  };

  const handleVerifyPayment = async (payment: any) => {
    setIsVerifyingPayment(true);
    setActionError(null);

    try {
      await updatePaymentStatus.mutateAsync({
        status: "VERIFIED",
      });

      toast.success("Payment verified successfully!");
      setPaymentDetailModalOpen(false);
      await refetchBookings();
      if (selectedBookingId) {
        await refetchDetail();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to verify payment";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleRejectPayment = async (payment: any) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsRejectingPayment(true);
    setActionError(null);

    try {
      await updatePaymentStatus.mutateAsync({
        status: "REJECTED",
        rejectionReason: rejectionReason,
      });

      toast.success("Payment rejected successfully!");
      setVerificationModalOpen(false);
      setPaymentDetailModalOpen(false);
      setRejectionReason("");

      await refetchBookings();
      if (selectedBookingId) {
        await refetchDetail();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to reject payment";
      toast.error(errorMessage);
      setActionError(errorMessage);
    } finally {
      setIsRejectingPayment(false);
    }
  };

  const handleOpenVerificationModal = (payment: any) => {
    setSelectedPayment(payment);
    setVerificationModalOpen(true);
  };

  const handleFilterChange = () => {};

  const handleApplyFilters = () => {
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
    setTravelDateFrom(pendingTravelDateFrom);
    setTravelDateTo(pendingTravelDateTo);
    setMinAmount(pendingMinAmount);
    setMaxAmount(pendingMaxAmount);

    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPendingDateFrom("");
    setPendingDateTo("");
    setPendingTravelDateFrom("");
    setPendingTravelDateTo("");
    setPendingMinAmount("");
    setPendingMaxAmount("");
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[#10B981]/20";
      case "Partial":
        return "bg-[rgba(255,184,77,0.1)] text-[#FFB84D] border-[#FFB84D]/20";
      case "Unpaid":
        return "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[#FF6B6B]/20";
      default:
        return "bg-[#F8FAFB] text-[#64748B] border-[#E5E7EB]";
    }
  };

  const getPaymentVerificationStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[#10B981]/20";
      case "rejected":
        return "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[#FF6B6B]/20";
      case "pending":
      default:
        return "bg-[rgba(255,184,77,0.1)] text-[#FFB84D] border-[#FFB84D]/20";
    }
  };

  // Main loading states
  if (isLoadingMergedBookings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#0A7AFF]" />
        <p className="text-[#64748B]">Loading bookings...</p>
        <div className="w-64 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A7AFF] animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
      </div>
    );
  }

  if (isMergedBookingsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center p-6">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,107,107,0.1)] flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-[#FF6B6B]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
          Failed to load bookings
        </h3>
        <p className="text-sm text-[#64748B] mb-6 max-w-md">
          We couldn't load your bookings. This might be due to network issues or
          server problems.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetchBookings()}
            className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC] flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFB] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "detail") {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          {/* Back button skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E5E7EB] animate-pulse"></div>
            <div>
              <div className="h-6 w-48 bg-[#E5E7EB] rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-[#E5E7EB] rounded animate-pulse"></div>
            </div>
          </div>

          {/* Header skeleton */}
          <div className="rounded-2xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-3">
                <div className="h-8 w-64 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="h-5 w-5 bg-white/20 rounded-full animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-white/20 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
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
                  <div className="h-6 w-32 bg-[#E5E7EB] rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-3 w-20 bg-[#E5E7EB] rounded animate-pulse"></div>
                        <div className="h-4 w-40 bg-[#E5E7EB] rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="h-6 w-40 bg-[#E5E7EB] rounded animate-pulse mb-6"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="h-4 w-24 bg-[#E5E7EB] rounded animate-pulse mb-2"></div>
                    <div className="space-y-2">
                      {[...Array(2)].map((_, j) => (
                        <div
                          key={j}
                          className="h-12 bg-[#E5E7EB] rounded-lg animate-pulse"
                        ></div>
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

    if (isDetailError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-100 text-center p-6">
          <div className="w-20 h-20 rounded-full bg-[rgba(255,107,107,0.1)] flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-[#FF6B6B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
            Failed to load booking details
          </h3>
          <p className="text-sm text-[#64748B] mb-6">
            We couldn't load the details for this booking.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => refetchDetail()}
              className="px-4 py-2 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0865CC] flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFB] transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      );
    }

    if (!selectedBooking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-100 text-center p-6">
          <div className="w-20 h-20 rounded-full bg-[rgba(255,184,77,0.1)] flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-[#FFB84D]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
            Booking not found
          </h3>
          <p className="text-sm text-[#64748B] mb-6">
            The booking you're looking for doesn't exist or has been removed.
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
        actionButtons={
          <div className="space-y-3">
            {/* Error Display */}
            {actionError && (
              <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{actionError}</span>
                </div>
              </div>
            )}

            {/* Complete Booking Modal */}
            <ConfirmationModal
              open={completeDialogOpen}
              onOpenChange={(open) => {
                setCompleteDialogOpen(open);
                if (!open) setActionError(null);
              }}
              title="Mark Trip as Complete"
              description="Confirm that this trip has been successfully completed."
              icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              iconGradient="bg-gradient-to-br from-[#10B981] to-[#34D399]"
              iconShadow="shadow-[#10B981]/20"
              contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.12)]"
              contentBorder="border-[rgba(16,185,129,0.2)]"
              isLoading={isCompletingBooking}
              content={
                bookingToComplete && (
                  <div>
                    {actionError && (
                      <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] mb-4">
                        <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{actionError}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-[#334155]">
                      Are you sure you want to mark the trip for{" "}
                      <span className="font-semibold text-[#10B981]">
                        {bookingToComplete.customer}
                      </span>{" "}
                      as completed?
                    </p>
                  </div>
                )
              }
              onConfirm={handleConfirmComplete}
              onCancel={() => {
                setCompleteDialogOpen(false);
                setActionError(null);
              }}
              confirmText={
                isCompletingBooking ? "Completing..." : "Mark as Complete"
              }
              cancelText="Cancel"
              confirmVariant="success"
            />

            {/* Cancel Booking Modal */}
            <ConfirmationModal
              open={cancelDialogOpen}
              onOpenChange={(open) => {
                setCancelDialogOpen(open);
                if (!open) {
                  setActionError(null);
                }
              }}
              title="Cancel Booking"
              description="Confirm that you want to cancel this booking."
              icon={<X className="w-5 h-5 text-white" />}
              iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
              iconShadow="shadow-[#FF6B6B]/20"
              contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.08)] to-[rgba(255,107,107,0.12)]"
              contentBorder="border-[rgba(255,107,107,0.2)]"
              isLoading={isCancellingBooking}
              content={
                bookingToCancel && (
                  <>
                    {actionError && (
                      <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] mb-4">
                        <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{actionError}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-[#334155] mb-4">
                      Are you sure you want to cancel the booking for{" "}
                      <span className="font-semibold text-[#FF6B6B]">
                        {bookingToCancel.customer}
                      </span>
                      ?
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">
                          Booking ID
                        </p>
                        <p className="text-sm font-semibold text-[#0A7AFF]">
                          {bookingToCancel.bookingCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">
                          Destination
                        </p>
                        <p className="text-sm font-medium text-[#334155]">
                          {bookingToCancel.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">
                          Travel Date
                        </p>
                        <p className="text-sm font-medium text-[#334155]">
                          {formatDateRange(
                            bookingToCancel.startDate,
                            bookingToCancel.endDate
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">
                          Total Amount
                        </p>
                        <p className="text-sm font-semibold text-[#1A2B4F]">
                          ₱{bookingToCancel.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </>
                )
              }
              onConfirm={handleConfirmCancel}
              onCancel={() => {
                setCancelDialogOpen(false);
                setCancellationReason("");
                setActionError(null);
              }}
              confirmText={
                isCancellingBooking ? "Cancelling..." : "Cancel Booking"
              }
              cancelText="Go Back"
              confirmVariant="destructive"
            />

            {/* Move to Approvals Modal */}
            <ConfirmationModal
              open={moveToApprovalsDialogOpen}
              onOpenChange={(open) => {
                setMoveToApprovalsDialogOpen(open);
                if (!open) setActionError(null);
              }}
              title="Move to Approvals"
              description="This booking will be moved to the Approvals page for review."
              icon={<RotateCcw className="w-5 h-5 text-white" />}
              iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
              iconShadow="shadow-[#0A7AFF]/20"
              contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)]"
              contentBorder="border-[rgba(10,122,255,0.2)]"
              isLoading={isMovingToApprovals}
              content={
                bookingToMoveToApprovals && (
                  <div className="">
                    {actionError && (
                      <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] mb-4">
                        <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{actionError}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A7AFF]/10 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <p className="text-sm text-[#334155] leading-relaxed mb-4">
                        Move booking for{" "}
                        <span className="font-semibold text-[#0A7AFF]">
                          {bookingToMoveToApprovals.customer}
                        </span>{" "}
                        to Requested Itinerary tab?
                      </p>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">
                            Booking ID
                          </p>
                          <p className="text-sm font-semibold text-[#0A7AFF]">
                            {bookingToMoveToApprovals.bookingCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">
                            Destination
                          </p>
                          <p className="text-sm font-medium text-[#334155]">
                            {bookingToMoveToApprovals.destination}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">
                            Travel Date
                          </p>
                          <p className="text-sm font-medium text-[#334155]">
                            {formatDateRange(
                              bookingToMoveToApprovals.startDate,
                              bookingToMoveToApprovals.endDate
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">
                            Total Amount
                          </p>
                          <p className="text-sm font-semibold text-[#1A2B4F]">
                            ₱
                            {bookingToMoveToApprovals.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              onConfirm={handleConfirmMoveToApprovals}
              onCancel={() => {
                setMoveToApprovalsDialogOpen(false);
                setActionError(null);
              }}
              confirmText={
                isMovingToApprovals ? "Moving..." : "Move to Approvals"
              }
              cancelText="Cancel"
              confirmVariant="default"
            />

            {/* Move to Requested Modal */}
            <Dialog
              open={moveToRequestedDialogOpen}
              onOpenChange={setMoveToRequestedDialogOpen}
            >
              <DialogContent className="sm:max-w-125">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    Move to Requested #{bookingToMoveToRequested?.bookingCode}
                  </DialogTitle>
                  <DialogDescription>
                    This booking will be moved to the Requested tab in Itinerary
                    page.
                  </DialogDescription>
                </DialogHeader>

                {bookingToMoveToRequested && (
                  <div className="px-8 py-6">
                    <div className="bg-linear-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)] border border-[rgba(10,122,255,0.2)] rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A7AFF]/10 rounded-full blur-3xl"></div>
                      <div className="relative">
                        <p className="text-sm text-[#334155] leading-relaxed mb-4">
                          Move booking for{" "}
                          <span className="font-semibold text-[#0A7AFF]">
                            {bookingToMoveToRequested.customer}
                          </span>{" "}
                          to Requested Itinerary tab?
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                          <div>
                            <p className="text-xs text-[#64748B] mb-1">
                              Booking ID
                            </p>
                            <p className="text-sm font-semibold text-[#0A7AFF]">
                              {bookingToMoveToRequested.bookingCode}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748B] mb-1">
                              Destination
                            </p>
                            <p className="text-sm font-medium text-[#334155]">
                              {bookingToMoveToRequested.destination}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748B] mb-1">
                              Travel Date
                            </p>
                            <p className="text-sm font-medium text-[#334155]">
                              {formatDateRange(
                                bookingToMoveToRequested.startDate,
                                bookingToMoveToRequested.endDate
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748B] mb-1">
                              Total Amount
                            </p>
                            <p className="text-sm font-semibold text-[#1A2B4F]">
                              ₱
                              {bookingToMoveToRequested.totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <ShadcnButton
                    variant="outline"
                    onClick={() => setMoveToRequestedDialogOpen(false)}
                    className="h-11 px-6 rounded-xl border-[#E5E7EB] hover:bg-[#F8FAFB]"
                  >
                    Cancel
                  </ShadcnButton>
                  <ShadcnButton
                    onClick={handleConfirmMoveToRequested}
                    className="h-11 px-6 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] hover:from-[#0865CC] hover:to-[#0F9B8E] shadow-lg shadow-[#0A7AFF]/25 text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Move to Requested
                  </ShadcnButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Booking Modal */}
            <ConfirmationModal
              open={editModalOpen}
              onOpenChange={(open) => {
                setEditModalOpen(open);
                if (!open) setActionError(null);
              }}
              title="Edit Booking"
              description="Update the booking details for this standard itinerary."
              icon={<Edit className="w-5 h-5 text-white" />}
              iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
              iconShadow="shadow-[#0A7AFF]/20"
              contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.05)] to-[rgba(20,184,166,0.05)]"
              contentBorder="border-[rgba(10,122,255,0.2)]"
              isLoading={isSavingEdit}
              content={
                <div className="space-y-4">
                  {actionError && (
                    <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                      <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{actionError}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label
                      htmlFor="edit-customerName"
                      className="text-[#1A2B4F] mb-2 block"
                    >
                      Customer Name <span className="text-[#FF6B6B]">*</span>
                    </Label>
                    <Input
                      id="edit-customerName"
                      value={editFormData.customerName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          customerName: e.target.value,
                        })
                      }
                      placeholder="Enter customer name"
                      className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                      disabled={isSavingEdit}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-email"
                      className="text-[#1A2B4F] mb-2 block"
                    >
                      Email Address <span className="text-[#FF6B6B]">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      placeholder="customer@email.com"
                      className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                      disabled={isSavingEdit}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-mobile"
                      className="text-[#1A2B4F] mb-2 block"
                    >
                      Mobile Number <span className="text-[#FF6B6B]">*</span>
                    </Label>
                    <Input
                      id="edit-mobile"
                      type="tel"
                      value={editFormData.mobile}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          mobile: e.target.value,
                        })
                      }
                      placeholder="+63 9XX XXX XXXX"
                      className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                      disabled={isSavingEdit}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="edit-startDate"
                        className="text-[#1A2B4F] mb-2 block"
                      >
                        Travel Start Date{" "}
                        <span className="text-[#FF6B6B]">*</span>
                      </Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            startDate: e.target.value,
                          })
                        }
                        className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                        disabled={isSavingEdit}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="edit-endDate"
                        className="text-[#1A2B4F] mb-2 block"
                      >
                        Travel End Date{" "}
                        <span className="text-[#FF6B6B]">*</span>
                      </Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            endDate: e.target.value,
                          })
                        }
                        className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                        disabled={isSavingEdit}
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-travelers"
                      className="text-[#1A2B4F] mb-2 block"
                    >
                      Number of Travelers{" "}
                      <span className="text-[#FF6B6B]">*</span>
                    </Label>
                    <Input
                      id="edit-travelers"
                      type="number"
                      min="1"
                      value={editFormData.travelers}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          travelers: e.target.value,
                        })
                      }
                      className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                      disabled={isSavingEdit}
                    />
                  </div>
                </div>
              }
              onConfirm={handleSaveEdit}
              onCancel={() => {
                setEditModalOpen(false);
                setBookingToEdit(null);
                setEditFormData({
                  customerName: "",
                  email: "",
                  mobile: "",
                  destination: "",
                  startDate: "",
                  endDate: "",
                  travelers: "1",
                });
                setActionError(null);
              }}
              confirmText={isSavingEdit ? "Saving..." : "Save Changes"}
              cancelText="Cancel"
              confirmVariant="default"
            />

            {/* Export Buttons */}
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
                      selectedBooking.startDate,
                      selectedBooking.endDate
                    ),
                    travelers: selectedBooking.travelers,
                    total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                    bookedDate: selectedBooking.bookedDate,
                    status: selectedBooking.status,
                  };
                  exportBookingDetailToPDF(
                    bookingData,
                    selectedBooking.itineraryDetails
                  );
                  toast.success("Exporting booking as PDF...");
                }}
                className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#FF6B6B] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      selectedBooking.startDate,
                      selectedBooking.endDate
                    ),
                    travelers: selectedBooking.travelers,
                    total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                    bookedDate: selectedBooking.bookedDate,
                    status: selectedBooking.status,
                  };
                  exportBookingDetailToExcel(
                    bookingData,
                    selectedBooking.itineraryDetails
                  );
                  toast.success("Exporting booking as Excel...");
                }}
                className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#10B981] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>

            {/* Edit/Move Buttons */}
            {false ? (
              <button
                onClick={() => handleEditBooking(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isLoadingDetail}
              >
                {isSavingEdit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                {isSavingEdit ? "Saving..." : "Edit Booking"}
              </button>
            ) : true ? (
              <button
                onClick={() => handleMoveToRequestedClick(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isLoadingDetail || isMovingToRequested}
              >
                {isMovingToRequested ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                {isMovingToRequested ? "Moving..." : "Move to Requested"}
              </button>
            ) : (
              <button
                onClick={() => handleMoveToApprovalsClick(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isLoadingDetail || isMovingToApprovals}
              >
                {isMovingToApprovals ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {isMovingToApprovals ? "Moving..." : "Move to Approvals"}
              </button>
            )}

            {/* Complete Button */}
            {selectedBooking.status !== "COMPLETED" && (
              <button
                onClick={() => handleCompleteClick(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={isLoadingDetail || isCompletingBooking}
              >
                {isCompletingBooking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isCompletingBooking ? "Completing..." : "Mark as Complete"}
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={() => handleCancelClick(selectedBooking)}
              className="w-full h-11 px-4 rounded-xl border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoadingDetail || isCancellingBooking}
            >
              {isCancellingBooking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {isCancellingBooking ? "Cancelling..." : "Cancel Booking"}
            </button>
          </div>
        }
        breadcrumbPage="Bookings"
        isRequestedItinerary={false}
      />
    );
  }

  // List view
  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB]">
        {["all", "paid", "partial", "unpaid"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              handleFilterChange();
            }}
            disabled={isLoadingMergedBookings}
            className={`px-5 h-11 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedStatus === status
                ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-0.5"
                : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
            }`}
          >
            {status === "all"
              ? "All"
              : status === "paid"
              ? "Paid"
              : status === "partial"
              ? "Partial Payment"
              : "Unpaid"}
          </button>
        ))}
      </div>

      {/* Booking Type Stats - Show skeleton while loading */}
      {isLoadingMergedBookings ? (
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5E7EB] animate-pulse"></div>
                <div className="h-4 w-24 bg-[#E5E7EB] rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-[#E5E7EB] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div
            onClick={() =>
              setSelectedTypeFilter(selectedTypeFilter === null ? null : null)
            }
            className="cursor-pointer"
          >
            <StatCard
              icon={BookOpen}
              label="Active Bookings"
              value={filteredBookings.length}
              gradientFrom="#8B5CF6"
              gradientTo="#A78BFA"
              selected={selectedTypeFilter === null}
            />
          </div>
          <div
            onClick={() =>
              setSelectedTypeFilter(
                selectedTypeFilter === "CUSTOMIZED" ? null : "CUSTOMIZED"
              )
            }
            className="cursor-pointer"
          >
            <StatCard
              icon={Briefcase}
              label="Customized"
              value={customizedCount}
              gradientFrom="#0A7AFF"
              gradientTo="#3B9EFF"
              selected={selectedTypeFilter === "CUSTOMIZED"}
            />
          </div>
          <div
            onClick={() =>
              setSelectedTypeFilter(
                selectedTypeFilter === "STANDARD" ? null : "STANDARD"
              )
            }
            className="cursor-pointer"
          >
            <StatCard
              icon={FileCheck}
              label="Standard"
              value={standardCount}
              gradientFrom="#10B981"
              gradientTo="#14B8A6"
              selected={selectedTypeFilter === "STANDARD"}
            />
          </div>
          <div
            onClick={() =>
              setSelectedTypeFilter(
                selectedTypeFilter === "REQUESTED" ? null : "REQUESTED"
              )
            }
            className="cursor-pointer"
          >
            <StatCard
              icon={ClipboardList}
              label="Requested"
              value={requestedCount}
              gradientFrom="#FFB84D"
              gradientTo="#FF9800"
              selected={selectedTypeFilter === "REQUESTED"}
            />
          </div>
        </div>
      )}

      <ContentCard
        title={`Confirmed Bookings (${totalItems})`}
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
          searchPlaceholder="Search by booking ID, customer name, or destination..."
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
          }}
          sortOrder={sortOrder}
          onSortChange={(order) => {
            setSortOrder(order);
          }}
          filterOpen={filterOpen}
          onFilterOpenChange={setFilterOpen}
          activeFiltersCount={activeFiltersCount}
          filterContent={
            <BookingFilterContent
              dateFrom={pendingDateFrom}
              onDateFromChange={setPendingDateFrom}
              dateTo={pendingDateTo}
              onDateToChange={setPendingDateTo}
              travelDateFrom={pendingTravelDateFrom}
              onTravelDateFromChange={setPendingTravelDateFrom}
              travelDateTo={pendingTravelDateTo}
              onTravelDateToChange={setPendingTravelDateTo}
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
              startdate: new Date(booking.startDate).toLocaleDateString(),
              enddate: new Date(booking.endDate).toLocaleDateString(),
              travelers: `${booking.travelers} pax`,
              totalamount: `₱${booking.totalAmount.toLocaleString()}`,
              paymentstatus: booking.paymentStatus,
              bookingtype: booking.bookingType || "N/A",
              status: booking.status,
            }));
            exportToPDF(exportData, "Bookings Report", [
              "ID",
              "Customer",
              "Email",
              "Mobile",
              "Destination",
              "Start Date",
              "End Date",
              "Travelers",
              "Total Amount",
              "Payment Status",
              "Booking Type",
              "Status",
            ]);
            toast.success("Exporting bookings as PDF...");
          }}
          onExportExcel={() => {
            const exportData = filteredBookings.map((booking) => ({
              id: booking.id,
              customer: booking.customer,
              email: booking.email,
              mobile: booking.mobile,
              destination: booking.destination,
              startdate: new Date(booking.startDate).toLocaleDateString(),
              enddate: new Date(booking.endDate).toLocaleDateString(),
              travelers: `${booking.travelers} pax`,
              totalamount: `₱${booking.totalAmount.toLocaleString()}`,
              paymentstatus: booking.paymentStatus,
              bookingtype: booking.bookingType || "N/A",
              status: booking.status,
            }));
            exportToExcel(exportData, "Bookings Report", [
              "ID",
              "Customer",
              "Email",
              "Mobile",
              "Destination",
              "Start Date",
              "End Date",
              "Travelers",
              "Total Amount",
              "Payment Status",
              "Booking Type",
              "Status",
            ]);
            toast.success("Exporting bookings as Excel...");
          }}
        />

        {/* Bookings List */}
        <div className="space-y-4">
          {isLoadingMergedBookings ? (
            // Skeleton loading for bookings list
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border-2 border-[#E5E7EB] animate-pulse"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#E5E7EB]"></div>
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-[#E5E7EB] rounded"></div>
                      <div className="h-4 w-32 bg-[#E5E7EB] rounded"></div>
                    </div>
                  </div>
                  <div className="h-9 w-28 bg-[#E5E7EB] rounded-xl"></div>
                </div>
                <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
                  <div className="h-4 w-64 bg-[#E5E7EB] rounded"></div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-3 w-16 bg-[#E5E7EB] rounded"></div>
                      <div className="h-4 w-24 bg-[#E5E7EB] rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[rgba(10,122,255,0.1)] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#0A7AFF]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                No confirmed bookings found
              </h3>
              <p className="text-sm text-[#64748B] mb-6">
                {searchQuery || activeFiltersCount > 0
                  ? "Try adjusting your search or filters"
                  : "All confirmed bookings will appear here"}
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    handleResetFilters();
                    setDateFrom("");
                    setDateTo("");
                    setTravelDateFrom("");
                    setTravelDateTo("");
                    setMinAmount("");
                    setMaxAmount("");
                    setSelectedStatus("all");
                    setSelectedTypeFilter(null);
                  }}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFB] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div key={booking.id} id={`booking-${booking.id}`}>
                <BookingListCard
                  booking={transformBookingForCard(booking)}
                  onViewDetails={handleViewDetails}
                  context="active"
                  showViewDetailsButton={true}
                  highlightOnClick={true}
                />
              </div>
            ))
          )}
        </div>
      </ContentCard>

      {/* Payment Detail Modal */}
      <Dialog
        open={paymentDetailModalOpen}
        onOpenChange={(open: any) => {
          setPaymentDetailModalOpen(open);
          if (!open) setActionError(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0A7AFF]" />
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {actionError && (
                <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                  <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{actionError}</span>
                  </div>
                </div>
              )}
              <div className="bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] rounded-xl p-4 text-white">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedPayment.paymentType}
                    </h3>
                    <p className="text-sm text-white/80">
                      {new Date(
                        selectedPayment.submittedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Amount</p>
                    <p className="text-2xl font-bold">
                      ₱{selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPayment.proofOfPayment && (
                <div>
                  <Label>Proof of Payment</Label>
                  <img
                    src={selectedPayment.proofOfPayment}
                    alt="Proof of payment"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {selectedPayment.status === "pending" && (
                <div className="flex gap-3">
                  <ShadcnButton
                    onClick={() => handleVerifyPayment(selectedPayment)}
                    className="flex-1"
                    disabled={isVerifyingPayment}
                  >
                    {isVerifyingPayment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {isVerifyingPayment ? "Verifying..." : "Verify Payment"}
                  </ShadcnButton>
                  <ShadcnButton
                    variant="destructive"
                    onClick={() => handleOpenVerificationModal(selectedPayment)}
                    className="flex-1"
                    disabled={isRejectingPayment}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Payment
                  </ShadcnButton>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Rejection Modal */}
      <Dialog
        open={verificationModalOpen}
        onOpenChange={(open: any) => {
          setVerificationModalOpen(open);
          if (!open) {
            setRejectionReason("");
            setActionError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#FF6B6B]" />
              Reject Payment
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionError && (
              <div className="p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                <div className="flex items-center gap-2 text-[#FF6B6B] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{actionError}</span>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={isRejectingPayment}
              />
            </div>
          </div>

          <DialogFooter>
            <ShadcnButton
              variant="outline"
              onClick={() => {
                setVerificationModalOpen(false);
                setRejectionReason("");
                setActionError(null);
              }}
              disabled={isRejectingPayment}
            >
              Cancel
            </ShadcnButton>
            <ShadcnButton
              variant="destructive"
              onClick={() =>
                selectedPayment && handleRejectPayment(selectedPayment)
              }
              disabled={!rejectionReason.trim() || isRejectingPayment}
            >
              {isRejectingPayment ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {isRejectingPayment ? "Rejecting..." : "Reject Payment"}
            </ShadcnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
