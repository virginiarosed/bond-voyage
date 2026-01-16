import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  MapPin,
  Sparkles,
  Users,
  Calendar,
  Eye,
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Trash2,
  Edit,
  BookOpen,
  Send,
  Share2,
  QrCode,
  Download,
  Upload,
  X,
  Copy,
  Type,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Mail,
  Phone,
  MessageSquare,
  // Import all icon options from your CreateNewTravel component
  Waves,
  Mountain,
  Palmtree,
  TreePine,
  Building2,
  Ship,
  Train,
  Coffee,
  ShoppingBag,
  Music,
  Sunset,
  AlertCircle,
  Sparkles as SparklesIcon,
  CheckCircle2,
  FileText,
  Users as UsersIcon,
  DollarSign,
  Utensils,
  Home,
  Landmark,
  Church,
  Castle,
  Globe,
  Backpack,
  Luggage,
  Umbrella,
  Sun,
  Moon,
  Star,
  Heart,
  Gift,
  ShoppingCart,
  Search,
  Bus,
  Anchor,
  Bike,
  Film,
  Ticket,
  Wine,
  IceCream,
  Pizza,
  Fish,
  Salad,
  Tent,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { ContentCard } from "../../components/ContentCard";
import { BookingListCard } from "../../components/BookingListCard";
import { BookingDetailView } from "../../components/BookingDetailView";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { capitalize } from "../../utils/helpers/capitalize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useBreadcrumbs } from "../../components/BreadcrumbContext";
import { toast } from "sonner";
import { FAQAssistant } from "../../components/FAQAssistant";
import {
  useMyBookings,
  useSharedBookings,
  useBookingDetail,
  useSubmitBooking,
  useDeleteBooking,
  useUpdateBooking,
  useJoinBooking,
} from "../../hooks/useBookings";
import { Booking, User } from "../../types/types";
import { queryKeys } from "../../utils/lib/queryKeys";
import { useProfile } from "../../hooks/useAuth";
// Share token hooks removed - now using booking ID directly via useJoinBooking
import { getIconForActivity } from "../../utils/helpers/getIconForActivity";
import { QueryClient } from "@tanstack/react-query";

// Icon mapping for the new API response
const ICON_MAP: Record<string, any> = {
  relax: UtensilsCrossed,
  food: UtensilsCrossed,
  beach: Waves,
  mountain: Mountain,
  tree: TreePine,
  // Map all icon values from CreateNewTravel component
  Plane: Plane,
  Hotel: Hotel,
  Car: Car,
  Bus: Bus,
  Train: Train,
  Ship: Ship,
  Anchor: Anchor,
  Bike: Bike,
  Home: Home,
  Tent: Tent,
  UtensilsCrossed: UtensilsCrossed,
  Utensils: Utensils,
  Coffee: Coffee,
  Wine: Wine,
  IceCream: IceCream,
  Pizza: Pizza,
  Fish: Fish,
  Salad: Salad,
  Camera: Camera,
  Waves: Waves,
  Mountain: Mountain,
  Palmtree: Palmtree,
  TreePine: TreePine,
  Landmark: Landmark,
  Church: Church,
  Castle: Castle,
  Film: Film,
  Music: Music,
  Ticket: Ticket,
  ShoppingBag: ShoppingBag,
  ShoppingCart: ShoppingCart,
  MapPin: MapPin,
  Compass: AlertCircle,
  Globe: Globe,
  Backpack: Backpack,
  Luggage: Luggage,
  Package: ShoppingBag,
  Building2: Building2,
  Sunset: Sunset,
  Sun: Sun,
  Moon: Moon,
  Star: Star,
  Umbrella: Umbrella,
  Heart: Heart,
  Gift: Gift,
};

