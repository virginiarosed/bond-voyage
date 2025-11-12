import { useParams, useNavigate } from "react-router-dom";
import { Plane, Hotel, Camera, UtensilsCrossed, Car, Download } from "lucide-react";
import { BookingDetailView } from "../../components/BookingDetailView";
import { ItineraryDetailDisplay } from "../../components/ItineraryDetailDisplay";
import { exportBookingDetailToPDF, exportBookingDetailToExcel } from "../../utils/exportUtils";
import { toast } from "sonner@2.0.3";

interface Booking {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  dates: string;
  travelers: number;
  amount: string;
  status: "confirmed" | "pending" | "cancelled";
  bookingDate: string;
  image: string;
  itinerary: string;
  bookingType: "Standard" | "Customized";
}

const bookingsData: Booking[] = [
  {
    id: "BV-2025-001",
    customer: "Maria Santos",
    email: "maria.santos@email.com",
    mobile: "+63 917 123 4567",
    destination: "Boracay, Aklan",
    dates: "December 20, 2025 – December 25, 2025",
    travelers: 4,
    amount: "₱85,500",
    status: "confirmed",
    bookingDate: "November 10, 2025",
    image: "https://images.unsplash.com/photo-1675760134774-0d6972b51e32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3JhY2F5JTIwYmVhY2glMjBzdW5zZXR8ZW58MXx8fHwxNzYyODQ2MjMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    itinerary: "5 Days / 4 Nights",
    bookingType: "Standard",
  },
  {
    id: "BV-2025-002",
    customer: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    mobile: "+63 918 234 5678",
    destination: "El Nido, Palawan",
    dates: "January 15, 2026 – January 20, 2026",
    travelers: 2,
    amount: "₱62,000",
    status: "confirmed",
    bookingDate: "November 8, 2025",
    image: "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWxhd2FuJTIwZWwlMjBuaWRvJTIwaXNsYW5kfGVufDF8fHx8MTc2Mjg0NjIzM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    itinerary: "5 Days / 4 Nights",
    bookingType: "Customized",
  },
  {
    id: "BV-2025-003",
    customer: "Ana Reyes",
    email: "ana.reyes@email.com",
    mobile: "+63 919 345 6789",
    destination: "Baguio City, Benguet",
    dates: "December 28, 2025 – December 31, 2025",
    travelers: 3,
    amount: "₱38,750",
    status: "pending",
    bookingDate: "November 11, 2025",
    image: "https://images.unsplash.com/photo-1677215552516-1f2a2aa46915?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWd1aW8lMjBjaXR5JTIwbW91bnRhaW5zfGVufDF8fHx8MTc2Mjg0NjIzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    itinerary: "3 Days / 2 Nights",
    bookingType: "Standard",
  },
  {
    id: "BV-2025-004",
    customer: "Carlos Mendoza",
    email: "carlos.mendoza@email.com",
    mobile: "+63 920 456 7890",
    destination: "Oslob, Cebu",
    dates: "February 10, 2026 – February 13, 2026",
    travelers: 2,
    amount: "₱45,200",
    status: "confirmed",
    bookingDate: "November 5, 2025",
    image: "https://images.unsplash.com/photo-1573808645321-beaa7ab67839?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWJ1JTIwb3Nsb2IlMjB3aGFsZSUyMHNoYXJrfGVufDF8fHx8MTc2Mjg0NjIzM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    itinerary: "3 Days / 2 Nights",
    bookingType: "Customized",
  },
];

