import { useParams, useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BookingDetailView } from "../../components/BookingDetailView";
import { FAQAssistant } from "../../components/FAQAssistant";
import { useBookingDetail } from "../../hooks/useBookings";

const iconMap: Record<string, any> = {
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Package,
  Anchor: Package,
  Clock: Camera,
  Ship: Plane,
};

export function UserHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: bookingDetailData,
    isLoading,
    isError,
  } = useBookingDetail(id!, {
    enabled: !!id,
  });

  const booking = bookingDetailData?.data;

  const handleBack = () => {
    navigate("/user/history");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A7AFF]" />
      </div>
    );
  }

  // Error state
  if (isError || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#FF6B6B] mx-auto mb-4" />
          <h2 className="text-2xl text-card-foreground mb-2">Trip Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The trip you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/user/history")}
            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white hover:shadow-lg transition-all"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const itinerary =
    booking.itinerary?.days?.map((day) => ({
      day: day.dayNumber,
      title: day.title || `Day ${day.dayNumber}`,
      activities:
        day.activities?.map((activity) => ({
          time: activity.time,
          icon: iconMap[activity.icon] || Package,
          title: activity.title,
          description: activity.description,
          location: activity.location,
        })) || [],
    })) || [];

  const headerVariant =
    booking.status === "COMPLETED" ? "completed" : "cancelled";

  // Format price
  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString()}`;
  };

  const actionContent = (
    <div className="space-y-3">
      <div
        className={`p-4 rounded-xl border ${
          booking.status === "COMPLETED"
            ? "bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)]"
            : "bg-[rgba(255,107,107,0.05)] border-[rgba(255,107,107,0.2)]"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#64748B]">Status</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              booking.status === "COMPLETED"
                ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                : "bg-[rgba(255,107,107,0.1)] text-[#FF6B6B] border border-[rgba(255,107,107,0.2)]"
            }`}
          >
            {booking.status === "COMPLETED" ? "✓ Completed" : "✗ Cancelled"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            {booking.status === "COMPLETED" ? "Completed On" : "Cancelled On"}
          </span>
          <span className="text-xs font-medium text-[#334155]">
            {booking.updatedAtDisplay}
          </span>
        </div>
      </div>
      {booking.status === "CANCELLED" && booking.rejectionReason && (
        <div className="p-4 rounded-xl border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.05)]">
          <p className="text-xs text-[#64748B] mb-2">Cancellation Reason</p>
          <p className="text-sm text-[#334155] leading-relaxed">
            {booking.rejectionReason}
          </p>
        </div>
      )}
      <FAQAssistant />
    </div>
  );

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case "CUSTOMIZED":
        return "Customized";
      case "STANDARD":
        return "Standard";
      case "REQUESTED":
        return "Requested";
      default:
        return type;
    }
  };

  return (
    <BookingDetailView
      booking={{
        id: booking.bookingCode,
        customer: booking.customerName!,
        email: booking.customerEmail!,
        mobile: booking.customerMobile!,
        destination: booking.destination,
        dates: (booking as any).dateRangeDisplay || "Not specified",
        travelers: booking.travelers,
        total: formatPrice(booking.totalPrice),
        bookedDate: (booking as any).bookedDateDisplay,
        bookingType: getBookingTypeLabel(booking.type),
        bookingCode: booking.bookingCode,
      }}
      itinerary={booking.itinerary}
      onBack={handleBack}
      actionButtons={actionContent}
      breadcrumbPage="History"
      headerVariant={headerVariant}
      showPaymentDetails={false}
    />
  );
}
