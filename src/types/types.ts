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

export interface PaginatedData<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

export interface IActivity {
  id: string;
  time: string;
  title: string;
  description: string | null;
  location: string | null;
  icon: string | null;
  order: number;
}

export interface Day {
  id: string;
  dayNumber: number;
  date: string | null;
  activities: IActivity[];
}

export interface Collaborator {
  id: string;
  userId: string;
  invitedById: string;
  role: string;
  addedAt: string;
  user: any | null;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string | null;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number;
  estimatedCost: number | null;
  type: "STANDARD" | "CUSTOMIZED" | "REQUESTED";
  status: string;
  tourType: "PRIVATE" | "GROUP" | string;
  sentStatus: string | null;
  requestedStatus: string | null;
  sentAt: string | null;
  confirmedAt: string | null;
  rejectionReason: string | null;
  rejectionResolution: string | null;
  isResolved: boolean;
  collaborators: Collaborator[];
  days: Day[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  itineraryId: string;
  userId: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number;
  totalPrice: number;
  type: "STANDARD" | "CUSTOMIZED" | "REQUESTED";
  status:
    | "DRAFT"
    | "PENDING"
    | "CONFIRMED"
    | "REJECTED"
    | "COMPLETED"
    | "CANCELLED";
  tourType: "PRIVATE" | "GROUP" | string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | string;
  paymentReceiptUrl: string | null;
  rejectionReason: string | null;
  rejectionResolution: string | null;
  isResolved: boolean;
  customerName: string | null;
  customerEmail: string | null;
  customerMobile: string | null;
  bookedDate: string;
  createdAt: string;
  updatedAt: string;
  itinerary: Itinerary;
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
  days: any[];
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

type NotificationType =
  | "BOOKING"
  | "PAYMENT"
  | "INQUIRY"
  | "FEEDBACK"
  | "SYSTEM";

export interface INotification {
  id: string;
  userId: string;
  type: string;
  title: string | null;
  message: string;
  data: {
    amount?: number;
    status?: string;
    bookingId?: string;
    paymentId?: string;
    bookingCode?: string;
    destination?: string;
    itineraryId?: string;
  } | null;
  isRead: boolean;
  createdAt: string;
}
export interface Feedback {
  id: string;
  userId: string;
  respondedById?: string;
  rating: number;
  comment: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  respondedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