const itineraryData: Record<string, any> = {
  "BV-2025-001": {
    id: "BV-2025-001",
    destination: "Boracay, Aklan",
    duration: "5 Days / 4 Nights",
    description: "Experience the pristine white beaches and crystal-clear waters of Boracay",
    destinations: ["Boracay Island", "White Beach", "Puka Beach"],
    days: [
      {
        day: 1,
        title: "Arrival & Beach Sunset",
        description: "Check-in and relax at the beach",
        activities: [
          { time: "10:00", activity: "Arrival at Caticlan Airport", location: "Caticlan Airport" },
          { time: "11:30", activity: "Transfer to Boracay", location: "D'Mall Area" },
          { time: "14:00", activity: "Hotel Check-in", location: "Station 2" },
          { time: "18:00", activity: "Sunset at White Beach", location: "White Beach" },
          { time: "20:00", activity: "Welcome Dinner", location: "Beachfront Restaurant" },
        ]
      },
      {
        day: 2,
        title: "Island Hopping Adventure",
        description: "Explore nearby islands",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "09:00", activity: "Island Hopping Tour", location: "Crystal Cove, Crocodile Island" },
          { time: "13:00", activity: "Lunch on Island", location: "Puka Beach" },
          { time: "17:00", activity: "Return to Resort", location: "Resort" },
          { time: "19:00", activity: "Dinner at D'Mall", location: "D'Mall" },
        ]
      },
      {
        day: 3,
        title: "Beach Activities & Water Sports",
        description: "Adventure and fun in the sun",
        activities: [
          { time: "08:00", activity: "Breakfast", location: "Resort" },
          { time: "10:00", activity: "Water Sports - Parasailing, Banana Boat", location: "White Beach" },
          { time: "13:00", activity: "Lunch", location: "Station 1" },
          { time: "15:00", activity: "Shopping at D'Mall", location: "D'Mall" },
          { time: "19:00", activity: "Dinner", location: "Beachfront Restaurant" },
        ]
      },
      {
        day: 4,
        title: "Relaxation Day",
        description: "Spa and leisure",
        activities: [
          { time: "08:00", activity: "Breakfast", location: "Resort" },
          { time: "10:00", activity: "Beach Relaxation", location: "White Beach" },
          { time: "14:00", activity: "Spa Treatment", location: "Resort Spa" },
          { time: "19:00", activity: "Farewell Dinner", location: "Beachfront Restaurant" },
        ]
      },
      {
        day: 5,
        title: "Departure",
        description: "Safe travels",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "09:00", activity: "Check-out", location: "Resort" },
          { time: "10:00", activity: "Transfer to Airport", location: "Caticlan Airport" },
          { time: "12:00", activity: "Departure Flight", location: "Caticlan Airport" },
        ]
      },
    ],
    inclusions: ["Accommodation (4 nights)", "Daily Breakfast", "Island Hopping Tour", "Airport Transfers", "Tour Guide"],
    exclusions: ["Airfare", "Lunch & Dinner", "Personal Expenses", "Optional Activities"],
    pricing: {
      basePrice: 85500,
      breakdown: [
        { item: "Accommodation (4 nights)", amount: 45000 },
        { item: "Island Hopping Tour", amount: 15500 },
        { item: "Transportation & Transfers", amount: 12000 },
        { item: "Tour Guide Services", amount: 8000 },
        { item: "Activities Package", amount: 5000 },
      ]
    }
  },
  "BV-2025-002": {
    id: "BV-2025-002",
    destination: "El Nido, Palawan",
    duration: "5 Days / 4 Nights",
    description: "Discover the stunning lagoons and limestone cliffs of El Nido",
    destinations: ["El Nido", "Big Lagoon", "Small Lagoon", "Secret Lagoon"],
    days: [
      {
        day: 1,
        title: "Arrival & Town Exploration",
        description: "Settle in and explore El Nido town",
        activities: [
          { time: "09:00", activity: "Arrival at Puerto Princesa", location: "Puerto Princesa Airport" },
          { time: "14:00", activity: "Transfer to El Nido", location: "El Nido Town" },
          { time: "17:00", activity: "Hotel Check-in", location: "Resort" },
          { time: "19:00", activity: "Town Walk & Dinner", location: "El Nido Town" },
        ]
      },
      {
        day: 2,
        title: "Island Hopping Tour A",
        description: "Big Lagoon, Small Lagoon, Shimizu Island",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "09:00", activity: "Tour A - Big Lagoon", location: "Big Lagoon" },
          { time: "11:00", activity: "Small Lagoon", location: "Small Lagoon" },
          { time: "13:00", activity: "Beach BBQ Lunch", location: "Shimizu Island" },
          { time: "16:00", activity: "Return to Resort", location: "Resort" },
        ]
      },
      {
        day: 3,
        title: "Island Hopping Tour C",
        description: "Hidden Beach, Secret Beach, Matinloc Shrine",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "09:00", activity: "Tour C - Hidden Beach", location: "Hidden Beach" },
          { time: "11:30", activity: "Secret Beach", location: "Secret Beach" },
          { time: "13:00", activity: "Lunch", location: "Helicopter Island" },
          { time: "15:00", activity: "Matinloc Shrine", location: "Matinloc Island" },
          { time: "17:00", activity: "Return to Resort", location: "Resort" },
        ]
      },
      {
        day: 4,
        title: "Free Day & Sunset Viewing",
        description: "Leisure and relaxation",
        activities: [
          { time: "08:00", activity: "Breakfast", location: "Resort" },
          { time: "10:00", activity: "Beach Relaxation or Optional Activities", location: "Resort/Town" },
          { time: "17:30", activity: "Sunset at Las Cabanas Beach", location: "Las Cabanas" },
          { time: "19:30", activity: "Farewell Dinner", location: "Beachfront Restaurant" },
        ]
      },
      {
        day: 5,
        title: "Departure",
        description: "Journey home",
        activities: [
          { time: "06:00", activity: "Early Breakfast", location: "Resort" },
          { time: "07:00", activity: "Check-out & Transfer to Puerto Princesa", location: "Puerto Princesa" },
          { time: "13:00", activity: "Departure Flight", location: "Puerto Princesa Airport" },
        ]
      },
    ],
    inclusions: ["Accommodation (4 nights)", "Daily Breakfast", "Island Tours A & C", "Van Transfers", "Tour Guide"],
    exclusions: ["Airfare", "Eco-tourism Fees", "Lunch & Dinner", "Optional Tours"],
    pricing: {
      basePrice: 62000,
      breakdown: [
        { item: "Accommodation (4 nights)", amount: 32000 },
        { item: "Island Tours A & C", amount: 12000 },
        { item: "Van Transfer (Round Trip)", amount: 10000 },
        { item: "Tour Guide Services", amount: 5000 },
        { item: "Environmental Fees", amount: 3000 },
      ]
    }
  },
  "BV-2025-003": {
    id: "BV-2025-003",
    destination: "Baguio City, Benguet",
    duration: "3 Days / 2 Nights",
    description: "Enjoy the cool mountain breeze and scenic views of the Summer Capital",
    destinations: ["Baguio City", "Mines View Park", "Burnham Park"],
    days: [
      {
        day: 1,
        title: "City Tour",
        description: "Explore Baguio's famous landmarks",
        activities: [
          { time: "08:00", activity: "Arrival & Check-in", location: "Hotel" },
          { time: "10:00", activity: "Mines View Park", location: "Mines View" },
          { time: "12:00", activity: "Lunch at Good Taste", location: "Good Taste Restaurant" },
          { time: "14:00", activity: "The Mansion & Wright Park", location: "The Mansion" },
          { time: "16:00", activity: "Burnham Park Boat Ride", location: "Burnham Park" },
          { time: "19:00", activity: "Dinner at Hill Station", location: "Hill Station" },
        ]
      },
      {
        day: 2,
        title: "Nature & Culture",
        description: "Experience Baguio's natural beauty",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Hotel" },
          { time: "09:00", activity: "Strawberry Farm Picking", location: "La Trinidad" },
          { time: "11:00", activity: "BenCab Museum", location: "Tuba" },
          { time: "13:00", activity: "Lunch at Café by the Ruins", location: "Café by the Ruins" },
          { time: "15:00", activity: "Session Road Shopping", location: "Session Road" },
          { time: "18:00", activity: "Night Market", location: "Harrison Road" },
        ]
      },
      {
        day: 3,
        title: "Departure",
        description: "Last day in the city",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Hotel" },
          { time: "09:00", activity: "Check-out & Baguio Cathedral", location: "Baguio Cathedral" },
          { time: "11:00", activity: "Last Minute Shopping", location: "SM Baguio" },
          { time: "13:00", activity: "Departure", location: "Baguio City" },
        ]
      },
    ],
    inclusions: ["Accommodation (2 nights)", "Daily Breakfast", "City Tour", "Transportation"],
    exclusions: ["Airfare/Bus Fare", "Lunch & Dinner", "Entrance Fees", "Personal Expenses"],
    pricing: {
      basePrice: 38750,
      breakdown: [
        { item: "Accommodation (2 nights)", amount: 18000 },
        { item: "City Tour Package", amount: 9750 },
        { item: "Transportation", amount: 7000 },
        { item: "Tour Guide Services", amount: 4000 },
      ]
    }
  },
  "BV-2025-004": {
    id: "BV-2025-004",
    destination: "Oslob, Cebu",
    duration: "3 Days / 2 Nights",
    description: "Swim with whale sharks and explore Cebu's southern treasures",
    destinations: ["Oslob", "Tumalog Falls", "Sumilon Island"],
    days: [
      {
        day: 1,
        title: "Whale Shark Encounter",
        description: "Once in a lifetime experience",
        activities: [
          { time: "04:00", activity: "Early Pickup from Hotel", location: "Cebu City" },
          { time: "07:00", activity: "Whale Shark Watching", location: "Oslob" },
          { time: "09:00", activity: "Tumalog Falls", location: "Tumalog Falls" },
          { time: "11:00", activity: "Lunch", location: "Local Restaurant" },
          { time: "13:00", activity: "Check-in at Resort", location: "Oslob Resort" },
          { time: "15:00", activity: "Beach Relaxation", location: "Resort Beach" },
          { time: "19:00", activity: "Dinner", location: "Resort Restaurant" },
        ]
      },
      {
        day: 2,
        title: "Island Hopping & Heritage Tour",
        description: "Sumilon Island and Simala Shrine",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "08:00", activity: "Sumilon Island Hopping", location: "Sumilon Island" },
          { time: "13:00", activity: "Lunch on Island", location: "Sumilon" },
          { time: "15:00", activity: "Return to Resort", location: "Resort" },
          { time: "16:30", activity: "Simala Shrine Visit", location: "Simala Shrine" },
          { time: "19:00", activity: "Dinner", location: "Local Restaurant" },
        ]
      },
      {
        day: 3,
        title: "Departure",
        description: "Return to Cebu City",
        activities: [
          { time: "07:00", activity: "Breakfast", location: "Resort" },
          { time: "09:00", activity: "Check-out", location: "Resort" },
          { time: "10:00", activity: "Travel to Cebu City", location: "Cebu City" },
          { time: "14:00", activity: "Drop-off at Hotel/Airport", location: "Cebu" },
        ]
      },
    ],
    inclusions: ["Accommodation (2 nights)", "Daily Breakfast", "Whale Shark Watching", "Sumilon Island Tour", "Transportation"],
    exclusions: ["Airfare", "Lunch & Dinner", "Environmental Fees", "Optional Activities"],
    pricing: {
      basePrice: 45200,
      breakdown: [
        { item: "Accommodation (2 nights)", amount: 16000 },
        { item: "Whale Shark Experience", amount: 12000 },
        { item: "Sumilon Island Tour", amount: 8000 },
        { item: "Transportation (Round Trip)", amount: 6200 },
        { item: "Tour Guide Services", amount: 3000 },
      ]
    }
  },
};

