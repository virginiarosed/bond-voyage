import { MapPin, Calendar, Users, Clock, Eye, Share2, CreditCard } from "lucide-react";
import { capitalize } from "../utils/helpers/capitalize";
import { formatDateRange } from "../App";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Booking } from "../types/types";

interface BookingListCardProps {
  booking: Booking;
  onViewDetails: (bookingId: string) => void;
  onShare?: (bookingCode: string, bookingId: string) => void;
  showShare?: boolean;
  context?: "approvals" | "rejected" | "active" | "cancelled";
  activeTab?: "all" | "byDate" | "rejected";
  showViewDetailsButton?: boolean;
  highlightOnClick?: boolean;
  // Add these new optional props
  ownership?: "owned" | "collaborated" | "requested";
  confirmStatus?: "confirmed" | "unconfirmed";
  // Add optional prop for displaying sent status for REQUESTED bookings
  sentStatus?: "sent" | "unsent";
}

export function BookingListCard({
  booking,
  onViewDetails,
  onShare,
  showShare = false,
  context = "approvals",
  activeTab,
  showViewDetailsButton = true,
  highlightOnClick = true,
  ownership,
  confirmStatus,
  sentStatus,
}: BookingListCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(booking.id);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(booking.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(booking.bookingCode, booking.id);
  };

  // Helper to determine if this is a REQUESTED booking
  const isRequestedBooking = () => {
    return booking.bookingType?.toUpperCase() === "REQUESTED";
  };

  // Get Payment Status Badge (NEW)
const getPaymentStatusBadge = () => {
  if (!booking.paymentStatus) return null;

  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";
  const status = booking.paymentStatus.toLowerCase();

  switch (status) {
    case "paid":
    case "verified": // Some APIs might use "verified" instead of "paid"
      return (
        <span className={`${baseClasses} bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          Paid
        </span>
      );
    case "partial":
    case "partial_payment":
      return (
        <span className={`${baseClasses} bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          Partial
        </span>
      );
    case "pending":
    case "processing":
      return (
        <span className={`${baseClasses} bg-[rgba(255,184,77,0.1)] text-[#FFB84D] border-[rgba(255,184,77,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          Pending
        </span>
      );
    case "unpaid":
      return (
        <span className={`${baseClasses} bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[rgba(255,107,107,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          Unpaid
        </span>
      );
    case "rejected":
    case "failed":
      return (
        <span className={`${baseClasses} bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[rgba(255,107,107,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-[rgba(100,116,139,0.1)] text-[#64748B] border-[rgba(100,116,139,0.2)]`}>
          <CreditCard className="w-3 h-3" />
          {capitalize(booking.paymentStatus)}
        </span>
      );
  }
};

  // Get Tour Type Badge (NEW)
  const getTourTypeBadge = () => {
    if (!booking.tourType) return null;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";
    const type = booking.tourType.toLowerCase();

    switch (type) {
      case "private":
        return (
          <span className={`${baseClasses} bg-[rgba(168,85,247,0.1)] text-[#A855F7] border-[rgba(168,85,247,0.2)]`}>
            Private
          </span>
        );
      case "group":
        return (
          <span className={`${baseClasses} bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border-[rgba(59,130,246,0.2)]`}>
            Group
          </span>
        );
      case "standard":
        return (
          <span className={`${baseClasses} bg-[rgba(14,165,233,0.1)] text-[#0EA5E9] border-[rgba(14,165,233,0.2)]`}>
            Standard
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-[rgba(100,116,139,0.1)] text-[#64748B] border-[rgba(100,116,139,0.2)]`}>
            {capitalize(booking.tourType)}
          </span>
        );
    }
  };

  // Get Ownership Badge
  const getOwnershipBadge = () => {
    if (!ownership) return null;
    
    // Don't show ownership badge for REQUESTED bookings to avoid redundancy
    if (isRequestedBooking()) return null;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";

    switch (ownership) {
      case "owned":
        return (
          <span className={`${baseClasses} bg-[rgba(10,122,255,0.1)] text-[#0A7AFF] border-[rgba(10,122,255,0.2)]`}>
            Owned
          </span>
        );
      case "collaborated":
        return (
          <span className={`${baseClasses} bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border-[rgba(139,92,246,0.2)]`}>
            Collaborated
          </span>
        );
      case "requested":
        // We won't show this for REQUESTED booking type
        return null;
      default:
        return null;
    }
  };

  // Get Confirmation Status Badge (only for REQUESTED bookings)
  const getConfirmationBadge = () => {
    // Only show confirmation badge for REQUESTED bookings
    if (!isRequestedBooking()) return null;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";

    // Use confirmStatus prop if available, otherwise fall back to booking status
    const statusToUse = confirmStatus || 
      (booking.status?.toUpperCase() === "CONFIRMED" ? "confirmed" : "unconfirmed");

    switch (statusToUse) {
      case "confirmed":
        return (
          <span className={`${baseClasses} bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]`}>
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case "unconfirmed":
        return (
          <span className={`${baseClasses} bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]`}>
            <AlertTriangle className="w-3 h-3" />
            Unconfirmed
          </span>
        );
      default:
        return null;
    }
  };

  // Get Sent Status Badge (only for REQUESTED bookings)
  const getSentStatusBadge = () => {
    // Only show sent status badge for REQUESTED bookings
    if (!isRequestedBooking()) return null;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";

    // Use sentStatus prop if available, otherwise fall back to booking.sentStatus
    const statusToUse = sentStatus || booking.sentStatus?.toLowerCase() as "sent" | "unsent" | undefined;

    if (!statusToUse) return null;

    switch (statusToUse) {
      case "sent":
        return (
          <span className={`${baseClasses} bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]`}>
            <CheckCircle className="w-3 h-3" />
            Sent
          </span>
        );
      case "unsent":
        return (
          <span className={`${baseClasses} bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[rgba(255,107,107,0.2)]`}>
            <XCircle className="w-3 h-3" />
            Unsent
          </span>
        );
      default:
        return null;
    }
  };

  const getBookingTypeBadge = () => {
    if (!booking.bookingType) return null;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border";

    switch (booking.bookingType.toUpperCase()) {
      case "CUSTOMIZED":
        return (
          <span
            className={`${baseClasses} bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border-[rgba(139,92,246,0.2)]`}
          >
            {capitalize(booking.bookingType)}
          </span>
        );
      case "STANDARD":
        return (
          <span
            className={`${baseClasses} bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]`}
          >
            {capitalize(booking.bookingType)}
          </span>
        );
      case "REQUESTED":
        // Show REQUESTED booking type badge
        return (
          <span
            className={`${baseClasses} bg-[rgba(20,184,166,0.1)] text-[#14B8A6] border-[rgba(20,184,166,0.2)]`}
          >
            {capitalize(booking.bookingType)}
          </span>
        );
      default:
        return (
          <span
            className={`${baseClasses} bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]`}
          >
            {capitalize(booking.bookingType)}
          </span>
        );
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] transition-all duration-200 cursor-pointer ${
        highlightOnClick ? "hover:shadow-[0_4px_12px_rgba(10,122,255,0.1)]" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center">
            <span className="text-white text-lg">🎫</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg text-[#1A2B4F] font-semibold">
                Booking {booking.bookingCode}
              </h3>
              
              {/* Show payment status badge first (NEW) */}
              {getPaymentStatusBadge()}
              
              {/* Show booking type badge */}
              {getBookingTypeBadge()}
              
              {/* Show tour type badge (NEW) */}
              {getTourTypeBadge()}
              
              {/* Show ownership badge (not for REQUESTED bookings) */}
              {getOwnershipBadge()}
              
              {/* Show confirmation badge for REQUESTED bookings */}
              {getConfirmationBadge()}
              
              {/* Show sent status badge for REQUESTED bookings */}
              {getSentStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="font-medium text-[#334155]">
                {booking.customer}
              </span>
              <span>•</span>
              <span>{booking.email}</span>
              {booking.mobile && booking.mobile !== "N/A" && (
                <>
                  <span>•</span>
                  <span>{booking.mobile}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {(showViewDetailsButton || showShare) && (
          <div className="flex items-center gap-2">
            {showViewDetailsButton && (
              <button
                onClick={handleButtonClick}
                className="h-9 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFB] hover:border-[#0A7AFF] text-[#334155] flex items-center gap-2 text-sm font-medium transition-all"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            )}
            {showShare && onShare && (
              <button
                onClick={handleShareClick}
                className="h-9 w-9 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFB] hover:border-[#0A7AFF] text-[#334155] flex items-center justify-center transition-all"
                title="Share itinerary"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
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
              {booking.travelers} {booking.travelers > 1 ? "People" : "Person"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#10B981] text-lg font-bold">₱</span>
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

      {/* Additional Info for Rejected Bookings */}
      {context === "rejected" && booking.rejectionReason && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF6B6B] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#FF6B6B]">
                Rejection Reason:
              </p>
              <p className="text-xs text-[#64748B]">
                {booking.rejectionReason}
              </p>
              {booking.rejectionResolution && (
                <>
                  <p className="text-xs font-semibold text-[#FF6B6B] mt-2">
                    Required Action:
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {booking.rejectionResolution}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}