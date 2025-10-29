import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  RotateCcw,
  ChevronRight,
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
} from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { BookingListCard } from "../components/BookingListCard";
import { ItineraryDetailDisplay } from "../components/ItineraryDetailDisplay";
import { Pagination } from "../components/Pagination";
import { ConfirmationModal } from "../components/ConfirmationModal";
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
import { Input } from "../components/ui/input";
import type { ApprovalBooking } from "../App";
import { toast } from "sonner@2.0.3";
import { useBreadcrumbs } from "../components/BreadcrumbContext";

interface Booking extends ApprovalBooking {}

interface ApprovalsProps {
  pendingBookings: ApprovalBooking[];
  setPendingBookings: React.Dispatch<
    React.SetStateAction<ApprovalBooking[]>
  >;
}

type ItineraryDay = {
  day: number;
  title: string;
  activities: {
    time: string;
    icon: any;
    title: string;
    description: string;
    location?: string;
  }[];
};

export function Approvals({
  pendingBookings: initialPendingBookings,
  setPendingBookings: setParentPendingBookings,
}: ApprovalsProps) {
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const [activeTab, setActiveTab] = useState<
    "all" | "urgent" | "byDate" | "rejected"
  >("all");
  const [isRejectDialogOpen, setIsRejectDialogOpen] =
    useState(false);
  const [isUnresolveDialogOpen, setIsUnresolveDialogOpen] =
    useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] =
    useState(false);
  const [isReviewForApprovalDialogOpen, setIsReviewForApprovalDialogOpen] =
    useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionResolution, setRejectionResolution] =
    useState("");

  // Edit total amount state
  const [editingTotalAmount, setEditingTotalAmount] = useState(false);
  const [editedTotalAmount, setEditedTotalAmount] = useState("");

  // View state
  const [viewMode, setViewMode] = useState<"list" | "detail">(
    "list",
  );
  const [selectedBookingId, setSelectedBookingId] = useState<
    string | null
  >(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [pendingBookings, setPendingBookings] = useState<
    Booking[]
  >(initialPendingBookings);

  const [rejectedBookings, setRejectedBookings] = useState<
    Booking[]
  >([
    {
      id: "BV-2024-045",
      customer: "Ana Reyes",
      email: "ana.reyes@email.com",
      mobile: "+63 919 876 5432",
      destination: "Bohol, Tagbilaran",
      duration: "3 Days",
      dates: "February 10, 2024 – February 13, 2024",
      total: "₱15,750",
      urgent: false,
      rejectionReason: "Incomplete payment documentation",
      rejectionResolution:
        "Please submit proof of payment or valid payment method. Contact our support team for assistance.",
      resolutionStatus: "resolved",
    },
    {
      id: "BV-2024-032",
      customer: "Roberto Garcia",
      email: "roberto.garcia@email.com",
      mobile: "+63 920 345 6789",
      destination: "Coron, Palawan",
      duration: "6 Days",
      dates: "January 20, 2024 – January 26, 2024",
      total: "₱28,300",
      urgent: false,
      rejectionReason:
        "Invalid travel dates - destination unavailable during specified period",
      rejectionResolution:
        "Please select alternative dates. Our customer service will contact you with available options.",
      resolutionStatus: "unresolved",
    },
  ]);

  // Sync with parent when initialPendingBookings changes
  useEffect(() => {
    setPendingBookings(initialPendingBookings);
  }, [initialPendingBookings]);

  // Update breadcrumbs based on view mode
  useEffect(() => {
    if (viewMode === "detail" && selectedBookingId) {
      const currentBooking = [...pendingBookings, ...rejectedBookings].find(
        (b) => b.id === selectedBookingId
      );
      if (currentBooking) {
        setBreadcrumbs([
          { label: "Home", path: "/" },
          { label: "Approvals", path: "/approvals" },
          { label: `Booking ${currentBooking.id}` }
        ]);
      }
    } else {
      resetBreadcrumbs();
    }
  }, [viewMode, selectedBookingId, pendingBookings, rejectedBookings, setBreadcrumbs, resetBreadcrumbs]);

  // Itinerary data for detailed view
  const itineraryData: Record<string, ItineraryDay[]> = {
    "BV-2024-001": [
      {
        day: 1,
        title: "Arrival & Beach Sunset",
        activities: [
          {
            time: "10:00 AM",
            icon: Plane,
            title: "Arrival at Caticlan Airport",
            description: "Meet and greet with tour guide",
            location: "Caticlan Airport",
          },
          {
            time: "11:30 AM",
            icon: Car,
            title: "Transfer to Boracay",
            description: "Boat ride and van transfer to hotel",
            location: "D'Mall Area",
          },
          {
            time: "2:00 PM",
            icon: Hotel,
            title: "Check-in at Resort",
            description:
              "Check-in and settle at beachfront resort",
            location: "Station 2",
          },
          {
            time: "6:00 PM",
            icon: Camera,
            title: "Sunset at White Beach",
            description: "Witness the famous Boracay sunset",
            location: "White Beach",
          },
          {
            time: "8:00 PM",
            icon: UtensilsCrossed,
            title: "Welcome Dinner",
            description:
              "Seafood dinner at beachfront restaurant",
            location: "D'Mall Area",
          },
        ],
      },
      {
        day: 2,
        title: "Island Hopping Adventure",
        activities: [
          {
            time: "7:00 AM",
            icon: UtensilsCrossed,
            title: "Breakfast",
            description: "Breakfast at hotel restaurant",
            location: "Resort",
          },
          {
            time: "9:00 AM",
            icon: Plane,
            title: "Island Hopping Tour",
            description: "Visit Crystal Cove, Crocodile Island",
            location: "Various Islands",
          },
          {
            time: "1:00 PM",
            icon: UtensilsCrossed,
            title: "Lunch on Island",
            description: "Beachside lunch and snorkeling",
            location: "Puka Beach",
          },
        ],
      },
    ],
    "BV-2024-002": [
      {
        day: 1,
        title: "Arrival & City Tour",
        activities: [
          {
            time: "9:00 AM",
            icon: Plane,
            title: "Arrival at Puerto Princesa",
            description: "Meet tour coordinator",
            location: "Puerto Princesa Airport",
          },
          {
            time: "11:00 AM",
            icon: Hotel,
            title: "Hotel Check-in",
            description: "Check-in at city hotel",
            location: "City Center",
          },
          {
            time: "2:00 PM",
            icon: Camera,
            title: "City Tour",
            description: "Visit Plaza Cuartel and Baywalk",
            location: "Puerto Princesa City",
          },
        ],
      },
    ],
    "BV-2024-003": [
      {
        day: 1,
        title: "Arrival & Beach Welcome",
        activities: [
          {
            time: "10:30 AM",
            icon: Plane,
            title: "Arrival at Siargao Airport",
            description: "Airport pickup and transfer",
            location: "Siargao Airport",
          },
          {
            time: "12:00 PM",
            icon: Hotel,
            title: "Resort Check-in",
            description: "Check-in at beachfront resort",
            location: "General Luna",
          },
          {
            time: "3:00 PM",
            icon: Camera,
            title: "Beach Exploration",
            description: "Explore the famous Cloud 9 area",
            location: "Cloud 9",
          },
        ],
      },
    ],
  };

  const handleRejectClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectionReason("");
    setRejectionResolution("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (
      !selectedBooking ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    ) {
      return;
    }

    // Move booking from pending to rejected with reason and resolution
    const rejectedBooking: Booking = {
      ...selectedBooking,
      rejectionReason: rejectionReason.trim(),
      rejectionResolution: rejectionResolution.trim(),
      resolutionStatus: "unresolved",
    };

    const updatedPending = pendingBookings.filter(
      (b) => b.id !== selectedBooking.id,
    );
    setPendingBookings(updatedPending);
    setParentPendingBookings(updatedPending);
    setRejectedBookings([rejectedBooking, ...rejectedBookings]);

    setIsRejectDialogOpen(false);
    setSelectedBooking(null);
    setRejectionReason("");
    setRejectionResolution("");
    toast.success("Booking rejected successfully", {
      description: `Booking ${selectedBooking.id} has been rejected and moved to rejected tab.`,
    });
  };

  const handleMarkAsResolved = (bookingId: string) => {
    setRejectedBookings(
      rejectedBookings.map((b) =>
        b.id === bookingId
          ? { ...b, resolutionStatus: "resolved" as const }
          : b,
      ),
    );
  };

  const handleMarkAsUnresolvedClick = (booking: Booking) => {
    setSelectedBooking(booking);
    // Pre-populate with existing rejection info so admin can edit
    setRejectionReason(booking.rejectionReason || "");
    setRejectionResolution(booking.rejectionResolution || "");
    setIsUnresolveDialogOpen(true);
  };

  const handleUnresolveConfirm = () => {
    if (
      !selectedBooking ||
      !rejectionReason.trim() ||
      !rejectionResolution.trim()
    ) {
      return;
    }

    // Update the booking with new rejection info and mark as unresolved
    setRejectedBookings(
      rejectedBookings.map((b) =>
        b.id === selectedBooking.id
          ? {
              ...b,
              rejectionReason: rejectionReason.trim(),
              rejectionResolution: rejectionResolution.trim(),
              resolutionStatus: "unresolved" as const,
            }
          : b,
      ),
    );

    setIsUnresolveDialogOpen(false);
    setSelectedBooking(null);
    setRejectionReason("");
    setRejectionResolution("");
    toast.success("Booking marked as unresolved", {
      description: `Booking ${selectedBooking.id} has been updated and marked as unresolved.`,
    });
  };

  const handleReviewForApprovalClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsReviewForApprovalDialogOpen(true);
  };

  const handleReconsiderApproval = () => {
    if (!selectedBooking) return;

    // Move booking from rejected back to pending (remove rejection info)
    const {
      rejectionReason,
      rejectionResolution,
      resolutionStatus,
      ...pendingBooking
    } = selectedBooking;

    setRejectedBookings(
      rejectedBookings.filter((b) => b.id !== selectedBooking.id),
    );
    const updatedPending = [pendingBooking, ...pendingBookings];
    setPendingBookings(updatedPending);
    setParentPendingBookings(updatedPending);
    
    setIsReviewForApprovalDialogOpen(false);
    setSelectedBooking(null);
    
    // If in detail view, go back to list
    if (viewMode === "detail") {
      setViewMode("list");
      setSelectedBookingId(null);
    }
    
    toast.success("Booking moved for review", {
      description: `Booking ${selectedBooking.id} has been moved back to pending approvals.`,
    });
  };

  const handleApproveClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsApproveDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedBooking) return;

    // Remove from pending bookings
    const updatedPending = pendingBookings.filter(
      (b) => b.id !== selectedBooking.id,
    );
    setPendingBookings(updatedPending);
    setParentPendingBookings(updatedPending);

    setIsApproveDialogOpen(false);
    const bookingId = selectedBooking.id;
    const customerName = selectedBooking.customer;
    setSelectedBooking(null);

    // If in detail view, go back to list
    if (viewMode === "detail") {
      setViewMode("list");
      setSelectedBookingId(null);
    }
    
    toast.success("Booking approved successfully", {
      description: `Booking ${bookingId} for ${customerName} has been approved.`,
    });
  };

  // View booking details
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

  // Handle total amount editing
  const handleStartEditTotalAmount = (currentTotal: string) => {
    setEditedTotalAmount(currentTotal.replace("₱", "").replace(/,/g, "").trim());
    setEditingTotalAmount(true);
  };

  const handleSaveTotalAmount = (bookingId: string) => {
    if (!editedTotalAmount || parseFloat(editedTotalAmount) <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid total amount.",
      });
      return;
    }

    const formattedAmount = `₱${parseFloat(editedTotalAmount).toLocaleString()}`;

    // Update in pending bookings
    setPendingBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, total: formattedAmount }
          : booking
      )
    );

    // Update in rejected bookings
    setRejectedBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, total: formattedAmount }
          : booking
      )
    );

    // Update parent state
    setParentPendingBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, total: formattedAmount }
          : booking
      )
    );

    setEditingTotalAmount(false);
    setEditedTotalAmount("");

    toast.success("Total Amount Updated", {
      description: `The total amount has been updated to ${formattedAmount}.`,
    });
  };

  const handleCancelEditTotalAmount = () => {
    setEditingTotalAmount(false);
    setEditedTotalAmount("");
  };

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    switch (activeTab) {
      case "urgent":
        return pendingBookings.filter((b) => b.urgent);
      case "byDate":
        return [...pendingBookings].sort(
          (a, b) =>
            new Date(a.dates.split(" - ")[0]).getTime() -
            new Date(b.dates.split(" - ")[0]).getTime(),
        );
      default:
        return pendingBookings;
    }
  };

  const displayBookings =
    activeTab === "rejected"
      ? rejectedBookings
      : getFilteredBookings();

  // Calculate paginated bookings
  const indexOfLastBooking = currentPage * itemsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
  const currentBookings = displayBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking,
  );

  // Reset to page 1 when tab changes
  const handleTabChange = (
    tab: "all" | "urgent" | "byDate" | "rejected",
  ) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Get current booking for detailed view
  const currentBooking =
    viewMode === "detail" && selectedBookingId
      ? [...pendingBookings, ...rejectedBookings].find(
          (b) => b.id === selectedBookingId,
        )
      : null;
  const selectedItinerary = selectedBookingId
    ? itineraryData[selectedBookingId] || []
    : [];

  // Render detailed booking view
  if (viewMode === "detail" && currentBooking) {
    return (
      <div className="space-y-6">
        {/* Booking Header Card */}
        <div className="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold">
                  {currentBooking.destination}
                </h1>
                {currentBooking.urgent && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium border bg-[rgba(255,107,107,0.2)] border-[rgba(255,107,107,0.3)] text-white backdrop-blur-sm">
                    🔥 Urgent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4" />
                <span className="text-lg">
                  {currentBooking.destination}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">
                Booking ID
              </p>
              <p className="text-2xl font-semibold">
                {currentBooking.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Calendar className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">
                Travel Dates
              </p>
              <p className="font-medium">
                {currentBooking.dates}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Users className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">
                Travelers
              </p>
              <p className="font-medium">
                {currentBooking.travelers}{" "}
                {currentBooking.travelers > 1
                  ? "People"
                  : "Person"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <CreditCard className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">
                Total Amount
              </p>
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
                        handleSaveTotalAmount(currentBooking.id);
                      } else if (e.key === "Escape") {
                        handleCancelEditTotalAmount();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSaveTotalAmount(currentBooking.id)}
                    className="w-7 h-7 rounded-lg bg-[#10B981] hover:bg-[#059669] flex items-center justify-center transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={handleCancelEditTotalAmount}
                    className="w-7 h-7 rounded-lg bg-[#FF6B6B] hover:bg-[#EF4444] flex items-center justify-center transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {currentBooking.total}
                  </p>
                  <button
                    onClick={() => handleStartEditTotalAmount(currentBooking.total)}
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
              <p className="text-white/80 text-xs mb-1">
                Booked On
              </p>
              <p className="font-medium">
                {currentBooking.bookedDate}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Customer Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#1A2B4F]">
                    Customer Information
                  </h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">
                    Full Name
                  </p>
                  <p className="text-[#1A2B4F] font-medium">
                    {currentBooking.customer}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">
                    Email Address
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0A7AFF]" />
                    <p className="text-[#334155]">
                      {currentBooking.email}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">
                    Mobile Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#14B8A6]" />
                    <p className="text-[#334155]">
                      {currentBooking.mobile}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-3">
              {activeTab !== "rejected" && (
                <>
                  <button
                    onClick={() =>
                      handleApproveClick(currentBooking)
                    }
                    className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Booking
                  </button>
                  <button
                    onClick={() =>
                      handleRejectClick(currentBooking)
                    }
                    className="w-full h-11 px-4 rounded-xl border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Booking
                  </button>
                </>
              )}
              {activeTab === "rejected" && currentBooking.resolutionStatus === "resolved" && (
                <button
                  onClick={() =>
                    handleReviewForApprovalClick(currentBooking)
                  }
                  className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(10,122,255,0.35)] transition-all"
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
            <ItineraryDetailDisplay
              itinerary={selectedItinerary}
            />
          </div>
        </div>

        {/* Rejection Info for Rejected Bookings */}
        {activeTab === "rejected" &&
          currentBooking.rejectionReason &&
          currentBooking.rejectionResolution && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
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
                    {currentBooking.rejectionReason}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#FF6B6B] mb-1">
                    Required Action:
                  </p>
                  <p className="text-sm text-[#334155]">
                    {currentBooking.rejectionResolution}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-[#64748B]">
                    Client Action Status:
                  </p>
                  {currentBooking.resolutionStatus ===
                  "resolved" ? (
                    <button
                      onClick={() =>
                        handleMarkAsUnresolvedClick(
                          currentBooking,
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#10B981] text-xs font-medium border border-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.15)] transition-all"
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Resolved - Click to mark Unresolved
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleMarkAsResolved(currentBooking.id)
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
        
        {/* Approve Dialog - Only in Detail View */}
        <Dialog
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                Approve Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this booking? This action
                will confirm the booking for the customer.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
                className="border-[#E5E7EB]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveConfirm}
                className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#0EA574] hover:to-[#12A594]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog - Only in Detail View */}
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
                Reject Booking #{selectedBooking?.id}
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection and specify
                what the client must do to resolve this issue.
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
                  placeholder="e.g., Incomplete payment documentation, Invalid travel dates, Missing required documents..."
                  value={rejectionReason}
                  onChange={(e) =>
                    setRejectionReason(e.target.value)
                  }
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
                  placeholder="e.g., Please submit proof of payment or valid payment method. Contact our support team for assistance."
                  value={rejectionResolution}
                  onChange={(e) =>
                    setRejectionResolution(e.target.value)
                  }
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
                  !rejectionReason.trim() ||
                  !rejectionResolution.trim()
                }
                className="bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF3B3B]"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unresolve Dialog - Available in Detail View */}
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
                Update the rejection information and mark this booking
                as unresolved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-8 py-6">
              <div>
                <Label
                  htmlFor="unresolve-reason-detail"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Rejection Reason *
                </Label>
                <Textarea
                  id="unresolve-reason-detail"
                  placeholder="e.g., Incomplete payment documentation, Invalid travel dates, Missing required documents..."
                  value={rejectionReason}
                  onChange={(e) =>
                    setRejectionReason(e.target.value)
                  }
                  className="min-h-[80px] border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                />
              </div>

              <div>
                <Label
                  htmlFor="unresolve-resolution-detail"
                  className="text-[#1A2B4F] mb-2 block"
                >
                  Required Action / Resolution *
                </Label>
                <Textarea
                  id="unresolve-resolution-detail"
                  placeholder="e.g., Please submit proof of payment or valid payment method. Contact our support team for assistance."
                  value={rejectionResolution}
                  onChange={(e) =>
                    setRejectionResolution(e.target.value)
                  }
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
                  !rejectionReason.trim() ||
                  !rejectionResolution.trim()
                }
                className="bg-gradient-to-r from-[#FF9800] to-[#FFB84D] hover:from-[#FF8C00] hover:to-[#FFA836]"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Mark Unresolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review for Approval Confirmation Modal */}
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
            selectedBooking && (
              <>
                <p className="text-sm text-[#334155] leading-relaxed mb-4">
                  Move booking for <span className="font-semibold text-[#0A7AFF]">{selectedBooking.customer}</span> back to pending approvals for review?
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                    <p className="text-sm font-semibold text-[#0A7AFF]">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Destination</p>
                    <p className="text-sm font-medium text-[#334155]">{selectedBooking.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Customer</p>
                    <p className="text-sm font-medium text-[#334155]">{selectedBooking.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                    <p className="text-sm font-semibold text-[#1A2B4F]">{selectedBooking.total}</p>
                  </div>
                </div>
              </>
            )
          }
          onConfirm={handleReconsiderApproval}
          onCancel={() => setIsReviewForApprovalDialogOpen(false)}
          confirmText="Review for Approval"
          cancelText="Cancel"
          confirmVariant="default"
        />
      </div>
    );
  }

  // Render list view
  return (
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
          onClick={() => handleTabChange("urgent")}
          className={`px-5 h-11 text-sm transition-colors ${
            activeTab === "urgent"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          Urgent
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
            ? `Rejected Bookings (${rejectedBookings.length})`
            : `Pending Approvals (${displayBookings.length})`
        }
        footer={
          displayBookings.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalItems={displayBookings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              showingStart={
                displayBookings.length > 0
                  ? indexOfFirstBooking + 1
                  : 0
              }
              showingEnd={Math.min(
                indexOfLastBooking,
                displayBookings.length,
              )}
            />
          ) : undefined
        }
      >
        <div className="space-y-4">
          {displayBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">
                {activeTab === "rejected"
                  ? "No rejected bookings"
                  : "No pending bookings to display"}
              </p>
            </div>
          ) : (
            currentBookings.map((booking) => (
              <BookingListCard
                key={booking.id}
                booking={{
                  id: booking.id,
                  customer: booking.customer,
                  email: booking.email,
                  mobile: booking.mobile,
                  destination: booking.destination,
                  dates: booking.dates,
                  travelers: booking.travelers,
                  total: booking.total,
                  bookedDate: booking.bookedDate,
                  urgent: booking.urgent,
                  rejectionReason: booking.rejectionReason,
                  rejectionResolution:
                    booking.rejectionResolution,
                  resolutionStatus: booking.resolutionStatus,
                  statusBadges: (
                    <>
                      {activeTab === "rejected" && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] text-xs font-medium border border-[rgba(255,107,107,0.2)]">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                          {booking.resolutionStatus ===
                          "resolved" ? (
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
                    </>
                  ),
                }}
                onViewDetails={handleViewDetails}
                variant={
                  activeTab === "rejected"
                    ? "rejected"
                    : "default"
                }
                onMarkAsResolved={handleMarkAsResolved}
                onMarkAsUnresolved={(bookingId) => {
                  const bookingToUpdate = rejectedBookings.find(
                    (b) => b.id === bookingId,
                  );
                  if (bookingToUpdate) {
                    handleMarkAsUnresolvedClick(
                      bookingToUpdate,
                    );
                  }
                }}
              />
            ))
          )}
        </div>
      </ContentCard>

      {/* Unresolve Dialog - Available in List View */}
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
              Update the rejection information and mark this booking
              as unresolved.
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
                placeholder="e.g., Incomplete payment documentation, Invalid travel dates, Missing required documents..."
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(e.target.value)
                }
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
                placeholder="e.g., Please submit proof of payment or valid payment method. Contact our support team for assistance."
                value={rejectionResolution}
                onChange={(e) =>
                  setRejectionResolution(e.target.value)
                }
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
                !rejectionReason.trim() ||
                !rejectionResolution.trim()
              }
              className="bg-gradient-to-r from-[#FF9800] to-[#FFB84D] hover:from-[#FF8C00] hover:to-[#FFA836]"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mark Unresolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review for Approval Confirmation Modal - List View */}
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
          selectedBooking && (
            <>
              <p className="text-sm text-[#334155] leading-relaxed mb-4">
                Move booking for <span className="font-semibold text-[#0A7AFF]">{selectedBooking.customer}</span> back to pending approvals for review?
              </p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                  <p className="text-sm font-semibold text-[#0A7AFF]">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Destination</p>
                  <p className="text-sm font-medium text-[#334155]">{selectedBooking.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Customer</p>
                  <p className="text-sm font-medium text-[#334155]">{selectedBooking.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                  <p className="text-sm font-semibold text-[#1A2B4F]">{selectedBooking.total}</p>
                </div>
              </div>
            </>
          )
        }
        onConfirm={handleReconsiderApproval}
        onCancel={() => setIsReviewForApprovalDialogOpen(false)}
        confirmText="Review for Approval"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </div>
  );
}