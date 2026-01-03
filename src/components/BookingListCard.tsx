import { MapPin, Calendar, Users, Clock, Eye } from "lucide-react";
import { capitalize } from "../utils/helpers/capitalize";
import { formatDateRange } from "../App";
import { Booking } from "../types/types";

interface BookingListCardProps {
  booking: Booking;
  onViewDetails: (bookingId: string) => void;
}

export function BookingListCard({
  booking,
  onViewDetails,
}: BookingListCardProps) {
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
      paid: 0,
      paymentStatus: "Unpaid",
      bookedDate: apiBooking.bookedDate || apiBooking.createdAt,
      bookedDateObj: new Date(apiBooking.bookedDate || apiBooking.createdAt),
      status: apiBooking.status,
      bookingType: apiBooking.type,
      tourType:
        apiBooking.tourType || apiBooking.itinerary?.tourType || "PRIVATE",
      rejectionReason: apiBooking.rejectionReason,
      rejectionResolution: apiBooking.rejectionResolution,
      resolutionStatus: apiBooking.isResolved ? "resolved" : "unresolved",
      paymentHistory: [],
      totalPaid: 0,
      bookingSource: apiBooking.type,
      itineraryDetails: [],
    };
  };

  const transformedBooking = transformBooking(booking);

  const getPaymentStatusColor = (status: string | null | undefined) => {
    if (!status) return "bg-[#F8FAFB] text-[#64748B] border-[#E5E7EB]";

    switch (status.toLowerCase()) {
      case "paid":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[#10B981]/20";
      case "partial":
        return "bg-[rgba(255,184,77,0.1)] text-[#FFB84D] border-[#FFB84D]/20";
      case "unpaid":
      case "pending":
        return "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border-[#FF6B6B]/20";
      default:
        return "bg-[#F8FAFB] text-[#64748B] border-[#E5E7EB]";
    }
  };

  // Safely format booked date
  const getFormattedBookedDate = () => {
    try {
      if (!booking.bookedDate) return "Date not set";
      const date = new Date(booking.bookedDate);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div
      key={booking.id}
      id={`booking-${booking.id}`}
      onClick={() => onViewDetails(booking.id)}
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
                {transformedBooking.bookingCode}
              </h3>
              {transformedBooking.paymentStatus && (
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                    transformedBooking.paymentStatus
                  )}`}
                >
                  {transformedBooking.paymentStatus}
                </span>
              )}
              {transformedBooking.bookingType && (
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                    transformedBooking.bookingType === "CUSTOMIZED"
                      ? "bg-[rgba(255,127,110,0.1)] text-[#FF7F6E] border-[rgba(255,127,110,0.2)]"
                      : transformedBooking.bookingType === "STANDARD"
                      ? "bg-[rgba(139,125,107,0.1)] text-[#8B7D6B] border-[rgba(139,125,107,0.2)]"
                      : "bg-[rgba(236,72,153,0.1)] text-[#EC4899] border-[rgba(236,72,153,0.2)]"
                  }`}
                >
                  {capitalize(transformedBooking.bookingType)}
                </span>
              )}
              {transformedBooking.tourType && (
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                    transformedBooking.tourType === "JOINER"
                      ? "bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]"
                      : "bg-[rgba(167,139,250,0.1)] text-[#A78BFA] border-[rgba(167,139,250,0.2)]"
                  }`}
                >
                  {capitalize(transformedBooking.tourType)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(transformedBooking.id);
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
          <Users className="w-4 h-4 text-[#64748B]" />
          <span className="text-sm text-[#334155] font-medium">
            {transformedBooking.customer}
          </span>
          <span className="text-sm text-[#64748B]">•</span>
          <span className="text-sm text-[#64748B]">
            {transformedBooking.email}
          </span>
          <span className="text-sm text-[#64748B]">•</span>
          <span className="text-sm text-[#64748B]">
            {transformedBooking.mobile}
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
              {transformedBooking.destination}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#14B8A6]" />
          <div>
            <p className="text-xs text-[#64748B]">Travel Dates</p>
            <p className="text-sm text-[#334155] font-medium">
              {formatDateRange(
                transformedBooking.startDate,
                transformedBooking.endDate
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#64748B]" />
          <div>
            <p className="text-xs text-[#64748B]">Travelers</p>
            <p className="text-sm text-[#334155] font-medium">
              {transformedBooking.travelers}{" "}
              {transformedBooking.travelers > 1 ? "People" : "Person"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#10B981] text-lg">₱</span>
          <div>
            <p className="text-xs text-[#64748B]">Paid / Total</p>
            <p className="text-sm text-[#334155] font-medium">
              ₱{transformedBooking.paid.toLocaleString()} / ₱
              {transformedBooking.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#64748B]" />
          <div>
            <p className="text-xs text-[#64748B]">Booked On</p>
            <p className="text-sm text-[#334155] font-medium">
              {transformedBooking.bookedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
