import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Heart,
  Utensils,
  Camera,
  Waves,
  Mountain,
  Palmtree,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContentCard } from "../../components/ContentCard";
import { toast } from "sonner";
import { useBookings } from "../../components/BookingContext";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { FAQAssistant } from "../../components/FAQAssistant";
import { useSmartTrip } from "../../hooks/useSmartTrip";
import { X } from "lucide-react";
import { usePlacesSearch } from "../../hooks/useLocations";
import { Place } from "../../types/types";
import { queryKeys } from "../../utils/lib/queryKeys";

export function SmartTrip() {
  const navigate = useNavigate();
  const { addUserTravel } = useBookings();
  const [step, setStep] = useState(1);
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const [destinationQuery, setDestinationQuery] = useState("");
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Place | null>(
    null
  );

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: "1",
    budget: "",
    preferences: [] as string[],
    accommodationType: "hotel",
    travelPace: "moderate",
  });

  const {
    data: placesData,
    isLoading: isSearching,
    error: searchError,
  } = usePlacesSearch(
    { text: destinationQuery, limit: 5 },
    {
      enabled: destinationQuery.length >= 2,
      staleTime: 5 * 60 * 1000,
      queryKey: queryKeys.places.search(formData),
    }
  );

  const suggestions = placesData?.data || [];

  const destinationRef = useRef<HTMLDivElement>(null);

  const preferenceOptions = [
    { id: "beach", label: "Beach & Islands", icon: Waves },
    { id: "mountain", label: "Mountains & Hiking", icon: Mountain },
    { id: "culture", label: "Culture & Heritage", icon: Camera },
    { id: "food", label: "Food & Cuisine", icon: Utensils },
    { id: "adventure", label: "Adventure Sports", icon: Palmtree },
    { id: "relaxation", label: "Relaxation & Spa", icon: Heart },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        destinationRef.current &&
        !destinationRef.current.contains(event.target as Node)
      ) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDestinationSelect = (place: Place) => {
    setSelectedDestination(place);
    setDestinationQuery(place.name);
    setFormData((prev) => ({
      ...prev,
      destination: place.name,
    }));
    setShowDestinationSuggestions(false);
  };

  const handleDestinationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDestinationQuery(value);
    setFormData((prev) => ({ ...prev, destination: value }));

    if (value.length >= 2) {
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
      setSelectedDestination(null);
    }
  };

  const clearDestination = () => {
    setDestinationQuery("");
    setFormData((prev) => ({ ...prev, destination: "" }));
    setSelectedDestination(null);
    setShowDestinationSuggestions(false);
  };

  const { mutate: generateSmartTrip, isPending: isGenerating } = useSmartTrip({
    onSuccess: (response) => {
      const apiTrip = response.data;
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      const nights = days - 1;

      const transformedTrip = {
        title: `${formData.destination} Trip`,
        duration: `${days} ${days > 1 ? "Days" : "Day"}, ${nights} ${
          nights > 1 ? "Nights" : "Night"
        }`,
        totalCost: formData.budget
          ? `₱${parseInt(formData.budget).toLocaleString()}`
          : "₱0",
        itinerary: apiTrip.itinerary || [],
        inclusions: apiTrip.inclusions || [],
      };

      setGeneratedTrip(transformedTrip);
      setStep(2);
      toast.success("Trip generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate trip", {
        description: "Please try again later",
      });
    },
  });

  const handlePreferenceToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(id)
        ? prev.preferences.filter((p) => p !== id)
        : [...prev.preferences, id],
    }));
  };

  const handleGenerate = () => {
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      destination: formData.destination,
      ...(selectedDestination && {}),
      startDate: formData.startDate,
      endDate: formData.endDate,
      travelers: formData.travelers,
      budget: formData.budget,
      preference: formData.preferences,
      accomodationType: formData.accommodationType,
      travelPace: formData.travelPace as "drive" | "walk",
    };

    generateSmartTrip(payload);
  };

  const handleSaveToTravels = () => {
    if (!generatedTrip) return;

    const newTripId = `TP-${Date.now().toString().slice(-6)}`;

    const destinationDetails = selectedDestination
      ? {
          destination: formData.destination,
          destinationLat: selectedDestination.lat,
          destinationLng: selectedDestination.lng,
          destinationAddress: selectedDestination.address,
          destinationSource: selectedDestination.source,
        }
      : {
          destination: formData.destination,
        };

    const newTravel = {
      id: newTripId,
      ...destinationDetails,
      startDate: formData.startDate,
      endDate: formData.endDate,
      travelers: parseInt(formData.travelers),
      budget: formData.budget
        ? `₱${parseInt(formData.budget).toLocaleString()}`
        : generatedTrip?.totalCost || "₱0",
      status: "in-progress" as const,
      bookingType: "Customized" as const,
      bookingSource: "Generated" as const,
      ownership: "owned" as const,
      owner: "Maria Santos",
      collaborators: [],
      createdOn: new Date().toISOString().split("T")[0],
      itinerary: generatedTrip.itinerary,
    };

    addUserTravel(newTravel);

    toast.success("Trip saved to your travels!", {
      description: "Redirecting to In Progress tab...",
    });

    setTimeout(() => {
      navigate("/user/travels", {
        state: { scrollToId: newTripId, tab: "in-progress" },
      });
    }, 800);
  };

  const handleRegenerateTrip = () => {
    setShowRegenerateModal(false);
    setStep(1);
    setGeneratedTrip(null);
    setDestinationQuery("");
    setSelectedDestination(null);
    setShowDestinationSuggestions(false);
    setFormData({
      destination: "",
      startDate: "",
      endDate: "",
      travelers: "1",
      budget: "",
      preferences: [],
      accommodationType: "hotel",
      travelPace: "moderate",
    });
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <>
          {/* Trip Details Form */}
          <ContentCard title="Trip Details" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Destination with search suggestions */}
              <div className="relative" ref={destinationRef}>
                <label className="block text-sm mb-2 text-card-foreground">
                  Destination <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    type="text"
                    placeholder="e.g., Palawan, Boracay, Cebu"
                    value={destinationQuery}
                    onChange={handleDestinationInputChange}
                    onFocus={() => {
                      if (
                        destinationQuery.length >= 2 &&
                        suggestions.length > 0
                      ) {
                        setShowDestinationSuggestions(true);
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                  {destinationQuery && (
                    <button
                      onClick={clearDestination}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Suggestions Dropdown */}
                {showDestinationSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Searching destinations...
                        </p>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-2">
                        {suggestions.map((place: Place) => (
                          <button
                            key={`${place.source}-${place.name}-${place.lat}`}
                            type="button"
                            onClick={() => handleDestinationSelect(place)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3"
                          >
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-card-foreground font-medium truncate">
                                {place.name}
                              </p>
                              {place.address && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {place.address}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {place.source}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : destinationQuery.length >= 2 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No destinations found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try a different search term
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Selected Destination Details */}
                {selectedDestination && (
                  <div className="mt-2 p-3 bg-accent/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-card-foreground">
                          {selectedDestination.name}
                        </span>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {selectedDestination.source}
                      </span>
                    </div>
                    {selectedDestination.address && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {selectedDestination.address}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Rest of your form fields remain the same */}
              {/* Budget */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Budget (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="Total budget for all travelers"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Number of Travelers
                </label>
                <div className="relative">
                  <Users
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 2"
                    value={formData.travelers}
                    onChange={(e) =>
                      setFormData({ ...formData, travelers: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Travel Pace */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Travel Pace
                </label>
                <select
                  value={formData.travelPace}
                  onChange={(e) =>
                    setFormData({ ...formData, travelPace: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
                >
                  <option value="relaxed">Relaxed - Lots of free time</option>
                  <option value="moderate">
                    Moderate - Balanced itinerary
                  </option>
                  <option value="fast">Fast - See everything</option>
                </select>
              </div>

              {/* Accommodation Type */}
              <div>
                <label className="block text-sm mb-2 text-card-foreground">
                  Accommodation Type
                </label>
                <select
                  value={formData.accommodationType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accommodationType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
                >
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="villa">Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="hostel">Hostel</option>
                </select>
              </div>
            </div>
          </ContentCard>

          {/* Preferences */}
          <ContentCard title="Your Preferences" icon={Heart}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {preferenceOptions.map((pref) => {
                const Icon = pref.icon;
                const isSelected = formData.preferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => handlePreferenceToggle(pref.id)}
                    className={`p-5 border-2 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50 hover:shadow-sm"
                    }`}
                    style={
                      isSelected
                        ? {
                            background:
                              "linear-gradient(135deg, var(--primary-rgb-10), transparent)",
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className={`w-7 h-7 mx-auto mb-2 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      } transition-colors`}
                      strokeWidth={2}
                    />
                    <p
                      className={`text-sm text-center ${
                        isSelected ? "text-primary" : "text-card-foreground"
                      } transition-colors`}
                    >
                      {pref.label}
                    </p>
                    {isSelected && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check
                            className="w-3 h-3 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ContentCard>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-8 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isGenerating
                  ? "#9CA3AF"
                  : "linear-gradient(135deg, #0A7AFF, #14B8A6)",
                color: "white",
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                  Generating Your Perfect Trip...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                  Generate Itinerary
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === 2 && generatedTrip && (
        <>
          {/* Generated Trip Header */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-sm opacity-90">AI Generated</span>
                </div>
                <h2 className="text-2xl mb-2">{generatedTrip.title}</h2>
                <p className="text-white/90">{generatedTrip.duration}</p>
                <p className="text-xs text-white/70 mt-3 italic">
                  💡 You can edit this generated trip once you add this to
                  Travels
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80 mb-1">Total Cost</p>
                <p className="text-3xl">{generatedTrip.totalCost}</p>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <ContentCard title="Your Itinerary" icon={Calendar}>
            <div className="space-y-4">
              {generatedTrip.itinerary.map((day: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-md">
                      <span className="text-lg">{day.day}</span>
                    </div>
                    <h3 className="text-base text-card-foreground flex-1">
                      {day.title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {day.activities.map((activity: any, i: number) => {
                      const ActivityIcon = activity.icon || Camera;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <ActivityIcon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-primary">
                                {activity.time}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {activity.location}
                              </span>
                            </div>
                            <h4 className="text-sm text-card-foreground mb-1">
                              {activity.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Inclusions */}
          {generatedTrip.inclusions.length > 0 && (
            <ContentCard title="Package Inclusions" icon={Check}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedTrip.inclusions.map((item: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Check
                        className="w-4 h-4 text-green-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-sm text-card-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </ContentCard>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowRegenerateModal(true)}
              className="px-6 py-3 border-2 border-border rounded-xl hover:bg-accent hover:border-primary/50 transition-all text-center flex items-center justify-center"
            >
              Generate Another Trip
            </button>

            <button
              onClick={handleSaveToTravels}
              className="px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0A7AFF, #14B8A6)",
                color: "white",
              }}
            >
              Save to My Travels
            </button>
          </div>
        </>
      )}

      {/* Regenerate Trip Confirmation Modal */}
      <ConfirmationModal
        open={showRegenerateModal}
        onOpenChange={setShowRegenerateModal}
        title="Generate Another Trip"
        description="This will discard your current generated trip"
        icon={<AlertTriangle className="w-5 h-5 text-white" />}
        iconGradient="bg-gradient-to-br from-[#FF9500] to-[#FF6B00]"
        iconShadow="shadow-[#FF9500]/20"
        contentGradient="bg-gradient-to-br from-[rgba(255,149,0,0.05)] to-transparent"
        contentBorder="border-[rgba(255,149,0,0.2)]"
        content={
          <div className="text-card-foreground space-y-3">
            <p className="mb-3">
              Are you sure you want to generate another trip? Your current
              itinerary will be discarded and cannot be recovered.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Trip:</span>
                <span className="font-medium">{generatedTrip?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{generatedTrip?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">{generatedTrip?.totalCost}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                💡 Tip: You can save this trip to "My Travels" before generating
                a new one to keep it for later.
              </p>
            </div>
          </div>
        }
        onConfirm={handleRegenerateTrip}
        onCancel={() => setShowRegenerateModal(false)}
        confirmText="Yes, Generate New Trip"
        cancelText="Keep This Trip"
        confirmVariant="default"
      />

      <FAQAssistant />
    </div>
  );
}
