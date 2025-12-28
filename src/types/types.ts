export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;

  // user related
  isActive?: boolean;
  role?: string;
}

export type User = {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobile: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  avatarUrl: string | null;
  birthday: string | null;
  companyName: string | null;
  employeeId: string | null;
  customerRating: number | null;
};

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Booking {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalPrice: number;
  status:
    | "DRAFT"
    | "PENDING"
    | "CONFIRMED"
    | "REJECTED"
    | "COMPLETED"
    | "CANCELLED";
  type: "STANDARD" | "CUSTOMIZED" | "REQUESTED";
  tourType?: string;
  itinerary?: ItineraryDay[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  title: string;
  order: number;
  description?: string;
}

export interface TourPackage {
  id: string;
  title: string;
  destination: string;
  price: number;
  duration: number;
  isActive: boolean;
  description?: string;
  thumbUrl?: string;
  days: number;
  category: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  type: "PARTIAL" | "FULL";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  transactionId?: string;
}

export interface Inquiry {
  id: string;
  subject: string;
  message: string;
  status: string;
  bookingId?: string;
  userId: string;
  createdAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  response?: string;
  userId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  userId: string;
}

export interface WeatherResponse {
  coord?: { lon: number; lat: number };
  weather?: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main?: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind?: {
    speed: number;
    deg: number;
  };
  name?: string;
}

export interface RouteOptimizationRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
}

export interface ChatbotRequest {
  message: string;
  context?: string;
}

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
}

export interface DashboardStats {
  cards: {
    activeBookings: number;
    completedTrips: number;
    pendingApprovals: number;
    totalUsers: number;
  };

  distributions: {
    status: {
      active: number;
      cancelled: number;
      completed: number;
      pending: number;
    };
    type: {
      customized: number;
      requested: number;
      standard: number;
    };
  };

  trends: {
    historical: number[];
    labels: string[];
    predicted: number[];
    year: number;
  };
}
