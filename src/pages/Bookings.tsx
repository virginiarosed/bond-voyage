import { Calendar, MapPin, User, Users, Globe, Eye, Edit, RotateCcw, X, ChevronRight, Phone, Mail, CreditCard, CheckCircle2, Package, Clock, Plane, Hotel, Camera, UtensilsCrossed, Car, Briefcase, FileCheck, ClipboardList, BookOpen, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button as ShadcnButton } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SearchFilterToolbar, SortOrder } from "../components/SearchFilterToolbar";
import { BookingFilterContent } from "../components/filters/BookingFilterContent";
import { ContentCard } from "../components/ContentCard";
import { ItineraryDetailDisplay } from "../components/ItineraryDetailDisplay";
import { StatCard } from "../components/StatCard";
import { formatDateRange } from "../App";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner@2.0.3";
import { useBreadcrumbs } from "../components/BreadcrumbContext";
import { exportToPDF, exportToExcel, exportBookingDetailToPDF, exportBookingDetailToExcel } from "../utils/exportUtils";

type Booking = {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  itinerary: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalAmount: number;
  paid: number;
  paymentStatus: string;
  bookedDate: string;
  bookedDateObj: Date;
  status: string;
  bookingType?: "Customized" | "Requested" | "Standard";
  tourType?: "Joiner" | "Private";
  itineraryDetails?: ItineraryDay[];
};

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

interface BookingsProps {
  onMoveToApprovals: (booking: Booking) => void;
  onMoveToRequested: (booking: Booking) => void;
  onMoveToHistory: (booking: Booking, status: "completed" | "cancelled", cancellationReason?: string) => void;
  createdBookings?: Booking[];
  onBookingsCountChange?: (count: number) => void;
}

