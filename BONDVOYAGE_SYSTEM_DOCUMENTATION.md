# BondVoyage System Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [What is BondVoyage?](#what-is-bondvoyage)
3. [System Architecture](#system-architecture)
4. [Key Features](#key-features)
5. [Core Data Models](#core-data-models)
6. [Admin Side Workflow](#admin-side-workflow)
7. [User Side Workflow](#user-side-workflow)
8. [Data Flow: Admin ↔ User Connection](#data-flow-admin--user-connection)
9. [Booking Management Flow](#booking-management-flow)
10. [Payment Processing](#payment-processing)
11. [Itinerary Management](#itinerary-management)
12. [Notifications & Communication](#notifications--communication)
13. [Technical Stack](#technical-stack)
14. [API Response Format](#api-response-format)
15. [Role-Based Access Control](#role-based-access-control)

---

## System Overview

BondVoyage is a **comprehensive travel management and booking system** that connects travel agencies (Admin) with customers (Users) to streamline the creation, approval, booking, and management of travel itineraries and packages.

### Primary Purpose

- **Enable travel agencies** to create, manage, and approve customer bookings
- **Facilitate customers** to browse packages, request customized trips, and manage bookings
- **Automate workflow** from booking request → approval → payment → travel completion
- **Provide AI assistance** for smart trip planning and route optimization

---

## What is BondVoyage?

### High-Level Definition

BondVoyage is a **full-stack web application** that serves as a travel management platform with dual interfaces:

1. **Admin Dashboard** - For travel agency staff to manage operations
2. **User Portal** - For customers to book and manage travel

### System Roles

```
┌─────────────────────────┐
│   BondVoyage System     │
├─────────────────────────┤
│                         │
├─ ADMIN SIDE ────────────┤
│  • Travel Planners      │
│  • Booking Managers     │
│  • Finance Team         │
│  • System Admins        │
│                         │
├─ USER SIDE ─────────────┤
│  • Customers/Travelers  │
│  • Booking Requesters   │
│  • Trip Planners        │
│                         │
└─────────────────────────┘
```

### Core Capabilities

| Feature                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| **Booking Management**  | Track, approve, and process customer bookings     |
| **Itinerary Creation**  | Create standard and customized travel itineraries |
| **Payment Processing**  | Verify and process booking payments (Cash/GCash)  |
| **Route Optimization**  | AI-powered route planning and optimization        |
| **AI Assistant**        | ChatBot for travel advice and suggestions         |
| **Notifications**       | Real-time alerts for bookings, payments, updates  |
| **Activity Logging**    | Complete audit trail of system actions            |
| **Feedback Management** | Collect and manage customer reviews/ratings       |
| **Weather Forecast**    | 7-day weather forecasts for destinations          |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BondVoyage Frontend                          │
│                   (React + TypeScript + Vite)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   Admin Dashboard    │         │    User Portal       │      │
│  │  (Staff Interface)   │         │ (Customer Interface) │      │
│  └──────────────────────┘         └──────────────────────┘      │
│         │                                    │                   │
│         ├─ Sidebar Navigation                ├─ Sidebar Nav      │
│         ├─ Booking Management                ├─ Travel Plans     │
│         ├─ Itinerary Creation                ├─ Booking Status   │
│         ├─ Approvals/Rejections              ├─ Payment Tracking │
│         ├─ User Management                   ├─ Notifications    │
│         ├─ Payment Verification              ├─ Feedback         │
│         ├─ Activity Logs                     └─ Weather          │
│         └─ FAQ Management                                        │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│             React Query (Data Management & Caching)              │
├─────────────────────────────────────────────────────────────────┤
│                    Axios (HTTP Client)                           │
├─────────────────────────────────────────────────────────────────┤
│               Backend API (RESTful Endpoints)                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /auth         - Authentication & Authorization            │ │
│  │  /bookings     - Booking CRUD & Management                 │ │
│  │  /itineraries  - Itinerary Creation & Updates              │ │
│  │  /payments     - Payment Verification & Processing         │ │
│  │  /users        - User Management                           │ │
│  │  /notifications- Notification Management                   │ │
│  │  /feedbacks    - Feedback & Reviews                        │ │
│  │  /inquiries    - Customer Inquiries                        │ │
│  │  /tour-packages- Standard Itinerary Packages               │ │
│  │  /weather      - Weather Forecast Data                     │ │
│  │  /activity-logs- System Activity Tracking                  │ │
│  │  /faqs         - FAQ Management                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                   Database (Backend)                             │
│          (User Data, Bookings, Itineraries, Payments)           │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

```json
{
  "Frontend": {
    "Framework": "React 18+",
    "Language": "TypeScript",
    "Build Tool": "Vite",
    "State Management": "React Query (TanStack Query)",
    "UI Components": "Radix UI",
    "Styling": "Tailwind CSS",
    "Icons": "Lucide React",
    "Forms": "React Hook Form",
    "Animations": "Motion/Framer Motion",
    "HTTP Client": "Axios",
    "Mapping": "Leaflet",
    "Notifications": "Sonner Toast",
    "QR Code": "jsQR"
  },
  "Backend": {
    "Type": "RESTful API",
    "Authentication": "JWT (Access + Refresh tokens)",
    "Communication": "HTTP/HTTPS"
  }
}
```

---

## Key Features

### 1. Authentication & Authorization

**Flow:**

```
User Input Credentials
        ↓
POST /auth/login
        ↓
Backend Validates → Generates JWT Tokens
        ↓
Tokens Stored (localStorage)
        ↓
User Authenticated & Role-Based Access Granted
```

**Token Management:**

- **Access Token**: Short-lived, for API requests
- **Refresh Token**: Long-lived, for obtaining new access tokens
- **Storage**: `localStorage` (accessToken, refreshToken)
- **Headers**: `Authorization: Bearer {accessToken}`

### 2. User Management

**Admin Capabilities:**

- View all registered users
- Filter by active/inactive status
- Search by name/email
- Manage user permissions
- View user activity

**User Operations:**

- Register new account
- Edit profile (name, contact, avatar)
- Change password
- View profile information
- Manage preferences

### 3. Booking System

**Booking Types:**

```
┌──────────────────────┐
│   Booking Types      │
├──────────────────────┤
│ 1. STANDARD          │ - Pre-designed packages
│ 2. CUSTOMIZED        │ - User-created trips
│ 3. REQUESTED         │ - Custom requests
└──────────────────────┘
```

**Booking Status Flow:**

```
DRAFT
  ↓
PENDING (Awaiting approval)
  ↓
├─ CONFIRMED (Approved, ready for payment)
│   ↓
│   COMPLETED (Trip finished)
│
└─ REJECTED (Denied, needs resolution)
    ↓
    Resolution submitted
    ↓
    CONFIRMED or Re-REJECTED
```

### 4. Payment Processing

**Payment Methods:**

- GCash (Digital)
- Cash (Physical)

**Payment Types:**

- Full Payment
- Partial Payment

**Payment Status:**

```
PENDING → VERIFIED → PAID
         ↘ REJECTED
```

**Verification Process:**

```
User submits proof of payment
        ↓
Admin reviews payment proof
        ↓
├─ VERIFIED (Payment accepted)
│
└─ REJECTED (Invalid proof, requires resubmission)
```

### 5. Itinerary Management

**Two Types of Itineraries:**

#### Standard Itinerary (Template-Based)

- Pre-designed travel packages
- Reusable across multiple bookings
- Contains fixed price per pax
- Example: "5-day Boracay Beach Resort Package"

#### Requested Itinerary (Custom)

- Created per customer request
- Day-by-day custom activities
- Flexible modifications
- Generated from booking requests

**Itinerary Structure:**

```
Itinerary
├─ Basic Info
│  ├─ Title/Destination
│  ├─ Start/End Date
│  ├─ Category
│  └─ Price (per pax)
│
└─ Days (Daily Schedule)
   ├─ Day 1
   │  ├─ Activities
   │  │  ├─ Activity 1 (time, location, description)
   │  │  ├─ Activity 2
   │  │  └─ Activity N
   │  └─ Notes
   │
   ├─ Day 2
   │  └─ ...
   └─ Day N
      └─ ...
```

### 6. Route Optimization

**Features:**

- AI-powered route analysis
- Distance calculation between locations
- Time-saving recommendations
- Visual map display using Leaflet
- Optimization metrics:
  - Original distance vs. optimized distance
  - Time saved
  - Alternative ordering suggestions

### 7. AI Travel Assistant

**Capabilities:**

- Chat-based trip planning
- Itinerary suggestions
- Activity recommendations
- Day-by-day planning advice
- Real-time suggestions
- Context-aware responses

### 8. Notification System

**Notification Types:**

```
1. BOOKING    - Booking status changes
2. PAYMENT    - Payment updates
3. INQUIRY    - Customer inquiries
4. FEEDBACK   - Feedback received
5. SYSTEM     - System notifications
```

**Notification Features:**

- Real-time updates
- Mark as read/unread
- Filter by type
- Clear/delete notifications
- View notification details

---

## Core Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobile: string;
  role: "admin" | "user"; // Role-based access
  isActive: boolean;
  avatarUrl?: string;
  birthday?: string;
  companyName?: string; // For admin users
  employeeId?: string;
  customerRating?: number;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}
```

### Booking Model

```typescript
interface Booking {
  id: string;
  bookingCode: string; // Unique booking identifier
  itineraryId: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
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
  tourType: "PRIVATE" | "GROUP";

  // Payment Info
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalPaid: number;

  // Customer Info
  customerName: string;
  customerEmail: string;
  customerMobile: string;

  // Rejection/Resolution
  rejectionReason?: string;
  rejectionResolution?: string;
  isResolved: boolean;

  // Timestamps
  bookedDate: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  itinerary: Itinerary;
  payments: Payment[];
  collaborators: Collaborator[];
}
```

### Itinerary Model

```typescript
interface Itinerary {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  estimatedCost: number;
  type: "STANDARD" | "CUSTOMIZED" | "REQUESTED";
  status: string;
  tourType: "PRIVATE" | "GROUP";

  // Sent & Confirmation Status
  sentStatus?: "sent" | "unsent";
  sentAt?: string;
  confirmedAt?: string;

  // Rejection Info
  rejectionReason?: string;
  rejectionResolution?: string;
  isResolved: boolean;

  // Relations
  days: Day[]; // Daily activities
  collaborators: Collaborator[];
  createdAt: string;
  updatedAt: string;
}
```

### Day Model

```typescript
interface Day {
  id: string;
  dayNumber: number;
  date?: string;
  title?: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  time: string; // e.g., "08:00 AM"
  title: string;
  description: string;
  location: string;
  icon: string; // Icon name
  order: number; // Display order
  locationData?: {
    source: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}
```

### Payment Model

```typescript
interface Payment {
  id: string;
  bookingId: string;
  amount: string; // Amount in currency
  method: "GCASH" | "CASH";
  type: "PARTIAL" | "FULL";
  status: "PENDING" | "VERIFIED" | "REJECTED";

  // Transaction Details
  transactionId?: string;
  proofImage?: string; // Base64 or URL

  // Submitter Info
  submittedById: string;
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  // Verification Details
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}
```

### Notification Model

```typescript
interface INotification {
  id: string;
  userId: string;
  type: "BOOKING" | "PAYMENT" | "INQUIRY" | "FEEDBACK" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;

  // Optional Relations
  bookingId?: string;
  paymentId?: string;
  inquiryId?: string;
  feedbackId?: string;

  createdAt: string;
  updatedAt: string;
}
```

### Tour Package Model (Standard Itinerary)

```typescript
interface TourPackage {
  id: string;
  title: string;
  destination: string;
  price: number; // Price per pax
  duration: number; // Days
  isActive: boolean;
  description?: string;
  category: string; // e.g., "Beach", "Mountain"
  imageUrl?: string;

  // Itinerary Details
  days: Day[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Admin Side Workflow

### Admin Dashboard Overview

**Main Sections:**

```
┌─────────────────────────────────────────┐
│         ADMIN DASHBOARD                 │
├─────────────────────────────────────────┤
│                                         │
│  1. DASHBOARD OVERVIEW                  │
│     • Key metrics (bookings, revenue)   │
│     • Charts (status distribution)      │
│     • Recent activities                 │
│                                         │
│  2. BOOKING MANAGEMENT                  │
│     • View all bookings                 │
│     • Search & filter                   │
│     • Update booking status             │
│     • View payment history              │
│                                         │
│  3. BOOKING APPROVALS                   │
│     • Pending approvals queue           │
│     • Approve/Reject bookings           │
│     • Add rejection reasons             │
│                                         │
│  4. ITINERARY MANAGEMENT                │
│     • Create standard itineraries       │
│     • Create requested itineraries      │
│     • Edit/Delete itineraries           │
│     • View created bookings             │
│                                         │
│  5. PAYMENT VERIFICATION                │
│     • Review payment proofs             │
│     • Verify/Reject payments            │
│     • Track payment status              │
│                                         │
│  6. USER MANAGEMENT                     │
│     • View all users                    │
│     • Search & filter                   │
│     • Manage user accounts              │
│     • Track user activities             │
│                                         │
│  7. CUSTOMER INTERACTION                │
│     • Inquiries management              │
│     • Feedback & Reviews                │
│     • Respond to customers              │
│                                         │
│  8. SYSTEM MANAGEMENT                   │
│     • Activity logs                     │
│     • FAQ management                    │
│     • Notifications                     │
│                                         │
└─────────────────────────────────────────┘
```

### Workflow: Booking Approval Process

```
Step 1: User Creates Booking
        ↓ (POST /bookings)
Step 2: Booking Created in PENDING Status
        ↓ (Admin notified)
Step 3: Admin Reviews Booking
        ├─ View customer details
        ├─ Check itinerary
        └─ Review total amount
        ↓
Step 4: Admin Decision
        ├─ APPROVE
        │   ├─ Status: PENDING → CONFIRMED
        │   └─ Notification sent to user
        │
        └─ REJECT
            ├─ Enter rejection reason
            ├─ Specify required action
            ├─ Status: PENDING → REJECTED
            └─ Notification sent to user
        ↓
Step 5: User Response (if rejected)
        ├─ View rejection details
        ├─ Resolve issue
        └─ Mark as resolved/unresolved
        ↓
Step 6: Payment Processing
        ├─ User submits payment proof
        ├─ Admin verifies
        └─ Status: PENDING → VERIFIED/REJECTED
```

### Admin API Operations

| Operation          | Endpoint                 | Method | Purpose                    |
| ------------------ | ------------------------ | ------ | -------------------------- |
| View Bookings      | `/bookings`              | GET    | List all bookings          |
| Get Booking Detail | `/bookings/{id}`         | GET    | View single booking        |
| Approve Booking    | `/bookings/{id}/approve` | PUT    | Approve pending booking    |
| Reject Booking     | `/bookings/{id}/reject`  | PUT    | Reject with reason         |
| Update Status      | `/bookings/{id}/status`  | PUT    | Change booking status      |
| View Users         | `/users`                 | GET    | List all users             |
| Create Standard    | `/tour-packages`         | POST   | Create standard itinerary  |
| Edit Standard      | `/tour-packages/{id}`    | PUT    | Modify itinerary           |
| Delete Standard    | `/tour-packages/{id}`    | DELETE | Remove itinerary           |
| Verify Payment     | `/payments/{id}/verify`  | PUT    | Approve payment            |
| Reject Payment     | `/payments/{id}/reject`  | PUT    | Decline payment            |
| Create Itinerary   | `/itineraries`           | POST   | Create requested itinerary |
| Submit Booking     | `/bookings/{id}/submit`  | POST   | Send itinerary to client   |

---

## User Side Workflow

### User Portal Overview

**Main Sections:**

```
┌─────────────────────────────────────────┐
│         USER PORTAL                     │
├─────────────────────────────────────────┤
│                                         │
│  1. DASHBOARD                           │
│     • Profile information               │
│     • Quick stats                       │
│     • Recent activities                 │
│                                         │
│  2. TRAVELS (Travel Plans)              │
│     • View all travel plans             │
│     • Create new travel                 │
│     • Edit customized trips             │
│     • View trip details                 │
│                                         │
│  3. STANDARD ITINERARY                  │
│     • Browse available packages         │
│     • View itinerary details            │
│     • Book packages                     │
│                                         │
│  4. SMART TRIP GENERATOR                │
│     • AI-generated trips                │
│     • AI suggestions                    │
│                                         │
│  5. BOOKINGS                            │
│     • View all bookings                 │
│     • Track booking status              │
│     • View itinerary                    │
│     • Submit payments                   │
│                                         │
│  6. PAYMENT TRACKING                    │
│     • Upload payment proof              │
│     • Track payment status              │
│     • Payment history                   │
│                                         │
│  7. HISTORY                             │
│     • Completed trips                   │
│     • Cancelled trips                   │
│                                         │
│  8. CUSTOMER SERVICE                    │
│     • Inquiries                         │
│     • Feedback & Reviews                │
│     • Notifications                     │
│                                         │
│  9. ADDITIONAL FEATURES                 │
│     • Weather forecast                  │
│     • Trip wheel (random selector)      │
│     • Activity logs                     │
│                                         │
└─────────────────────────────────────────┘
```

### Workflow: Creating and Booking a Trip

#### Path 1: Standard Itinerary Booking

```
Step 1: Browse Packages
        ↓ (GET /tour-packages)
Step 2: View Package Details
        ├─ Destination, dates, price
        ├─ Itinerary (day-by-day activities)
        └─ Traveler count
        ↓
Step 3: Book Package
        ├─ Fill booking form:
        │  ├─ Traveler count
        │  ├─ Travel dates
        │  └─ Tour type (PRIVATE/GROUP)
        ├─ System calculates total (price × travelers)
        └─ POST /bookings
        ↓
Step 4: Booking Created
        ├─ Status: PENDING
        ├─ Awaiting admin approval
        └─ Notification: "Booking submitted"
        ↓
Step 5: Wait for Admin Approval
        ├─ Admin reviews booking
        ├─ User notified of approval/rejection
        └─ If CONFIRMED: Ready for payment
        ↓
Step 6: Submit Payment
        ├─ Upload payment proof
        ├─ Select payment method (GCash/Cash)
        ├─ Choose payment type (Full/Partial)
        └─ POST /payments
        ↓
Step 7: Payment Verification
        ├─ Admin reviews proof
        ├─ Payment status updates
        └─ User receives confirmation
        ↓
Step 8: Trip Confirmed
        └─ Booking ready for travel
```

#### Path 2: Customized Trip Creation

```
Step 1: Create New Travel
        ├─ Set destination
        ├─ Set travel dates
        └─ Set traveler count
        ↓
Step 2: Build Itinerary
        ├─ Day 1
        │  ├─ Activity 1 (time, title, location, description)
        │  ├─ Activity 2
        │  └─ Activity N
        ├─ Day 2, Day 3, ...
        └─ POST /itineraries
        ↓
Step 3: Trip Saved as Draft
        ├─ Status: DRAFT
        ├─ Can be edited later
        └─ Appears in "Travels"
        ↓
Step 4: Submit to Admin (Optional)
        ├─ Request itinerary to be sent to admin
        ├─ Admin reviews custom plan
        └─ Admin may approve or request changes
        ↓
Step 5: Create Booking from Trip
        ├─ Convert travel plan to booking
        ├─ Fill customer details
        └─ POST /bookings
        ↓
Step 6: Booking Submitted
        ├─ Status: PENDING
        ├─ Awaits admin approval
        └─ Continue with approval/payment flow
```

#### Path 3: AI Smart Trip Generator

```
Step 1: Access Smart Trip
        ├─ Enter destination
        ├─ Set travel dates
        ├─ Set budget
        └─ Set preferences
        ↓
Step 2: AI Generates Trip
        ├─ AI creates itinerary
        ├─ Day-by-day activities
        ├─ Estimated cost
        └─ Displays suggestions
        ↓
Step 3: Review & Edit
        ├─ Customize itinerary
        ├─ Add/remove activities
        ├─ Adjust dates
        └─ Modify details
        ↓
Step 4: Add to Travels
        ├─ Save as travel plan
        ├─ Status: DRAFT
        └─ Can be booked later
```

### User API Operations

| Operation         | Endpoint                   | Method | Purpose                     |
| ----------------- | -------------------------- | ------ | --------------------------- |
| Get Profile       | `/auth/profile`            | GET    | Current user info           |
| Update Profile    | `/users/{id}`              | PUT    | Edit profile                |
| Get Travels       | `/bookings/my-bookings`    | GET    | All user travels            |
| Create Booking    | `/bookings`                | POST   | Create new booking          |
| Get Booking       | `/bookings/{id}`           | GET    | View booking details        |
| Get Packages      | `/tour-packages`           | GET    | Browse standard itineraries |
| Create Itinerary  | `/itineraries`             | POST   | Create custom itinerary     |
| Submit Payment    | `/payments`                | POST   | Upload payment proof        |
| Get Notifications | `/notifications`           | GET    | Retrieve notifications      |
| Mark Read         | `/notifications/{id}/read` | PUT    | Mark as read                |
| Submit Feedback   | `/feedbacks`               | POST   | Leave review/feedback       |
| Create Inquiry    | `/inquiries`               | POST   | Ask a question              |

---

## Data Flow: Admin ↔ User Connection

### Bidirectional Communication Model

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   USER SIDE                        ADMIN SIDE           │
│                                                          │
│   User Creates Booking             (Stored in DB)       │
│          │                             │                │
│          └─────────→ POST /bookings ──→│                │
│                      (Booking Created) │                │
│                                        │                │
│          ←─── Notification Alert ─────←│                │
│          (Booking received)            │                │
│                                        │                │
│   (Waiting...)      Admin reviews     │                │
│                    decision:          │                │
│                                        │                │
│          ←─── PUT /bookings/{id} ─────│                │
│          (Status: PENDING→CONFIRMED)  │                │
│          ←─── Notification: APPROVED ─│                │
│                                        │                │
│   User submits payment    Admin verifies              │
│          │                     │                        │
│          └─→ POST /payments →──┤                        │
│             (Proof uploaded)    │                        │
│                                 │                        │
│          ←─ PUT /payments/{id}──│                        │
│          (Status: VERIFIED)     │                        │
│          ←─ Notification ────────│                        │
│          (Payment confirmed)    │                        │
│                                 │                        │
│   Booking Ready for Travel      │                        │
│          │                       │                        │
│          └────→ Travel ────→ Complete ────→ Archive    │
│                                 │                        │
│          ←─ Notification ────────│                        │
│          (Trip completed)        │                        │
│                                  │                        │
└──────────────────────────────────────────────────────────┘
```

### Data Synchronization Points

1. **Booking Status Changes**

   ```
   Admin Action: Status Update
   ↓
   Broadcast Notification to User
   ↓
   User Interface Updates
   ```

2. **Payment Verification**

   ```
   User Submits Proof
   ↓
   Admin Reviews
   ↓
   Status Updated in Database
   ↓
   User Notified
   ```

3. **Rejection & Resolution**

   ```
   Admin Rejects with Reason
   ↓
   User Sees Rejection Details
   ↓
   User Submits Resolution
   ↓
   Admin Reviews Resolution
   ↓
   Final Status Determination
   ```

4. **Itinerary Sharing**
   ```
   Admin Creates/Edits Itinerary
   ↓
   Admin Sends to Client
   ↓
   User Receives Itinerary Details
   ↓
   User Can Accept/Reject
   ```

### Key Data Relationships

```
User
├─ Bookings (1 → Many)
│  ├─ Itinerary (1 → 1)
│  │  └─ Days (1 → Many)
│  │     └─ Activities (1 → Many)
│  └─ Payments (1 → Many)
│
├─ Travels/Trip Plans (1 → Many)
│  └─ Collaborators (1 → Many)
│
├─ Notifications (1 → Many)
├─ Inquiries (1 → Many)
└─ Feedbacks (1 → Many)

Booking
├─ Status (DRAFT → PENDING → CONFIRMED → COMPLETED)
├─ Rejection Info (reason, resolution, resolved status)
├─ Payment History (Payment records)
└─ Activity Tracking (Creation, updates, completion)
```

---

## Booking Management Flow

### Complete Booking Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                   BOOKING LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ CREATION PHASE                                           │
│ │                                                            │
│ │  (1) DRAFT STATE                                           │
│ │      ├─ Booking created locally                           │
│ │      ├─ Not submitted to admin                            │
│ │      └─ User can edit/delete                              │
│ │           │                                                │
│ │           └─→ (2) SUBMISSION                              │
│ │               ├─ POST /bookings                           │
│ │               ├─ Status: PENDING                          │
│ │               └─ Admin notified                           │
│ │                                                            │
│ └─────────────────────────────────────────────────────────┘
│                      ↓
│ ┌─ APPROVAL PHASE                                          │
│ │                                                           │
│ │  (3) ADMIN REVIEW                                        │
│ │      ├─ Admin views booking details                      │
│ │      ├─ Checks customer info                             │
│ │      ├─ Verifies itinerary                               │
│ │      └─ Reviews total amount                             │
│ │           │                                               │
│ │           ├─→ APPROVE                                    │
│ │           │   ├─ PUT /bookings/{id}/approve              │
│ │           │   ├─ Status: PENDING → CONFIRMED             │
│ │           │   └─ User notified (APPROVED)                │
│ │           │        │                                      │
│ │           │        └─→ PAYMENT PHASE (see below)          │
│ │           │                                               │
│ │           └─→ REJECT                                     │
│ │               ├─ PUT /bookings/{id}/reject               │
│ │               ├─ Enter rejection reason                  │
│ │               ├─ Status: PENDING → REJECTED              │
│ │               └─ User notified (REJECTED)                │
│ │                    │                                      │
│ │                    └─→ RESOLUTION PHASE                  │
│ │                        ├─ User reviews reason            │
│ │                        ├─ Submits resolution             │
│ │                        ├─ Admin reviews                  │
│ │                        └─ Approve/Reject again           │
│ │                                                           │
│ └─────────────────────────────────────────────────────────┘
│                      ↓
│ ┌─ PAYMENT PHASE                                           │
│ │                                                           │
│ │  (4) USER PAYMENT SUBMISSION                             │
│ │      ├─ User submits proof of payment                    │
│ │      ├─ Select payment method (GCash/Cash)               │
│ │      ├─ Choose type (Full/Partial)                       │
│ │      ├─ POST /payments                                   │
│ │      └─ Status: PENDING                                  │
│ │           │                                               │
│ │           └─→ (5) ADMIN VERIFICATION                     │
│ │               ├─ Admin views payment proof               │
│ │               ├─ Verifies transaction                    │
│ │               │                                           │
│ │               ├─→ VERIFY                                 │
│ │               │   ├─ PUT /payments/{id}/verify           │
│ │               │   ├─ Status: PENDING → VERIFIED          │
│ │               │   └─ Payment marked as PAID              │
│ │               │                                           │
│ │               └─→ REJECT                                 │
│ │                   ├─ PUT /payments/{id}/reject           │
│ │                   ├─ Status: PENDING → REJECTED          │
│ │                   ├─ User notified to resubmit           │
│ │                   └─ Return to step 4                    │
│ │                                                           │
│ └─────────────────────────────────────────────────────────┘
│                      ↓
│ ┌─ CONFIRMED STATE                                         │
│ │                                                           │
│ │  (6) BOOKING CONFIRMED                                   │
│ │      ├─ Status: CONFIRMED                                │
│ │      ├─ Payment verified                                 │
│ │      ├─ Ready for travel                                 │
│ │      └─ All details locked                               │
│ │           │                                               │
│ │           └─→ TRAVEL PHASE                               │
│ │               ├─ Travel dates arrive                     │
│ │               ├─ User on trip                            │
│ │               └─ Experiencing itinerary                  │
│ │                    │                                      │
│ │                    └─→ COMPLETION PHASE                  │
│ │                        ├─ Trip ends                      │
│ │                        ├─ Status: COMPLETED              │
│ │                        ├─ Moved to history               │
│ │                        └─ User can provide feedback       │
│ │                                                           │
│ └─────────────────────────────────────────────────────────┘
│
│ ALTERNATIVE PATHS:
│
│ ┌─ CANCELLATION                                            │
│ │                                                           │
│ │  User/Admin can cancel booking at any time              │
│ │      ├─ Status: → CANCELLED                              │
│ │      ├─ Moved to history                                 │
│ │      └─ Reason recorded                                  │
│ │                                                           │
│ └─────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### Booking Status Reference

| Status        | Meaning               | Next Actions                    |
| ------------- | --------------------- | ------------------------------- |
| **DRAFT**     | Not submitted         | Submit to admin / Edit / Delete |
| **PENDING**   | Awaiting admin review | Admin approves/rejects          |
| **CONFIRMED** | Approved by admin     | Submit payment / Cancel         |
| **REJECTED**  | Denied by admin       | Submit resolution / Cancel      |
| **COMPLETED** | Trip finished         | Provide feedback / Archive      |
| **CANCELLED** | Booking cancelled     | View in history                 |

---

## Payment Processing

### Payment Submission Flow

```
User Interface                          Backend API

User Fills Payment Info
  ├─ Amount
  ├─ Method (GCash/Cash)
  ├─ Type (Full/Partial)
  └─ Payment Proof (Image)
         │
         ├─→ POST /payments
         │   (Submit payment)
         │        ↓
         │   (Backend Validation)
         │   ├─ Verify booking exists
         │   ├─ Check amount validity
         │   └─ Store proof image
         │        ↓
         │   Payment created (Status: PENDING)
         │        │
         ├─────←─┘
         │
    Payment Pending
         │
    Admin receives notification
         ├─ Reviews payment proof
         ├─ Verifies transaction
         │
         └─→ PUT /payments/{id}/verify
             (Admin action)
                  ↓
             Backend verifies
                  ├─ Check proof
                  ├─ Update status
                  └─ Notify user
                  ↓
    Payment Status: VERIFIED
         │
    Notification sent to user
         │
    Booking Ready!
```

### Payment Proof Submission

**Supported Payment Methods:**

- GCash (Digital transfer)
- Cash (Manual transfer)

**Payment Types:**

- Full Payment (100% of booking amount)
- Partial Payment (Installment)

**Proof Submission Process:**

```typescript
interface PaymentProof {
  amount: string;                    // Amount paid
  method: "GCASH" | "CASH";         // Payment method
  type: "FULL" | "PARTIAL";         // Payment type
  proofImage: string;               // Base64 image data
  transactionId?: string;            // Optional: for GCash reference
}

// Submission
POST /payments
{
  bookingId: "BK-123456",
  amount: "15000",
  method: "GCASH",
  type: "PARTIAL",
  proofImage: "data:image/png;base64,...",
  transactionId: "G-123456789"
}

// Response
{
  success: true,
  data: {
    id: "PAY-001",
    bookingId: "BK-123456",
    amount: "15000",
    status: "PENDING",
    createdAt: "2024-01-14T10:00:00Z"
  }
}
```

### Payment Verification by Admin

```
Admin Payment Review Dashboard
         │
    View Payment Details
    ├─ Payment amount
    ├─ Submitted method
    ├─ Proof image
    └─ Transaction ID
         │
    Admin Decision:
         │
         ├─→ VERIFY
         │   ├─ Payment is valid
         │   ├─ PUT /payments/{id}/verify
         │   ├─ Status: VERIFIED
         │   └─ User notified (APPROVED)
         │        │
         │        └─→ Booking ready for travel
         │
         └─→ REJECT
             ├─ Invalid proof
             ├─ PUT /payments/{id}/reject
             ├─ Add rejection reason
             ├─ Status: REJECTED
             └─ User notified (RESUBMIT REQUIRED)
                  │
                  └─→ User resubmits proof
```

---

## Itinerary Management

### Two Types of Itineraries

#### 1. Standard Itinerary (Template)

**Characteristics:**

- Pre-designed travel packages
- Fixed price per person
- Reusable across multiple bookings
- Can be activated/deactivated
- Example: "5-Day Boracay Beach Experience"

**Creation Process:**

```
Admin Interface
     │
Create Standard Itinerary
     ├─ Set title & destination
     ├─ Set price per pax
     ├─ Set duration (days)
     ├─ Select category
     ├─ Upload package image
     │
     ├─ Add Activities:
     │  ├─ Day 1
     │  │  ├─ Activity 1
     │  │  │  ├─ Time
     │  │  │  ├─ Title
     │  │  │  ├─ Location
     │  │  │  └─ Description
     │  │  ├─ Activity 2
     │  │  └─ Activity N
     │  ├─ Day 2, 3, ...
     │  └─ Day N
     │
     └─→ POST /tour-packages
         │
    Package Created (Active)
         │
    Available for Users to Book
```

**Booking a Standard Package:**

```
User Interface
     │
Browse Packages
     ├─ GET /tour-packages (active ones)
     ├─ View destination, price, days
     └─ Read itinerary details
         │
    Select Package
         │
    Fill Booking Form:
    ├─ Traveler count
    ├─ Travel dates
    ├─ Tour type (PRIVATE/GROUP)
         │
    System Calculates:
    ├─ Total = Price per Pax × Travelers
         │
    POST /bookings
         │
    Booking Created
    ├─ Type: STANDARD
    ├─ Status: PENDING
    └─ Awaits admin approval
```

#### 2. Requested/Customized Itinerary

**Characteristics:**

- User creates custom itinerary
- Day-by-day planning
- Flexible modifications
- Created per request

**Creation Process:**

```
User Interface
     │
Create New Travel (Customized)
     │
Fill Trip Basics:
├─ Destination
├─ Start date
├─ End date
├─ Traveler count
     │
Add Activities (Day-by-day):
├─ Day 1
│  ├─ Activity 1 (time, title, location, description)
│  ├─ Activity 2
│  └─ Activity N
├─ Day 2
│  └─ ...
└─ Day N
│  └─ ...
     │
Save as Draft
├─ Status: DRAFT
├─ Type: CUSTOMIZED
├─ Stored in DB
└─ User can edit later
     │
Convert to Booking:
├─ POST /bookings
├─ Booking created with this itinerary
├─ Status: PENDING
└─ Sent to admin for approval
```

### Itinerary Editing & Sharing

**Admin Can:**

- Create standard itineraries
- Create requested itineraries
- Edit any itinerary
- Send itinerary to client
- Delete itineraries

**User Can:**

- Create custom itineraries
- Edit own itineraries
- Share with collaborators
- Convert to bookings
- Request admin review

### Route Optimization

**Feature:** AI-powered route analysis

```
User selects "Optimize Route"
         │
System analyzes activities
├─ Extract locations
├─ Calculate distances
├─ Compute time between points
     │
Run optimization algorithm
├─ Find more efficient order
├─ Calculate time saved
├─ Calculate distance reduction
     │
Display Results:
├─ Original distance: 45 km
├─ Optimized distance: 38 km
├─ Time saved: 1 hour 15 min
├─ Suggested new order
└─ Visual map display
     │
User Decision:
├─ ACCEPT
│  └─ Itinerary reordered
│
└─ REJECT
   └─ Keep original order
```

---

## Notifications & Communication

### Notification System

**Real-time Alerts:**

```
Events that Trigger Notifications:

1. BOOKING Events
   ├─ Booking created
   ├─ Booking approved
   ├─ Booking rejected
   ├─ Booking confirmed
   └─ Booking completed

2. PAYMENT Events
   ├─ Payment submitted
   ├─ Payment verified
   ├─ Payment rejected
   └─ Payment reminder

3. INQUIRY Events
   ├─ New inquiry received
   └─ Inquiry responded

4. FEEDBACK Events
   ├─ Feedback received
   └─ Feedback responded

5. SYSTEM Events
   ├─ System alerts
   ├─ Maintenance notices
   └─ General notifications
```

**Notification Management:**

```
User Interface
     │
View Notifications
├─ GET /notifications
├─ Display recent notifications
├─ Show unread count
     │
Filter/Sort:
├─ By type (Booking, Payment, etc.)
├─ By status (Read/Unread)
├─ By date
     │
Actions:
├─ Mark as read: PUT /notifications/{id}/read
├─ Mark as unread
├─ Delete: DELETE /notifications/{id}
├─ Clear all: DELETE /notifications
└─ Respond to notification
     │
Notification Details:
├─ Type
├─ Title
├─ Message
├─ Related booking/payment
└─ Timestamp
```

### Inquiry System

**Customer Inquiries:**

```
User Creates Inquiry
     │
     ├─ POST /inquiries
     │  ├─ Subject
     │  ├─ Message
     │  └─ Booking ID (optional)
     │
Inquiry Stored in DB
     │
Admin Notified
     │
Admin Reviews & Responds
     │
     ├─ PUT /inquiries/{id}
     │  ├─ Response message
     │  └─ Status: RESOLVED
     │
User Receives Response
     │
Notification sent to user
```

### Feedback System

**Travel Feedback:**

```
After Trip Completion:

User Submits Feedback
     │
     ├─ POST /feedbacks
     │  ├─ Booking ID
     │  ├─ Rating (1-5 stars)
     │  ├─ Review text
     │  └─ Optional photos
     │
Feedback Stored
     │
Admin Reviews Feedback
     │
├─ Publicly visible review
├─ Admin can respond
└─ Rating affects business metrics
```

---

## Technical Stack

### Frontend Dependencies

```json
{
  "React": "18+",
  "TypeScript": "5+",
  "Vite": "Latest",

  "UI Libraries": {
    "@radix-ui/*": "Multiple components",
    "lucide-react": "Icons",
    "motion": "Animations"
  },

  "State Management": {
    "@tanstack/react-query": "Data fetching & caching",
    "react-hook-form": "Form management"
  },

  "Styling": {
    "tailwindcss": "Utility-first CSS",
    "class-variance-authority": "Component variants"
  },

  "HTTP": {
    "axios": "API requests",
    "jwt-decode": "Token decoding"
  },

  "Features": {
    "leaflet": "Maps & routing",
    "jsQR": "QR code scanning",
    "html2canvas": "Screenshot/export",
    "sonner": "Toast notifications",
    "emoji-picker-react": "Emoji selection"
  }
}
```

### Project Structure

```
src/
├── components/          # React components
│   ├── login/          # Authentication components
│   ├── ui/             # Base UI components (Radix-based)
│   ├── figma/          # Design system components
│   ├── filters/        # Filter components
│   └── *.tsx           # Feature components
│
├── pages/              # Page components
│   ├── admin/          # Admin-only pages
│   ├── user/           # User-only pages
│   └── *.tsx           # Shared pages
│
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication
│   ├── useBookings.ts  # Booking operations
│   ├── useTourPackages.ts
│   ├── usePayments.ts
│   └── *.ts            # Feature hooks
│
├── types/              # TypeScript types
│   ├── types.ts        # Core data models
│   └── aq.ts           # Query parameters
│
├── utils/              # Utility functions
│   ├── axios/          # HTTP client setup
│   ├── lib/            # Helper libraries
│   └── helpers/        # Data transformations
│
├── styles/             # Global styles
│   └── index.css
│
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── vite.config.ts      # Build config
```

---

## API Response Format

### Standard API Response Structure

```typescript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Resource data
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "data": null
}

// Paginated Response
{
  "success": true,
  "message": "Data retrieved",
  "data": {
    "items": [
      // Array of items
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Query Parameters

```typescript
interface QueryParams {
  page?: number;              // Page number (1-indexed)
  limit?: number;             // Items per page
  q?: string;                 // Search query
  status?: string;            // Filter by status
  dateFrom?: string;          // Start date filter
  dateTo?: string;            // End date filter
  sort?: string;              // Sort field
  isActive?: boolean;         // Filter by active status
  role?: string;              // Filter by user role
}

// Example:
GET /bookings?page=1&limit=10&status=CONFIRMED&sort=createdAt
GET /users?q=john&isActive=true&role=user
```

---

## Role-Based Access Control

### User Roles

```
┌─────────────────────────────────────────────────────┐
│           Role-Based Access Control                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ADMIN (Staff)                                       │
│ ├─ Access: Admin Dashboard Only                    │
│ ├─ Permissions:                                    │
│ │  ├─ View all bookings                            │
│ │  ├─ Approve/Reject bookings                      │
│ │  ├─ Create/Edit/Delete itineraries               │
│ │  ├─ Verify payments                              │
│ │  ├─ Manage users                                 │
│ │  ├─ View activity logs                           │
│ │  ├─ Respond to inquiries                         │
│ │  └─ Manage FAQs                                  │
│ │                                                   │
│ USER (Customer)                                     │
│ ├─ Access: User Portal Only                        │
│ ├─ Permissions:                                    │
│ │  ├─ View own bookings                            │
│ │  ├─ Create bookings                              │
│ │  ├─ Submit payments                              │
│ │  ├─ Create custom itineraries                    │
│ │  ├─ View standard packages                       │
│ │  ├─ Receive notifications                        │
│ │  ├─ Submit inquiries                             │
│ │  ├─ Leave feedback                               │
│ │  └─ View own activity logs                       │
│ │                                                   │
└─────────────────────────────────────────────────────┘
```

### Access Control Flow

```
User Logs In
     │
     ├─ POST /auth/login
     │  ├─ Email & password validation
     │  ├─ Role determination from DB
     │  └─ JWT token generation
     │       (includes role in payload)
     │
Token Stored (localStorage)
     │
     ├─ accessToken
     ├─ refreshToken
     └─ Decoded data includes:
         ├─ userId
         ├─ email
         ├─ role (admin/user)
         └─ permissions
     │
Routing Decision
     │
     ├─ If role === "admin"
     │  └─ Redirect to Admin Dashboard (/)
     │
     └─ If role === "user"
        └─ Redirect to User Portal (/user/home)
     │
Protected Routes
     │
     ├─ Route check: User.role === requiredRole
     │  ├─ Match: Allow access
     │  └─ No match: Redirect to login
     │
API Requests
     │
     ├─ Header: Authorization: Bearer {accessToken}
     │  └─ Backend verifies token & permissions
     │
Session Expiry
     │
     ├─ Access token expires
     ├─ Use refresh token to get new access token
     └─ Re-authenticate if refresh token invalid
```

---

## System Features Overview

### Dashboard & Analytics

**Admin Dashboard:**

- Total bookings count
- Revenue metrics
- Booking status distribution (pie chart)
- Booking type distribution
- Recent activities feed
- Quick action cards

**User Dashboard:**

- Profile information
- Quick statistics (Travels, Bookings)
- Recent activities
- Notification preview

### Search & Filtering

**Capabilities:**

- Full-text search
- Filter by status
- Filter by type
- Filter by date range
- Sort by date (newest/oldest)
- Sort by custom fields

### Export Functions

**Supported Formats:**

- PDF export
- Excel export
- Data includes filtered results

---

## Security Considerations

### Authentication

- **JWT-based** authentication
- **Access Token** (short-lived, ~15-30 min)
- **Refresh Token** (long-lived, ~7 days)
- Tokens stored in `localStorage`
- **HTTPS only** in production

### Authorization

- **Role-based access control (RBAC)**
- Routes protected by role
- API endpoints check permissions
- Actions verified server-side

### Data Protection

- **Sensitive data**: Passwords hashed
- **Payment proofs**: Encrypted storage
- **Personal info**: GDPR compliant
- **Audit trail**: All actions logged

---

## Common Workflows Summary

### Complete Booking Workflow

```
1. User Creates/Browses → Selects Package
2. User Fills Booking Details → Submits
3. Admin Reviews → Approves/Rejects
4. If Approved: User Submits Payment
5. Admin Verifies Payment → Confirms
6. Booking Status: CONFIRMED
7. Travel Dates Arrive → Trip Happens
8. Trip Completes → Status: COMPLETED
9. User Leaves Feedback
10. Booking Archived
```

### Payment Workflow

```
1. User Prepares Payment Proof
2. User Uploads Proof + Details
3. System Creates Payment Record
4. Admin Reviews Proof
5. Admin Verifies or Rejects
6. If Verified: Payment Status Updated
7. Booking Ready for Travel
8. If Rejected: User Resubmits
```

### Itinerary Creation Workflow

### Standard (Admin-Created)

```
1. Admin Creates Standard Itinerary
2. Admin Adds Days & Activities
3. Admin Sets Price & Category
4. Standard Published (Active)
5. Users Browse & Book
6. Booking Uses This Template
```

### Customized (User-Created)

```
1. User Creates Customized Itinerary
2. User Adds Days & Activities
3. Saved as DRAFT
4. User Can Publish as Booking
5. Admin Reviews Custom Itinerary
6. Admin Approves or Requests Changes
```

---

## Conclusion

BondVoyage is a comprehensive, full-featured travel management platform that bridges the gap between travel agencies and customers through:

- **Seamless booking workflows** from creation to completion
- **Robust payment verification** system with proof of payment
- **Flexible itinerary management** supporting both standard and custom trips
- **Real-time notifications** keeping both parties informed
- **AI-powered assistance** for trip planning and optimization
- **Complete audit trail** for compliance and accountability

The system's bidirectional communication ensures that both admin and user sides are always synchronized, providing a reliable and professional travel booking experience.

---

## Document Information

- **Document Version**: 1.0
- **Last Updated**: January 14, 2026
- **System**: BondVoyage Travel Management Platform
- **Scope**: Complete system documentation covering all major features and workflows
- **Audience**: Developers, Project Managers, System Administrators, Stakeholders

---

**For questions or updates to this documentation, please contact the development team.**
