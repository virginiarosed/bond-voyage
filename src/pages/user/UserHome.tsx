import {
  Calendar,
  MapPin,
  TrendingUp,
  Plane,
  Star,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  Users,
  FileText,
  CloudRain,
  Sun,
  Cloud,
  Droplets,
  Wind,
  Search,
  Briefcase,
  UserPlus,
  Activity,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../components/StatCard";
import { ContentCard } from "../../components/ContentCard";
import { BookingListCard } from "../../components/BookingListCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdventureAvatar } from "../../components/AdventureAvatar";
import { useState, useEffect } from "react";
import { toast } from "sonner@2.0.3";
import { motion } from "motion/react";
import { useProfile } from "../../components/ProfileContext";
import { useBookings } from "../../components/BookingContext";

export function UserHome() {
  const navigate = useNavigate();
  const { userProfileData } = useProfile();
  const { userTravels } = useBookings();
  const [selectedLocation, setSelectedLocation] = useState("Manila");
  const [searchLocation, setSearchLocation] = useState("");
  const [currentTipBatch, setCurrentTipBatch] = useState(0);

  // Get initials from first and last name
  const getInitials = () => {
    if (!userProfileData) return null;
    if (userProfileData.profilePicture) return null;
    return (
      userProfileData.firstName[0] + userProfileData.lastName[0]
    ).toUpperCase();
  };

  // Calculate owned, collaborated, and pending counts from userTravels
  const ownedTravelCount = userTravels.filter(
    (travel) => travel.ownership === "owned" && travel.status === "in-progress"
  ).length;

  const collaboratedTravelCount = userTravels.filter(
    (travel) =>
      travel.ownership === "collaborated" && travel.status === "in-progress"
  ).length;

  const pendingTravelCount = userTravels.filter(
    (travel) => travel.status === "pending"
  ).length;

  // Mock user profile data - keeping for owned/collaborated travel counts
  const userProfile = {
    firstName: userProfileData ? userProfileData.firstName : "",
    lastName: userProfileData ? userProfileData.lastName : "",
    email: userProfileData ? userProfileData.email : "",
    ownedTravel: ownedTravelCount || 0,
    collaboratedTravel: collaboratedTravelCount || 0,
  };

  // Bookings data from UserBookings.tsx
  const upcomingBookings = [];

  // Historical completed trips data from UserHistory.tsx
  const completedTripsData = [
    { dates: "October 12, 2024 – October 17, 2024" }, // October
    { dates: "August 5, 2024 – August 7, 2024" }, // August
    { dates: "July 20, 2024 – July 25, 2024" }, // July
  ];

  // Generate booking trends data for last 12 months based on actual data
  const generateBookingTrends = () => {
    const now = new Date();
    const trends = [];

    // Initialize all months with 0 bookings
    const monthCounts: Record<string, number> = {};

    // Count bookings per month from completed trips
    completedTripsData.forEach((trip) => {
      // Extract month and year from dates string (e.g., "Oct 12-17, 2024")
      const monthStr = trip.dates.split(" ")[0]; // "Oct"
      const year = trip.dates.split(", ")[1]; // "2024"
      const monthKey = `${monthStr} ${year}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Add upcoming bookings
    upcomingBookings.forEach((booking) => {
      const monthStr = booking.dates.split(" ")[0];
      const year = booking.dates.split(", ")[1];
      const monthKey = `${monthStr} ${year}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Create trend data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      const monthKey = `${monthName} ${year}`;

      trends.push({
        month: monthName,
        bookings: monthCounts[monthKey] || 0,
      });
    }

    return trends;
  };

  const monthlyData = generateBookingTrends();

  // Current weather forecast (7 days)
  const forecast = [
    { day: "Mon", temp: "28°C", icon: Cloud, condition: "Partly Cloudy" },
    { day: "Tue", temp: "30°C", icon: Sun, condition: "Sunny" },
    { day: "Wed", temp: "27°C", icon: CloudRain, condition: "Rainy" },
    { day: "Thu", temp: "29°C", icon: Cloud, condition: "Cloudy" },
    { day: "Fri", temp: "31°C", icon: Sun, condition: "Sunny" },
    { day: "Sat", temp: "28°C", icon: Cloud, condition: "Cloudy" },
    { day: "Sun", temp: "29°C", icon: Sun, condition: "Sunny" },
  ];

  // Enhanced travel tips - organized in batches of 6
  const allTravelTips = [
    // Batch 1: General Travel Tips
    [
      {
        emoji: "🌴",
        title: "Best Time to Visit Palawan",
        description:
          "December to May offers perfect weather for island hopping and beach activities. Avoid the rainy season from June to November.",
        color: "blue",
        icon: Sun,
      },
      {
        emoji: "💰",
        title: "Budget Travel Tip",
        description:
          "Book your trips 3-4 months in advance to get the best deals on flights and accommodations. Consider traveling during off-peak seasons.",
        color: "green",
        icon: TrendingUp,
      },
      {
        emoji: "🎒",
        title: "Pack Smart",
        description:
          "Bring lightweight, quick-dry clothing and always pack a reusable water bottle to stay hydrated during your adventures.",
        color: "purple",
        icon: CheckCircle,
      },
      {
        emoji: "📸",
        title: "Capture Memories",
        description:
          "Don't forget to bring a waterproof camera or phone case for those amazing underwater shots and beach photography.",
        color: "pink",
        icon: Sparkles,
      },
      {
        emoji: "🗺️",
        title: "Explore Local Culture",
        description:
          "Visit local markets and try authentic Filipino cuisine. Learn basic Tagalog phrases like 'Salamat' (Thank you) to connect with locals.",
        color: "orange",
        icon: MapPin,
      },
      {
        emoji: "🌊",
        title: "Island Hopping Tips",
        description:
          "Start early morning tours to avoid crowds and enjoy the best lighting for photos at pristine beaches and hidden lagoons.",
        color: "cyan",
        icon: Star,
      },
    ],
    // Batch 2: Safety & Health
    [
      {
        emoji: "🏥",
        title: "Health Essentials",
        description:
          "Pack sunscreen (SPF 50+), insect repellent, and basic first aid kit. Stay hydrated and bring electrolyte drinks for hot weather.",
        color: "blue",
        icon: CheckCircle,
      },
      {
        emoji: "🌡️",
        title: "Beat the Heat",
        description:
          "Philippine summers can be intense. Wear light colors, use umbrella for shade, and take breaks in air-conditioned areas.",
        color: "orange",
        icon: Sun,
      },
      {
        emoji: "🚰",
        title: "Water Safety",
        description:
          "Always drink bottled or purified water. Avoid ice in drinks unless you're sure it's from filtered water. Stay safe, stay hydrated!",
        color: "cyan",
        icon: Sparkles,
      },
      {
        emoji: "📱",
        title: "Stay Connected",
        description:
          "Get a local SIM card for affordable data and calls. Download offline maps and important contacts before your trip.",
        color: "purple",
        icon: MapPin,
      },
      {
        emoji: "💊",
        title: "Medicine Checklist",
        description:
          "Bring motion sickness pills for boat rides, antihistamines, pain relievers, and any prescription medications you need.",
        color: "pink",
        icon: TrendingUp,
      },
      {
        emoji: "🔒",
        title: "Secure Your Belongings",
        description:
          "Use hotel safes for valuables, keep copies of important documents, and be aware of your surroundings in crowded areas.",
        color: "green",
        icon: Star,
      },
    ],
    // Batch 3: Local Experience
    [
      {
        emoji: "🍽️",
        title: "Filipino Food Must-Try",
        description:
          "Don't miss Adobo, Sinigang, Lechon, and Halo-Halo! Visit local 'carinderia' for authentic home-cooked Filipino meals.",
        color: "orange",
        icon: Sparkles,
      },
      {
        emoji: "🚕",
        title: "Transportation Tips",
        description:
          "Use Grab or local tricycles for short distances. For longer trips, book van transfers in advance for better rates and comfort.",
        color: "blue",
        icon: MapPin,
      },
      {
        emoji: "💬",
        title: "Learn Basic Filipino",
        description:
          "Locals appreciate effort! Learn: 'Magkano?' (How much?), 'Paki-help' (Please help), 'Masarap!' (Delicious!).",
        color: "green",
        icon: Star,
      },
      {
        emoji: "🎁",
        title: "Shopping Smart",
        description:
          "Buy pasalubong (gifts) at local markets instead of tourist shops. Dried mangoes, barako coffee, and handwoven products are great!",
        color: "purple",
        icon: TrendingUp,
      },
      {
        emoji: "🏖️",
        title: "Beach Etiquette",
        description:
          "Take your trash with you, respect marine life, don't touch corals. Help keep Philippine beaches pristine for future travelers!",
        color: "cyan",
        icon: Sun,
      },
      {
        emoji: "🎭",
        title: "Cultural Festivals",
        description:
          "Plan around local festivals like Sinulog (Cebu), Ati-Atihan (Aklan), or Pahiyas (Quezon) for unforgettable cultural experiences.",
        color: "pink",
        icon: CheckCircle,
      },
    ],
    // Batch 4: Adventure & Activities
    [
      {
        emoji: "🤿",
        title: "Diving & Snorkeling",
        description:
          "Philippines has world-class dive sites! Bring reef-safe sunscreen and underwater camera. Best spots: Apo Reef, Tubbataha, Moalboal.",
        color: "cyan",
        icon: Star,
      },
      {
        emoji: "🏄",
        title: "Surfing Destinations",
        description:
          "Siargao's Cloud 9 is famous, but also try La Union and Baler for great waves. September to November is prime surf season.",
        color: "blue",
        icon: Sparkles,
      },
      {
        emoji: "⛰️",
        title: "Hiking Adventures",
        description:
          "Mt. Pulag for sea of clouds, Taal Volcano for lake views, or Mt. Pinatubo for crater lake. Always hire local guides!",
        color: "green",
        icon: MapPin,
      },
      {
        emoji: "🚣",
        title: "Water Activities",
        description:
          "Try kayaking in Puerto Princesa Underground River, canyoneering in Cebu, or SUP in Coron. Book tours with certified operators.",
        color: "purple",
        icon: TrendingUp,
      },
      {
        emoji: "🎣",
        title: "Fishing Experiences",
        description:
          "Join local fishermen for traditional fishing experiences or try sport fishing in Palawan. Fresh catch can be cooked at your resort!",
        color: "orange",
        icon: Sun,
      },
      {
        emoji: "🌅",
        title: "Sunrise & Sunset Spots",
        description:
          "Catch sunrise at Cloud 9 boardwalk or Mt. Pulag. Best sunsets: Boracay White Beach, Manila Bay, or El Nido's Las Cabanas.",
        color: "pink",
        icon: CheckCircle,
      },
    ],
  ];

  // Auto-rotate tips every 20 seconds (giving users time to read)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipBatch((prev) => (prev + 1) % allTravelTips.length);
    }, 20000); // 20 seconds per batch

    return () => clearInterval(interval);
  }, []);

  const travelTips = allTravelTips[currentTipBatch];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> =
      {
        blue: {
          bg: "from-blue-500/10",
          icon: "bg-blue-500/20 text-blue-500",
          border: "hover:border-blue-500/50",
        },
        green: {
          bg: "from-green-500/10",
          icon: "bg-green-500/20 text-green-500",
          border: "hover:border-green-500/50",
        },
        purple: {
          bg: "from-purple-500/10",
          icon: "bg-purple-500/20 text-purple-500",
          border: "hover:border-purple-500/50",
        },
        pink: {
          bg: "from-pink-500/10",
          icon: "bg-pink-500/20 text-pink-500",
          border: "hover:border-pink-500/50",
        },
        orange: {
          bg: "from-orange-500/10",
          icon: "bg-orange-500/20 text-orange-500",
          border: "hover:border-orange-500/50",
        },
        cyan: {
          bg: "from-cyan-500/10",
          icon: "bg-cyan-500/20 text-cyan-500",
          border: "hover:border-cyan-500/50",
        },
      };
    return colors[color] || colors.blue;
  };

  const handleWeatherSearch = () => {
    if (searchLocation.trim()) {
      setSelectedLocation(searchLocation);
      setSearchLocation("");
      toast.success("Weather updated!", {
        description: `Showing forecast for ${searchLocation}`,
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Information Section */}
      <div
        className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]"
        style={{
          background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
          boxShadow: `0 8px 32px var(--shadow-color-strong)`,
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32" />
        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full blur-2xl translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24" />

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Side - Profile Info */}
          <div className="flex items-center gap-12 sm:gap-12 flex-1 pl-0 lg:pl-12 w-full lg:w-auto">
            {/* Profile Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-30 h-30 sm:w-34 sm:h-34 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden ${
                  userProfileData && userProfileData.profilePicture
                    ? ""
                    : "bg-primary"
                }`}
              >
                {userProfileData && userProfileData.profilePicture ? (
                  <img
                    src={userProfileData.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {getInitials()}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="max-w-md flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-white">
                  {userProfile.firstName} {userProfile.lastName}
                </h1>
              </div>
              <p className="text-white/90 text-sm sm:text-base mb-3 sm:mb-4">
                {userProfile.email}
              </p>
              {/* Quick Stats */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 whitespace-nowrap">
                      Owned Travel
                    </p>
                    <p className="text-sm text-white">
                      {userProfile.ownedTravel}
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/20" />

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 whitespace-nowrap">
                      Collaborated Travel
                    </p>
                    <p className="text-sm text-white">
                      {userProfile.collaboratedTravel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Interactive Traveling Avatar */}
          <div className="flex-shrink-0 w-full lg:w-1/2 min-w-[280px] sm:min-w-[320px] hidden md:block">
            <AdventureAvatar />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={FileText}
          label="Travel Plans"
          value="0"
          gradientFrom="#F472B6"
          gradientTo="#38BDF8"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value="0"
          gradientFrom="#F97316"
          gradientTo="#EF4444"
        />
        <StatCard
          icon={Plane}
          label="Active Bookings"
          value="0"
          gradientFrom="#14B8A6"
          gradientTo="#0A7AFF"
        />
        <StatCard
          icon={Award}
          label="Completed Trips"
          value="0"
          gradientFrom="#22C55E"
          gradientTo="#16A34A"
        />
      </div>

      {/* Recent Activity & Weather Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Widget - Right Half */}
        <ContentCard title="Weather">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleWeatherSearch()}
                  className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <button
                onClick={handleWeatherSearch}
                className="px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                  color: "white",
                }}
              >
                Search
              </button>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Showing weather for:{" "}
              <span className="text-primary font-semibold">
                {selectedLocation}
              </span>
            </div>

            {/* Current Weather */}
            <div
              className="p-6 rounded-2xl text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Today</p>
                  <h2 className="text-4xl mb-1">28°C</h2>
                  <p className="text-sm opacity-90">Partly Cloudy</p>
                </div>
                <Cloud className="w-16 h-16 opacity-80" strokeWidth={1.5} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm pt-3 border-t border-white/20">
                <div>
                  <p className="opacity-75 mb-1 text-xs">Humidity</p>
                  <p className="text-base">75%</p>
                </div>
                <div>
                  <p className="opacity-75 mb-1 text-xs">Wind</p>
                  <p className="text-base">12 km/h</p>
                </div>
                <div>
                  <p className="opacity-75 mb-1 text-xs">Rain</p>
                  <p className="text-base">20%</p>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast - Compact */}
            <div className="grid grid-cols-7 gap-2">
              {forecast.map((day, index) => {
                const Icon = day.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 bg-accent rounded-lg hover:bg-accent/80 transition-all"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {day.day}
                    </p>
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        day.condition === "Sunny"
                          ? "text-yellow-500"
                          : day.condition === "Rainy"
                          ? "text-blue-500"
                          : "text-gray-500"
                      }`}
                      strokeWidth={1.5}
                    />
                    <p className="text-xs text-card-foreground">{day.temp}</p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate("/user/weather")}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2 border-t border-border pt-3"
            >
              View Full Forecast
            </button>
          </div>
        </ContentCard>

        {/* Recent Activity - Left Half */}
        <ContentCard
          title="Recent Activity"
          footer={
            <div className="flex justify-center">
              <button
                onClick={() => navigate("/user/activity")}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                View Activity Log
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {[
              {
                id: "act-1",
                text: "Booked trip to El Nido, Palawan for December 15-20, 2024",
                time: "2 days ago",
              },
              {
                id: "act-2",
                text: "Created new travel plan 'Banaue Rice Terraces Heritage Tour'",
                time: "5 days ago",
              },
              {
                id: "act-3",
                text: "Left 5-star review for completed Boracay Island Trip",
                time: "1 week ago",
              },
              {
                id: "act-4",
                text: "Submitted inquiry about Coron Island Tour package availability",
                time: "2 weeks ago",
              },
              {
                id: "act-5",
                text: "Added collaborators to Siargao Surfing Adventure plan",
                time: "3 weeks ago",
              },
              {
                id: "act-5",
                text: "Added collaborators to Siargao Surfing Adventure plan",
                time: "3 weeks ago",
              },{
                id: "act-5",
                text: "Added collaborators to Siargao Surfing Adventure plan",
                time: "3 weeks ago",
              },
            ].map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0 cursor-default"
              >
                <div className="w-2 h-2 mt-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-card-foreground">{activity.text}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      {/* Upcoming Trips */}
      <ContentCard title="Upcoming Trips" icon={Calendar}>
        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background:
                  "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                opacity: 0.1,
              }}
            >
              <Calendar className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg text-card-foreground mb-2">
              No Upcoming Trips
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              You don't have any upcoming trips planned yet. Start planning your
              next adventure!
            </p>
            <button
              onClick={() => navigate("/user/smart-trip")}
              className="px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
                color: "white",
              }}
            >
              <Sparkles className="w-5 h-5" />
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((trip) => (
              <BookingListCard
                key={trip.id}
                booking={{
                  id: trip.id,
                  customer: userProfile.firstName + " " + userProfile.lastName,
                  email: userProfile.email,
                  mobile: "",
                  destination: trip.destination,
                  dates: trip.dates,
                  travelers: trip.travelers,
                  total: trip.amount,
                  bookedDate: trip.bookingDate,
                }}
                onViewDetails={() => navigate(`/user/bookings`)}
                additionalBadges={
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      trip.status === "confirmed"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                }
                userSide={true}
              />
            ))}
          </div>
        )}
      </ContentCard>

      {/* Travel Tips & Inspiration */}
      <ContentCard title="Travel Tips & Inspiration" icon={Sparkles}>
        <div className="space-y-4">
          {/* Tips Grid with Animation */}
          <motion.div
            key={currentTipBatch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {travelTips.map((tip, index) => {
              const colors = getColorClasses(tip.color);
              const Icon = tip.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`group p-5 rounded-xl border border-border ${colors.border} transition-all bg-gradient-to-br ${colors.bg} to-transparent hover:shadow-lg cursor-pointer`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{tip.emoji}</span>
                        <h4 className="text-sm text-card-foreground">
                          {tip.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Batch Indicators */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {allTravelTips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTipBatch(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentTipBatch
                      ? "w-8 bg-primary"
                      : "w-2 bg-border hover:bg-border/70"
                  }`}
                  title={`Page ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Page {currentTipBatch + 1} of {allTravelTips.length} • Changes
              every 20 seconds
            </p>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
