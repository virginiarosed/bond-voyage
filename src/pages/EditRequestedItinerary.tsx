import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, Plane, Hotel, Camera, UtensilsCrossed, Car, Package, MapPin, Compass, TreePine, Building2, Ship, Train, Coffee, ShoppingBag, Music, Sunset, Clock, AlertCircle, Sparkles, CheckCircle2, User, Mail, Phone, Calendar, Users, FileText, Waves, Mountain, Palmtree, Tent, Bike, Bus, Anchor, Film, Ticket, Wine, IceCream, Pizza, Fish, Salad, Utensils, Home, Landmark, Church, Castle, Globe, Backpack, Luggage, Umbrella, Sun, Moon, Star, Heart, Gift, ShoppingCart, Search } from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner@2.0.3";

interface Activity {
  id: string;
  time: string;
  icon: string;
  title: string;
  description: string;
  location: string;
}

interface Day {
  id: string;
  day: number;
  title: string;
  activities: Activity[];
}

interface BookingFormData {
  customerName: string;
  email: string;
  mobile: string;
  destination: string;
  travelDateFrom: string;
  travelDateTo: string;
  travelers: string;
  totalAmount: string;
}

interface EditRequestedItineraryProps {
  onSave: (booking: any) => void;
  onSaveDraft?: (draft: any) => void;
  initialData?: any;
}

const ICON_OPTIONS = [
  // Transportation
  { value: "Plane", label: "Plane / Flight", icon: Plane },
  { value: "Car", label: "Car / Drive", icon: Car },
  { value: "Bus", label: "Bus", icon: Bus },
  { value: "Train", label: "Train", icon: Train },
  { value: "Ship", label: "Ship / Ferry", icon: Ship },
  { value: "Anchor", label: "Boat / Anchor", icon: Anchor },
  { value: "Bike", label: "Bike / Cycling", icon: Bike },
  
  // Accommodation
  { value: "Hotel", label: "Hotel / Lodging", icon: Hotel },
  { value: "Home", label: "Home / Villa", icon: Home },
  { value: "Tent", label: "Camping / Tent", icon: Tent },
  
  // Food & Dining
  { value: "UtensilsCrossed", label: "Restaurant", icon: UtensilsCrossed },
  { value: "Utensils", label: "Dining", icon: Utensils },
  { value: "Coffee", label: "Coffee / Cafe", icon: Coffee },
  { value: "Wine", label: "Wine / Bar", icon: Wine },
  { value: "IceCream", label: "Dessert / Ice Cream", icon: IceCream },
  { value: "Pizza", label: "Pizza / Fast Food", icon: Pizza },
  { value: "Fish", label: "Seafood", icon: Fish },
  { value: "Salad", label: "Healthy Food", icon: Salad },
  
  // Activities & Attractions
  { value: "Camera", label: "Photography / Sightseeing", icon: Camera },
  { value: "Waves", label: "Beach / Swimming", icon: Waves },
  { value: "Mountain", label: "Mountain / Hiking", icon: Mountain },
  { value: "Palmtree", label: "Tropical / Island", icon: Palmtree },
  { value: "TreePine", label: "Nature / Forest", icon: TreePine },
  { value: "Landmark", label: "Landmark / Monument", icon: Landmark },
  { value: "Church", label: "Church / Temple", icon: Church },
  { value: "Castle", label: "Castle / Palace", icon: Castle },
  { value: "Film", label: "Movies / Shows", icon: Film },
  { value: "Music", label: "Music / Entertainment", icon: Music },
  { value: "Ticket", label: "Event / Tickets", icon: Ticket },
  { value: "ShoppingBag", label: "Shopping", icon: ShoppingBag },
  { value: "ShoppingCart", label: "Market / Shopping", icon: ShoppingCart },
  
  // Navigation & Travel
  { value: "MapPin", label: "Location / Map Pin", icon: MapPin },
  { value: "Compass", label: "Compass / Navigate", icon: Compass },
  { value: "Globe", label: "World / Global", icon: Globe },
  { value: "Backpack", label: "Backpacking / Adventure", icon: Backpack },
  { value: "Luggage", label: "Luggage / Travel", icon: Luggage },
  
  // Misc
  { value: "Package", label: "Package / Tour", icon: Package },
  { value: "Building2", label: "Building / City", icon: Building2 },
  { value: "Sunset", label: "Sunset / Sunrise", icon: Sunset },
  { value: "Sun", label: "Sun / Day", icon: Sun },
  { value: "Moon", label: "Moon / Night", icon: Moon },
  { value: "Star", label: "Star / Featured", icon: Star },
  { value: "Umbrella", label: "Umbrella / Beach", icon: Umbrella },
  { value: "Heart", label: "Love / Favorite", icon: Heart },
  { value: "Gift", label: "Gift / Souvenir", icon: Gift },
];

