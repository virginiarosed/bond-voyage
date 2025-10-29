import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Bookings } from "./pages/Bookings";
import { Approvals } from "./pages/Approvals";
import { History } from "./pages/History";
import { Itinerary } from "./pages/Itinerary";
import { Inquiries } from "./pages/Inquiries";
import { Feedback } from "./pages/Feedback";
import { Notifications } from "./pages/Notifications";
import { EditProfile } from "./pages/EditProfile";
import { CreateStandardItinerary } from "./pages/CreateStandardItinerary";
import { CreateRequestedItinerary } from "./pages/CreateRequestedItinerary";
import { EditRequestedItinerary } from "./pages/EditRequestedItinerary";
import { Toaster } from "./components/ui/sonner";
import { ProfileProvider } from "./components/ProfileContext";
import useAuthStore from "./store/auth";
import {
  BreadcrumbProvider,
  useBreadcrumbs,
} from "./components/BreadcrumbContext";
import LoginPage from "./pages/LoginPage";
import { useConditionalCSS } from "./hooks/useConditionalCss";

// Utility function to format dates consistently
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return `${formatDate(start)} – ${formatDate(end)}`;
};

// Shared booking types
export interface ApprovalBooking {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  duration: string;
  dates: string;
  total: string;
  travelers: number;
  urgent: boolean;
  bookedDate: string;
  rejectionReason?: string;
  rejectionResolution?: string;
}

export interface HistoryBooking {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  itinerary: string;
  dates: string;
  travelers: number;
  totalAmount: string;
  paid: string;
  bookedDate: string;
  status: "completed" | "cancelled";
  completedDate?: string;
  cancelledDate?: string;
  bookingType: string;
}

export interface BookingData {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalAmount: number;
  paid: number;
  bookedDate: string;
  bookingType: string;
  status?: string;
}

// Layout Component to handle page config and TopNav
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { breadcrumbs: contextBreadcrumbs, resetBreadcrumbs } =
    useBreadcrumbs();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem("bondvoyage-theme") || "light";
    setCurrentTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("bondvoyage-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  // Close mobile menu on route change and reset breadcrumbs
  useEffect(() => {
    setIsMobileMenuOpen(false);
    resetBreadcrumbs();
  }, [location.pathname, resetBreadcrumbs]);

  const pageConfig: Record<
    string,
    {
      title: string;
      subtitle: string;
      breadcrumbs: { label: string; path?: string }[];
    }
  > = {
    "/": {
      title: "Dashboard Overview",
      subtitle: "Welcome back, Admin! Here's what's happening today.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Dashboard" }],
    },
    "/users": {
      title: "Users Management",
      subtitle: "Manage all registered users and their permissions.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Users" }],
    },
    "/bookings": {
      title: "Bookings Management",
      subtitle: "View and manage all current and approved bookings.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Bookings" }],
    },
    "/approvals": {
      title: "Bookings Approvals",
      subtitle: "Review and approve pending booking requests.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Approvals" }],
    },
    "/history": {
      title: "Booking History",
      subtitle: "View completed and cancelled bookings.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "History" }],
    },
    "/itinerary": {
      title: "Standard Itinerary",
      subtitle: "Manage and create travel itinerary templates.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Itinerary" }],
    },
    "/itinerary/create-standard": {
      title: "Create Standard Itinerary",
      subtitle: "Design a new standard itinerary template for travelers.",
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Itinerary", path: "/itinerary" },
        { label: "Create Standard" },
      ],
    },
    "/itinerary/create-requested": {
      title: "Create Requested Itinerary",
      subtitle: "Create a custom itinerary based on client request.",
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Itinerary", path: "/itinerary" },
        { label: "Create Requested" },
      ],
    },
    "/itinerary/edit-standard": {
      title: "Edit Standard Itinerary",
      subtitle: "Update and modify your existing itinerary template.",
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Itinerary", path: "/itinerary" },
        { label: "Edit Standard" },
      ],
    },
    "/itinerary/edit-requested": {
      title: "Edit Requested Booking",
      subtitle: "Update requested booking details and itinerary.",
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Itinerary", path: "/itinerary" },
        { label: "Edit Requested" },
      ],
    },
    "/profile/edit": {
      title: "Edit Profile",
      subtitle: "Manage your account information and security settings.",
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Profile" },
        { label: "Edit" },
      ],
    },
    "/inquiries": {
      title: "Client Inquiries",
      subtitle: "Manage and respond to client inquiries and questions.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Inquiries" }],
    },
    "/feedback": {
      title: "Customer Feedback",
      subtitle: "Reviews and feedback from travelers.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Feedback" }],
    },
    "/notifications": {
      title: "Notifications",
      subtitle: "Stay updated with all activities across the dashboard.",
      breadcrumbs: [{ label: "Home", path: "/" }, { label: "Notifications" }],
    },
  };

  const config = pageConfig[location.pathname] || pageConfig["/"];

  // Use context breadcrumbs if set, otherwise use page config breadcrumbs
  const displayBreadcrumbs =
    contextBreadcrumbs.length > 0 ? contextBreadcrumbs : config.breadcrumbs;

  return isAuthenticated ? (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-20 flex flex-col min-w-0">
        {/* Top Navigation - Now shown on all pages including Dashboard */}
        <TopNav
          pageTitle={config.title}
          pageSubtitle={config.subtitle}
          breadcrumbs={displayBreadcrumbs}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  ) : (
    children
  );
}

