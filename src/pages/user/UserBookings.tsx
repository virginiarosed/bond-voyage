import {
  Calendar,
  MapPin,
  User,
  Users,
  Eye,
  DollarSign,
  Clock,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  BookOpen,
  Briefcase,
  FileCheck,
  ClipboardList,
  Download,
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBreadcrumbs } from "../../components/BreadcrumbContext";
import { useBookingDetail, useMyBookings } from "../../hooks/useBookings";
import { formatDateRange } from "../../App";
import { ContentCard } from "../../components/ContentCard";
import { ItineraryDetailDisplay } from "../../components/ItineraryDetailDisplay";
import { StatCard } from "../../components/StatCard";
import { capitalize } from "../../utils/helpers/capitalize";
import { queryKeys } from "../../utils/lib/queryKeys";

export function UserBookings() {
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();

  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
  });

  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch,
  } = useMyBookings(queryParams);

  // Local state for UI
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(
    null
  );

  // Fetch detailed booking when in detail view
  const { data: bookingDetailData, isLoading: isLoadingDetail } =
    useBookingDetail(selectedBookingId || "", {
      enabled: !!selectedBookingId && viewMode === "detail",
      queryKey: [queryKeys.bookings.detail],
    });

  // Transform API data
  const transformBooking = (apiBooking: any) => {
    const totalAmount =
      parseFloat(apiBooking.total?.replace(/[₱,]/g, "") || apiBooking.total) ||
      0;

    const dates = apiBooking.dates?.split(" - ") || [];
    const startDate = dates[0];
    const endDate = dates[1] || startDate;

    let paymentStatus = "Unpaid";
    let totalPaid = 0;

    return {
      id: apiBooking.id,
      customer: apiBooking.customer || "Unknown Customer",
      email: apiBooking.email || "",
      mobile: apiBooking.mobile || "N/A",
      destination: apiBooking.destination,
      startDate: startDate,
      endDate: endDate,
      travelers: apiBooking.travelers,
      totalAmount: totalAmount,
      paid: totalPaid,
      paymentStatus: paymentStatus,
      bookedDate: apiBooking.bookedDate,
      status: apiBooking.statusBadges,
      bookingType: apiBooking.bookingType,
      tourType: apiBooking.tourType,
      itineraryDetails: apiBooking.itenerary,
    };
  };

  const transformDetailedBooking = (apiBooking: any) => {
    const totalAmount = parseFloat(apiBooking.totalPrice) || 0;

    const verifiedPayments =
      apiBooking.payments?.filter((p: any) => p.status === "VERIFIED") || [];
    const totalPaid = verifiedPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount),
      0
    );

    let paymentStatus = "Unpaid";
    if (totalPaid >= totalAmount) {
      paymentStatus = "Paid";
    } else if (totalPaid > 0) {
      paymentStatus = "Partial";
    }

    return {
      id: apiBooking.id,
      customer:
        `${apiBooking.user?.firstName || ""} ${
          apiBooking.user?.lastName || ""
        }`.trim() || "Unknown Customer",
      email: apiBooking.user?.email || "",
      mobile: "N/A",
      destination: apiBooking.destination,
      startDate: apiBooking.startDate,
      endDate: apiBooking.endDate,
      travelers: apiBooking.travelers,
      totalAmount: totalAmount,
      paid: totalPaid,
      paymentStatus: paymentStatus,
      bookedDate: apiBooking.createdAt,
      status: apiBooking.status,
      bookingType: apiBooking.type,
      tourType: apiBooking.tourType,
      paymentHistory:
        apiBooking.payments?.map((p: any) => ({
          id: p.id,
          paymentType: p.type === "FULL" ? "Full Payment" : "Partial Payment",
          amount: parseFloat(p.amount),
          modeOfPayment: p.method === "GCASH" ? "Gcash" : "Cash",
          proofOfPayment: p.proofImage
            ? `data:${p.proofMimeType};base64,${btoa(
                String.fromCharCode(...p.proofImage.data)
              )}`
            : undefined,
          submittedAt: p.createdAt,
          status: p.status?.toLowerCase(),
          transactionId: p.transactionId,
        })) || [],
      totalPaid: totalPaid,
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

  const bookings = bookingsData?.data?.map(transformBooking) || [];
  const selectedBooking = useMemo(() => {
    return bookingDetailData?.data
      ? transformDetailedBooking(bookingDetailData.data)
      : null;
  }, [bookingDetailData?.data?.id]);

  // Update breadcrumbs
  useEffect(() => {
    if (viewMode === "detail" && selectedBooking) {
      setBreadcrumbs([
        { label: "Home", path: "/" },
        { label: "My Bookings", path: "/user/bookings" },
        { label: `Booking ${selectedBooking.id.substring(0, 8)}` },
      ]);
    } else {
      resetBreadcrumbs();
    }
  }, [viewMode, selectedBooking?.id, setBreadcrumbs, resetBreadcrumbs]);

  // Filter bookings
  const getFilteredBookings = () => {
    let filtered = bookings;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (b) => b.paymentStatus?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    if (selectedTypeFilter) {
      filtered = filtered.filter((b) => b.bookingType === selectedTypeFilter);
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

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

  // Calculate payment progress
  const calculatePaymentProgress = (booking: any) => {
    const totalAmount = booking.totalAmount;
    const paidAmount = booking.totalPaid || 0;
    const balance = totalAmount - paidAmount;
    const progressPercent = Math.round((paidAmount / totalAmount) * 100);

    return { totalAmount, paidAmount, balance, progressPercent };
  };

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
    if (selectedTypeFilter === type) {
      setSelectedTypeFilter(null);
    } else {
      setSelectedTypeFilter(type);
    }
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

  const getTabLabel = () => {
    switch (selectedStatus) {
      case "all":
        return "Active Bookings";
      case "paid":
        return "Paid Bookings";
      case "partial":
        return "Partial Bookings";
      case "unpaid":
        return "Unpaid Bookings";
      default:
        return "Bookings";
    }
  };

  const getTabColor = () => {
    switch (selectedStatus) {
      case "paid":
        return { from: "#10B981", to: "#14B8A6" };
      case "partial":
        return { from: "#FF9800", to: "#FFB84D" };
      case "unpaid":
        return { from: "#FF6B6B", to: "#FF8C8C" };
      default:
        return { from: "#0A7AFF", to: "#3B9EFF" };
    }
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

    const { totalAmount, paidAmount, balance, progressPercent } =
      calculatePaymentProgress(selectedBooking);

    return (
      <div className="space-y-6">
        {/* Booking Header Card */}
        <div className="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold mb-2">
                {selectedBooking.destination}
              </h1>
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
              <DollarSign className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">Total Amount</p>
              <p className="font-medium">
                ₱{selectedBooking.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Clock className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">Booked On</p>
              <p className="font-medium">{selectedBooking.bookedDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Customer & Payment Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#1A2B4F]">
                    Your Information
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

            {/* Payment Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden">
              <div className="relative p-6 border-b border-[#E5E7EB]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A2B4F] text-lg">
                      Payment Summary
                    </h3>
                    <p className="text-sm text-[#64748B]">
                      Track your payment progress
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-[#F8FAFB] to-[#F1F5F9] rounded-2xl p-5 border border-[#E5E7EB]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Total Package Cost
                      </span>
                      <span className="font-bold text-[#1A2B4F] text-lg">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Amount Paid
                      </span>
                      <span className="font-bold text-[#10B981] text-lg">
                        ₱{paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                        <span className="text-sm font-medium text-[#1A2B4F]">
                          Outstanding Balance
                        </span>
                      </div>
                      <span className="font-bold text-[#EF4444] text-lg">
                        ₱{balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-[#64748B]">Progress</span>
                    <span className="text-xs font-medium text-[#1A2B4F]">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <button
                onClick={handleBackToList}
                className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-[#334155] font-medium transition-all"
              >
                Back to My Bookings
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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b-2 border-[#E5E7EB]">
        <button
          onClick={() => setSelectedStatus("all")}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "all"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedStatus("paid")}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "paid"
              ? "font-semibold text-[#10B981] border-b-[3px] border-[#10B981] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setSelectedStatus("partial")}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "partial"
              ? "font-semibold text-[#FF9800] border-b-[3px] border-[#FF9800] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#FF9800] hover:bg-[rgba(255,152,0,0.05)]"
          }`}
        >
          Partial Payment
        </button>
        <button
          onClick={() => setSelectedStatus("unpaid")}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "unpaid"
              ? "font-semibold text-[#FF6B6B] border-b-[3px] border-[#FF6B6B] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)]"
          }`}
        >
          Unpaid
        </button>
      </div>

      {/* Booking Type Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div
          onClick={() => {
            handleStatCardClick(null);
            setQueryParams((prev) => ({ ...prev, type: null }));
          }}
          className="cursor-pointer"
        >
          <StatCard
            icon={BookOpen}
            label={getTabLabel()}
            value={filteredBookings.length}
            gradientFrom={getTabColor().from}
            gradientTo={getTabColor().to}
            selected={selectedTypeFilter === null}
          />
        </div>
        <div
          onClick={() => {
            handleStatCardClick("CUSTOMIZED");
            setQueryParams((prev) => ({ ...prev, type: "CUSTOMIZED" }));
          }}
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
          onClick={() => {
            handleStatCardClick("STANDARD");
            setQueryParams((prev) => ({ ...prev, type: "STANDARD" }));
          }}
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
          onClick={() => {
            handleStatCardClick("REQUESTED");
            setQueryParams((prev) => ({ ...prev, type: "REQUESTED" }));
          }}
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

      {/* Bookings List */}
      <ContentCard title={`Your Bookings (${filteredBookings.length})`}>
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                No bookings found
              </h3>
              <p className="text-sm text-[#64748B]">
                No {selectedStatus} bookings at the moment
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => handleViewDetails(booking.id)}
                className="p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(10,122,255,0.1)] cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center">
                      <span className="text-white text-lg">🎫</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg text-[#1A2B4F] font-semibold">
                          Booking #{booking.id.substring(0, 8)}...
                        </h3>
                        {booking.paymentStatus && (
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                              booking.paymentStatus
                            )}`}
                          >
                            {booking.paymentStatus}
                          </span>
                        )}
                        {booking.bookingType && (
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                              booking.bookingType === "CUSTOMIZED"
                                ? "bg-[rgba(255,127,110,0.1)] text-[#FF7F6E] border-[rgba(255,127,110,0.2)]"
                                : booking.bookingType === "STANDARD"
                                ? "bg-[rgba(139,125,107,0.1)] text-[#8B7D6B] border-[rgba(139,125,107,0.2)]"
                                : "bg-[rgba(236,72,153,0.1)] text-[#EC4899] border-[rgba(236,72,153,0.2)]"
                            }`}
                          >
                            {capitalize(booking.bookingType)}
                          </span>
                        )}
                        {booking.tourType && (
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                              booking.tourType === "JOINER"
                                ? "bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]"
                                : "bg-[rgba(167,139,250,0.1)] text-[#A78BFA] border-[rgba(167,139,250,0.2)]"
                            }`}
                          >
                            {capitalize(booking.tourType)}
                          </span>
                        )}
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

                {/* Customer Info */}
                <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#0A7AFF]" />
                    <span className="text-sm text-[#334155] font-medium">
                      {booking.customer}
                    </span>
                    <span className="text-sm text-[#64748B]">•</span>
                    <span className="text-sm text-[#64748B]">
                      {booking.email}
                    </span>
                    <span className="text-sm text-[#64748B]">•</span>
                    <span className="text-sm text-[#64748B]">
                      {booking.mobile}
                    </span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-5 gap-4 mb-5">
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
                    <span className="text-[#10B981] text-lg">₱</span>
                    <div>
                      <p className="text-xs text-[#64748B]">Paid / Total</p>
                      <p className="text-sm text-[#334155] font-medium">
                        ₱{booking.paid.toLocaleString()} / ₱
                        {booking.totalAmount.toLocaleString()}
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
    </div>
  );
}