// Philippine cities/destinations for autocomplete suggestions
const PHILIPPINE_LOCATIONS = [
  "Boracay, Aklan",
  "Caticlan Airport, Malay, Aklan",
  "White Beach, Boracay",
  "D'Mall, Boracay",
  "Manila, Metro Manila",
  "Makati, Metro Manila",
  "BGC, Taguig City",
  "Intramuros, Manila",
  "Rizal Park, Manila",
  "Palawan",
  "El Nido, Palawan",
  "Coron, Palawan",
  "Puerto Princesa, Palawan",
  "Underground River, Palawan",
  "Cebu City, Cebu",
  "Mactan Island, Cebu",
  "Oslob, Cebu",
  "Moalboal, Cebu",
  "Kawasan Falls, Cebu",
  "Baguio City, Benguet",
  "Banaue Rice Terraces, Ifugao",
  "Sagada, Mountain Province",
  "Vigan, Ilocos Sur",
  "Pagudpud, Ilocos Norte",
  "Siargao Island",
  "Cloud 9, Siargao",
  "Bohol",
  "Chocolate Hills, Bohol",
  "Panglao Island, Bohol",
  "Tagbilaran, Bohol",
  "Davao City",
  "Camiguin Island",
  "Batanes",
  "Hundred Islands, Pangasinan",
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption ? iconOption.icon : Clock;
};

// Helper function to get icon name from icon component
const getIconNameFromComponent = (iconComponent: any): string => {
  if (!iconComponent) return "Clock";
  
  // If it's already a string, return it
  if (typeof iconComponent === "string") return iconComponent;
  
  // Try to match by comparing the actual component
  const iconMatch = ICON_OPTIONS.find(opt => {
    try {
      return opt.icon === iconComponent || opt.icon.name === iconComponent.name;
    } catch {
      return false;
    }
  });
  
  if (iconMatch) return iconMatch.value;
  
  // Default fallback
  return "Clock";
};