export function UserTravels() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();
  const bookingRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = new QueryClient();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [selectedTab, setSelectedTab] = useState<
    "draft" | "booked" | "pending" | "rejected" | undefined
  >("draft");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "owned" | "collaborated" | "requested"
  >("all");
  const [requestedSubTab, setRequestedSubTab] = useState<
    "all" | "confirmed" | "unconfirmed"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinTravelModal, setShowJoinTravelModal] = useState(false);
  const [joinShareToken, setJoinShareToken] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [showBookConfirmModal, setShowBookConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [showShareQRModal, setShowShareQRModal] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [joinMethod, setJoinMethod] = useState<"manual" | "scan" | "upload">(
    "manual"
  );
  const [scannedQRData, setScannedQRData] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const qrCodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: joinBooking, isPending: isAcceptingShare } = useJoinBooking({
    onSuccess: (data) => {
      toast.success("Successfully Joined!", {
        description: data.message || "You are now a collaborator on this trip.",
      });
      setShowJoinTravelModal(false);
      setJoinShareToken("");
    },
    onError: (error: any) => {
      toast.error("Failed to join travel", {
        description:
          error.response?.data?.message ||
          "Please check the Booking Code and try again",
      });
    },
  });

  const { data: profileResponse, isLoading: profileDataIsLoading } =
    useProfile();

  const profileData: User = useMemo(() => {
    return profileResponse?.data?.user
      ? profileResponse.data.user
      : {
          companyName: "",
          id: "",
          email: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          role: "USER",
          avatarUrl: "",
          middleName: "",
          mobile: "",
          isActive: true,
          createdAt: "",
          updatedAt: "",
          lastLogin: "",
          birthday: "",
          employeeId: "",
          customerRating: 0,
        };
  }, [profileResponse?.data?.user]);

  const [conversations, setConversations] = useState<
    Record<
      string,
      Array<{ sender: "user" | "admin"; message: string; time: string }>
    >
  >({});
  const [currentMessage, setCurrentMessage] = useState<Record<string, string>>(
    {}
  );

  const [bookingType, setBookingType] = useState<"REQUESTED" | "CUSTOMIZED">(
    "CUSTOMIZED"
  );

  const {
    data: myBookingsResponse,
    isLoading: isLoadingMyBookings,
    refetch: refetchMyBookings,
  } = useMyBookings({
    status: selectedTab?.toUpperCase(),
  });

  const { data: sharedBookingsResponse, isLoading: isLoadingSharedBookings } =
    useSharedBookings({
      status: selectedTab?.toUpperCase(),
    });

  const { data: selectedBookingData, isLoading: isLoadingDetail } =
    useBookingDetail(selectedBookingId || "", {
      enabled: false, // Disabled since we're using the booking from the list
      queryKey: [queryKeys.bookings.detail],
    });

  const isLoadingBookings =
    isLoadingMyBookings || isLoadingSharedBookings || profileDataIsLoading;

  const submitBookingMutation = useSubmitBooking(selectedBookingId || "", {
    onSuccess: () => {
      toast.success("Booking Submitted!", {
        description: "Your booking request has been sent for approval.",
      });
      setShowBookConfirmModal(false);
      setViewMode("list");
      setSelectedBookingId(null);
      setSelectedTab("pending");
      refetchMyBookings();
    },
    onError: (error: any) => {
      toast.error("Failed to submit booking", {
        description: error.response?.data?.message || "Please try again later",
      });
    },
  });

  const deleteBookingMutation = useDeleteBooking(selectedBookingId || "", {
    onSuccess: () => {
      toast.success("Booking Deleted", {
        description: "The travel booking has been permanently removed.",
      });
      setShowDeleteConfirmModal(false);
      setViewMode("list");
      setSelectedBookingId(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete booking", {
        description: error.response?.data?.message || "Please try again later",
      });
    },
  });

  const updateBookingMutation = useUpdateBooking(selectedBookingId || "", {
    onSuccess: (data) => {
      toast.success("Booking Updated", {
        description:
          data.message || "Your changes have been saved successfully.",
      });
      // Refresh the booking data
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bookings.detail(selectedBookingId!)],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (error: any) => {
      toast.error("Failed to update booking", {
        description: error.response?.data?.message || "Please try again later",
      });
    },
  });
  // Combine bookings from both endpoints without transformation
  const bookings = useMemo(() => {
    const ownedBookings = myBookingsResponse?.data || [];
    const sharedBookings = sharedBookingsResponse?.data || [];

    const uniqueBookings = new Map<string, any>();
    [...ownedBookings, ...sharedBookings].forEach((booking: any) => {
      uniqueBookings.set(booking.id, booking);
    });

    return Array.from(uniqueBookings.values());
  }, [myBookingsResponse?.data, sharedBookingsResponse?.data]);

  const filteredTravels = useMemo(() => {
    return bookings.filter((booking: any) => {
      const statusMatch = booking.status?.toLowerCase() === selectedTab;
      const ownershipMatch =
        selectedFilter === "all" ||
        booking.ownership?.toLowerCase() === selectedFilter;

      if (selectedFilter === "requested" && requestedSubTab !== "all") {
        // Handle requested sub-tabs
        if (requestedSubTab === "confirmed") {
          return (
            statusMatch &&
            ownershipMatch &&
            booking.status?.toLowerCase() === "confirmed"
          );
        } else if (requestedSubTab === "unconfirmed") {
          return (
            statusMatch &&
            ownershipMatch &&
            booking.status?.toLowerCase() !== "confirmed"
          );
        }
        return statusMatch && ownershipMatch;
      }

      return statusMatch && ownershipMatch;
    });
  }, [bookings, selectedTab, selectedFilter, requestedSubTab]);

  // Get the selected booking for detail view
  const selectedBooking = useMemo(() => {
    return bookings.find((t: any) => t.id === selectedBookingId);
  }, [bookings, selectedBookingId]);

  // Transform itinerary for display in detail view
  const transformedItinerary = useMemo(() => {
    if (!selectedBooking?.itinerary?.days) return [];

    return selectedBooking.itinerary.days.map((day: any) => ({
      day: day.dayNumber,
      title: day.date
        ? `Day ${day.dayNumber} - ${new Date(day.date).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          )}`
        : `Day ${day.dayNumber}`,
      activities: (day.activities || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((activity: any) => ({
          time: activity.time || "00:00",
          icon:
            ICON_MAP[activity.icon] ||
            getIconForActivity(activity.title, activity.description),
          title: activity.title,
          description: activity.description || "",
          location: activity.location || "",
        })),
    }));
  }, [selectedBooking?.itinerary?.days]);

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedBookingId(null);
  };

  const handleStartNewTravel = () => {
    setShowCreateModal(false);
    navigate("/user/create-new-travel");
  };

  const handleJoinExisting = () => {
    setShowCreateModal(false);
    setShowJoinTravelModal(true);
  };

  const handleConfirmJoinTravel = () => {
    const trimmedBookingCode = joinShareToken.trim();

    if (!trimmedBookingCode) {
      toast.error("Please enter a Booking Code");
      return;
    }

    joinBooking(trimmedBookingCode);
  };

  const handleBookFromStandard = () => {
    setShowCreateModal(false);
    navigate("/user/standard-itinerary");
  };

  const handleBookThisTrip = () => {
    setShowBookConfirmModal(true);
  };

  const handleConfirmBooking = () => {
    if (selectedBookingId) {
      submitBookingMutation.mutate(); // This will submit the booking for approval
    }
  };

  const handleConfirmRequestedBooking = () => {
    if (selectedBookingId) {
      updateBookingMutation.mutate({ status: "CONFIRMED" });
    }
  };

  const handleEditBooking = () => {
    if (!selectedBooking) {
      toast.error("Booking not found");
      return;
    }

    const serializableItinerary =
      selectedBooking.itinerary?.days?.map((day: any) => ({
        ...day,
        activities: day.activities.map((activity: any) => ({
          ...activity,
          icon: activity.icon || "Clock", // Default icon if none
        })),
      })) || [];

    navigate(`/user/travels/edit/${selectedBookingId}`, {
      state: {
        bookingData: selectedBooking,
        itinerary: serializableItinerary,
        tabStatus: selectedTab,
      },
    });
  };

  const handleDeleteBooking = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBookingId) {
      deleteBookingMutation.mutate();
    }
  };

  const handleConfirmStatus = () => {
    if (selectedBookingId) {
      // TODO: Implement confirmation status update when API supports it
      toast.success("Booking Confirmed", {
        description: "The booking status has been updated to Confirmed.",
      });
    }
    setShowConfirmStatusModal(false);
  };

  // QR Code handlers - Now uses Booking ID directly instead of share token
  const handleShareBooking = async (bookingId: string) => {
    setShareToken(bookingId);
    setShowShareQRModal(true);
    setTimeout(() => {
      generateQRCode(bookingId);
    }, 100);
  };

  const generateQRCode = async (token: string) => {
    const canvas = qrCodeCanvasRef.current;
    if (!canvas) return;

    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvas, token, {
        width: 200,
        margin: 2,
        color: {
          dark: "#0A7AFF",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrCodeCanvasRef.current;
    if (!canvas || !shareToken) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `travel-qr-${shareToken}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("QR code downloaded successfully!");
      }
    });
  };

  const handleStartScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRCode();
      }
    } catch (error: any) {
      console.error("Failed to access camera:", error);

      if (error.name === "NotAllowedError") {
        toast.error("Camera Permission Denied", {
          description:
            "Please enable camera access in your browser settings to scan QR codes",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Camera Not Found", {
          description: "No camera device was detected on your device",
        });
      } else {
        toast.error("Failed to access camera", {
          description: "Please check your camera permissions and try again",
        });
      }
      setIsScanning(false);
    }
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !isScanning) return;

    try {
      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (
        context &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const bookingId = code.data.trim();
          setScannedQRData(bookingId);
          setJoinShareToken(bookingId);
          stopScanning();
          toast.success("QR code scanned successfully!");

          // Automatically trigger join after scanning
          joinBooking(bookingId);
          return;
        }
      }
    } catch (error) {
      console.error("QR scanning error:", error);
    }

    if (isScanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const jsQR = (await import("jsqr")).default;
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height
            );

            if (code) {
              const bookingId = code.data.trim();
              setScannedQRData(bookingId);
              setJoinShareToken(bookingId);
              toast.success("QR code read successfully!");

              // Automatically trigger join after reading QR from file
              joinBooking(bookingId);
            } else {
              toast.error("No QR code found in image");
            }
          }
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to read QR code from file:", error);
      toast.error("Failed to read QR code from file");
    }
  };

  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  // Handle navigation with scroll-to functionality
  useEffect(() => {
    if (location.state?.scrollToId) {
      const { scrollToId, tab, activeTab } = location.state;

      const targetTab = tab || activeTab;
      if (targetTab) {
        setSelectedTab(targetTab);
      }

      navigate(location.pathname, { replace: true, state: {} });

      setTimeout(() => {
        const element = bookingRefs.current[scrollToId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.animation = "highlight 2s ease-in-out";
        }
      }, 300);
    }
  }, [location.state, navigate, location.pathname]);

  // Update breadcrumbs based on view mode
  useEffect(() => {
    if (viewMode === "detail" && selectedBookingId) {
      const tabLabel =
        selectedTab === "draft"
          ? "Draft"
          : selectedTab === "booked"
          ? "Booked"
          : selectedTab === "pending"
          ? "Pending"
          : selectedTab === "rejected"
          ? "Rejected"
          : "Bookings";

      setBreadcrumbs([
        { label: "Home", path: "/user/home" },
        { label: "Travels", path: "/user/travels" },
        { label: tabLabel },
        { label: `Booking ${selectedBookingId}` },
      ]);
    } else {
      resetBreadcrumbs();
    }
  }, [
    viewMode,
    selectedBookingId,
    selectedTab,
    setBreadcrumbs,
    resetBreadcrumbs,
  ]);

  // Loading state for detail view
  if (viewMode === "detail" && !selectedBooking) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A7AFF]" />
      </div>
    );
  }

  // Detail view
  if (viewMode === "detail" && selectedBookingId && selectedBooking) {
    const tabLabel =
      selectedTab === "draft"
        ? "Draft"
        : selectedTab === "booked"
        ? "Booked"
        : selectedTab === "pending"
        ? "Pending"
        : selectedTab === "rejected"
        ? "Rejected"
        : "Bookings";

    const bookingDetail = selectedBooking;
    const isOwner = bookingDetail.ownership?.toUpperCase() === "OWNED";

    return (
      <>
        <style>{`
        @keyframes highlight {
          0%, 100% {
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(255,107,107,0.3), 0 4px 6px rgba(255,107,107,0.1);
            transform: scale(1.005);
          }
        }
      `}</style>

        <BookingDetailView
          booking={{
            id: bookingDetail.id,
            bookingCode: bookingDetail.bookingCode,
            customer: bookingDetail.customerName!,
            email: bookingDetail.customerEmail!,
            mobile: bookingDetail.customerMobile!,
            destination: bookingDetail.destination,
            itinerary: bookingDetail.itinerary?.title || "Custom Itinerary",
            dates:
              bookingDetail.startDate && bookingDetail.endDate
                ? `${new Date(bookingDetail.startDate).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )} – ${new Date(bookingDetail.endDate).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}`
                : "Dates TBD",
            travelers: bookingDetail.travelers,
            total: `₱${parseFloat(
              bookingDetail.totalPrice.toString()
            ).toLocaleString()}`,
            bookedDate:
              bookingDetail.bookedDateDisplay ||
              (bookingDetail.bookedDate
                ? new Date(bookingDetail.bookedDate).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )
                : new Date(bookingDetail.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )),
            tripStatus: bookingDetail.itinerary?.status,
            paymentStatus: bookingDetail.paymentStatus,
            rejectionReason:
              bookingDetail.rejectionReason ||
              bookingDetail.itinerary?.rejectionReason ||
              "",
            rejectionResolution:
              bookingDetail.rejectionResolution ||
              bookingDetail.itinerary?.rejectionResolution ||
              "",
            resolutionStatus: bookingDetail.isResolved
              ? "resolved"
              : "unresolved",
          }}
          itinerary={bookingDetail.itinerary}
          onBack={handleBackToList}
          breadcrumbPage={tabLabel}
          headerVariant={
            selectedTab === "rejected"
              ? "cancelled"
              : selectedTab === "pending"
              ? "approval"
              : "default"
          }
          isRequestedItinerary={bookingDetail.type === "REQUESTED"}
          // Updated actionButtons prop with Notice Feature
          actionButtons={
            selectedTab === "pending" ? undefined : (
              <>
                {/* Notice Feature for Requested Bookings */}
                {bookingDetail.type === "REQUESTED" && (
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-3">
                    <div className="p-6 border-b border-[#E5E7EB] bg-linear-to-br from-[#F8FAFB] to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#FF6B6B] to-[#FF5252] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1A2B4F]">
                            Need Assistance?
                          </h3>
                          <p className="text-xs text-[#64748B] mt-1">
                            Questions or adjustments for your requested
                            itinerary
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-linear-to-r from-[#FFF7ED] to-[#FFEDD5] border border-[#FDBA74] rounded-xl">
                          <p className="text-sm text-[#92400E]">
                            <span className="font-semibold">Note:</span> Should
                            you have any requests, wish to make adjustments, or
                            have any concerns regarding your itinerary, please
                            do not hesitate to reach out to 4B's Travel and
                            Tours. Our team will be more than happy to assist
                            you.
                          </p>
                          <p className="text-sm text-[#92400E]">
                            <br />
                            For a smooth and efficient process, we kindly ask
                            that you include your{" "}
                            <span className="font-semibold">Booking ID</span> in
                            your message so we may address your concern promptly
                            and seamlessly.
                          </p>
                        </div>

                        <div className="p-4 bg-linear-to-r from-[#F0F9FF] to-[#E0F2FE] border border-[#7DD3FC] rounded-xl">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-[#0369A1] mb-2">
                              Contact Options:
                            </p>
                            <div className="space-y-2 text-xs text-[#0C4A6E] bg-white/50 p-3 rounded-lg">
                              <div className="flex items-start gap-2">
                                <span className="text-[#0A7AFF] font-medium">
                                  •
                                </span>
                                <div>
                                  <p className="font-medium text-sm">Email</p>
                                  <p className="text-[#0C4A6E]/80">
                                    4bstravelandtours2019@gmail.com
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[#0A7AFF] font-medium">
                                  •
                                </span>
                                <div>
                                  <p className="font-medium text-sm">Phone</p>
                                  <p className="text-[#0C4A6E]/80">
                                    +63 123 456 7890
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-[#0A7AFF] font-medium">
                                  •
                                </span>
                                <div>
                                  <p className="font-medium text-sm">
                                    Support Hours
                                  </p>
                                  <p className="text-[#0C4A6E]/80">
                                    Mon-Sun, 8AM-8PM
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              // Navigate to UserHome and scroll to the Contact section
                              navigate("/user/home", {
                                state: { scrollToContact: true },
                              });

                              // Close the detail view
                              setViewMode("list");
                              setSelectedBookingId(null);

                              toast.success("Redirecting to Contact Section", {
                                description:
                                  "You'll be redirected to the Home Page.",
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] hover:from-[#0970e6] hover:to-[#12a594] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Go to Contact Section
                          </button>
                        </div>

                        <div className="text-xs text-[#64748B] italic text-center pt-2">
                          You can attach travel documents or photos when
                          contacting us.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation Section for REQUESTED bookings */}
                {bookingDetail.type === "REQUESTED" && (
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-3">
                    <div className="p-6 border-b border-[#E5E7EB] bg-linear-to-br from-[#F8FAFB] to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-[#1A2B4F]">
                          Conversation
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3 p-4 bg-accent/50 rounded-xl max-h-64 overflow-y-auto mb-4">
                        {(conversations[bookingDetail.id] || []).length ===
                        0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          (conversations[bookingDetail.id] || []).map(
                            (msg, index) => (
                              <div
                                key={index}
                                className={`flex ${
                                  msg.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[75%] p-4 rounded-xl shadow-sm ${
                                    msg.sender === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-card border border-border"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">
                                    {msg.message}
                                  </p>
                                  <p
                                    className={`text-xs mt-2 ${
                                      msg.sender === "user"
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {msg.time}
                                  </p>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={currentMessage[bookingDetail.id] || ""}
                          onChange={(e) =>
                            setCurrentMessage({
                              ...currentMessage,
                              [bookingDetail.id]: e.target.value,
                            })
                          }
                          onKeyPress={(e) => {
                            if (
                              e.key === "Enter" &&
                              currentMessage[bookingDetail.id]?.trim()
                            ) {
                              const newMsg = {
                                sender: "user" as const,
                                message:
                                  currentMessage[bookingDetail.id].trim(),
                                time: new Date().toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }),
                              };
                              setConversations({
                                ...conversations,
                                [bookingDetail.id]: [
                                  ...(conversations[bookingDetail.id] || []),
                                  newMsg,
                                ],
                              });
                              setCurrentMessage({
                                ...currentMessage,
                                [bookingDetail.id]: "",
                              });
                              toast.success("Message sent!", {
                                description:
                                  "Your message has been sent to the admin.",
                              });
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        <button
                          onClick={() => {
                            if (currentMessage[bookingDetail.id]?.trim()) {
                              const newMsg = {
                                sender: "user" as const,
                                message:
                                  currentMessage[bookingDetail.id].trim(),
                                time: new Date().toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }),
                              };
                              setConversations({
                                ...conversations,
                                [bookingDetail.id]: [
                                  ...(conversations[bookingDetail.id] || []),
                                  newMsg,
                                ],
                              });
                              setCurrentMessage({
                                ...currentMessage,
                                [bookingDetail.id]: "",
                              });
                              toast.success("Message sent!", {
                                description:
                                  "Your message has been sent to the admin.",
                              });
                            }
                          }}
                          className="px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white"
                        >
                          <Send className="w-5 h-5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {bookingDetail.type === "REQUESTED" && (
                  <button
                    onClick={() => setShowConfirmBookingModal(true)}
                    className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#14B8A6] to-[#10B981] hover:from-[#12A594] hover:to-[#0EA574] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#14B8A6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updateBookingMutation.isPending}
                  >
                    <BookOpen className="w-4 h-4" />
                    {updateBookingMutation.isPending
                      ? "Confirming..."
                      : "Confirm Booking"}
                  </button>
                )}

                {bookingDetail.type === "CUSTOMIZED" &&
                  bookingDetail.ownership?.toUpperCase() === "OWNED" && (
                    <>
                      <button
                        onClick={() => setShowBookConfirmModal(true)}
                        className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#14B8A6] to-[#10B981] hover:from-[#12A594] hover:to-[#0EA574] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#14B8A6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submitBookingMutation.isPending}
                      >
                        <BookOpen className="w-4 h-4" />
                        {submitBookingMutation.isPending
                          ? "Submitting..."
                          : "Book this trip"}
                      </button>

                      <button
                        onClick={handleEditBooking}
                        className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#3B9EFF] hover:from-[#0970E6] hover:to-[#0A7AFF] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#0A7AFF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={updateBookingMutation.isPending}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Booking
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirmModal(true)}
                        className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5757] hover:to-[#FF6B6B] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#FF6B6B]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deleteBookingMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteBookingMutation.isPending
                          ? "Deleting..."
                          : "Delete Booking"}
                      </button>
                    </>
                  )}

                {bookingDetail.ownership?.toUpperCase() === "COLLABORATED" && (
                  <button
                    onClick={() =>
                      handleShareBooking(bookingDetail.itineraryId)
                    }
                    className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-[#8B5CF6]/20"
                  >
                    <Share2 className="w-4 h-4" />
                    Share with Others
                  </button>
                )}
              </>
            )
          }
        />

        {/* Modals */}
        <ConfirmationModal
          open={showBookConfirmModal}
          onOpenChange={setShowBookConfirmModal}
          title="Book This Trip"
          icon={<BookOpen className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
          iconShadow="shadow-[#0A7AFF]/20"
          contentGradient="bg-gradient-to-br from-[rgba(10,122,255,0.05)] to-[rgba(20,184,166,0.05)]"
          contentBorder="border-[rgba(10,122,255,0.2)]"
          content={
            <div className="text-card-foreground">
              <p className="mb-3">
                Are you sure you want to submit this travel plan for approval?
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span className="font-medium">
                    {bookingDetail.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-medium">
                    {bookingDetail.dateRangeDisplay ||
                      (bookingDetail.startDate && bookingDetail.endDate
                        ? `${new Date(
                            bookingDetail.startDate
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })} – ${new Date(
                            bookingDetail.endDate
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : "Dates TBD")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">
                    ₱
                    {parseFloat(
                      bookingDetail.totalPrice.toString()
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          }
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowBookConfirmModal(false)}
          confirmText={
            submitBookingMutation.isPending
              ? "Submitting..."
              : "Submit for Approval"
          }
          confirmVariant="success"
        />

        {/* Add this ConfirmationModal for confirming requested bookings */}
        <ConfirmationModal
          open={showConfirmBookingModal}
          onOpenChange={setShowConfirmBookingModal}
          title="Confirm Requested Booking"
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#14B8A6] to-[#10B981]"
          iconShadow="shadow-[#14B8A6]/20"
          contentGradient="bg-gradient-to-br from-[rgba(20,184,166,0.05)] to-[rgba(16,185,129,0.05)]"
          contentBorder="border-[rgba(20,184,166,0.2)]"
          content={
            <div className="text-card-foreground">
              <p className="mb-3">
                Are you sure you want to confirm this requested booking? This
                will mark it as accepted.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Code:</span>
                  <span className="font-medium">
                    {bookingDetail.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span className="font-medium">
                    {bookingDetail.destination}
                  </span>
                </div>
              </div>
            </div>
          }
          onConfirm={handleConfirmRequestedBooking}
          onCancel={() => setShowConfirmBookingModal(false)}
          confirmText={
            updateBookingMutation.isPending
              ? "Confirming..."
              : "Confirm Booking"
          }
          confirmVariant="success"
        />

        <ConfirmationModal
          open={showDeleteConfirmModal}
          onOpenChange={setShowDeleteConfirmModal}
          title="Delete Booking"
          description="Are you sure you want to delete this booking? This action cannot be undone."
          icon={<Trash2 className="w-5 h-5 text-white" />}
          iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
          iconShadow="shadow-[#FF6B6B]/30"
          contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-[rgba(255,82,82,0.05)]"
          contentBorder="border-[rgba(255,107,107,0.2)]"
          content={
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Destination:
                </span>
                <span className="text-sm font-medium text-[#1A2B4F] dark:text-white">
                  {bookingDetail.destination}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Booking Type:
                </span>
                <span className="text-sm font-medium text-[#1A2B4F] dark:text-white">
                  {bookingDetail.type}
                </span>
              </div>
            </div>
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirmModal(false)}
          confirmText={
            deleteBookingMutation.isPending ? "Deleting..." : "Delete Booking"
          }
          cancelText="Cancel"
          confirmVariant="destructive"
        />
      </>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes highlight {
          0%, 100% {
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(10,122,255,0.3), 0 4px 6px rgba(10,122,255,0.1);
            transform: scale(1.005);
          }
        }
      `}</style>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-border overflow-x-auto">
        <button
          onClick={() => setSelectedTab("draft")}
          className={`px-5 h-11 text-sm transition-colors whitespace-nowrap ${
            selectedTab === "draft"
              ? "font-semibold text-[#0A7AFF] border-b-[3px] border-[#0A7AFF] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setSelectedTab("booked")}
          className={`px-5 h-11 text-sm transition-colors whitespace-nowrap ${
            selectedTab === "booked"
              ? "font-semibold text-[#14B8A6] border-b-[3px] border-[#14B8A6] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#14B8A6] hover:bg-[rgba(20,184,166,0.05)]"
          }`}
        >
          Booked
        </button>
        <button
          onClick={() => setSelectedTab("pending")}
          className={`px-5 h-11 text-sm transition-colors whitespace-nowrap ${
            selectedTab === "pending"
              ? "font-semibold text-[#8B5CF6] border-b-[3px] border-[#8B5CF6] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.05)]"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSelectedTab("rejected")}
          className={`px-5 h-11 text-sm transition-colors whitespace-nowrap ${
            selectedTab === "rejected"
              ? "font-semibold text-[#FF6B6B] border-b-[3px] border-[#FF6B6B] -mb-0.5"
              : "font-medium text-[#64748B] hover:text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)]"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Travels List */}
      <ContentCard
        title={`${
          selectedTab === "draft"
            ? "Draft"
            : selectedTab === "booked"
            ? "Booked"
            : selectedTab === "pending"
            ? "Pending"
            : selectedTab === "rejected"
            ? "Rejected"
            : "Travel Bookings"
        } ${filteredTravels.length > 0 ? `(${filteredTravels.length})` : ""}`}
        icon={MapPin}
        action={
          <div className="flex gap-2 items-center">
            <button
              onClick={handleBookFromStandard}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm bg-linear-to-r from-[#14B8A6] to-[#10B981] hover:from-[#12A594] hover:to-[#0EA574] text-white"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
              <span className="hidden sm:inline">
                Book from Standard Itinerary
              </span>
              <span className="sm:hidden">Standard</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
              <span className="hidden sm:inline">Add Travel</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Filter Buttons - Responsive */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setBookingType("CUSTOMIZED");
                setSelectedTab(undefined);
              }}
              className={`px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
                bookingType === "CUSTOMIZED"
                  ? "bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white shadow-md"
                  : "bg-card border border-border text-card-foreground hover:bg-accent hover:border-primary/50"
              }`}
            >
              Customized
            </button>

            <button
              onClick={() => {
                setBookingType("REQUESTED");
                setSelectedTab(undefined);
              }}
              className={`px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
                bookingType === "REQUESTED"
                  ? "bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white shadow-md"
                  : "bg-card border border-border text-card-foreground hover:bg-accent hover:border-primary/50"
              }`}
            >
              {isMobile ? "Req" : "Requested"}
            </button>
          </div>
          {/* Dropdown for Requested filter */}
          {selectedFilter === "requested" && (
            <div className="pt-3 pb-2">
              <Select
                value={requestedSubTab}
                onValueChange={(value: "all" | "confirmed" | "unconfirmed") =>
                  setRequestedSubTab(value)
                }
              >
                <SelectTrigger className="w-full md:w-45 h-10 border-2 border-border bg-card text-card-foreground">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requested</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Loading State */}
          {isLoadingBookings ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary opacity-50 animate-pulse" />
              </div>
              <h3 className="text-lg text-card-foreground mb-2">
                Loading bookings...
              </h3>
            </div>
          ) : filteredTravels.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary opacity-50" />
              </div>
              <h3 className="text-lg text-card-foreground mb-2">
                No{" "}
                {selectedTab === "draft"
                  ? "draft"
                  : selectedTab === "booked"
                  ? "booked"
                  : selectedTab === "pending"
                  ? "pending"
                  : selectedTab === "rejected"
                  ? "rejected"
                  : ""}{" "}
                travel plans
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {selectedTab === "draft"
                  ? "You don't have any draft travel plans."
                  : selectedTab === "booked"
                  ? "You don't have any booked travel plans."
                  : selectedTab === "pending"
                  ? "You don't have any pending travel plans."
                  : selectedTab === "rejected"
                  ? "You don't have any rejected travel plans."
                  : "You don't have any travel plans."}
              </p>
              {(selectedTab === "draft" || selectedTab === "pending") && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2.5 rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                  Create Travel Plan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTravels.map((travel: any) => (
                <div
                  key={travel.id}
                  ref={(el) => {
                    if (el) bookingRefs.current[travel.id] = el;
                  }}
                >
                  <BookingListCard
                    showShare
                    booking={{
                      customer: travel?.customerName,
                      mobile: travel?.customerMobile,
                      email: travel?.customerEmail,
                      id: travel.id,
                      bookingCode: travel.bookingCode,
                      itineraryId: travel.itineraryId,
                      userId: travel.userId,
                      destination: travel.destination,
                      startDate: travel.startDate,
                      endDate: travel.endDate,
                      travelers: travel.travelers,
                      totalPrice: travel.totalPrice,
                      ownership: travel.ownership,
                      type: travel.type as
                        | "STANDARD"
                        | "CUSTOMIZED"
                        | "REQUESTED",
                      status: travel.status as
                        | "DRAFT"
                        | "PENDING"
                        | "CONFIRMED"
                        | "REJECTED"
                        | "COMPLETED"
                        | "CANCELLED",
                      tourType: travel.tourType,
                      paymentStatus: travel.paymentStatus,
                      paymentReceiptUrl: travel.paymentReceiptUrl,
                      rejectionReason: travel.rejectionReason,
                      rejectionResolution: travel.rejectionResolution,
                      isResolved: travel.isResolved,
                      customerName: travel.customerName,
                      customerEmail: travel.customerEmail,
                      customerMobile: travel.customerMobile,
                      bookedDate: travel.bookedDateDisplay,
                      createdAt: travel.createdAt,
                      updatedAt: travel.updatedAt,
                      itinerary: travel.itinerary,
                      total: travel.totalPrice,
                    }}
                    onViewDetails={handleViewDetails}
                    // Pass ownership and confirmation status
                    ownership={
                      travel.ownership?.toLowerCase() as
                        | "owned"
                        | "collaborated"
                        | "requested"
                    }
                    confirmStatus={
                      travel.status?.toLowerCase() === "confirmed"
                        ? "confirmed"
                        : "unconfirmed"
                    }
                    sentStatus={
                      travel.sentStatus?.toLowerCase() as "sent" | "unsent"
                    }
                    onShare={(bookingCode, bookingId) => {
                      // Use booking code for QR code (e.g., BV-2025-001)
                      setShareToken(bookingCode);
                      setSelectedBookingId(bookingId);
                      setShowShareQRModal(true);
                      setTimeout(() => {
                        generateQRCode(bookingCode);
                      }, 100);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentCard>

      {/* Add Travel Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-150 max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Add Travel
            </DialogTitle>
            <DialogDescription className="pb-4">
              Choose how you'd like to add your travel plan.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="px-8 py-2 space-y-4 pb-6">
              <button
                onClick={handleStartNewTravel}
                className="w-full p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] bg-white dark:bg-[#1E293B] hover:bg-[rgba(10,122,255,0.02)] dark:hover:bg-[rgba(10,122,255,0.05)] transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1A2B4F] dark:text-white mb-1 group-hover:text-[#0A7AFF] dark:group-hover:text-[#0A7AFF] transition-colors">
                      Start New Travel
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      Use our Smart Trip Generator to create a personalized
                      travel itinerary.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(10,122,255,0.1)] text-[#0A7AFF] border border-[rgba(10,122,255,0.2)]">
                        Customizable
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.2)]">
                        Flexible
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={handleJoinExisting}
                className="w-full p-6 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#8B5CF6] bg-white dark:bg-[#1E293B] hover:bg-[rgba(139,92,246,0.02)] dark:hover:bg-[rgba(139,92,246,0.05)] transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1A2B4F] dark:text-white mb-1 group-hover:text-[#8B5CF6] dark:group-hover:text-[#8B5CF6] transition-colors">
                      Join Existing Travel
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      Collaborate with others on their travel plans.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] border border-[rgba(139,92,246,0.2)]">
                        Collaborative
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                        Join Group
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Notice Feature for Custom Itinerary Request */}
              <div className="w-full p-6 rounded-2xl border-2 border-[#E5E7EB] dark:border-[#2A3441] bg-linear-to-br from-[#0A7AFF]/10 via-[#14B8A6]/8 to-[#0A7AFF]/15 dark:from-[#2596be]/15 dark:via-[#25bce0]/12 dark:to-[#2596be]/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-linear-to-br from-[#0A7AFF]/20 to-[#14B8A6]/15 dark:from-[#2596be]/25 dark:to-[#25bce0]/20 rounded-full blur-2xl -translate-y-24 translate-x-24" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-linear-to-tr from-[#14B8A6]/15 to-[#0A7AFF]/20 dark:from-[#25bce0]/20 dark:to-[#2596be]/25 rounded-full blur-2xl translate-y-16 -translate-x-16" />
                  <div className="absolute inset-0 bg-linear-to-br from-white/40 to-transparent dark:from-gray-900/30 mix-blend-overlay" />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#3B9EFF] dark:from-[#2596be] dark:to-[#25bce0] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/30 dark:shadow-[#2596be]/40 ring-2 ring-white/20 dark:ring-white/10">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1A2B4F] dark:text-white">
                        Need a Custom Itinerary?
                      </h3>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                        4B's Travel and Tours has got your back!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[#334155] dark:text-[#E5E7EB] text-sm">
                      If you want a{" "}
                      <span className="font-semibold text-[#0A7AFF] dark:text-[#2596be]">
                        customized itinerary
                      </span>{" "}
                      but don't want to do it yourself, 4B's Travel and Tours
                      offers personalized "Requested Itinerary" services.
                    </p>

                    {/* Contact Button */}
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        navigate("/user/home", {
                          state: { scrollToContact: true },
                        });
                        toast.success("Redirecting to Contact Section", {
                          description: "You'll be redirected to the Home Page.",
                        });
                      }}
                      className="w-full group relative px-2 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                        boxShadow:
                          "0 8px 25px rgba(10, 122, 255, 0.25), 0 4px 10px rgba(10, 122, 255, 0.2)",
                      }}
                    >
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      <div className="relative flex items-center justify-center gap-2">
                        <Send className="w-4 h-4 text-white" />
                        <span className="text-white font-semibold text-sm">
                          Contact 4B's Travel and Tours
                        </span>
                      </div>
                    </button>

                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] text-center">
                      You'll be redirected to the Home Page
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Join Travel Modal */}
      <ConfirmationModal
        open={showJoinTravelModal}
        onOpenChange={(open) => {
          setShowJoinTravelModal(open);
          if (!open) {
            setJoinMethod("manual");
            setJoinShareToken("");
            setScannedQRData("");
            stopScanning();
          }
        }}
        title="Join Existing Travel"
        description="Choose how you'd like to join an existing travel"
        icon={<Users className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]"
        iconShadow="shadow-[#8B5CF6]/20"
        contentGradient="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-transparent"
        contentBorder="border-[rgba(139,92,246,0.2)]"
        content={
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setJoinMethod("manual");
                  stopScanning();
                }}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  joinMethod === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Type className="w-4 h-4 inline mr-2" />
                Manual
              </button>
              <button
                onClick={() => {
                  setJoinMethod("scan");
                  setJoinShareToken("");
                  handleStartScanning();
                }}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  joinMethod === "scan"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                Scan QR
              </button>
              <button
                onClick={() => {
                  setJoinMethod("upload");
                  stopScanning();
                  setJoinShareToken("");
                }}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  joinMethod === "upload"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload QR
              </button>
            </div>

            {joinMethod === "manual" && (
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Booking Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., BV-2025-001"
                  value={joinShareToken}
                  onChange={(e) => setJoinShareToken(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  disabled={isAcceptingShare}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isAcceptingShare) {
                      handleConfirmJoinTravel();
                    }
                  }}
                />
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Tip: Ask the travel owner for their share token to join
                    their travel plan as a collaborator.
                  </p>
                </div>
              </div>
            )}

            {/* QR Code Scanner */}
            {joinMethod === "scan" && (
              <div>
                <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden">
                  {isScanning ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-4 border-primary rounded-2xl"></div>
                      </div>
                      <button
                        onClick={stopScanning}
                        className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Camera will activate
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {scannedQRData && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-3">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ QR code scanned: {scannedQRData}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload QR Code */}
            {joinMethod === "upload" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-border hover:border-primary rounded-xl bg-muted/50 hover:bg-muted transition-all"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-card-foreground font-medium">
                    Click to upload QR code image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </button>
                {scannedQRData && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-3">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ QR code read: {scannedQRData}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        onConfirm={handleConfirmJoinTravel}
        onCancel={() => {
          setShowJoinTravelModal(false);
          setJoinMethod("manual");
          setJoinShareToken("");
          setScannedQRData("");
          stopScanning();
        }}
        confirmText={isAcceptingShare ? "Joining..." : "Join Travel"}
        cancelText="Cancel"
        confirmVariant="default"
      />
      {/* Share QR Code Modal */}
      <Dialog
        open={showShareQRModal}
        onOpenChange={(open: any) => {
          setShowShareQRModal(open);
          if (!open) {
            setShareToken(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              Share Travel Itinerary
            </DialogTitle>
            <DialogDescription>
              Share this QR code with others to let them join as collaborators
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <canvas ref={qrCodeCanvasRef} />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  Booking Code:{" "}
                  <span className="font-semibold text-card-foreground">
                    {shareToken}
                  </span>
                </p>
                <button
                  onClick={() => {
                    if (shareToken) {
                      navigator.clipboard.writeText(shareToken);
                      toast.success("Copied to clipboard!", {
                        description: "Booking code copied",
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-accent transition-all"
                  title="Copy Booking Code"
                >
                  <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 mx-6">
              <button
                onClick={handleDownloadQR}
                className="flex-1 h-11 px-4 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
              <button
                onClick={() => setShowShareQRModal(false)}
                className="px-6 h-11 rounded-xl border-2 border-border hover:bg-accent transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FAQAssistant />
    </div>
  );
}
