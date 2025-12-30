import { Booking } from "../../types/types";

export const transformBooking = (booking: Booking) => {
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const dateRange = `${startDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} – ${endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  return {
    id: booking.id,
    destination: booking.destination,
    dates: dateRange,
    travelers: booking.travelers,
    budget: `₱${booking.totalPrice.toLocaleString()}`,
    status: booking.status.toLowerCase() as "draft" | "pending" | "rejected",
    bookingType:
      booking.type === "STANDARD"
        ? "Standard"
        : booking.type === "CUSTOMIZED"
        ? "Customized"
        : "Requested",
    ownership:
      booking.type === "REQUESTED"
        ? "requested"
        : ("owned" as "owned" | "collaborated" | "requested"),
    owner: "Current User", // Will be replaced with actual user data
    collaborators: [] as string[], // Will be populated when API supports it
    createdOn: new Date(booking.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tourType: booking.tourType,
    itinerary: booking.itinerary,
    rawBooking: booking,
  };
};