// Main Routes Component with Data Management
function AppRoutes() {
  useConditionalCSS();

  const navigate = useNavigate();
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalBooking[]>([
    {
      id: "BV-2024-091",
      customer: "Maria Santos",
      email: "maria.santos@email.com",
      mobile: "+63 917 123 4567",
      destination: "El Nido, Palawan",
      duration: "5 Days",
      dates: "December 15, 2024 – December 20, 2024",
      total: "₱45,000",
      travelers: 2,
      urgent: true,
      bookedDate: "2024-11-20",
    },
    {
      id: "BV-2024-092",
      customer: "Juan Dela Cruz",
      email: "juan.delacruz@email.com",
      mobile: "+63 918 234 5678",
      destination: "Bohol Countryside Tour",
      duration: "4 Days",
      dates: "December 22, 2024 – December 26, 2024",
      total: "₱38,500",
      travelers: 4,
      urgent: false,
      bookedDate: "2024-11-22",
    },
  ]);

  const [createdBookings, setCreatedBookings] = useState<BookingData[]>([]);
  const [standardItineraries, setStandardItineraries] = useState<any[]>([]);
  const [requestedBookingsFromBookings, setRequestedBookingsFromBookings] =
    useState<BookingData[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingItinerary, setEditingItinerary] = useState<any>(null);
  const [editingRequestedBooking, setEditingRequestedBooking] =
    useState<any>(null);
  const [editingRequestedDraft, setEditingRequestedDraft] = useState<any>(null);

  const [historyBookings, setHistoryBookings] = useState<HistoryBooking[]>([
    {
      id: "BV-2024-034",
      customer: "Carlos Mendoza",
      email: "carlos.mendoza@email.com",
      mobile: "+63 919 456 7890",
      destination: "Siargao Island, Surigao del Norte",
      itinerary: "Siargao 5-Day Surf & Island Adventure",
      dates: "August 10, 2024 – August 15, 2024",
      travelers: 2,
      totalAmount: "₱32,000",
      paid: "₱32,000",
      bookedDate: "2024-07-15",
      status: "completed",
      completedDate: "2024-08-14",
      bookingType: "Requested",
    },
    {
      id: "BV-2024-076",
      customer: "Ana Reyes",
      email: "ana.reyes@email.com",
      mobile: "+63 918 345 6789",
      destination: "Baguio City, Benguet",
      itinerary: "Baguio 7-Day Summer Getaway",
      dates: "July 5, 2024 – July 12, 2024",
      travelers: 1,
      totalAmount: "₱19,500",
      paid: "₱9,750",
      bookedDate: "2024-06-20",
      status: "cancelled",
      cancelledDate: "2024-06-25",
      bookingType: "Standard",
    },
  ]);

  // Function to move booking from Bookings to Approvals
  const moveBookingToApprovals = (booking: BookingData) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const durationDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const today = new Date();
    const daysUntilTrip = Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isUrgent = daysUntilTrip <= 7;

    const approvalBooking: ApprovalBooking = {
      id: booking.id,
      customer: booking.customer,
      email: booking.email,
      mobile: booking.mobile,
      destination: booking.destination,
      duration: `${durationDays} Days`,
      dates: formatDateRange(booking.startDate, booking.endDate),
      total: `₱${booking.totalAmount.toLocaleString()}`,
      travelers: booking.travelers,
      urgent: isUrgent,
      bookedDate: booking.bookedDate,
    };

    setPendingApprovals((prev) => [approvalBooking, ...prev]);
    navigate("/approvals");
  };

  const moveBookingToRequested = (booking: BookingData) => {
    setRequestedBookingsFromBookings((prev) => [booking, ...prev]);
    navigate("/itinerary");
  };

  const handleCreateBooking = (newBooking: BookingData) => {
    setCreatedBookings((prev) => [newBooking, ...prev]);
    navigate("/bookings");
  };

  const handleCreateStandardItinerary = (newItinerary: any) => {
    setStandardItineraries((prev) => [newItinerary, ...prev]);
    navigate("/itinerary");
  };

  const handleSaveDraft = (draft: any) => {
    setDrafts((prev) => {
      const existingIndex = prev.findIndex((d) => d.id === draft.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = draft;
        return updated;
      }
      return [draft, ...prev];
    });
  };

  const handleEditStandardItinerary = (itinerary: any) => {
    setEditingItinerary(itinerary);
    navigate("/itinerary/create-standard");
  };

  const handleUpdateStandardItinerary = (updatedItinerary: any) => {
    setStandardItineraries((prev) =>
      prev.map((it) => (it.id === updatedItinerary.id ? updatedItinerary : it))
    );
    setEditingItinerary(null);
    navigate("/itinerary");
  };

  const handleEditRequestedBooking = (booking: any) => {
    setEditingRequestedBooking(booking);
    navigate("/itinerary/edit-requested");
  };

  const handleUpdateRequestedBooking = (updatedBooking: any) => {
    setRequestedBookingsFromBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setEditingRequestedBooking(null);
    navigate("/itinerary");
  };

  const handleSaveRequestedItinerary = (newBooking: any) => {
    setRequestedBookingsFromBookings((prev) => [newBooking, ...prev]);
    setEditingRequestedDraft(null);
    navigate("/itinerary");
  };

  const handleEditRequestedDraft = (draft: any) => {
    setEditingRequestedDraft(draft);
    navigate("/itinerary/create-requested");
  };

  const moveBookingToHistory = (
    booking: BookingData,
    status: "completed" | "cancelled"
  ) => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const historyBooking: HistoryBooking = {
      id: booking.id,
      customer: booking.customer,
      email: booking.email,
      mobile: booking.mobile,
      destination: booking.destination,
      itinerary: booking.destination,
      dates: formatDateRange(booking.startDate, booking.endDate),
      travelers: booking.travelers,
      totalAmount: `₱${booking.totalAmount.toLocaleString()}`,
      paid: `₱${booking.paid.toLocaleString()}`,
      bookedDate: booking.bookedDate,
      status: status,
      completedDate: status === "completed" ? today : undefined,
      cancelledDate: status === "cancelled" ? today : undefined,
      bookingType: booking.bookingType,
    };

    setHistoryBookings((prev) => {
      const exists = prev.some((b) => b.id === booking.id);
      if (exists) {
        return prev.map((b) => (b.id === booking.id ? historyBooking : b));
      }
      return [historyBooking, ...prev];
    });
  };

  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Dashboard
            pendingApprovalsCount={pendingApprovals.length}
            historyBookings={historyBookings}
            createdBookings={createdBookings}
            activeBookingsCount={activeBookingsCount}
          />
        }
      />
      <Route path="/users" element={<Users />} />
      <Route
        path="/bookings"
        element={
          <Bookings
            onMoveToApprovals={moveBookingToApprovals}
            onMoveToRequested={moveBookingToRequested}
            onMoveToHistory={moveBookingToHistory}
            createdBookings={createdBookings}
            onBookingsCountChange={setActiveBookingsCount}
          />
        }
      />
      <Route
        path="/approvals"
        element={
          <Approvals
            pendingBookings={pendingApprovals}
            setPendingBookings={setPendingApprovals}
          />
        }
      />
      <Route
        path="/history"
        element={
          <History
            historyBookings={historyBookings}
            setHistoryBookings={setHistoryBookings}
          />
        }
      />
      <Route
        path="/itinerary"
        element={
          <Itinerary
            onCreateBooking={handleCreateBooking}
            requestedBookingsFromBookings={requestedBookingsFromBookings}
            newStandardItineraries={standardItineraries}
            drafts={drafts}
            onEditItinerary={handleEditStandardItinerary}
            onEditRequestedBooking={handleEditRequestedBooking}
            onEditRequestedDraft={handleEditRequestedDraft}
          />
        }
      />
      <Route
        path="/itinerary/create-standard"
        element={
          <CreateStandardItinerary
            onSave={
              editingItinerary
                ? handleUpdateStandardItinerary
                : handleCreateStandardItinerary
            }
            onSaveDraft={handleSaveDraft}
            initialData={editingItinerary || undefined}
          />
        }
      />
      <Route
        path="/itinerary/create-requested"
        element={
          <CreateRequestedItinerary
            onSave={handleSaveRequestedItinerary}
            onSaveDraft={handleSaveDraft}
            initialData={editingRequestedDraft || undefined}
          />
        }
      />
      <Route
        path="/itinerary/edit-requested"
        element={
          <EditRequestedItinerary
            onSave={handleUpdateRequestedBooking}
            onSaveDraft={handleSaveDraft}
            initialData={editingRequestedBooking || undefined}
          />
        }
      />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/inquiries" element={<Inquiries />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/notifications" element={<Notifications />} />
      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <BreadcrumbProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </BreadcrumbProvider>
      </ProfileProvider>
    </BrowserRouter>
  );
}