export function UserBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const booking = bookingsData.find(b => b.id === id);
  const itinerary = id ? itineraryData[id] : null;

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl text-card-foreground mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-6">The booking you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate("/user/bookings")}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white hover:shadow-lg transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/user/bookings");
  };

  const exportButtons = (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <button
        onClick={() => {
          const bookingData = {
            id: booking.id,
            customer: booking.customer,
            email: booking.email,
            mobile: booking.mobile,
            destination: booking.destination,
            dates: booking.dates,
            travelers: booking.travelers,
            total: booking.amount,
            bookedDate: booking.bookingDate,
          };
          const itineraryDays = itinerary?.days || [];
          exportBookingDetailToPDF(bookingData, itineraryDays);
          toast.success("Exporting booking as PDF...");
        }}
        className="h-9 px-3 rounded-lg border border-[#E5E7EB] dark:border-[#2A3441] hover:border-[#FF6B6B] dark:hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] dark:hover:bg-[rgba(255,107,107,0.1)] flex items-center justify-center gap-2 text-sm text-[#334155] dark:text-[#E5E7EB] hover:text-[#FF6B6B] font-medium transition-all"
      >
        <Download className="w-4 h-4" />
        PDF
      </button>
      <button
        onClick={() => {
          const bookingData = {
            id: booking.id,
            customer: booking.customer,
            email: booking.email,
            mobile: booking.mobile,
            destination: booking.destination,
            dates: booking.dates,
            travelers: booking.travelers,
            total: booking.amount,
            bookedDate: booking.bookingDate,
          };
          const itineraryDays = itinerary?.days || [];
          exportBookingDetailToExcel(bookingData, itineraryDays);
          toast.success("Exporting booking as Excel...");
        }}
        className="h-9 px-3 rounded-lg border border-[#E5E7EB] dark:border-[#2A3441] hover:border-[#10B981] dark:hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)] dark:hover:bg-[rgba(16,185,129,0.1)] flex items-center justify-center gap-2 text-sm text-[#334155] dark:text-[#E5E7EB] hover:text-[#10B981] font-medium transition-all"
      >
        <Download className="w-4 h-4" />
        Excel
      </button>
    </div>
  );

  return (
    <BookingDetailView
      booking={{
        id: booking.id,
        customer: booking.customer,
        email: booking.email,
        mobile: booking.mobile,
        destination: booking.destination,
        dates: booking.dates,
        travelers: booking.travelers,
        total: booking.amount,
        bookedDate: booking.bookingDate,
        bookingType: booking.bookingType,
      }}
      itineraryContent={
        itinerary ? (
          <ItineraryDetailDisplay itineraryData={itinerary} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No itinerary details available
          </div>
        )
      }
      onBack={handleBack}
      breadcrumbPage="Bookings"
      actionButtons={exportButtons}
    />
  );
}
