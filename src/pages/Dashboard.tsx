import { Users, Clock, TrendingUp, CheckCircle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { ContentCard } from "../components/ContentCard";
import { BookingListCard } from "../components/BookingListCard";
import { TravelingAvatar } from "../components/TravelingAvatar";
import { useProfile } from "../components/ProfileContext";
import { HistoryBooking, BookingData } from "../App";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  pendingApprovalsCount: number;
  historyBookings: HistoryBooking[];
  createdBookings: BookingData[];
  activeBookingsCount?: number;
}

export function Dashboard({ pendingApprovalsCount, historyBookings, createdBookings, activeBookingsCount: propActiveBookingsCount }: DashboardProps) {
  const navigate = useNavigate();
  const { profileData } = useProfile();
  
  // Get initials from company name
  const getInitials = () => {
    if (profileData.profilePicture) return null;
    const words = profileData.companyName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return profileData.companyName.substring(0, 2).toUpperCase();
  };
  
  // Calculate metrics
  const completedTripsCount = historyBookings.filter(booking => booking.status === "completed").length;
  const cancelledTripsCount = historyBookings.filter(booking => booking.status === "cancelled").length;
  const activeBookingsCount = propActiveBookingsCount !== undefined ? propActiveBookingsCount : createdBookings.length;
  const totalBookings = completedTripsCount + cancelledTripsCount + activeBookingsCount + pendingApprovalsCount;
  
  // Generate booking trends data for last 12 months + 6 months prediction
  const generateBookingTrends = () => {
    const now = new Date();
    const trends = [];
    
    // Historical data (last 12 months) - based on system performance
    // Pattern: Growth trend with seasonal variations
    const baselineBookings = [4, 5, 7, 6, 9, 11, 13, 12, 15, 14, 18, 16];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      trends.push({
        month: monthName,
        bookings: baselineBookings[11 - i],
        predicted: false,
      });
    }
    
    // Predicted data (next 6 months) - based on growth trend
    // Calculate average growth rate from last 6 months
    const recentGrowth = (baselineBookings[11] - baselineBookings[5]) / 6;
    let lastValue = baselineBookings[11];
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      // Apply growth with slight randomization for realism
      lastValue = Math.round(lastValue + recentGrowth + (Math.random() - 0.5) * 2);
      trends.push({
        month: monthName,
        bookings: Math.max(lastValue, 1), // Ensure positive values
        predicted: true,
      });
    }
    
    return trends;
  };
  
  const monthlyData = generateBookingTrends();
  
  // Booking status distribution
  const statusData = [
    { name: 'Completed', value: completedTripsCount, color: '#10B981' },
    { name: 'Active', value: activeBookingsCount, color: '#0A7AFF' },
    { name: 'Pending', value: pendingApprovalsCount, color: '#FFB84D' },
    { name: 'Cancelled', value: cancelledTripsCount, color: '#EF4444' },
  ];
  
  // Booking type distribution
  const bookingTypeData = [
    { name: 'Customized', value: historyBookings.filter(b => b.bookingType === "Customized").length + 
                                  createdBookings.filter(b => b.bookingType === "Customized").length, color: '#0A7AFF' },
    { name: 'Standard', value: historyBookings.filter(b => b.bookingType === "Standard").length + 
                               createdBookings.filter(b => b.bookingType === "Standard").length, color: '#14B8A6' },
    { name: 'Requested', value: historyBookings.filter(b => b.bookingType === "Requested").length + 
                                createdBookings.filter(b => b.bookingType === "Requested").length, color: '#A78BFA' },
  ].filter(item => item.value > 0);
  
  // Top 5 destinations - Dummy data
  const topDestinations = [
    { name: "Boracay", value: 45 },
    { name: "Palawan", value: 38 },
    { name: "Siargao", value: 32 },
    { name: "Bohol", value: 28 },
    { name: "Cebu", value: 25 }
  ];
  

  
  // Generate recent activities from actual data
  const generateRecentActivities = () => {
    const activities = [];
    
    // Add recent completed bookings
    const recentCompleted = historyBookings
      .filter(b => b.status === "completed")
      .slice(0, 2);
    
    recentCompleted.forEach((booking, index) => {
      const daysAgo = index + 1;
      activities.push({
        id: `completed-${booking.id}`,
        text: `Booking ${booking.id} for ${booking.customer} was completed`,
        time: daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`,
        icon: "check"
      });
    });
    
    // Add recent cancelled bookings
    const recentCancelled = historyBookings
      .filter(b => b.status === "cancelled")
      .slice(0, 1);
    
    recentCancelled.forEach((booking) => {
      activities.push({
        id: `cancelled-${booking.id}`,
        text: `Booking ${booking.id} for ${booking.customer} was cancelled`,
        time: "3 days ago",
        icon: "cancel"
      });
    });
    
    // Add pending approvals activity
    if (pendingApprovalsCount > 0) {
      activities.push({
        id: "pending-approvals",
        text: `${pendingApprovalsCount} booking${pendingApprovalsCount > 1 ? 's' : ''} pending approval`,
        time: "5 hours ago",
        icon: "clock"
      });
    }
    
    // Add standard itinerary activity
    activities.push({
        id: "standard-itinerary",
        text: "New standard itinerary template created",
        time: "1 week ago",
        icon: "itinerary"
    });
    
    // Add user activity
    activities.push({
        id: "user-activity",
        text: "New user registration completed",
        time: "2 weeks ago",
        icon: "user"
    });
    
    return activities.slice(0, 5); // Return max 5 activities
  };
  
  const recentActivities = generateRecentActivities();

  const upcomingTrips = createdBookings
    .filter(b => b.tripStatus === "upcoming")
    .slice(0, 4)
    .map(booking => ({
      id: booking.id,
      customer: booking.customer,
      destination: booking.destination,
      date: new Date(booking.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: booking.paymentStatus === "Paid" ? "confirmed" : "pending-payment"
    }));

  // If no upcoming trips from data, show placeholder
  const displayUpcomingTrips = upcomingTrips.length > 0 ? upcomingTrips : [
    { id: "BK-2026-001", customer: "Sofia Villanueva", email: "sofia.villanueva@email.com", mobile: "+63 917 234 5678", destination: "Batanes, Cagayan Valley", dates: "March 15, 2026 – March 20, 2026", travelers: 2, total: "₱55,000", bookedDate: "February 10, 2026", bookingType: "Standard" as const, date: "March 15, 2026", status: "confirmed" },
    { id: "BK-2026-002", customer: "Miguel Santos", email: "miguel.santos@email.com", mobile: "+63 918 345 6789", destination: "Vigan, Ilocos Sur", dates: "May 10, 2026 – May 15, 2026", travelers: 4, total: "₱48,000", bookedDate: "March 20, 2026", bookingType: "Customized" as const, date: "May 10, 2026", status: "confirmed" },
    { id: "BK-2026-003", customer: "Katrina Dela Rosa", email: "katrina.delarosa@email.com", mobile: "+63 919 456 7890", destination: "Sagada, Mountain Province", dates: "June 20, 2026 – June 25, 2026", travelers: 3, total: "₱42,000", bookedDate: "April 15, 2026", bookingType: "Standard" as const, date: "June 20, 2026", status: "confirmed" },
    { id: "BK-2026-004", customer: "Ramon Cruz", email: "ramon.cruz@email.com", mobile: "+63 920 567 8901", destination: "Camiguin, Northern Mindanao", dates: "July 5, 2026 – July 10, 2026", travelers: 2, total: "₱38,000", bookedDate: "May 12, 2026", bookingType: "Requested" as const, date: "July 5, 2026", status: "pending-payment" },
  ];

  return (
    <div>
      {/* Profile Information Section */}
      <div 
        className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]"
        style={{
          background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
          boxShadow: `0 8px 32px var(--shadow-color-strong)`
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
              <div className={`w-30 h-30 sm:w-34 sm:h-34 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden ${
                profileData.profilePicture ? '' : 'bg-primary'
              }`}>
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-white">{profileData.companyName}</h1>
              </div>
              <p className="text-white/90 text-sm sm:text-base mb-3 sm:mb-4">{profileData.email}</p>
              {/* Quick Stats */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 whitespace-nowrap">Years in Operation</p>
                    <p className="text-sm text-white">{profileData.yearsInOperation}</p>
                  </div>
                </div>
                
                <div className="h-10 w-px bg-white/20" />
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 whitespace-nowrap">Customer Satisfaction</p>
                    <p className="text-sm text-white">{profileData.customerRating}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Interactive Traveling Avatar */}
          <div className="flex-shrink-0 w-full lg:w-1/2 min-w-[280px] sm:min-w-[320px] hidden md:block">
            <TravelingAvatar />
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value="8"
          gradientFrom="#F472B6"
          gradientTo="#38BDF8"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Bookings"
          value={activeBookingsCount.toString()}
          gradientFrom="#14B8A6"
          gradientTo="#0A7AFF"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingApprovalsCount.toString()}
          gradientFrom="#F97316"
          gradientTo="#EF4444"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Trips"
          value={completedTripsCount.toString()}
          gradientFrom="#22C55E"
          gradientTo="#16A34A"
        />
      </div>

      {/* Booking Trends Chart - Full Width */}
      <div className="mb-6 sm:mb-8">
        <ContentCard title={`Booking Trends (Last 12 Months + 6 Month Prediction) - ${new Date().getFullYear()}`}>
          <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A7AFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0A7AFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748B" 
                  style={{ fontSize: '13px', fontWeight: 500 }} 
                  tickMargin={12}
                />
                <YAxis 
                  stroke="#64748B" 
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  tickMargin={8}
                  label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: '13px', fontWeight: 600 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1A2B4F', marginBottom: '4px' }}
                  formatter={(value: number, name: string, props: any) => [
                    value + ' bookings',
                    props.payload.predicted ? 'Predicted' : 'Actual'
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '16px' }} 
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#0A7AFF" 
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    return payload.predicted ? (
                      <circle 
                        key={`dot-predicted-${index}`}
                        cx={cx} 
                        cy={cy} 
                        r={5} 
                        fill="#14B8A6" 
                        stroke="#14B8A6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    ) : (
                      <circle 
                        key={`dot-actual-${index}`}
                        cx={cx} 
                        cy={cy} 
                        r={5} 
                        fill="white" 
                        stroke="#0A7AFF"
                        strokeWidth={3}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: '#0A7AFF', stroke: 'white', strokeWidth: 3 }}
                  name="Bookings"
                  strokeDasharray={(props: any) => props.predicted ? "5 5" : "0"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0A7AFF]"></div>
              <span className="text-[#64748B]">Historical Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#14B8A6] border-2 border-[#14B8A6]" style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, #14B8A6 25%, #14B8A6 50%, transparent 50%, transparent 75%, #14B8A6 75%, #14B8A6)' }}></div>
              <span className="text-[#64748B]">Predicted Growth</span>
            </div>
          </div>
        </ContentCard>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Booking Status Distribution */}
        <ContentCard title="Booking Status Distribution">
          <div className="h-[280px] sm:h-[300px] lg:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-status-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.8}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={{
                    stroke: '#CBD5E1',
                    strokeWidth: 2,
                  }}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#1A2B4F" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        style={{ fontSize: '13px', fontWeight: 600 }}
                      >
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  innerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-status-${index})`}
                      stroke="white"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1A2B4F', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} bookings`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-muted-foreground">{entry.name}:</span>
                <span className="text-sm text-card-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Booking Type Distribution */}
        <ContentCard title="Booking Type Distribution">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {bookingTypeData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-type-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.8}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={bookingTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={{
                    stroke: '#CBD5E1',
                    strokeWidth: 2,
                  }}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#1A2B4F" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        style={{ fontSize: '13px', fontWeight: 600 }}
                      >
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  innerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                >
                  {bookingTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-type-${index})`}
                      stroke="white"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1A2B4F', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} bookings`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3">
            {bookingTypeData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-muted-foreground">{entry.name}:</span>
                <span className="text-sm text-card-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      {/* Top Destinations and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Top Destinations */}
        <ContentCard title="Top 5 Destinations">
          <div className="space-y-5 pt-2">
            {topDestinations.length > 0 ? (
              topDestinations.map((dest, index) => {
                const percentage = (dest.value / Math.max(...topDestinations.map(d => d.value))) * 100;
                const colors = [
                  { from: '#0A7AFF', to: '#14B8A6' },
                  { from: '#14B8A6', to: '#10B981' },
                  { from: '#10B981', to: '#0A7AFF' },
                  { from: '#A78BFA', to: '#8B5CF6' },
                  { from: '#FFB84D', to: '#FF9800' },
                ];
                const color = colors[index];
                
                return (
                  <div key={dest.name} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-m shadow-md transition-transform group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm text-card-foreground font-semibold group-hover:text-primary transition-colors">{dest.name}</p>
                          <p className="text-sm text-muted-foreground font-medium">{dest.value} bookings</p>
                        </div>
                        <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 group-hover:shadow-md"
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${color.from}, ${color.to})`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No destination data available yet</p>
            )}
          </div>
        </ContentCard>

        {/* Recent Activity */}
        <ContentCard 
          title="Recent Activity"
          footer={
            <div className="flex justify-center">
              <button 
                onClick={() => navigate("/activity-log")}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                View Activity Log
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0 cursor-default">
                <div className="w-2 h-2 mt-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-card-foreground">{activity.text}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      {/* Upcoming Trips */}
      <div className="grid grid-cols-1 gap-6">
        <ContentCard 
          title={`Upcoming Trips (${displayUpcomingTrips.length})`}
          footer={
            <button 
              onClick={() => navigate("/bookings")}
              className="text-sm text-primary hover:underline"
            >
              View All Bookings
            </button>
          }
        >
          <div className="space-y-4">
            {displayUpcomingTrips.map((trip) => (
              <BookingListCard
                key={trip.id}
                booking={{
                  id: trip.id,
                  customer: trip.customer,
                  email: trip.email || "",
                  mobile: trip.mobile || "",
                  destination: trip.destination,
                  dates: trip.dates || trip.date,
                  travelers: trip.travelers || 2,
                  total: trip.total || "₱0",
                  bookedDate: trip.bookedDate || trip.date,
                  bookingType: trip.bookingType,
                }}
                onViewDetails={(id) => navigate("/bookings")}
                additionalBadges={
                  trip.status === "confirmed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                      Pending Payment
                    </span>
                  )
                }
              />
            ))}
          </div>
        </ContentCard>
      </div>
    </div>
  );
}