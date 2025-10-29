import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, Plane, Hotel, Camera, UtensilsCrossed, Car, Package, MapPin, Compass, TreePine, Building2, Ship, Train, Coffee, ShoppingBag, Music, Sunset, Clock, AlertCircle, Sparkles, CheckCircle2, FileText, Calendar, Users, DollarSign, Mail, Phone, User, Waves, Mountain, Palmtree, Tent, Bike, Bus, Anchor, Film, Ticket, Wine, IceCream, Pizza, Fish, Salad, Utensils, Home, Landmark, Church, Castle, Globe, Backpack, Luggage, Umbrella, Sun, Moon, Star, Heart, Gift, ShoppingCart, Search, Bot } from "lucide-react";
import { ContentCard } from "../components/ContentCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { RouteOptimizationPanel } from "../components/RouteOptimizationPanel";
import { AITravelAssistant } from "../components/AITravelAssistant";
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

interface RequestedBookingFormData {
  customerName: string;
  email: string;
  mobile: string;
  destination: string;
  travelDateFrom: string;
  travelDateTo: string;
  travelers: string;
  totalAmount: string;
}

interface CreateRequestedItineraryProps {
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

export function CreateRequestedItinerary({ onSave, onSaveDraft, initialData }: CreateRequestedItineraryProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RequestedBookingFormData>({
    customerName: "",
    email: "",
    mobile: "",
    destination: "",
    travelDateFrom: "",
    travelDateTo: "",
    travelers: "1",
    totalAmount: "",
  });

  const [itineraryDays, setItineraryDays] = useState<Day[]>([
    {
      id: "day-1",
      day: 1,
      title: "",
      activities: [],
    },
  ]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [deleteActivityConfirm, setDeleteActivityConfirm] = useState<{ dayId: string; activityId: string } | null>(null);
  const [currentActivityForIcon, setCurrentActivityForIcon] = useState<{ dayId: string; activityId: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [reduceDaysConfirm, setReduceDaysConfirm] = useState<{ newDayCount: number; daysToRemove: number } | null>(null);
  const [pendingDateChange, setPendingDateChange] = useState<{ field: "travelDateFrom" | "travelDateTo"; value: string } | null>(null);

  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [activeLocationInput, setActiveLocationInput] = useState<{ dayId: string; activityId: string } | null>(null);

  // Icon search state
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Route Optimization state
  const [selectedDayForRoute, setSelectedDayForRoute] = useState<string | null>(null);

  // Generate unique ID
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to get icon name from icon component
  const getIconNameFromComponent = (iconComponent: any) => {
    if (!iconComponent) return "Clock";
    
    // If it's already a string, return it
    if (typeof iconComponent === "string") return iconComponent;
    
    // Try to match by component name
    if (iconComponent.name) {
      const iconMatch = ICON_OPTIONS.find(opt => opt.icon.name === iconComponent.name);
      if (iconMatch) return iconMatch.value;
    }
    
    // Try to match by comparing the actual component
    const iconMatch = ICON_OPTIONS.find(opt => {
      try {
        return opt.icon === iconComponent;
      } catch {
        return false;
      }
    });
    
    if (iconMatch) return iconMatch.value;
    
    // Default fallback
    return "Clock";
  };

  // Load initial data if provided (for drafts)
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName || "",
        email: initialData.email || "",
        mobile: initialData.mobile || "",
        destination: initialData.destination || "",
        travelDateFrom: initialData.travelDateFrom || "",
        travelDateTo: initialData.travelDateTo || "",
        travelers: initialData.travelers?.toString() || "1",
        totalAmount: initialData.totalAmount?.toString() || "",
      });
      
      // If itineraryDays exists (from draft), use it directly
      if (initialData.itineraryDays && initialData.itineraryDays.length > 0) {
        setItineraryDays(initialData.itineraryDays);
      }
    }
  }, [initialData]);

  // Track changes
  useEffect(() => {
    const hasData = formData.customerName || formData.email || formData.mobile || 
                    formData.destination || formData.totalAmount || 
                    itineraryDays.some(day => day.title || day.activities.length > 0);
    setHasUnsavedChanges(hasData);
  }, [formData, itineraryDays]);

  // Recalculate days when dates change (now handled with confirmation)
  useEffect(() => {
    if (formData.travelDateFrom && formData.travelDateTo && !pendingDateChange) {
      const start = new Date(formData.travelDateFrom);
      const end = new Date(formData.travelDateTo);
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
  }, [formData.travelDateFrom, formData.travelDateTo, pendingDateChange]);

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
  const handleFormChange = (field: keyof RequestedBookingFormData, value: string) => {
    // Special handling for date changes
    if (field === "travelDateFrom" || field === "travelDateTo") {
      const tempData = { ...formData, [field]: value };
      
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
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Confirm reduce days
  const handleConfirmReduceDays = () => {
    if (reduceDaysConfirm && pendingDateChange) {
      // Apply the pending date change
      setFormData(prev => ({ ...prev, [pendingDateChange.field]: pendingDateChange.value }));
      
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

    toast.success("Activity Removed", {
      description: "The activity has been deleted from your itinerary.",
    });

    setDeleteActivityConfirm(null);
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

  // Open icon picker
  const openIconPicker = (dayId: string, activityId: string) => {
    setCurrentActivityForIcon({ dayId, activityId });
    setIconPickerOpen(true);
  };

  // Select icon
  const selectIcon = (iconName: string) => {
    if (currentActivityForIcon) {
      updateActivity(
        currentActivityForIcon.dayId,
        currentActivityForIcon.activityId,
        "icon",
        iconName
      );
    }
    setIconPickerOpen(false);
    setCurrentActivityForIcon(null);
  };

  // Move activity up
  const moveActivityUp = (dayId: string, activityIndex: number) => {
    if (activityIndex === 0) return;
    setItineraryDays(prev =>
      prev.map(day => {
        if (day.id === dayId) {
          const newActivities = [...day.activities];
          [newActivities[activityIndex], newActivities[activityIndex - 1]] = [
            newActivities[activityIndex - 1],
            newActivities[activityIndex],
          ];
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
          [newActivities[activityIndex], newActivities[activityIndex + 1]] = [
            newActivities[activityIndex + 1],
            newActivities[activityIndex],
          ];
          return { ...day, activities: newActivities };
        }
        return day;
      })
    );
  };

  // Validate form
  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.error("Missing Required Field", {
        description: "Please enter the customer name.",
      });
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Missing Required Field", {
        description: "Please enter the customer's email address.",
      });
      return false;
    }
    if (!formData.mobile.trim()) {
      toast.error("Missing Required Field", {
        description: "Please enter the customer's mobile number.",
      });
      return false;
    }
    if (!formData.destination.trim()) {
      toast.error("Missing Required Field", {
        description: "Please enter a destination.",
      });
      return false;
    }
    if (!formData.travelDateFrom) {
      toast.error("Missing Required Field", {
        description: "Please enter a travel start date.",
      });
      return false;
    }
    if (!formData.travelDateTo) {
      toast.error("Missing Required Field", {
        description: "Please enter a travel end date.",
      });
      return false;
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid total amount (must be greater than 0).",
      });
      return false;
    }

    // Check if all days have titles and at least one activity
    for (const day of itineraryDays) {
      if (!day.title.trim()) {
        toast.error(`Day ${day.day} Incomplete`, {
          description: `Please enter a title for Day ${day.day}.`,
        });
        return false;
      }
      if (day.activities.length === 0) {
        toast.error(`Day ${day.day} Empty`, {
          description: `Please add at least one activity for Day ${day.day}.`,
        });
        return false;
      }
      
      // Check if all activities have required fields
      for (const activity of day.activities) {
        if (!activity.title.trim()) {
          toast.error(`Activity Title Missing`, {
            description: `Please enter a title for all activities on Day ${day.day}.`,
          });
          return false;
        }
      }
    }

    return true;
  };

  // Open save confirmation
  const handleSaveClick = () => {
    if (!validateForm()) return;
    setSaveConfirmOpen(true);
  };

  // Save booking
  const handleSave = () => {
    const startDate = new Date(formData.travelDateFrom);
    const endDate = new Date(formData.travelDateTo);
    const formattedDates = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    
    const newBooking = {
      id: initialData?.id || `BV-REQ-${Date.now()}`,
      customer: formData.customerName,
      email: formData.email,
      mobile: formData.mobile,
      destination: formData.destination,
      itinerary: `${itineraryDays.length}-Day ${formData.destination} Trip`,
      dates: formattedDates,
      startDate: formData.travelDateFrom,
      endDate: formData.travelDateTo,
      travelers: parseInt(formData.travelers),
      totalAmount: `₱${parseFloat(formData.totalAmount).toLocaleString()}`,
      paid: "₱0",
      bookedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      bookedDateObj: new Date(),
      status: "pending" as const,
      sentStatus: "unsent" as const,
      confirmStatus: "unconfirmed" as const,
      bookingType: "Requested" as const,
      itineraryDetails: itineraryDays.map(day => ({
        day: day.day,
        title: day.title,
        activities: day.activities.map(activity => ({
          time: activity.time,
          icon: activity.icon,
          title: activity.title,
          description: activity.description,
          location: activity.location,
        })),
      })),
    };

    toast.success("Requested Itinerary Saved!", {
      description: `Requested itinerary for ${formData.customerName} has been successfully saved to the Itinerary page.`,
    });

    setSaveConfirmOpen(false);
    setHasUnsavedChanges(false);
    onSave(newBooking);
  };

  // Handle back with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setBackConfirmOpen(true);
    } else {
      navigate("/itinerary");
    }
  };

  // Save as draft
  const handleSaveDraft = () => {
    const draft = {
      id: initialData?.id || `DRAFT-REQ-${Date.now()}`,
      type: "requested" as const,
      customerName: formData.customerName || "Unnamed Customer",
      email: formData.email,
      mobile: formData.mobile,
      destination: formData.destination || "No destination set",
      travelDateFrom: formData.travelDateFrom,
      travelDateTo: formData.travelDateTo,
      travelers: formData.travelers ? parseInt(formData.travelers) : 1,
      totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0,
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

  // Handle route optimization acceptance
  const handleAcceptOptimization = (dayId: string, optimizedActivities: Activity[]) => {
    setItineraryDays(prev =>
      prev.map(day =>
        day.id === dayId
          ? { ...day, activities: optimizedActivities }
          : day
      )
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 pb-32">
      {/* Main Content */}
      <div className="space-y-6">
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
              <h1 className="text-[#1A2B4F] mb-1">Create Requested Itinerary</h1>
              <p className="text-sm text-[#64748B]">
                Build a customized itinerary with detailed day-by-day plans for your client
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

      {/* Customer & Booking Information */}
      <ContentCard>
        <div className="mb-6">
          <h2 className="text-lg text-[#1A2B4F] font-semibold">Customer & Booking Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="customerName" className="text-[#1A2B4F] mb-2 block">
              Customer Name <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="customerName"
                placeholder="e.g., Maria Santos"
                value={formData.customerName}
                onChange={(e) => handleFormChange("customerName", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-[#1A2B4F] mb-2 block">
              Email Address <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="maria.santos@email.com"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile" className="text-[#1A2B4F] mb-2 block">
              Mobile Number <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="mobile"
                type="tel"
                placeholder="+63 917 123 4567"
                value={formData.mobile}
                onChange={(e) => handleFormChange("mobile", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="destination" className="text-[#1A2B4F] mb-2 block">
              Destination <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="destination"
                placeholder="e.g., Baguio City"
                value={formData.destination}
                onChange={(e) => handleFormChange("destination", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelDateFrom" className="text-[#1A2B4F] mb-2 block">
              Travel Start Date <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelDateFrom"
                type="date"
                value={formData.travelDateFrom}
                onChange={(e) => handleFormChange("travelDateFrom", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelDateTo" className="text-[#1A2B4F] mb-2 block">
              Travel End Date <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelDateTo"
                type="date"
                value={formData.travelDateTo}
                onChange={(e) => handleFormChange("travelDateTo", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="travelers" className="text-[#1A2B4F] mb-2 block">
              Number of Travelers <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              <Input
                id="travelers"
                type="number"
                min="1"
                placeholder="2"
                value={formData.travelers}
                onChange={(e) => handleFormChange("travelers", e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalAmount" className="text-[#1A2B4F] mb-2 block">
              Total Amount (₱) <span className="text-[#FF6B6B]">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">₱</span>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter Total Amount"
                value={formData.totalAmount}
                onChange={(e) => handleFormChange("totalAmount", e.target.value)}
                className="h-12 pl-10 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
              />
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Day-by-Day Itinerary */}
      <ContentCard>
        <div className="mb-6">
          <h2 className="text-lg text-[#1A2B4F] font-semibold">Day-by-Day Itinerary ({itineraryDays.length} Days)</h2>
          <p className="text-sm text-[#64748B] mt-1">Days are automatically calculated from travel dates</p>
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
                                  {locationSuggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
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

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-[80px] right-0 h-20 bg-white border-t-2 border-[#E5E7EB] z-40">
        <div className="h-full max-w-[1400px] mx-auto px-8 flex items-center justify-end gap-3">
          <button
            onClick={handleBackClick}
            className="h-12 px-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#CBD5E1] bg-white hover:bg-[#F8FAFB] text-[#334155] font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white font-medium shadow-lg shadow-[#0A7AFF]/20 hover:shadow-xl hover:shadow-[#0A7AFF]/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Itinerary
          </button>
        </div>
      </div>
      </div>

      {/* Route Optimization Panel */}
      {itineraryDays.some(day => day.activities.filter(a => a.location).length >= 2) && (
        <RouteOptimizationPanel
          itineraryDays={itineraryDays}
          selectedDayId={selectedDayForRoute || itineraryDays.find(d => d.activities.filter(a => a.location).length >= 2)?.id}
          onAcceptOptimization={handleAcceptOptimization}
        />
      )}

      {/* Icon Picker Dialog */}
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

      {/* Preview Modal - Similar to booking detail view */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl text-[#1A2B4F] mb-2">Itinerary Preview</DialogTitle>
                    <DialogDescription className="text-[#64748B]">
                      This is how the itinerary will appear once saved
                    </DialogDescription>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(10,122,255,0.1)] to-[rgba(20,184,166,0.1)] border-2 border-[rgba(10,122,255,0.2)]">
                    <span className="text-sm font-medium text-[#0A7AFF]">Preview Mode</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Customer Information */}
              <div className="mb-6 p-6 rounded-2xl border-2 border-[#E5E7EB] bg-gradient-to-br from-[rgba(10,122,255,0.02)] to-[rgba(20,184,166,0.02)]">
                <h3 className="text-sm font-semibold text-[#1A2B4F] mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#64748B]">Customer Name</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">{formData.customerName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Email</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">{formData.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Mobile</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">{formData.mobile || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Destination</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">{formData.destination || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Travel Dates</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">
                      {formData.travelDateFrom && formData.travelDateTo 
                        ? `${new Date(formData.travelDateFrom).toLocaleDateString()} - ${new Date(formData.travelDateTo).toLocaleDateString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Total Amount</span>
                    <p className="text-sm text-[#1A2B4F] font-medium mt-1">
                      {formData.totalAmount ? `₱${parseFloat(formData.totalAmount).toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itinerary Details */}
              <div>
                <h3 className="text-sm font-semibold text-[#1A2B4F] mb-4">Itinerary Details ({itineraryDays.length} Days)</h3>
                <div className="space-y-6">
                  {itineraryDays.map((day) => (
                    <div key={day.id} className="p-6 rounded-2xl border-2 border-[#E5E7EB] bg-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">D{day.day}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#1A2B4F]">Day {day.day}</h4>
                          <p className="text-sm text-[#64748B]">{day.title || "Untitled"}</p>
                        </div>
                      </div>
                      <div className="space-y-3 pl-4 border-l-2 border-[#E5E7EB] ml-6">
                        {day.activities.length === 0 ? (
                          <p className="text-sm text-[#94A3B8] italic">No activities added yet</p>
                        ) : (
                          day.activities.map((activity) => {
                            const IconComponent = getIconComponent(activity.icon);
                            return (
                              <div key={activity.id} className="flex items-start gap-3 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgba(10,122,255,0.1)] to-[rgba(20,184,166,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <IconComponent className="w-4 h-4 text-[#0A7AFF]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-[#0A7AFF]">{activity.time}</span>
                                    <span className="text-sm font-medium text-[#1A2B4F]">{activity.title || "Untitled Activity"}</span>
                                  </div>
                                  {activity.description && (
                                    <p className="text-sm text-[#64748B] mb-1">{activity.description}</p>
                                  )}
                                  {activity.location && (
                                    <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                                      <MapPin className="w-3 h-3" />
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
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="Save Requested Itinerary"
        description="Are you ready to save this requested itinerary? It will be added to the Requested tab in the Itinerary page."
        icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#10B981] to-[#14B8A6]"
        iconShadow="shadow-[#10B981]/20"
        contentGradient="bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-[rgba(20,184,166,0.05)]"
        contentBorder="border-[rgba(16,185,129,0.2)]"
        content={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Customer:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{formData.customerName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Destination:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{formData.destination || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Days:</span>
              <span className="text-sm text-[#1A2B4F] font-medium">{itineraryDays.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Total Amount:</span>
              <span className="text-sm text-[#10B981] font-bold">
                ₱{formData.totalAmount ? parseFloat(formData.totalAmount).toLocaleString() : "0"}
              </span>
            </div>
          </div>
        }
        onConfirm={handleSave}
        onCancel={() => setSaveConfirmOpen(false)}
        confirmText="Save Itinerary"
        cancelText="Review Again"
        confirmVariant="default"
      />

      {/* Unsaved Changes Modal */}
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
              Your itinerary has unsaved changes. You can save it as a draft to continue working on it later, continue editing, or discard the changes.
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
                onClick={() => {
                  setBackConfirmOpen(false);
                  setHasUnsavedChanges(false);
                  navigate("/itinerary");
                }}
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
        description="Are you sure you want to remove this activity from the itinerary?"
        icon={<Trash2 className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF5252]"
        iconShadow="shadow-[#FF6B6B]/30"
        contentGradient="bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-[rgba(255,82,82,0.05)]"
        contentBorder="border-[#FF6B6B]/20"
        content={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#FF6B6B]">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">This action cannot be undone</span>
            </div>
            <p className="text-sm text-[#64748B]">
              The activity will be permanently removed from this day's itinerary.
            </p>
          </div>
        }
        onConfirm={removeActivity}
        confirmText="Delete Activity"
        cancelText="Keep Activity"
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