export function Bookings({ onMoveToApprovals, onMoveToRequested, onMoveToHistory, createdBookings = [], onBookingsCountChange }: BookingsProps) {
  const navigate = useNavigate();
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  
  // View state
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelDateFrom, setTravelDateFrom] = useState("");
  const [travelDateTo, setTravelDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State for standard bookings from UserStandardItinerary
  const [standardBookingsFromUser, setStandardBookingsFromUser] = useState<Booking[]>([]);

  // Edit modal states for Standard bookings
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    email: "",
    mobile: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelers: "1",
  });

  // Modal states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [moveToApprovalsDialogOpen, setMoveToApprovalsDialogOpen] = useState(false);
  const [moveToRequestedDialogOpen, setMoveToRequestedDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [bookingToMoveToApprovals, setBookingToMoveToApprovals] = useState<Booking | null>(null);
  const [bookingToMoveToRequested, setBookingToMoveToRequested] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([
    // 2026 Bookings
    {
      id: "BK-2026-001",
      customer: "Sofia Villanueva",
      email: "sofia.villanueva@email.com",
      mobile: "+63 915 234 5678",
      destination: "Batanes, Cagayan Valley",
      itinerary: "Batanes 6-Day Cultural Immersion",
      startDate: "2026-03-15",
      endDate: "2026-03-21",
      travelers: 2,
      totalAmount: 48000,
      paid: 48000,
      paymentStatus: "Paid",
      bookedDate: "2024-10-14",
      bookedDateObj: new Date("2024-10-14"),
      status: "active",
      bookingType: "Customized",
      tourType: "Private",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Basco Exploration",
          activities: [
            { time: "10:00 AM", icon: Plane, title: "Arrival at Basco Airport", description: "Meet local guide", location: "Basco Airport" },
            { time: "11:30 AM", icon: Hotel, title: "Hotel Check-in", description: "Check-in at traditional Ivatan homestay", location: "Basco Town" },
            { time: "2:00 PM", icon: Camera, title: "Basco Lighthouse", description: "Visit historic lighthouse with panoramic views", location: "Naidi Hills" },
            { time: "5:00 PM", icon: Camera, title: "Sunset at Valugan Boulder Beach", description: "Marvel at unique rock formations", location: "Valugan Beach" },
          ],
        },
        {
          day: 2,
          title: "North Batan Tour",
          activities: [
            { time: "7:00 AM", icon: UtensilsCrossed, title: "Traditional Breakfast", description: "Taste authentic Ivatan cuisine", location: "Homestay" },
            { time: "9:00 AM", icon: Camera, title: "Rakuh-a-Payaman", description: "Rolling hills viewpoint", location: "Mahatao" },
            { time: "11:00 AM", icon: Camera, title: "Marlboro Hills", description: "Scenic grasslands", location: "Racuh a Payaman" },
            { time: "1:00 PM", icon: UtensilsCrossed, title: "Lunch", description: "Local restaurant", location: "Basco" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-002",
      customer: "Miguel Santos",
      email: "miguel.santos@email.com",
      mobile: "+63 926 789 0123",
      destination: "Vigan, Ilocos Sur",
      itinerary: "Vigan 4-Day Heritage Walk",
      startDate: "2026-05-10",
      endDate: "2026-05-14",
      travelers: 4,
      totalAmount: 36000,
      paid: 18000,
      paymentStatus: "Partial",
      bookedDate: "2024-10-13",
      bookedDateObj: new Date("2024-10-13"),
      status: "active",
      bookingType: "Standard",
      itineraryDetails: [
        {
          day: 1,
          title: "Heritage City Arrival",
          activities: [
            { time: "8:00 AM", icon: Car, title: "Departure from Manila", description: "Travel to Vigan", location: "Manila" },
            { time: "4:00 PM", icon: Hotel, title: "Check-in", description: "Heritage hotel check-in", location: "Calle Crisologo" },
            { time: "6:00 PM", icon: Camera, title: "Kalesa Ride", description: "Horse-drawn carriage tour", location: "Heritage Village" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-003",
      customer: "Katrina Dela Rosa",
      email: "katrina.delarosa@email.com",
      mobile: "+63 917 456 7890",
      destination: "Sagada, Mountain Province",
      itinerary: "Sagada 5-Day Mountain Adventure",
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      travelers: 3,
      totalAmount: 27500,
      paid: 27500,
      paymentStatus: "Paid",
      bookedDate: "2024-10-13",
      bookedDateObj: new Date("2024-10-13"),
      status: "active",
      bookingType: "Customized",
      tourType: "Joiner",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Cave Exploration",
          activities: [
            { time: "6:00 AM", icon: Car, title: "Depart from Baguio", description: "Scenic mountain drive", location: "Baguio City" },
            { time: "10:00 AM", icon: Hotel, title: "Check-in", description: "Lodge check-in", location: "Sagada Town" },
            { time: "2:00 PM", icon: Camera, title: "Sumaguing Cave", description: "Cave spelunking adventure", location: "Sumaguing Cave" },
          ],
        },
        {
          day: 2,
          title: "Sunrise & Waterfalls",
          activities: [
            { time: "5:00 AM", icon: Camera, title: "Kiltepan Sunrise", description: "Sea of clouds viewpoint", location: "Kiltepan Peak" },
            { time: "9:00 AM", icon: UtensilsCrossed, title: "Breakfast", description: "Breakfast at lodge", location: "Lodge" },
            { time: "11:00 AM", icon: Camera, title: "Bomod-ok Falls", description: "Waterfall trek", location: "Bomod-ok Falls" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-004",
      customer: "Ramon Cruz",
      email: "ramon.cruz@email.com",
      mobile: "+63 928 901 2345",
      destination: "Camiguin, Northern Mindanao",
      itinerary: "Camiguin 7-Day Island Paradise",
      startDate: "2026-07-05",
      endDate: "2026-07-12",
      travelers: 2,
      totalAmount: 42000,
      paid: 0,
      paymentStatus: "Unpaid",
      bookedDate: "2024-10-14",
      bookedDateObj: new Date("2024-10-14"),
      status: "active",
      bookingType: "Customized",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Hot Springs",
          activities: [
            { time: "11:00 AM", icon: Plane, title: "Arrival at Camiguin Airport", description: "Airport pickup", location: "Camiguin Airport" },
            { time: "12:30 PM", icon: Hotel, title: "Resort Check-in", description: "Beachfront resort", location: "White Island Area" },
            { time: "3:00 PM", icon: Camera, title: "Ardent Hot Springs", description: "Natural hot spring pools", location: "Ardent Hot Springs" },
          ],
        },
        {
          day: 2,
          title: "Waterfalls & Sunken Cemetery",
          activities: [
            { time: "8:00 AM", icon: UtensilsCrossed, title: "Breakfast", description: "Breakfast at resort", location: "Resort" },
            { time: "10:00 AM", icon: Camera, title: "Katibawasan Falls", description: "Majestic waterfall visit", location: "Katibawasan Falls" },
            { time: "2:00 PM", icon: Camera, title: "Sunken Cemetery", description: "Unique underwater cemetery", location: "Bonbon" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-005",
      customer: "Elena Martinez",
      email: "elena.martinez@email.com",
      mobile: "+63 919 012 3456",
      destination: "Coron, Palawan",
      itinerary: "Coron 5-Day Diving Experience",
      startDate: "2026-08-12",
      endDate: "2026-08-17",
      travelers: 2,
      totalAmount: 38500,
      paid: 19250,
      paymentStatus: "Partial",
      bookedDate: "2024-10-14",
      bookedDateObj: new Date("2024-10-14"),
      status: "active",
      bookingType: "Standard",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Orientation",
          activities: [
            { time: "10:00 AM", icon: Plane, title: "Arrival at Busuanga Airport", description: "Transfer to Coron town", location: "Busuanga Airport" },
            { time: "12:00 PM", icon: Hotel, title: "Hotel Check-in", description: "Waterfront hotel", location: "Coron Town" },
            { time: "3:00 PM", icon: Camera, title: "Mt. Tapyas Sunset Climb", description: "360-degree views", location: "Mt. Tapyas" },
          ],
        },
        {
          day: 2,
          title: "Wreck Diving Day",
          activities: [
            { time: "7:00 AM", icon: UtensilsCrossed, title: "Early Breakfast", description: "Pre-dive meal", location: "Hotel" },
            { time: "8:30 AM", icon: Plane, title: "Wreck Diving", description: "Japanese shipwrecks exploration", location: "Coron Bay" },
            { time: "1:00 PM", icon: UtensilsCrossed, title: "Lunch on Boat", description: "Fresh seafood", location: "Dive Boat" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-006",
      customer: "Patrick Lim",
      email: "patrick.lim@email.com",
      mobile: "+63 920 123 4567",
      destination: "Banaue, Ifugao",
      itinerary: "Banaue 4-Day Rice Terraces Trek",
      startDate: "2026-09-08",
      endDate: "2026-09-12",
      travelers: 1,
      totalAmount: 24500,
      paid: 24500,
      paymentStatus: "Paid",
      bookedDate: "2024-10-13",
      bookedDateObj: new Date("2024-10-13"),
      status: "active",
      bookingType: "Requested",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Viewpoint",
          activities: [
            { time: "6:00 AM", icon: Car, title: "Depart from Manila", description: "9-hour scenic drive", location: "Manila" },
            { time: "3:00 PM", icon: Hotel, title: "Check-in at Inn", description: "Traditional Ifugao inn", location: "Banaue Town" },
            { time: "5:00 PM", icon: Camera, title: "Banaue Viewpoint", description: "UNESCO World Heritage Site", location: "Banaue Rice Terraces" },
          ],
        },
        {
          day: 2,
          title: "Batad Rice Terraces Trek",
          activities: [
            { time: "7:00 AM", icon: UtensilsCrossed, title: "Breakfast", description: "Traditional breakfast", location: "Inn" },
            { time: "8:30 AM", icon: Car, title: "Travel to Batad Junction", description: "Jeepney ride", location: "Batad" },
            { time: "10:00 AM", icon: Camera, title: "Batad Terraces Trek", description: "Hike through ancient terraces", location: "Batad Amphitheater" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-007",
      customer: "Jessica Ramos",
      email: "jessica.ramos@email.com",
      mobile: "+63 927 234 5678",
      destination: "Hundred Islands, Pangasinan",
      itinerary: "Hundred Islands 3-Day Beach Hopping",
      startDate: "2026-10-15",
      endDate: "2026-10-18",
      travelers: 5,
      totalAmount: 52500,
      paid: 26250,
      paymentStatus: "Partial",
      bookedDate: "2024-10-14",
      bookedDateObj: new Date("2024-10-14"),
      status: "active",
      bookingType: "Standard",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & Island Hopping",
          activities: [
            { time: "7:00 AM", icon: Car, title: "Depart from Manila", description: "Travel to Alaminos", location: "Manila" },
            { time: "12:00 PM", icon: Hotel, title: "Check-in", description: "Beachfront hotel", location: "Lucap Wharf" },
            { time: "2:00 PM", icon: Plane, title: "Island Hopping", description: "Visit Governor's, Quezon, Children's Islands", location: "Hundred Islands" },
          ],
        },
        {
          day: 2,
          title: "Water Activities",
          activities: [
            { time: "8:00 AM", icon: UtensilsCrossed, title: "Breakfast", description: "Hotel breakfast", location: "Hotel" },
            { time: "9:30 AM", icon: Camera, title: "Snorkeling & Kayaking", description: "Water sports at various islands", location: "Hundred Islands" },
            { time: "1:00 PM", icon: UtensilsCrossed, title: "Lunch", description: "Picnic lunch on island", location: "Marcos Island" },
          ],
        },
      ],
    },
    {
      id: "BK-2026-008",
      customer: "Daniel Aquino",
      email: "daniel.aquino@email.com",
      mobile: "+63 918 345 6789",
      destination: "Davao City, Davao del Sur",
      itinerary: "Davao 6-Day Food and Adventure",
      startDate: "2026-11-22",
      endDate: "2026-11-28",
      travelers: 3,
      totalAmount: 39000,
      paid: 39000,
      paymentStatus: "Paid",
      bookedDate: "2024-10-13",
      bookedDateObj: new Date("2024-10-13"),
      status: "active",
      bookingType: "Customized",
      itineraryDetails: [
        {
          day: 1,
          title: "Arrival & City Tour",
          activities: [
            { time: "10:00 AM", icon: Plane, title: "Arrival at Davao Airport", description: "Meet tour guide", location: "Francisco Bangoy Airport" },
            { time: "12:00 PM", icon: Hotel, title: "Hotel Check-in", description: "City center hotel", location: "Davao City" },
            { time: "2:00 PM", icon: Camera, title: "People's Park", description: "Visit cultural park", location: "People's Park" },
            { time: "6:00 PM", icon: UtensilsCrossed, title: "Durian Tasting", description: "Try the king of fruits", location: "Roxas Night Market" },
          ],
        },
        {
          day: 2,
          title: "Philippine Eagle & Samal Island",
          activities: [
            { time: "8:00 AM", icon: UtensilsCrossed, title: "Breakfast", description: "Hotel breakfast", location: "Hotel" },
            { time: "9:30 AM", icon: Camera, title: "Philippine Eagle Center", description: "See the national bird", location: "Malagos" },
            { time: "1:00 PM", icon: Plane, title: "Samal Island", description: "Beach resort day trip", location: "Island Garden City of Samal" },
          ],
        },
      ],
    },
  ]);

  // Load standard bookings from localStorage that were created in UserStandardItinerary
  useEffect(() => {
    const savedAdminBookings = localStorage.getItem('adminStandardBookings');
    if (savedAdminBookings) {
      const adminBookings = JSON.parse(savedAdminBookings);
      // Convert to Booking format
      const converted: Booking[] = adminBookings.map((booking: any) => ({
        id: booking.id,
        customer: booking.customer,
        email: booking.email,
        mobile: booking.mobile,
        destination: booking.destination,
        itinerary: booking.itinerary,
        startDate: booking.dates.split(' – ')[0],
        endDate: booking.dates.split(' – ')[1] || booking.dates.split(' – ')[0],
        travelers: booking.travelers,
        totalAmount: parseInt(booking.amount.replace(/[₱,]/g, '')),
        paid: 0,
        paymentStatus: "Unpaid",
        bookedDate: booking.bookingDate,
        bookedDateObj: new Date(booking.bookingDate),
        status: "active",
        bookingType: "Standard" as const,
        tourType: booking.tourType,
      }));
      setStandardBookingsFromUser(converted);
    }
  }, []);

  // Merge created bookings from Itinerary page and standard bookings from users
  useEffect(() => {
    const allNewBookings = [...createdBookings, ...standardBookingsFromUser];
    if (allNewBookings.length > 0) {
      setBookings(prevBookings => {
        const existingIds = new Set(prevBookings.map(b => b.id));
        const newBookings = allNewBookings.filter(b => !existingIds.has(b.id));
        return [...newBookings, ...prevBookings];
      });
    }
  }, [createdBookings, standardBookingsFromUser]);

  // Check for completed bookings (past travel dates) automatically
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedBookings = bookings.filter(booking => {
      const endDate = new Date(booking.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    });
    
    if (completedBookings.length > 0) {
      completedBookings.forEach(booking => {
        onMoveToHistory(booking, "completed");
      });
      
      setBookings(prevBookings => 
        prevBookings.filter(booking => {
          const endDate = new Date(booking.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        })
      );
    }
  }, [bookings, onMoveToHistory]);

  // Update active bookings count in parent
  useEffect(() => {
    if (onBookingsCountChange) {
      onBookingsCountChange(bookings.length);
    }
  }, [bookings, onBookingsCountChange]);

  // Update breadcrumbs based on view mode
  useEffect(() => {
    if (viewMode === "detail" && selectedBookingId) {
      const currentBooking = bookings.find(b => b.id === selectedBookingId);
      if (currentBooking) {
        setBreadcrumbs([
          { label: "Home", path: "/" },
          { label: "Bookings", path: "/bookings" },
          { label: `Booking ${currentBooking.id}` }
        ]);
      }
    } else {
      resetBreadcrumbs();
    }
  }, [viewMode, selectedBookingId, bookings, setBreadcrumbs, resetBreadcrumbs]);

  const itineraryData: Record<string, ItineraryDay[]> = {};

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const selectedItinerary = selectedBooking?.itineraryDetails || (selectedBookingId ? itineraryData[selectedBookingId] || [] : []);

  const activeFiltersCount = 
    (dateFrom || dateTo ? 1 : 0) + 
    (travelDateFrom || travelDateTo ? 1 : 0) + 
    (minAmount || maxAmount ? 1 : 0);

  const getFilteredBookings = () => {
    let filtered = bookings;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(b => b.paymentStatus.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Apply booking type filter
    if (selectedTypeFilter) {
      filtered = filtered.filter(b => b.bookingType === selectedTypeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter(b => {
        const bookingDate = b.bookedDateObj;
        if (dateFrom && dateTo) {
          return bookingDate >= new Date(dateFrom) && bookingDate <= new Date(dateTo);
        } else if (dateFrom) {
          return bookingDate >= new Date(dateFrom);
        } else if (dateTo) {
          return bookingDate <= new Date(dateTo);
        }
        return true;
      });
    }

    if (travelDateFrom || travelDateTo) {
      filtered = filtered.filter(b => {
        const travelDate = new Date(b.startDate);
        if (travelDateFrom && travelDateTo) {
          return travelDate >= new Date(travelDateFrom) && travelDate <= new Date(travelDateTo);
        } else if (travelDateFrom) {
          return travelDate >= new Date(travelDateFrom);
        } else if (travelDateTo) {
          return travelDate <= new Date(travelDateTo);
        }
        return true;
      });
    }

    if (minAmount || maxAmount) {
      filtered = filtered.filter(b => {
        if (minAmount && maxAmount) {
          return b.totalAmount >= Number(minAmount) && b.totalAmount <= Number(maxAmount);
        } else if (minAmount) {
          return b.totalAmount >= Number(minAmount);
        } else if (maxAmount) {
          return b.totalAmount <= Number(maxAmount);
        }
        return true;
      });
    }

    if (sortOrder === "newest") {
      filtered = [...filtered].sort((a, b) => b.bookedDateObj.getTime() - a.bookedDateObj.getTime());
    } else if (sortOrder === "oldest") {
      filtered = [...filtered].sort((a, b) => a.bookedDateObj.getTime() - b.bookedDateObj.getTime());
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Calculate paginated bookings
  const indexOfLastBooking = currentPage * itemsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

  // Reset to page 1 when filters/search/sort/tab changes
  const handleFilterChange = () => {
    setCurrentPage(1);
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

  const getTripStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[#10B981]/20";
      case "ongoing":
        return "bg-[rgba(10,122,255,0.1)] text-[#0A7AFF] border-[#0A7AFF]/20";
      default:
        return "bg-[#F8FAFB] text-[#64748B] border-[#E5E7EB]";
    }
  };

  const totalBookings = bookings.length;  // Total bookings count (non-filtered)
  const activeBookingsCount = filteredBookings.length;
  const customizedCount = filteredBookings.filter(b => b.bookingType === "Customized").length;
  const standardCount = filteredBookings.filter(b => b.bookingType === "Standard").length;
  const requestedCount = filteredBookings.filter(b => b.bookingType === "Requested").length;

  const getActiveBookingsLabel = () => {
    switch (selectedStatus) {
      case "paid":
        return "Paid Bookings";
      case "partial":
        return "Partial Bookings";
      case "unpaid":
        return "Unpaid Bookings";
      default:
        return "Active Bookings";
    }
  };

  // Handle stat card click for filtering
  const handleStatCardClick = (type: string | null) => {
    if (selectedTypeFilter === type) {
      setSelectedTypeFilter(null); // Deselect if clicking the same filter
    } else {
      setSelectedTypeFilter(type);
    }
    setCurrentPage(1);
  };

  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    handleFilterChange();
  };

  const handleApplyFilters = () => {
    setFilterOpen(false);
    handleFilterChange();
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setTravelDateFrom("");
    setTravelDateTo("");
    setMinAmount("");
    setMaxAmount("");
    handleFilterChange();
  };

  const handleExportPDF = () => {
    const exportData = filteredBookings.map(booking => ({
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
      bookingtype: booking.bookingType || 'N/A',
    }));
    exportToPDF(exportData, "Bookings Report", ["ID", "Customer", "Email", "Mobile", "Destination", "Start Date", "End Date", "Travelers", "Total Amount", "Payment Status", "Booking Type"]);
    toast.success("Exporting bookings as PDF...");
  };

  const handleExportExcel = () => {
    const exportData = filteredBookings.map(booking => ({
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
      bookingtype: booking.bookingType || 'N/A',
    }));
    exportToExcel(exportData, "Bookings Report", ["ID", "Customer", "Email", "Mobile", "Destination", "Start Date", "End Date", "Travelers", "Total Amount", "Payment Status", "Booking Type"]);
    toast.success("Exporting bookings as Excel...");
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditFormData({
      customerName: booking.customer,
      email: booking.email,
      mobile: booking.mobile,
      travelDateFrom: booking.startDate,
      travelDateTo: booking.endDate,
      travelers: booking.travelers.toString(),
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!bookingToEdit || !editFormData.customerName || !editFormData.email || !editFormData.mobile || !editFormData.travelDateFrom || !editFormData.travelDateTo) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedBookings = bookings.map(b => {
      if (b.id === bookingToEdit.id) {
        return {
          ...b,
          customer: editFormData.customerName,
          email: editFormData.email,
          mobile: editFormData.mobile,
          startDate: editFormData.travelDateFrom,
          endDate: editFormData.travelDateTo,
          travelers: parseInt(editFormData.travelers),
          totalAmount: b.totalAmount / b.travelers * parseInt(editFormData.travelers),
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    setEditModalOpen(false);
    setBookingToEdit(null);
    setEditFormData({
      customerName: "",
      email: "",
      mobile: "",
      travelDateFrom: "",
      travelDateTo: "",
      travelers: "1",
    });
    toast.success(`Booking ${bookingToEdit.id} updated successfully!`);
  };

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
  };

  const handleMoveToApprovalsClick = (booking: Booking) => {
    setBookingToMoveToApprovals(booking);
    setMoveToApprovalsDialogOpen(true);
  };

  const handleConfirmMoveToApprovals = () => {
    if (bookingToMoveToApprovals) {
      setBookings(bookings.filter(b => b.id !== bookingToMoveToApprovals.id));
      onMoveToApprovals(bookingToMoveToApprovals);
      toast.success(`Booking ${bookingToMoveToApprovals.id} moved to Booking Approval successfully!`);
      setMoveToApprovalsDialogOpen(false);
      setBookingToMoveToApprovals(null);
      
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedBookingId(null);
      }
    }
  };

  const handleMoveToRequestedClick = (booking: Booking) => {
    setBookingToMoveToRequested(booking);
    setMoveToRequestedDialogOpen(true);
  };

  const handleConfirmMoveToRequested = () => {
    if (bookingToMoveToRequested) {
      setBookings(bookings.filter(b => b.id !== bookingToMoveToRequested.id));
      onMoveToRequested(bookingToMoveToRequested);
      toast.success(`Booking ${bookingToMoveToRequested.id} moved to Requested Bookings successfully!`);
      setMoveToRequestedDialogOpen(false);
      setBookingToMoveToRequested(null);
      
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedBookingId(null);
      }
    }
  };

  const handleCompleteClick = (booking: Booking) => {
    setBookingToComplete(booking);
    setCompleteDialogOpen(true);
  };

  const handleConfirmComplete = () => {
    if (bookingToComplete) {
      setBookings(bookings.filter(b => b.id !== bookingToComplete.id));
      onMoveToHistory(bookingToComplete, "completed");
      toast.success(`Booking ${bookingToComplete.id} marked as completed successfully!`);
      setCompleteDialogOpen(false);
      setBookingToComplete(null);
      
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedBookingId(null);
      }
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (bookingToCancel) {
      setBookings(bookings.filter(b => b.id !== bookingToCancel.id));
      onMoveToHistory(bookingToCancel, "cancelled", cancellationReason);
      toast.success(`Booking ${bookingToCancel.id} cancelled successfully!`);
      setCancelDialogOpen(false);
      
      const cancelledBookingId = bookingToCancel.id;
      setBookingToCancel(null);
      setCancellationReason("");
      
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedBookingId(null);
      }
      
      // Redirect to History page with cancelled tab and scroll to the booking
      navigate("/history", {
        state: {
          scrollToId: cancelledBookingId,
          activeTab: "cancelled"
        }
      });
    }
  };

  const handlePaymentStatusChange = (bookingId: string, newStatus: string) => {
    setBookings(bookings.map(b => 
      b.id === bookingId 
        ? { 
            ...b, 
            paymentStatus: newStatus,
            paid: newStatus === "Paid" ? b.totalAmount : newStatus === "Partial" ? b.totalAmount / 2 : 0
          }
        : b
    ));
  };

  const handlePaidAmountChange = (bookingId: string, newAmount: number) => {
    setBookings(bookings.map(b => 
      b.id === bookingId 
        ? { ...b, paid: newAmount }
        : b
    ));
  };

  // Render detailed booking view
  if (viewMode === "detail" && selectedBooking) {
    return (
      <div className="space-y-6">
        {/* Booking Header Card */}
        <div className="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold">{selectedBooking.itinerary}</h1>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4" />
                <span className="text-lg">{selectedBooking.destination}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">Booking ID</p>
              <p className="text-2xl font-semibold">{selectedBooking.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Calendar className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">Travel Dates</p>
              <p className="font-medium">{formatDateRange(selectedBooking.startDate, selectedBooking.endDate)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Users className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">Travelers</p>
              <p className="font-medium">{selectedBooking.travelers} {selectedBooking.travelers > 1 ? 'People' : 'Person'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <CreditCard className="w-5 h-5 mb-2 text-white/80" />
              <p className="text-white/80 text-xs mb-1">Total Amount</p>
              <p className="font-medium">₱{selectedBooking.totalAmount.toLocaleString()}</p>
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#1A2B4F]">Customer Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Full Name</p>
                  <p className="text-[#1A2B4F] font-medium">{selectedBooking.customer}</p>
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#1A2B4F]">Payment Details</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="payment-status" className="text-[#1A2B4F] mb-2 block">Payment Status</Label>
                  <Select 
                    value={selectedBooking.paymentStatus} 
                    onValueChange={(value) => handlePaymentStatusChange(selectedBooking.id, value)}
                  >
                    <SelectTrigger id="payment-status" className="h-11 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#64748B]">Total Amount</span>
                    <span className="font-semibold text-[#1A2B4F]">₱{selectedBooking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#64748B]">Amount Paid</span>
                    {selectedBooking.paymentStatus === "Partial" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">₱</span>
                        <Input
                          type="number"
                          value={selectedBooking.paid}
                          onChange={(e) => {
                            const newPaid = Math.min(Number(e.target.value), selectedBooking.totalAmount);
                            setBookings(bookings.map(b => 
                              b.id === selectedBooking.id 
                                ? { ...b, paid: Math.max(0, newPaid) }
                                : b
                            ));
                          }}
                          className="w-32 h-8 text-sm font-semibold text-[#10B981] text-right"
                          min="0"
                          max={selectedBooking.totalAmount}
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-[#10B981]">₱{selectedBooking.paid.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                    <span className="text-sm font-medium text-[#1A2B4F]">Balance</span>
                    <span className="font-semibold text-[#FF6B6B]">₱{(selectedBooking.totalAmount - selectedBooking.paid).toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-[#64748B] mb-2">
                    <span>Payment Progress</span>
                    <span>{Math.round((selectedBooking.paid / selectedBooking.totalAmount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] transition-all duration-300"
                      style={{ width: `${(selectedBooking.paid / selectedBooking.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-3">
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
                      dates: formatDateRange(selectedBooking.startDate, selectedBooking.endDate),
                      travelers: selectedBooking.travelers,
                      total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                      bookedDate: selectedBooking.bookedDate,
                    };
                    exportBookingDetailToPDF(bookingData, selectedItinerary);
                    toast.success("Exporting booking as PDF...");
                  }}
                  className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#FF6B6B] font-medium transition-all"
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
                      dates: formatDateRange(selectedBooking.startDate, selectedBooking.endDate),
                      travelers: selectedBooking.travelers,
                      total: `₱${selectedBooking.totalAmount.toLocaleString()}`,
                      bookedDate: selectedBooking.bookedDate,
                    };
                    exportBookingDetailToExcel(bookingData, selectedItinerary);
                    toast.success("Exporting booking as Excel...");
                  }}
                  className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#10B981] font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>

              {selectedBooking.bookingType === "Standard" ? (
                <button
                  onClick={() => handleEditBooking(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(10,122,255,0.35)] transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Booking
                </button>
              ) : selectedBooking.bookingType === "Requested" ? (
                <button
                  onClick={() => handleMoveToRequestedClick(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(10,122,255,0.35)] transition-all"
                >
                  <Package className="w-4 h-4" />
                  Move to Requested
                </button>
              ) : (
                <button
                  onClick={() => handleMoveToApprovalsClick(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(10,122,255,0.35)] transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Move to Approvals
                </button>
              )}
              {selectedBooking.tripStatus !== "completed" && selectedBooking.paymentStatus === "Paid" && (
                <button
                  onClick={() => handleCompleteClick(selectedBooking)}
                  className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}
              <button
                onClick={() => handleCancelClick(selectedBooking)}
                className="w-full h-11 px-4 rounded-xl border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center gap-2 font-medium transition-all"
              >
                <X className="w-4 h-4" />
                Cancel Booking
              </button>
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
            <ItineraryDetailDisplay itinerary={selectedItinerary} />
          </div>
        </div>

        {/* Complete Trip Modal */}
        <ConfirmationModal
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          title="Mark Trip as Complete"
          description="Confirm that this trip has been successfully completed."
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#10B981] to-[#34D399]"
          iconShadow="shadow-[#10B981]/20"
          contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.12)]"
          contentBorder="border-[rgba(16,185,129,0.2)]"
          content={
            bookingToComplete && (
              <>
                <p className="text-sm text-[#334155] leading-relaxed mb-4">
                  Are you sure you want to mark the trip for <span className="font-semibold text-[#10B981]">{bookingToComplete.customer}</span> as completed?
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(16,185,129,0.2)]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                    <p className="text-sm font-semibold text-[#0A7AFF]">{bookingToComplete.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Destination</p>
                    <p className="text-sm font-medium text-[#334155]">{bookingToComplete.destination}</p>
                  </div>
                </div>
              </>
            )
          }
          onConfirm={handleConfirmComplete}
          onCancel={() => setCompleteDialogOpen(false)}
          confirmText="Mark as Complete"
          cancelText="Cancel"
          confirmVariant="success"
        />

        {/* Cancel Booking Dialog */}
        <ConfirmationModal
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancel Booking"
          description="Confirm that you want to cancel this booking. This action will move the booking to history."
          icon={<X className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
          iconShadow="shadow-[#FF6B6B]/20"
          contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.08)] to-[rgba(255,107,107,0.12)]"
          contentBorder="border-[rgba(255,107,107,0.2)]"
          content={
            bookingToCancel && (
              <>
                <p className="text-sm text-[#334155] leading-relaxed mb-4">
                  Are you sure you want to cancel the booking for <span className="font-semibold text-[#FF6B6B]">{bookingToCancel.customer}</span>?
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4 pb-3 border-b border-[rgba(255,107,107,0.2)]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                    <p className="text-sm font-semibold text-[#0A7AFF]">{bookingToCancel.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Destination</p>
                    <p className="text-sm font-medium text-[#334155]">{bookingToCancel.destination}</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="cancellation-reason" className="text-[#1A2B4F] mb-2 block">
                    Reason for Cancellation
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="Enter reason for cancellation..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="min-h-[80px] rounded-xl border-2 border-[#E5E7EB] focus:border-[#FF6B6B] focus:ring-4 focus:ring-[rgba(255,107,107,0.1)] transition-all"
                    rows={3}
                  />
                </div>
              </>
            )
          }
          onConfirm={handleConfirmCancel}
          onCancel={() => {
            setCancelDialogOpen(false);
            setCancellationReason("");
          }}
          confirmText="Cancel Booking"
          cancelText="Go Back"
          confirmVariant="destructive"
        />

        {/* Edit Standard Booking Modal */}
        <ConfirmationModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title="Edit Booking"
          description="Update the booking details for this standard itinerary."
          icon={<Edit className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
          iconShadow="shadow-[#0A7AFF]/20"
          contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.05)] to-[rgba(20,184,166,0.05)]"
          contentBorder="border-[rgba(10,122,255,0.2)]"
          content={
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-customerName" className="text-[#1A2B4F] mb-2 block">
                  Customer Name <span className="text-[#FF6B6B]">*</span>
                </Label>
                <Input
                  id="edit-customerName"
                  value={editFormData.customerName}
                  onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-[#1A2B4F] mb-2 block">
                  Email Address <span className="text-[#FF6B6B]">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="customer@email.com"
                  className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                />
              </div>
              <div>
                <Label htmlFor="edit-mobile" className="text-[#1A2B4F] mb-2 block">
                  Mobile Number <span className="text-[#FF6B6B]">*</span>
                </Label>
                <Input
                  id="edit-mobile"
                  type="tel"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                  className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-travelDateFrom" className="text-[#1A2B4F] mb-2 block">
                    Travel Start Date <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="edit-travelDateFrom"
                    type="date"
                    value={editFormData.travelDateFrom}
                    onChange={(e) => setEditFormData({ ...editFormData, travelDateFrom: e.target.value })}
                    className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-travelDateTo" className="text-[#1A2B4F] mb-2 block">
                    Travel End Date <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="edit-travelDateTo"
                    type="date"
                    value={editFormData.travelDateTo}
                    onChange={(e) => setEditFormData({ ...editFormData, travelDateTo: e.target.value })}
                    className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-travelers" className="text-[#1A2B4F] mb-2 block">
                  Number of Travelers <span className="text-[#FF6B6B]">*</span>
                </Label>
                <Input
                  id="edit-travelers"
                  type="number"
                  min="1"
                  value={editFormData.travelers}
                  onChange={(e) => setEditFormData({ ...editFormData, travelers: e.target.value })}
                  className="h-11 border-[#E5E7EB] focus:border-[#14B8A6] focus:ring-[#14B8A6]/10"
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
              travelDateFrom: "",
              travelDateTo: "",
              travelers: "1",
            });
          }}
          confirmText="Save Changes"
          cancelText="Cancel"
          confirmVariant="default"
        />

        {/* Move to Requested Dialog */}
        <Dialog open={moveToRequestedDialogOpen} onOpenChange={setMoveToRequestedDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Move to Requested #{bookingToMoveToRequested?.id}
              </DialogTitle>
              <DialogDescription>
                This booking will be moved to the Requested tab in Itinerary page.
              </DialogDescription>
            </DialogHeader>
            
            {bookingToMoveToRequested && (
              <div className="px-8 py-6">
                <div className="bg-gradient-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)] border border-[rgba(10,122,255,0.2)] rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A7AFF]/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <p className="text-sm text-[#334155] leading-relaxed mb-4">
                      Move booking for <span className="font-semibold text-[#0A7AFF]">{bookingToMoveToRequested.customer}</span> to Requested Itinerary tab?
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                        <p className="text-sm font-semibold text-[#0A7AFF]">{bookingToMoveToRequested.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Destination</p>
                        <p className="text-sm font-medium text-[#334155]">{bookingToMoveToRequested.destination}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Travel Date</p>
                        <p className="text-sm font-medium text-[#334155]">{formatDateRange(bookingToMoveToRequested.startDate, bookingToMoveToRequested.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                        <p className="text-sm font-semibold text-[#1A2B4F]">₱{bookingToMoveToRequested.totalAmount.toLocaleString()}</p>
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
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] hover:from-[#0865CC] hover:to-[#0F9B8E] shadow-lg shadow-[#0A7AFF]/25 text-white"
              >
                <Package className="w-4 h-4 mr-2" />
                Move to Requested
              </ShadcnButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move to Approvals Confirmation Modal */}
        <ConfirmationModal
          open={moveToApprovalsDialogOpen}
          onOpenChange={setMoveToApprovalsDialogOpen}
          title="Move to Approvals"
          description="This booking will be moved to the Approvals page for review."
          icon={<RotateCcw className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
          iconShadow="shadow-[#0A7AFF]/20"
          contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.08)] to-[rgba(20,184,166,0.12)]"
          contentBorder="border-[rgba(10,122,255,0.2)]"
          content={
            bookingToMoveToApprovals && (
              <>
                <p className="text-sm text-[#334155] leading-relaxed mb-4">
                  Move booking for <span className="font-semibold text-[#0A7AFF]">{bookingToMoveToApprovals.customer}</span> to Approvals for re-review?
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(10,122,255,0.2)]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Booking ID</p>
                    <p className="text-sm font-semibold text-[#0A7AFF]">{bookingToMoveToApprovals.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Destination</p>
                    <p className="text-sm font-medium text-[#334155]">{bookingToMoveToApprovals.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Travel Date</p>
                    <p className="text-sm font-medium text-[#334155]">{formatDateRange(bookingToMoveToApprovals.startDate, bookingToMoveToApprovals.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Total Amount</p>
                    <p className="text-sm font-semibold text-[#1A2B4F]">₱{bookingToMoveToApprovals.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </>
            )
          }
          onConfirm={handleConfirmMoveToApprovals}
          onCancel={() => setMoveToApprovalsDialogOpen(false)}
          confirmText="Move to Approvals"
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
          onClick={() => {
            setSelectedStatus("all");
            handleFilterChange();
          }}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "all"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setSelectedStatus("paid");
            handleFilterChange();
          }}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "paid"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => {
            setSelectedStatus("partial");
            handleFilterChange();
          }}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "partial"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          Partial Payment
        </button>
        <button
          onClick={() => {
            setSelectedStatus("unpaid");
            handleFilterChange();
          }}
          className={`px-5 h-11 text-sm transition-colors ${
            selectedStatus === "unpaid"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-[2px]"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          Unpaid
        </button>
      </div>

      {/* Booking Type Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div onClick={() => handleStatCardClick(null)} className="cursor-pointer">
          <StatCard
            icon={BookOpen}
            label={getActiveBookingsLabel()}
            value={activeBookingsCount}
            gradientFrom="#8B5CF6"
            gradientTo="#A78BFA"
            selected={selectedTypeFilter === null}
          />
        </div>
        <div onClick={() => handleStatCardClick("Customized")} className="cursor-pointer">
          <StatCard
            icon={Briefcase}
            label="Customized"
            value={customizedCount}
            gradientFrom="#0A7AFF"
            gradientTo="#3B9EFF"
            selected={selectedTypeFilter === "Customized"}
          />
        </div>
        <div onClick={() => handleStatCardClick("Standard")} className="cursor-pointer">
          <StatCard
            icon={FileCheck}
            label="Standard"
            value={standardCount}
            gradientFrom="#10B981"
            gradientTo="#14B8A6"
            selected={selectedTypeFilter === "Standard"}
          />
        </div>
        <div onClick={() => handleStatCardClick("Requested")} className="cursor-pointer">
          <StatCard
            icon={ClipboardList}
            label="Requested"
            value={requestedCount}
            gradientFrom="#FFB84D"
            gradientTo="#FF9800"
            selected={selectedTypeFilter === "Requested"}
          />
        </div>
      </div>

      <ContentCard 
        title={`All Bookings (${totalBookings})`}
        footer={
          filteredBookings.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              showingStart={filteredBookings.length > 0 ? indexOfFirstBooking + 1 : 0}
              showingEnd={Math.min(indexOfLastBooking, filteredBookings.length)}
            />
          ) : undefined
        }
      >
        <SearchFilterToolbar
          searchPlaceholder="Search by booking ID, customer name, or destination..."
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            handleFilterChange();
          }}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          filterOpen={filterOpen}
          onFilterOpenChange={setFilterOpen}
          activeFiltersCount={activeFiltersCount}
          filterContent={
            <BookingFilterContent
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              travelDateFrom={travelDateFrom}
              onTravelDateFromChange={setTravelDateFrom}
              travelDateTo={travelDateTo}
              onTravelDateToChange={setTravelDateTo}
              minAmount={minAmount}
              onMinAmountChange={setMinAmount}
              maxAmount={maxAmount}
              onMaxAmountChange={setMaxAmount}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
            />
          }
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">No bookings to display</p>
            </div>
          ) : (
            currentBookings.map((booking) => (
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
                        <h3 className="text-lg text-[#1A2B4F] font-semibold">Booking #{booking.id}</h3>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                        {booking.tripStatus && (
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getTripStatusColor(booking.tripStatus)}`}>
                            {booking.tripStatus.charAt(0).toUpperCase() + booking.tripStatus.slice(1)}
                          </span>
                        )}
                        {booking.bookingType && (
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                            booking.bookingType === "Customized"
                              ? "bg-[rgba(255,127,110,0.1)] text-[#FF7F6E] border-[rgba(255,127,110,0.2)]"
                              : booking.bookingType === "Standard"
                              ? "bg-[rgba(139,125,107,0.1)] text-[#8B7D6B] border-[rgba(139,125,107,0.2)]"
                              : "bg-[rgba(236,72,153,0.1)] text-[#EC4899] border-[rgba(236,72,153,0.2)]"
                          }`}>
                            {booking.bookingType}
                          </span>
                        )}
                        {booking.bookingType === "Standard" && booking.tourType && (
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                            booking.tourType === "Joiner"
                              ? "bg-[rgba(255,152,0,0.1)] text-[#FF9800] border-[rgba(255,152,0,0.2)]"
                              : "bg-[rgba(167,139,250,0.1)] text-[#A78BFA] border-[rgba(167,139,250,0.2)]"
                          }`}>
                            {booking.tourType}
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
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm text-[#334155] font-medium">{booking.customer}</span>
                    <span className="text-sm text-[#64748B]">•</span>
                    <span className="text-sm text-[#64748B]">{booking.email}</span>
                    <span className="text-sm text-[#64748B]">•</span>
                    <span className="text-sm text-[#64748B]">{booking.mobile}</span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-5 gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0A7AFF]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Destination</p>
                      <p className="text-sm text-[#334155] font-medium">{booking.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#14B8A6]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Travel Dates</p>
                      <p className="text-sm text-[#334155] font-medium">{formatDateRange(booking.startDate, booking.endDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Travelers</p>
                      <p className="text-sm text-[#334155] font-medium">{booking.travelers} {booking.travelers > 1 ? 'People' : 'Person'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981] text-lg">₱</span>
                    <div>
                      <p className="text-xs text-[#64748B]">Paid / Total</p>
                      <p className="text-sm text-[#334155] font-medium">₱{booking.paid.toLocaleString()} / ₱{booking.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Booked On</p>
                      <p className="text-sm text-[#334155] font-medium">{booking.bookedDate}</p>
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