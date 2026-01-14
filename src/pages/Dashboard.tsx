import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  MapPin,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { ContentCard } from "../components/ContentCard";
import { TravelingAvatar } from "../components/TravelingAvatar";
import { useProfile } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboard";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { getInitials } from "../utils/helpers/getInitials";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { transformTrendsData } from "../utils/helpers/transformTrendsData";
import { User, FAQ } from "../types/types";
import { queryKeys } from "../utils/lib/queryKeys";
import {
  getDefaultActivities,
  transformActivityLogs,
} from "../utils/helpers/transformActivityLogs";
import { useFaqs } from "../hooks/useFaqs";

export function Dashboard() {
  const navigate = useNavigate();
  const { data: profileResponse } = useProfile();
  const { data: dashboardStatsResponse, isLoading } = useDashboardStats();

  // Use real FAQ data from the API
  const { data: faqsResponse } = useFaqs({ limit: 3 });

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

  const cards = useMemo(() => {
    return (
      dashboardStatsResponse?.data?.cards || {
        activeBookings: 0,
        completedTrips: 0,
        pendingApprovals: 0,
        totalUsers: 0,
      }
    );
  }, [dashboardStatsResponse?.data?.cards]);

  const distributions = useMemo(() => {
    return (
      dashboardStatsResponse?.data?.distributions || {
        status: { active: 0, cancelled: 0, completed: 0, pending: 0 },
        type: { customized: 0, requested: 0, standard: 0 },
      }
    );
  }, [dashboardStatsResponse?.data?.distributions]);

  const trends = useMemo(() => {
    return (
      dashboardStatsResponse?.data?.trends || {
        historical: [],
        labels: [],
        predicted: [],
        year: new Date().getFullYear(),
      }
    );
  }, [dashboardStatsResponse?.data?.trends]);

  const statusData = useMemo(() => {
    return [
      {
        name: "Completed",
        value: distributions.status.completed,
        color: "#10B981",
      },
      { name: "Active", value: distributions.status.active, color: "#0A7AFF" },
      {
        name: "Pending",
        value: distributions.status.pending,
        color: "#FFB84D",
      },
      {
        name: "Cancelled",
        value: distributions.status.cancelled,
        color: "#EF4444",
      },
    ];
  }, [distributions.status]);

  const bookingTypeData = useMemo(() => {
    return [
      {
        name: "Customized",
        value: distributions.type.customized,
        color: "#0A7AFF",
      },
      {
        name: "Standard",
        value: distributions.type.standard,
        color: "#14B8A6",
      },
      {
        name: "Requested",
        value: distributions.type.requested,
        color: "#A78BFA",
      },
    ];
  }, [distributions.type]);

  const { data: activityLogsResponse } = useActivityLogs(
    { actorId: profileData.id, limit: 4 },
    {
      enabled: !!profileResponse?.data,
      queryKey: [queryKeys.activityLogs.all],
    }
  );

  const recentActivities = useMemo(() => {
    if (!activityLogsResponse?.data) {
      return getDefaultActivities();
    }

    return transformActivityLogs(activityLogsResponse.data);
  }, [activityLogsResponse?.data]);

  // Use real FAQ data from API response
  const faqData = useMemo(() => {
    return faqsResponse?.data || [];
  }, [faqsResponse?.data]);

  return (
    <div>
      {/* Profile Information Section - Updated with UserHome.tsx design */}
      <div
        className="mb-6 sm:mb-8 rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 relative overflow-hidden min-h-[auto] xs:min-h-[320px] sm:min-h-[340px] md:min-h-[360px] lg:min-h-[380px]"
        style={{
          background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
          boxShadow: `0 8px 32px var(--shadow-color-strong)`,
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-white/10 rounded-full blur-3xl -translate-y-16 xs:-translate-y-20 sm:-translate-y-24 md:-translate-y-28 lg:-translate-y-32 translate-x-16 xs:translate-x-20 sm:translate-x-24 md:translate-x-28 lg:translate-x-32" />
        <div className="absolute bottom-0 left-0 w-24 h-24 xs:w-28 xs:h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-white/5 rounded-full blur-2xl translate-y-12 xs:translate-y-14 sm:translate-y-16 md:translate-y-20 lg:translate-y-24 -translate-x-12 xs:-translate-x-14 sm:-translate-x-16 md:-translate-x-20 lg:-translate-x-24" />

        <div className="relative flex flex-col gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Side - Profile Info */}
          <div className="flex flex-col items-center lg:items-start lg:flex-row gap-4 xs:gap-5 sm:gap-6 md:gap-8 lg:gap-10 flex-1 lg:pl-4 xl:pl-8 w-full">
            {/* Profile Avatar - Larger on mobile */}
            <div className="relative flex-shrink-0 mt-4 lg:mt-0">
              <div
                className={`w-28 xs:w-32 sm:w-36 md:w-40 lg:w-40 h-28 xs:h-32 sm:h-36 md:h-40 lg:h-40 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden ${
                  profileData && profileData.avatarUrl ? "" : "bg-blue-500"
                }`}
              >
                {profileData && profileData.avatarUrl ? (
                  <img
                    src={profileData.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold text-white">
                    {getInitials(profileData.companyName!)}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info - Centered on mobile, left-aligned on desktop */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-auto">
              <div className="flex flex-col items-center lg:items-start gap-2 xs:gap-2.5 sm:gap-3 mb-3 xs:mb-4 sm:mb-5">
                <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-4xl text-white font-semibold break-words max-w-full">
                  {profileData ? profileData.companyName : ""}
                </h1>
                <p className="text-white/90 text-sm xs:text-base sm:text-lg lg:text-base break-all max-w-full">
                  {profileData ? profileData.email : ""}
                </p>
              </div>

              {/* Quick Stats - Always in same row, visible divider */}
              {/* Quick Stats - Stacked on mobile, row on desktop */}
<div className="flex flex-col sm:flex-row items-center gap-4 xs:gap-5 sm:gap-6 w-full">
  <div className="flex items-center gap-3 justify-center w-full sm:w-auto">
    <div className="w-10 xs:w-11 sm:w-12 h-10 xs:h-11 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <TrendingUp
        className="w-5 xs:w-5.5 sm:w-6 h-5 xs:h-5.5 sm:h-6 text-white"
        strokeWidth={2}
      />
    </div>
    <div className="text-left sm:text-left">
      <p className="text-xs sm:text-sm text-white/70 whitespace-nowrap font-medium">
        Years in Operation
      </p>
      <p className="text-base xs:text-lg sm:text-xl lg:text-base text-white font-semibold">{`${
        new Date().getFullYear() - 2019
      } Years`}</p>
    </div>
  </div>

  {/* Divider - Hidden on mobile, visible on sm and up */}
  <div className="hidden sm:block h-10 w-px bg-white/20" />

  <div className="flex items-center gap-3 justify-center w-full sm:w-auto">
    <div className="w-10 xs:w-11 sm:w-12 h-10 xs:h-11 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <svg
        className="w-5 xs:w-5.5 sm:w-6 h-5 xs:h-5.5 sm:h-6 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
    <div className="text-left sm:text-left">
      <p className="text-xs sm:text-sm text-white/70 whitespace-nowrap font-medium">
        Customer Satisfaction
      </p>
      <p className="text-base xs:text-lg sm:text-xl lg:text-base text-white font-semibold flex items-center gap-1">
        {profileData && profileData.customerRating !== undefined
          ? (
            <>
              <span>{profileData.customerRating}</span>
              <span className="text-white/80 text-sm">/ 5 stars</span>
            </>
          )
          : "N/A"}
      </p>
    </div>
  </div>
</div>
            </div>
          </div>

          {/* Right Side - Interactive Traveling Avatar - Hidden on mobile (moved below) */}
          <div className="hidden lg:flex w-full lg:w-auto lg:flex-1 justify-center items-center min-h-[200px] lg:min-h-[250px]">
            <div className="w-full max-w-[300px] lg:max-w-none">
              <TravelingAvatar />
            </div>
          </div>
        </div>

        {/* Mobile Traveling Avatar - Moved to bottom and always visible on mobile/tablet */}
        <div className="lg:hidden mt-6 xs:mt-7 sm:mt-8 flex justify-center items-center min-h-[200px] xs:min-h-[220px] sm:min-h-[240px]">
          <div className="w-full max-w-[280px] xs:max-w-[300px] sm:max-w-[350px]">
            <TravelingAvatar />
          </div>
        </div>
      </div>

      {/* Stats Cards Row - Mobile: 2 per row, Desktop: 4 per row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon={Users}
          value={cards.totalUsers || "0"}
          label="Total Users"
          gradientFrom="#F472B6"
          gradientTo="#38BDF8"
          isLoading={isLoading}
        />
        <StatCard
          icon={Clock}
          label="Pending Approvals"
          value={cards.pendingApprovals || "0"}
          gradientFrom="#F97316"
          gradientTo="#EF4444"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Bookings"
          value={cards.activeBookings || "0"}
          gradientFrom="#14B8A6"
          gradientTo="#0A7AFF"
          isLoading={isLoading}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Trips"
          value={cards.completedTrips || "0"}
          gradientFrom="#22C55E"
          gradientTo="#16A34A"
          isLoading={isLoading}
        />
      </div>

      {/* Booking Trends Chart - Full Width */}
      <div className="mb-6 sm:mb-8">
        <ContentCard
          title={`Booking Trends (Last 12 Months + 6 Month Prediction) - ${new Date().getFullYear()}`}
        >
          <div className="h-75 sm:h-87.5 lg:h-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={transformTrendsData(
                  trends.historical,
                  trends.labels,
                  trends.predicted
                )}
              >
                <defs>
                  <linearGradient
                    id="colorBookings"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0A7AFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A7AFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorPredicted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  style={{ fontSize: "13px", fontWeight: 500 }}
                  tickMargin={12}
                />
                <YAxis
                  stroke="#64748B"
                  style={{ fontSize: "13px", fontWeight: 500 }}
                  tickMargin={8}
                  label={{
                    value: "Bookings",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "#64748B",
                      fontSize: "13px",
                      fontWeight: 600,
                    },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "12px 16px",
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    color: "#1A2B4F",
                    marginBottom: "4px",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    value + " bookings",
                    props.payload.predicted ? "Predicted" : "Actual",
                  ]}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "13px",
                    fontWeight: 500,
                    paddingTop: "16px",
                  }}
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
                  activeDot={{
                    r: 7,
                    fill: "#0A7AFF",
                    stroke: "white",
                    strokeWidth: 3,
                  }}
                  name="Bookings"
                  strokeDasharray={(props: any) =>
                    props.predicted ? "5 5" : "0"
                  }
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
              <div
                className="w-3 h-3 rounded-full bg-[#14B8A6] border-2 border-[#14B8A6]"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, transparent 25%, #14B8A6 25%, #14B8A6 50%, transparent 50%, transparent 75%, #14B8A6 75%, #14B8A6)",
                }}
              ></div>
              <span className="text-[#64748B]">Predicted Growth</span>
            </div>
          </div>
        </ContentCard>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Booking Status Distribution */}
        <ContentCard title="Booking Status Distribution">
          <div className="h-70 sm:h-75 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`gradient-status-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={entry.color}
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor={entry.color}
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={{
                    stroke: "#CBD5E1",
                    strokeWidth: 2,
                  }}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    name,
                    value,
                  }) => {
                    if (value === 0 || percent < 0.01) return null;

                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 1.3;
                    const x =
                      cx + radius * Math.cos((-midAngle * Math.PI) / 180);
                    const y =
                      cy + radius * Math.sin((-midAngle * Math.PI) / 180);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#1A2B4F"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        style={{
                          fontSize: percent < 0.05 ? "11px" : "13px",
                          fontWeight: 600,
                        }}
                      >
                        {percent < 0.05
                          ? `${(percent * 100).toFixed(0)}%`
                          : `${name} (${(percent * 100).toFixed(0)}%)`}
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
                    backgroundColor: "white",
                    border: "2px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "12px 16px",
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    color: "#1A2B4F",
                    marginBottom: "4px",
                  }}
                  formatter={(value: number) => [`${value} bookings`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {entry.name}:
                </span>
                <span className="text-sm text-card-foreground">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Booking Type Distribution */}
        <ContentCard title="Booking Type Distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {bookingTypeData.map((entry, index) => (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`gradient-type-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={entry.color}
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor={entry.color}
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={bookingTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={{
                    stroke: "#CBD5E1",
                    strokeWidth: 2,
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
                    backgroundColor: "white",
                    border: "2px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "12px 16px",
                  }}
                  labelStyle={{
                    fontWeight: 600,
                    color: "#1A2B4F",
                    marginBottom: "4px",
                  }}
                  formatter={(value: number) => [`${value} bookings`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3">
            {bookingTypeData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {entry.name}:
                </span>
                <span className="text-sm text-card-foreground">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      {/* FAQ and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Frequently Asked Questions - Using real API data */}
        <ContentCard
          title="Frequently Asked Questions"
          action={
            <button
              onClick={() => navigate("/faq")}
              className="h-10 px-5 rounded-[20px] text-white text-sm font-medium shadow-[0_2px_8px_rgba(10,122,255,0.25)] flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
              }}
            >
              <Plus className="w-4 h-4" />
              New FAQ
            </button>
          }
          footer={
            <div className="flex justify-center">
              <button
                onClick={() => navigate("/faq")}
                className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                View All FAQs
              </button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            {faqData.slice(0, 2).map((faq: FAQ, index: number) => {
              const colors = [
                { from: "#0A7AFF", to: "#14B8A6" },
                { from: "#FFB84D", to: "#FF9800" },
                { from: "#A78BFA", to: "#8B5CF6" },
                { from: "#14B8A6", to: "#10B981" },
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={faq.id}
                  className="group rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] bg-white hover:shadow-md transition-all duration-200 p-4 cursor-pointer"
                  onClick={() => navigate("/faq")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                      }}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#1A2B4F] group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-[#64748B] line-clamp-3">
                        {faq.answer}
                      </p>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {faq.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={`${faq.id}-tag-${tagIndex}`}
                              className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {faq.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              +{faq.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state if no FAQs */}
            {faqData.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F8FAFB] flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6 text-[#94A3B8]" />
                </div>
                <p className="text-sm text-[#64748B] mb-2">No FAQs yet</p>
                <p className="text-xs text-[#94A3B8]">
                  Create your first FAQ to help users
                </p>
              </div>
            )}
          </div>
        </ContentCard>

        {/* Recent Activity - UPDATED DESIGN */}
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
          <div className="space-y-3 pt-2">
            {recentActivities.map((activity) => {
              // Define colors and icons based on activity type
              let iconBgColor = "bg-blue-50";
              let iconColor = "text-blue-600";
              let IconComponent = CheckCircle;

              if (activity.icon === "clock") {
                iconBgColor = "bg-yellow-50";
                iconColor = "text-yellow-600";
                IconComponent = Clock;
              } else if (activity.icon === "cancel") {
                iconBgColor = "bg-red-50";
                iconColor = "text-red-600";
                IconComponent = Clock; // Using clock as placeholder for cancel icon
              } else if (activity.icon === "itinerary") {
                iconBgColor = "bg-purple-50";
                iconColor = "text-purple-600";
                IconComponent = MapPin;
              } else if (activity.icon === "user") {
                iconBgColor = "bg-green-50";
                iconColor = "text-green-600";
                IconComponent = Users;
              } else if (activity.icon === "payment") {
                iconBgColor = "bg-emerald-50";
                iconColor = "text-emerald-600";
                IconComponent = TrendingUp;
              }

              return (
                <div
                  key={activity.id}
                  className="group rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] bg-white hover:shadow-md transition-all duration-200 p-3 cursor-pointer"
                  onClick={() => navigate("/activity-log")}
                >
                  <div className="flex items-center gap-3">
                    {/* Smaller icon */}
                    <div
                      className={`shrink-0 w-8 h-8 rounded-lg ${iconBgColor} flex items-center justify-center`}
                    >
                      <IconComponent className={`w-4 h-4 ${iconColor}`} />
                    </div>

                    {/* Text centered vertically */}
                    <div className="flex-1 min-w-0 flex items-center">
                      <p className="text-sm font-medium text-[#1A2B4F] line-clamp-2">
                        {activity.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state if no activities */}
            {recentActivities.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F8FAFB] flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-[#94A3B8]" />
                </div>
                <p className="text-sm text-[#64748B] mb-2">
                  No recent activity
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Activity will appear here
                </p>
              </div>
            )}
          </div>
        </ContentCard>
      </div>
    </div>
  );
}