export function EditRequestedItinerary({ onSave, onSaveDraft, initialData }: EditRequestedItineraryProps) {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingFormData>({
    customerName: "",
    email: "",
    mobile: "",
    destination: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelers: "1",
    totalAmount: "",
  });

  const [itineraryDays, setItineraryDays] = useState<Day[]>([]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [deleteActivityConfirm, setDeleteActivityConfirm] = useState<{ dayId: string; activityId: string } | null>(null);
  const [currentActivityForIcon, setCurrentActivityForIcon] = useState<{ dayId: string; activityId: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [reduceDaysConfirm, setReduceDaysConfirm] = useState<{ newDayCount: number; daysToRemove: number } | null>(null);
  const [pendingDateChange, setPendingDateChange] = useState<{ field: "travelDateFrom" | "travelDateTo"; value: string } | null>(null);

  // Store initial data for comparison
  const [initialBookingData, setInitialBookingData] = useState<BookingFormData | null>(null);
  const [initialItineraryDays, setInitialItineraryDays] = useState<Day[] | null>(null);

  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [activeLocationInput, setActiveLocationInput] = useState<{ dayId: string; activityId: string } | null>(null);

  // Icon search state
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Generate unique ID
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load initial data
  useEffect(() => {
    if (initialData) {
      // Try to use startDate/endDate first, then fall back to parsing dates string
      let startDate = "";
      let endDate = "";
      
      if (initialData.startDate && initialData.endDate) {
        // Use the stored date fields directly
        startDate = initialData.startDate;
        endDate = initialData.endDate;
      } else if (initialData.dates) {
        // Parse the dates string to get start and end dates
        // Handle formats like "November 15, 2024 – November 22, 2024" or "Nov 15, 2024 - Nov 22, 2024"
        const datesMatch = initialData.dates.match(/([A-Za-z]+\s+\d+,\s+\d+)\s*[–-]\s*([A-Za-z]+\s+\d+,\s+\d+)/);
        if (datesMatch) {
          try {
            const startParsed = new Date(datesMatch[1]);
            const endParsed = new Date(datesMatch[2]);
            if (!isNaN(startParsed.getTime()) && !isNaN(endParsed.getTime())) {
              startDate = startParsed.toISOString().split('T')[0];
              endDate = endParsed.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error("Error parsing dates:", e);
          }
        }
      }

      // Parse totalAmount - remove currency symbols and commas
      let parsedTotalAmount = "";
      if (initialData.totalAmount) {
        const totalAmountStr = initialData.totalAmount.toString();
        // Remove ₱, $, commas, and any other non-numeric characters except decimal point
        const numericValue = totalAmountStr.replace(/[₱$,]/g, '').trim();
        parsedTotalAmount = numericValue;
      } else if (initialData.total) {
        const totalStr = initialData.total.toString();
        const numericValue = totalStr.replace(/[₱$,]/g, '').trim();
        parsedTotalAmount = numericValue;
      }

      const loadedBookingData = {
        customerName: initialData.customer || "",
        email: initialData.email || "",
        mobile: initialData.mobile || "",
        destination: initialData.destination || "",
        travelDateFrom: startDate,
        travelDateTo: endDate,
        travelers: initialData.travelers?.toString() || "1",
        totalAmount: parsedTotalAmount,
      };

      setBookingData(loadedBookingData);
      setInitialBookingData(loadedBookingData);

      // Load itinerary days if available
      let loadedItineraryDays: Day[] = [];
      if (initialData.itineraryDetails && initialData.itineraryDetails.length > 0) {
        loadedItineraryDays = initialData.itineraryDetails;
        setItineraryDays(loadedItineraryDays);
      } else {
        // Calculate number of days from dates
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          const days: Day[] = [];
          for (let i = 1; i <= dayCount; i++) {
            days.push({
              id: generateId(),
              day: i,
              title: "",
              activities: [],
            });
          }
          loadedItineraryDays = days;
          setItineraryDays(days);
        } else {
          loadedItineraryDays = [{
            id: generateId(),
            day: 1,
            title: "",
            activities: [],
          }];
          setItineraryDays(loadedItineraryDays);
        }
      }
      
      setInitialItineraryDays(JSON.parse(JSON.stringify(loadedItineraryDays)));
    }
  }, [initialData]);

  // Track changes from initial state
  useEffect(() => {
    if (!initialBookingData || !initialItineraryDays) {
      setHasUnsavedChanges(false);
      return;
    }

    // Check if booking data has changed
    const bookingChanged = 
      bookingData.customerName !== initialBookingData.customerName ||
      bookingData.email !== initialBookingData.email ||
      bookingData.mobile !== initialBookingData.mobile ||
      bookingData.destination !== initialBookingData.destination ||
      bookingData.travelDateFrom !== initialBookingData.travelDateFrom ||
      bookingData.travelDateTo !== initialBookingData.travelDateTo ||
      bookingData.travelers !== initialBookingData.travelers ||
      bookingData.totalAmount !== initialBookingData.totalAmount;

    // Check if itinerary days have changed
    const itineraryChanged = JSON.stringify(itineraryDays) !== JSON.stringify(initialItineraryDays);

    setHasUnsavedChanges(bookingChanged || itineraryChanged);
  }, [bookingData, itineraryDays, initialBookingData, initialItineraryDays]);

  // Recalculate days when dates change (now handled with confirmation)
  useEffect(() => {
    if (bookingData.travelDateFrom && bookingData.travelDateTo && !pendingDateChange) {
      const start = new Date(bookingData.travelDateFrom);
      const end = new Date(bookingData.travelDateTo);
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (dayCount > 0 && dayCount !== itineraryDays.length) {
        if (dayCount > itineraryDays.length) {
          // Add more days
          const newDays: Day[] = [];
          for (let i = itineraryDays.length + 1; i <= dayCount; i++) {
            newDays.push({
              id: generateId(),
              day: i,
              title: "",
              activities: [],
            });
          }
          setItineraryDays(prev => [...prev, ...newDays]);
        }
        // Reduction is now handled through confirmation modal
      }
    }
  }, [bookingData.travelDateFrom, bookingData.travelDateTo, pendingDateChange]);

  // Handle location search
  const handleLocationSearch = (searchTerm: string, dayId: string, activityId: string) => {
    if (searchTerm.length >= 2) {
      const filtered = PHILIPPINE_LOCATIONS.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setActiveLocationInput({ dayId, activityId });
    } else {
      setLocationSuggestions([]);
      setActiveLocationInput(null);
    }
  };

  // Select location suggestion
  const selectLocationSuggestion = (location: string, dayId: string, activityId: string) => {
    updateActivity(dayId, activityId, "location", location);
    setLocationSuggestions([]);
    setActiveLocationInput(null);
  };

  // Handle booking data changes
  const handleBookingChange = (field: keyof BookingFormData, value: string) => {
    // Special handling for date changes
    if (field === "travelDateFrom" || field === "travelDateTo") {
      const tempData = { ...bookingData, [field]: value };
      
      // Check if both dates are set
      if (tempData.travelDateFrom && tempData.travelDateTo) {
        const start = new Date(tempData.travelDateFrom);
        const end = new Date(tempData.travelDateTo);
        const newDayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const currentDayCount = itineraryDays.length;
        
        // Check if days will be reduced
        if (newDayCount > 0 && newDayCount < currentDayCount) {
          // Check if any of the days to be removed have content
          const daysToRemove = itineraryDays.slice(newDayCount);
          const hasContent = daysToRemove.some(day => day.title || day.activities.length > 0);
          
          if (hasContent) {
            // Store the pending change and show confirmation
            setPendingDateChange({ field, value });
            setReduceDaysConfirm({ 
              newDayCount, 
              daysToRemove: currentDayCount - newDayCount 
            });
            return;
          }
        }
      }
    }
    
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  // Confirm reduce days
  const handleConfirmReduceDays = () => {
    if (reduceDaysConfirm && pendingDateChange) {
      // Apply the pending date change
      setBookingData(prev => ({ ...prev, [pendingDateChange.field]: pendingDateChange.value }));
      
      // Remove the extra days
      setItineraryDays(prev => prev.slice(0, reduceDaysConfirm.newDayCount));
      
      toast.success("Travel Dates Updated", {
        description: `${reduceDaysConfirm.daysToRemove} ${reduceDaysConfirm.daysToRemove === 1 ? 'day' : 'days'} removed from itinerary.`,
      });
    }
    
    setReduceDaysConfirm(null);
    setPendingDateChange(null);
  };

  // Cancel reduce days
  const handleCancelReduceDays = () => {
    setReduceDaysConfirm(null);
    setPendingDateChange(null);
  };

  // Update day title
  const updateDayTitle = (dayId: string, title: string) => {
    setItineraryDays(prev =>
      prev.map(day => (day.id === dayId ? { ...day, title } : day))
    );
  };

  // Add activity to a day
  const addActivity = (dayId: string) => {
    const newActivity: Activity = {
      id: generateId(),
      time: "",
      icon: "",
      title: "",
      description: "",
      location: "",
    };

    setItineraryDays(prev =>
      prev.map(day =>
        day.id === dayId
          ? { ...day, activities: [...day.activities, newActivity] }
          : day
      )
    );

    toast.success("Activity Added", {
      description: "A new activity slot has been created.",
    });
  };

  // Remove activity from a day
  const confirmDeleteActivity = (dayId: string, activityId: string) => {
    setDeleteActivityConfirm({ dayId, activityId });
  };

  const removeActivity = () => {
    if (!deleteActivityConfirm) return;
    
    const { dayId, activityId } = deleteActivityConfirm;
    setItineraryDays(prev =>
      prev.map(day =>
        day.id === dayId
          ? { ...day, activities: day.activities.filter(a => a.id !== activityId) }
          : day
      )
    );

    setDeleteActivityConfirm(null);
    toast.success("Activity Removed", {
      description: "The activity has been deleted.",
    });
  };

  // Update activity
  const updateActivity = (dayId: string, activityId: string, field: keyof Activity, value: string) => {
    setItineraryDays(prev =>
      prev.map(day =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.map(activity =>
                activity.id === activityId
                  ? { ...activity, [field]: value }
                  : activity
              ),
            }
          : day
      )
    );
  };

  // Move activity up
  const moveActivityUp = (dayId: string, activityIndex: number) => {
    if (activityIndex === 0) return;

    setItineraryDays(prev =>
      prev.map(day => {
        if (day.id === dayId) {
          const newActivities = [...day.activities];
          [newActivities[activityIndex - 1], newActivities[activityIndex]] = 
          [newActivities[activityIndex], newActivities[activityIndex - 1]];
          return { ...day, activities: newActivities };
        }
        return day;
      })
    );
  };

  // Move activity down
  const moveActivityDown = (dayId: string, activityIndex: number) => {
    setItineraryDays(prev =>
      prev.map(day => {
        if (day.id === dayId && activityIndex < day.activities.length - 1) {
          const newActivities = [...day.activities];
          [newActivities[activityIndex], newActivities[activityIndex + 1]] = 
          [newActivities[activityIndex + 1], newActivities[activityIndex]];
          return { ...day, activities: newActivities };
        }
        return day;
      })
    );
  };

  // Open icon picker
  const openIconPicker = (dayId: string, activityId: string) => {
    setCurrentActivityForIcon({ dayId, activityId });
    setIconPickerOpen(true);
  };

  // Select icon
  const selectIcon = (iconValue: string) => {
    if (currentActivityForIcon) {
      updateActivity(currentActivityForIcon.dayId, currentActivityForIcon.activityId, "icon", iconValue);
    }
    setIconPickerOpen(false);
    setCurrentActivityForIcon(null);
  };

  // Handle save
  const handleSaveClick = () => {
    // Validation
    if (!bookingData.customerName.trim()) {
      toast.error("Validation Error", {
        description: "Please enter the customer name.",
      });
      return;
    }

    if (!bookingData.email.trim()) {
      toast.error("Validation Error", {
        description: "Please enter the email address.",
      });
      return;
    }

    if (!bookingData.mobile.trim()) {
      toast.error("Validation Error", {
        description: "Please enter the mobile number.",
      });
      return;
    }

    if (!bookingData.destination.trim()) {
      toast.error("Validation Error", {
        description: "Please enter the destination.",
      });
      return;
    }

    if (!bookingData.travelDateFrom || !bookingData.travelDateTo) {
      toast.error("Validation Error", {
        description: "Please select both travel dates.",
      });
      return;
    }

    // Check if all days have at least a title
    const hasEmptyDays = itineraryDays.some(day => !day.title.trim());
    if (hasEmptyDays) {
      toast.error("Validation Error", {
        description: "Please provide a title for all days.",
      });
      return;
    }

    setSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const startDate = new Date(bookingData.travelDateFrom);
    const endDate = new Date(bookingData.travelDateTo);
    const formattedDates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const updatedBooking = {
      id: initialData?.id || generateId(),
      customer: bookingData.customerName,
      email: bookingData.email,
      mobile: bookingData.mobile,
      destination: bookingData.destination,
      itinerary: initialData?.itinerary || `${bookingData.destination} - ${itineraryDays.length}D Trip`,
      dates: formattedDates,
      startDate: bookingData.travelDateFrom,
      endDate: bookingData.travelDateTo,
      travelers: parseInt(bookingData.travelers),
      totalAmount: parseFloat(bookingData.totalAmount) || 0,
      total: parseFloat(bookingData.totalAmount) || 0,
      bookedDate: initialData?.bookedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: initialData?.status || "pending",
      sentStatus: initialData?.sentStatus || "unsent",
      confirmStatus: initialData?.confirmStatus || "unconfirmed",
      itineraryDetails: itineraryDays,
    };

    onSave(updatedBooking);
    setHasUnsavedChanges(false);
    setSaveConfirmOpen(false);
    
    toast.success("Booking Updated!", {
      description: "The requested itinerary booking has been successfully updated.",
    });
  };

  // Handle back
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setBackConfirmOpen(true);
    } else {
      navigate("/itinerary");
    }
  };

  const handleConfirmBack = () => {
    setBackConfirmOpen(false);
    navigate("/itinerary");
  };

  // Save as draft
  const handleSaveDraft = () => {
    const draft = {
      id: initialData?.id || `DRAFT-REQ-${Date.now()}`,
      type: "requested" as const,
      customerName: bookingData.customerName || "Unnamed Customer",
      email: bookingData.email,
      mobile: bookingData.mobile,
      destination: bookingData.destination || "No destination set",
      travelDateFrom: bookingData.travelDateFrom,
      travelDateTo: bookingData.travelDateTo,
      travelers: bookingData.travelers ? parseInt(bookingData.travelers) : 1,
      totalAmount: bookingData.totalAmount ? parseFloat(bookingData.totalAmount) : 0,
      itineraryDays: itineraryDays,
      isDraft: true,
      savedAt: new Date().toISOString(),
    };

    if (onSaveDraft) {
      onSaveDraft(draft);
    }

    toast.success("Draft Saved", {
      description: "Your requested booking has been saved as a draft.",
    });

    setBackConfirmOpen(false);
    setHasUnsavedChanges(false);
    navigate("/itinerary");
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <ContentCard>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackClick}
            className="w-11 h-11 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] bg-white hover:bg-[rgba(10,122,255,0.05)] flex items-center justify-center transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#0A7AFF] transition-colors" />
          </button>
          <div className="flex-1">
            <h1 className="text-[#1A2B4F] mb-1">Edit Requested Booking</h1>
            <p className="text-sm text-[#64748B]">
              Update booking details and day-by-day itinerary
            </p>
          </div>
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="h-11 px-6 rounded-xl border-2 border-[#0A7AFF] bg-white hover:bg-[rgba(10,122,255,0.05)] text-[#0A7AFF] flex items-center gap-2 font-medium transition-all"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </ContentCard>


      {/* Booking Details */}
      <ContentCard
          title="Booking Information"
          icon={<User className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-[#14B8A6] to-[#10B981]"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customerName" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Customer Name <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="customerName"
                  placeholder="e.g., Maria Santos"
                  value={bookingData.customerName}
                  onChange={(e) => handleBookingChange("customerName", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Email Address <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., maria.santos@email.com"
                  value={bookingData.email}
                  onChange={(e) => handleBookingChange("email", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mobile" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Mobile Number <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={bookingData.mobile}
                  onChange={(e) => handleBookingChange("mobile", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="destination" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Destination <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="destination"
                  placeholder="e.g., Boracay"
                  value={bookingData.destination}
                  onChange={(e) => handleBookingChange("destination", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="travelDateFrom" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Travel Start Date <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="travelDateFrom"
                  type="date"
                  value={bookingData.travelDateFrom}
                  onChange={(e) => handleBookingChange("travelDateFrom", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="travelDateTo" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Travel End Date <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="travelDateTo"
                  type="date"
                  value={bookingData.travelDateTo}
                  onChange={(e) => handleBookingChange("travelDateTo", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="travelers" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Number of Travelers <span className="text-[#FF6B6B]">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <Input
                  id="travelers"
                  type="number"
                  min="1"
                  placeholder="e.g., 2"
                  value={bookingData.travelers}
                  onChange={(e) => handleBookingChange("travelers", e.target.value)}
                  className="h-11 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="totalAmount" className="text-sm text-[#1A2B4F] mb-2 block font-medium">
                Total Amount (₱)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B] pointer-events-none">₱</span>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 25000"
                  value={bookingData.totalAmount}
                  onChange={(e) => handleBookingChange("totalAmount", e.target.value)}
                  className="h-11 pl-8 rounded-xl border-2 border-[#E5E7EB] focus:border-[#14B8A6] transition-all"
                />
              </div>
            </div>
          </div>
        </ContentCard>

      {/* Day-by-Day Itinerary */}
      <ContentCard>
        <div className="mb-6">
          <h2 className="text-lg text-[#1A2B4F] font-semibold">Day-by-Day Itinerary ({itineraryDays.length} Days)</h2>
        </div>
        <div className="space-y-6">
            {itineraryDays.map((day, dayIndex) => (
              <div
                key={day.id}
                className="p-6 rounded-2xl border-2 border-[#E5E7EB] bg-gradient-to-br from-[rgba(10,122,255,0.02)] to-[rgba(20,184,166,0.02)] hover:border-[#0A7AFF]/30 transition-all"
              >
                {/* Day Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                    <span className="text-white font-bold">D{day.day}</span>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`day-${day.id}-title`} className="text-[#1A2B4F] mb-2 block text-sm font-medium">
                      Day {day.day} Title <span className="text-[#FF6B6B]">*</span>
                    </Label>
                    <Input
                      id={`day-${day.id}-title`}
                      placeholder="e.g., Arrival & Beach Sunset"
                      value={day.title}
                      onChange={(e) => updateDayTitle(day.id, e.target.value)}
                      className="h-11 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] bg-white transition-all"
                    />
                  </div>
                  <button
                    onClick={() => addActivity(day.id)}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center gap-2 text-sm font-medium shadow-lg shadow-[#0A7AFF]/20 hover:shadow-xl hover:shadow-[#0A7AFF]/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>
                </div>

                {/* Activities */}
                <div className="space-y-4">
                  {day.activities.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl bg-white">
                      <div className="w-14 h-14 rounded-xl bg-[#F8FAFB] flex items-center justify-center mx-auto mb-3">
                        <Package className="w-7 h-7 text-[#CBD5E1]" />
                      </div>
                      <p className="text-sm text-[#64748B] mb-1">No activities yet for Day {day.day}</p>
                      <p className="text-xs text-[#94A3B8]">Click "Add Activity" to start building this day</p>
                    </div>
                  ) : (
                    day.activities.map((activity, activityIndex) => {
                      const IconComponent = getIconComponent(activity.icon);
                      return (
                        <div
                          key={activity.id}
                          className="relative p-4 rounded-xl border-2 border-[#E5E7EB] bg-white hover:border-[#0A7AFF] transition-all group"
                        >
                          {/* Activity number badge */}
                          <div className="absolute -left-3 -top-3 w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-md text-white text-xs font-bold">
                            {activityIndex + 1}
                          </div>

                          <div className="flex items-start gap-4">
                            {/* Drag Handle */}
                            <div className="flex flex-col gap-1 pt-2">
                              <button
                                onClick={() => moveActivityUp(day.id, activityIndex)}
                                disabled={activityIndex === 0}
                                className="w-7 h-7 rounded-lg hover:bg-[rgba(10,122,255,0.1)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Move Up"
                              >
                                <GripVertical className="w-4 h-4 text-[#CBD5E1] rotate-90" />
                              </button>
                              <button
                                onClick={() => moveActivityDown(day.id, activityIndex)}
                                disabled={activityIndex === day.activities.length - 1}
                                className="w-7 h-7 rounded-lg hover:bg-[rgba(10,122,255,0.1)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Move Down"
                              >
                                <GripVertical className="w-4 h-4 text-[#CBD5E1] -rotate-90" />
                              </button>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-12 gap-4">
                              {/* Time */}
                              <div className="col-span-2">
                                <Label className="text-xs text-[#64748B] mb-1 block">Time</Label>
                                <Input
                                  type="time"
                                  value={activity.time}
                                  onChange={(e) => updateActivity(day.id, activity.id, "time", e.target.value)}
                                  className="h-9 rounded-lg border-[#E5E7EB] text-sm"
                                />
                              </div>

                              {/* Icon */}
                              <div className="col-span-2">
                                <Label className="text-xs text-[#64748B] mb-1 block">Icon</Label>
                                <button
                                  onClick={() => openIconPicker(day.id, activity.id)}
                                  className="w-full h-9 rounded-lg border-2 border-[#E5E7EB] hover:border-[#0A7AFF] bg-white flex items-center justify-center transition-all"
                                >
                                  <IconComponent className="w-4 h-4 text-[#0A7AFF]" />
                                </button>
                              </div>

                              {/* Title */}
                              <div className="col-span-8">
                                <Label className="text-xs text-[#64748B] mb-1 block">Activity Title *</Label>
                                <Input
                                  placeholder="e.g., Arrival at the Hotel"
                                  value={activity.title}
                                  onChange={(e) => updateActivity(day.id, activity.id, "title", e.target.value)}
                                  className="h-9 rounded-lg border-[#E5E7EB] text-sm"
                                />
                              </div>

                              {/* Location */}
                              <div className="col-span-12 relative">
                                <Label className="text-xs text-[#64748B] mb-1 block">Location</Label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                                  <Input
                                    placeholder="Search location..."
                                    value={activity.location}
                                    onChange={(e) => {
                                      updateActivity(day.id, activity.id, "location", e.target.value);
                                      handleLocationSearch(e.target.value, day.id, activity.id);
                                    }}
                                    onFocus={() => {
                                      if (activity.location.length >= 2) {
                                        handleLocationSearch(activity.location, day.id, activity.id);
                                      }
                                    }}
                                    onBlur={() => {
                                      // Delay hiding suggestions to allow click
                                      setTimeout(() => {
                                        setLocationSuggestions([]);
                                        setActiveLocationInput(null);
                                      }, 200);
                                    }}
                                    className="h-9 pl-9 rounded-lg border-[#E5E7EB] text-sm"
                                  />
                                </div>

                                {/* Location Suggestions Dropdown */}
                                {activeLocationInput?.dayId === day.id && 
                                 activeLocationInput?.activityId === activity.id && 
                                 locationSuggestions.length > 0 && (
                                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border-2 border-[#E5E7EB] rounded-lg shadow-lg max-h-40 overflow-auto">
                                    {locationSuggestions.map((suggestion) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => selectLocationSuggestion(suggestion, day.id, activity.id)}
                                        className="w-full px-4 py-2.5 text-left text-sm text-[#334155] hover:bg-[rgba(10,122,255,0.05)] hover:text-[#0A7AFF] transition-colors flex items-center gap-2 border-b border-[#F1F5F9] last:border-0"
                                      >
                                        <MapPin className="w-3.5 h-3.5 text-[#0A7AFF] flex-shrink-0" />
                                        <span className="truncate">{suggestion}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <div className="col-span-12">
                                <Label className="text-xs text-[#64748B] mb-1 block">Description</Label>
                                <Textarea
                                  placeholder="Add activity details..."
                                  value={activity.description}
                                  onChange={(e) => updateActivity(day.id, activity.id, "description", e.target.value)}
                                  className="rounded-lg border-[#E5E7EB] text-sm resize-none"
                                  rows={2}
                                />
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => confirmDeleteActivity(day.id, activity.id)}
                              className="w-9 h-9 rounded-lg border-2 border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center transition-all group/delete mt-1 flex-shrink-0"
                              title="Delete Activity"
                            >
                              <Trash2 className="w-4 h-4 text-[#64748B] group-hover/delete:text-[#FF6B6B] transition-colors" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-20 right-0 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFB84D] animate-pulse"></div>
                Unsaved changes
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="h-11 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFB] text-[#334155] font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white flex items-center gap-2 font-medium shadow-lg shadow-[#0A7AFF]/25 hover:shadow-xl hover:shadow-[#0A7AFF]/35 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      <Dialog open={iconPickerOpen} onOpenChange={(open) => {
        setIconPickerOpen(open);
        if (!open) setIconSearchQuery("");
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              Select Activity Icon
            </DialogTitle>
            <DialogDescription>
              Choose an icon that best represents this activity
            </DialogDescription>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
              <Input
                placeholder="Search icons..."
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                className="h-10 pl-10 rounded-lg border-[#E5E7EB]"
              />
            </div>
          </div>

          <ScrollArea className="max-h-[400px] px-6">
            <div className="grid grid-cols-4 gap-3 py-4">
              {ICON_OPTIONS.filter(option => 
                option.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
                option.value.toLowerCase().includes(iconSearchQuery.toLowerCase())
              ).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => selectIcon(option.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-center text-[#64748B] group-hover:text-[#0A7AFF] font-medium transition-colors leading-tight">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                <Eye className="w-5 h-5 text-white" />
              </div>
              Booking Preview
            </DialogTitle>
            <DialogDescription className="pb-2">
              This is how the booking details will appear
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-200px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Booking Info Preview */}
              <div className="p-6 rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm">
                <h3 className="text-lg text-[#1A2B4F] mb-4 pb-3 border-b-2 border-[#F1F5F9]">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Customer:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.customerName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Email:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Mobile:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.mobile || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Destination:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.destination || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Travel Dates:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">
                      {bookingData.travelDateFrom && bookingData.travelDateTo
                        ? `${new Date(bookingData.travelDateFrom).toLocaleDateString()} - ${new Date(bookingData.travelDateTo).toLocaleDateString()}`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] block mb-1">Travelers:</span>
                    <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.travelers || "N/A"}</span>
                  </div>
                  {bookingData.totalAmount && (
                    <div className="col-span-2 pt-3 border-t-2 border-[#F1F5F9]">
                      <span className="text-xs text-[#64748B] block mb-1">Total Amount:</span>
                      <span className="text-lg text-[#10B981] font-bold">
                        ₱{parseFloat(bookingData.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Days Preview */}
              {itineraryDays.map((day) => (
                <div key={day.id} className="p-6 rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-[#F1F5F9]">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">Day {day.day}</span>
                    </div>
                    <h3 className="text-lg text-[#1A2B4F]">{day.title || "Untitled Day"}</h3>
                  </div>
                  <div className="space-y-4">
                    {day.activities.length === 0 ? (
                      <p className="text-sm text-[#94A3B8] text-center py-6">No activities planned</p>
                    ) : (
                      day.activities.map((activity) => {
                        const IconComponent = getIconComponent(activity.icon);
                        return (
                          <div key={activity.id} className="flex gap-4 p-4 rounded-lg bg-[#F8FAFB] hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E7EB] transition-all">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow flex-shrink-0">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm text-[#0A7AFF] font-medium">{activity.time}</span>
                                <span className="text-sm text-[#1A2B4F] font-medium">{activity.title || "Untitled Activity"}</span>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-[#64748B] mb-1.5 leading-relaxed">{activity.description}</p>
                              )}
                              {activity.location && (
                                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {activity.location}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="Update Booking"
        description="Are you sure you want to save these changes? The booking will be updated immediately."
        icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
        iconShadow="shadow-[#10B981]/30"
        contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-[rgba(20,184,166,0.05)]"
        contentBorder="border-[#10B981]/20"
        content={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Customer:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.customerName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Destination:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{bookingData.destination || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Days:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{itineraryDays.length}</span>
            </div>
          </div>
        }
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveConfirmOpen(false)}
        confirmText="Save Changes"
        cancelText="Cancel"
        confirmVariant="default"
      />

      {/* Back Confirmation Modal */}
      <Dialog open={backConfirmOpen} onOpenChange={setBackConfirmOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB84D] to-[#FF9800] flex items-center justify-center shadow-lg shadow-[#FFB84D]/20">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="pb-4">
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-[#64748B]">
              Your booking has unsaved changes. You can discard the changes, continue editing, or save as a draft.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSaveDraft}
                className="w-full h-12 px-6 rounded-xl bg-gradient-to-r from-[#FFB84D] to-[#FF9800] text-white font-medium shadow-lg shadow-[#FFB84D]/20 hover:shadow-xl hover:shadow-[#FFB84D]/30 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                onClick={() => setBackConfirmOpen(false)}
                className="w-full h-12 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFB] text-[#334155] font-medium transition-all flex items-center justify-center"
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmBack}
                className="w-full h-12 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] text-[#334155] hover:text-[#FF6B6B] font-medium transition-all flex items-center justify-center"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Confirmation Modal */}
      <ConfirmationModal
        open={deleteActivityConfirm !== null}
        onOpenChange={(open) => !open && setDeleteActivityConfirm(null)}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This action cannot be undone."
        icon={<Trash2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#EF4444]"
        iconShadow="shadow-[#FF6B6B]/30"
        contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-[rgba(239,68,68,0.05)]"
        contentBorder="border-[#FF6B6B]/20"
        onConfirm={removeActivity}
        onCancel={() => setDeleteActivityConfirm(null)}
        confirmText="Delete Activity"
        cancelText="Cancel"
        confirmVariant="destructive"
      />

      {/* Reduce Days Confirmation Modal */}
      <ConfirmationModal
        open={reduceDaysConfirm !== null}
        onOpenChange={(open) => !open && handleCancelReduceDays()}
        title="Remove Days from Itinerary?"
        description="Changing the travel dates will reduce the number of days in this itinerary. Some itinerary details will be permanently removed and cannot be recovered."
        icon={<AlertCircle className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FFB84D] to-[#FF9800]"
        iconShadow="shadow-[#FFB84D]/30"
        contentGradient="bg-gradient-to-br from-[rgba(255,184,77,0.05)] to-[rgba(255,152,0,0.05)]"
        contentBorder="border-[#FFB84D]/20"
        content={
          reduceDaysConfirm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Current Days:</span>
                <span className="text-sm text-[#1A2B4F] font-medium">{itineraryDays.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">New Days:</span>
                <span className="text-sm text-[#1A2B4F] font-medium">{reduceDaysConfirm.newDayCount}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#FFB84D]/20">
                <span className="text-sm text-[#64748B]">Days to Remove:</span>
                <span className="text-sm text-[#FF9800] font-bold">{reduceDaysConfirm.daysToRemove}</span>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[#FF6B6B]/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64748B]">
                    Day {reduceDaysConfirm.newDayCount + 1} through Day {itineraryDays.length} will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )
        }
        onConfirm={handleConfirmReduceDays}
        onCancel={handleCancelReduceDays}
        confirmText="Remove Days"
        cancelText="Keep Current Dates"
        confirmVariant="destructive"
      />
    </div>
  );
}
