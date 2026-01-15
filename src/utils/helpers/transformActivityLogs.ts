import { ActivityLog } from "../../types/types";

interface RecentActivity {
  id: string;
  text: string;
  icon: string;
}

// Helper to determine icon from action code
const getIconFromAction = (action: string): string => {
  const actionLower = action.toLowerCase();

  // Authentication
  if (actionLower.includes("login")) return "login";
  if (actionLower.includes("logout")) return "logout";
  if (actionLower.includes("password")) return "user";

  // Booking
  if (actionLower.includes("booking_created")) return "booking";
  if (actionLower.includes("booking_updated")) return "edit";
  if (actionLower.includes("booking_cancelled")) return "cancel";
  if (actionLower.includes("booking_completed")) return "check";
  if (actionLower.includes("booking_approved")) return "approve";
  if (actionLower.includes("booking_rejected")) return "reject";
  if (actionLower.includes("booking")) return "booking";

  // Itinerary
  if (actionLower.includes("itinerary")) return "itinerary";

  // User
  if (actionLower.includes("user_created")) return "user";
  if (actionLower.includes("user_updated") || actionLower.includes("profile")) return "user-edit";
  if (actionLower.includes("user")) return "user";

  // Payment
  if (actionLower.includes("payment")) return "payment";

  // Inquiry
  if (actionLower.includes("inquiry")) return "inquiry";

  // FAQ
  if (actionLower.includes("faq")) return "faq";

  return "default";
};

export const transformActivityLogs = (
  logs: ActivityLog[]
): RecentActivity[] => {
  if (!logs || logs.length === 0) {
    return getDefaultActivities();
  }

  const activities: RecentActivity[] = [];

  logs.forEach((log) => {
    const icon = getIconFromAction(log.action);
    // Use the human-readable message from details (set by backend)
    const text = log.details || `${log.user.firstName} ${log.user.lastName}: ${log.action}`;

    activities.push({
      id: log.id,
      text: text,
      icon: icon,
    });
  });

  return ensureMinimumActivities(activities, 4);
};

export const ensureMinimumActivities = (
  activities: RecentActivity[],
  minCount: number
): RecentActivity[] => {
  if (activities.length >= minCount) {
    return activities.slice(0, minCount);
  }

  const defaultActivities = getDefaultActivities();
  const additionalNeeded = minCount - activities.length;

  return [...activities, ...defaultActivities.slice(0, additionalNeeded)];
};

export const getDefaultActivities = (): RecentActivity[] => {
  return [
    {
      id: "default-1",
      text: "System initialized successfully",
      icon: "system",
    },
    {
      id: "default-2",
      text: "Welcome to BondVoyage Dashboard",
      icon: "welcome",
    },
    {
      id: "default-3",
      text: "No recent activities",
      icon: "info",
    },
    {
      id: "default-4",
      text: "Check back later for updates",
      icon: "clock",
    },
  ];
};
