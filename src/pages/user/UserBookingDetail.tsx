import { useParams, useNavigate } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  UtensilsCrossed,
  Car,
  Download,
  QrCode,
  Keyboard,
  CreditCard,
  User,
  Phone,
  Mail,
  Banknote,
  Smartphone,
  Upload,
  X,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Pen,
  Save,
  Copy,
  Shield,
  AlertCircle,
  TrendingUp,
  Wallet,
  Receipt,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { ItineraryDetailDisplay } from "../../components/ItineraryDetailDisplay";
import {
  exportBookingDetailToPDF,
  exportBookingDetailToExcel,
} from "../../utils/exportUtils";
import { toast } from "sonner";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import { FAQAssistant } from "../../components/FAQAssistant";
import { useBookingDetail } from "../../hooks/useBookings";
import { useSubmitPayment } from "../../hooks/usePayments";
import { useProfile } from "../../hooks/useAuth";
import { Payment, User as IUser } from "../../types/types";
import { UserPaymentSection } from "./UserPaymentSection";

export function UserBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  // API Hooks
  const {
    data: bookingResponse,
    isLoading: bookingLoading,
    error: bookingError,
  } = useBookingDetail(id!);
  const { data: profileResponse } = useProfile();
  const submitPaymentMutation = useSubmitPayment(id!);

  const profileData: IUser = useMemo(() => {
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

  // Payment states
  const [paymentType, setPaymentType] = useState<"" | "FULL" | "PARTIAL">("");
  const [modeOfPayment, setModeOfPayment] = useState<"" | "CASH" | "GCASH">("");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [gcashModalOpen, setGcashModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [cashConfirmation, setCashConfirmation] = useState<File | null>(null);
  const [cashConfirmationPreview, setCashConfirmationPreview] =
    useState<string>("");
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qr"); // 'qr' or 'manual'
  const [cashTab, setCashTab] = useState("receipt"); // 'receipt' or 'upload'
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentDetailModalOpen, setPaymentDetailModalOpen] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [pendingCancelAction, setPendingCancelAction] = useState<
    (() => void) | null
  >(null);

  // Payment settings from localStorage (admin EditProfile)
  const [paymentSettings] = useState(() => {
    const saved = localStorage.getItem("paymentSettings");
    return saved
      ? JSON.parse(saved)
      : {
          accountName: "4B'S TRAVEL AND TOURS",
          gcashMobile: "0994 631 1233",
          gcashQrCode: "",
        };
  });

  // Extract data from API response
  const booking = bookingResponse?.data;
  const user = profileResponse?.data?.user;
  const payments = booking?.payments || [];

  // Calculate payment totals
  const totalAmount = booking ? parseFloat(booking.totalPrice.toString()) : 0;
  const totalPaid = payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const balance = totalAmount - totalPaid;
  const progressPercent =
    totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  // Determine payment status
  const getPaymentStatus = (): "Paid" | "Partial" | "Unpaid" => {
    if (totalPaid >= totalAmount) return "Paid";
    if (totalPaid > 0) return "Partial";
    return "Unpaid";
  };

  const paymentStatus = getPaymentStatus();
  const paymentSectionState =
    paymentStatus === "Paid"
      ? "fullyPaid"
      : paymentStatus === "Partial"
      ? "partial"
      : "unpaid";

  // Handle cancel actions
  const handleCancelWithConfirmation = (action: () => void) => {
    if (proofOfPayment || cashConfirmation) {
      setPendingCancelAction(() => action);
      setShowCancelConfirmation(true);
    } else {
      action();
    }
  };

  const handleConfirmedCancel = () => {
    if (pendingCancelAction) {
      setProofOfPayment(null);
      setProofPreview("");
      setCashConfirmation(null);
      setCashConfirmationPreview("");
      pendingCancelAction();
      setPendingCancelAction(null);
      setShowCancelConfirmation(false);
      toast.info("Payment process cancelled and uploaded files cleared");
    }
  };

  const handleCancelCancellation = () => {
    setPendingCancelAction(null);
    setShowCancelConfirmation(false);
    toast("Payment process continued");
  };

  // Handle payment history item click
  const handlePaymentItemClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentDetailModalOpen(true);
  };

  // GCash-themed Confetti Function
  const launchGCashConfetti = () => {
    const colors = ["#0A7AFF", "#00B2FF", "#10B981", "#FFFFFF", "#FFD700"];
    confetti({
      particleCount: 150,
      angle: 90,
      spread: 80,
      origin: { x: 0.5, y: 0.6 },
      colors: colors,
      shapes: ["circle", "square"],
    });
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast.success("GCash number copied to clipboard!");
  };

  // Enhanced Amount Input Validation
  const handlePartialAmountChange = (value: string) => {
    if (!editingPayment) return;

    const numericValue = value.replace(/[^\d.]/g, "");
    const decimalCount = (numericValue.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    const amount = parseFloat(numericValue) || 0;

    if (amount === 0 && numericValue !== "") {
      toast.error("Amount cannot be 0");
      return;
    }

    if (amount > balance) {
      toast.error(
        `Amount cannot exceed remaining balance of ₱${balance.toLocaleString()}`
      );
      return;
    }

    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    setPartialAmount(numericValue);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit payment to backend
  const handleSubmitPayment = async () => {
    if (!booking || !paymentType || !modeOfPayment) {
      toast.error("Please complete all payment fields");
      return;
    }

    if (paymentType === "PARTIAL") {
      const amount = parseFloat(partialAmount) || 0;

      if (amount === 0) {
        toast.error("Amount cannot be 0");
        return;
      }

      if (amount > balance) {
        toast.error(
          `Amount cannot exceed remaining balance of ₱${balance.toLocaleString()}`
        );
        return;
      }

      if (amount < 1) {
        toast.error("Minimum payment amount is ₱1");
        return;
      }
    }

    const paymentAmount =
      paymentType === "FULL" ? balance : parseFloat(partialAmount);

    try {
      // Prepare payment data
      const paymentData: any = {
        amount: paymentAmount,
        method: modeOfPayment,
        type: paymentType,
      };

      // Add proof of payment if available
      if (modeOfPayment === "GCASH" && proofOfPayment) {
        paymentData.proofOfPayment = await fileToBase64(proofOfPayment);
      } else if (modeOfPayment === "CASH" && cashConfirmation) {
        paymentData.proofOfPayment = await fileToBase64(cashConfirmation);
      }

      // Submit payment
      await submitPaymentMutation.mutateAsync(paymentData, {
        onSuccess: () => {
          toast.success("Payment submitted successfully!");

          // Reset form
          setPaymentType("");
          setModeOfPayment("");
          setPartialAmount("");
          setProofOfPayment(null);
          setProofPreview("");
          setCashConfirmation(null);
          setCashConfirmationPreview("");
          setEditingPayment(false);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to submit payment"
          );
        },
      });
    } catch (error) {
      console.error("Payment submission error:", error);
      toast.error("Failed to submit payment");
    }
  };

  const handlePaymentTypeChange = (value: "" | "FULL" | "PARTIAL") => {
    if (!editingPayment) return;
    setPaymentType(value);

    if (value !== "PARTIAL") {
      setPartialAmount("");
    }
  };

  const handleModeOfPaymentClick = (mode: "CASH" | "GCASH") => {
    if (!editingPayment) return;
    setModeOfPayment(mode);

    if (mode === "CASH") {
      setCashTab("receipt");
      setReceiptModalOpen(true);
    } else if (mode === "GCASH") {
      setGcashModalOpen(true);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setProofOfPayment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Proof of payment uploaded successfully!");
    }
  };

  const handleCashConfirmationUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setCashConfirmation(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCashConfirmationPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Payment confirmation uploaded successfully!");
    } else {
      toast.error("Please upload an image file");
    }
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      toast.loading("Preparing receipt download...");
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: receiptRef.current.scrollWidth,
        height: receiptRef.current.scrollHeight,
        windowWidth: 10000,
        windowHeight: receiptRef.current.scrollHeight,
        imageTimeout: 0,
        removeContainer: false,
      });

      const link = document.createElement("a");
      link.download = `Cash-Receipt-${booking?.id}-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      toast.dismiss();
      toast.success("Receipt downloaded successfully!");
      setReceiptModalOpen(false);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download receipt");
      console.error("Download error:", error);
    }
  };

  const handleBack = () => {
    navigate("/user/bookings");
  };

  const getInitials = () => {
    if (!user) return "4B";
    const fullName = `${user.firstName} ${user.lastName}`;
    const words = fullName.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date range
  const formatDateRange = () => {
    if (!booking) return "";
    return `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;
  };

  // Loading state
  if (bookingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0A7AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (bookingError || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl text-card-foreground mb-2">
            Booking Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The booking you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/user/bookings")}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white hover:shadow-lg transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const partialAmountNum = parseFloat(partialAmount) || 0;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-xl bg-white border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] dark:bg-gray-800 dark:border-gray-700 dark:hover:border-[#0A7AFF] dark:hover:bg-[rgba(10,122,255,0.05)] flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
        </button>
        <div>
          <h2 className="text-[#1A2B4F] dark:text-white font-semibold">
            {booking.destination}
          </h2>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Booking Details
          </p>
        </div>
      </div>

      {/* Booking Header Card */}
      <div className="bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold">{booking.destination}</h1>
              {/* Payment Status Badge */}
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatus === "Paid"
                    ? "bg-[#10B981] text-white"
                    : paymentStatus === "Partial"
                    ? "bg-[#F59E0B] text-white"
                    : "bg-[#EF4444] text-white"
                }`}
              >
                {paymentStatus === "Paid"
                  ? "Paid"
                  : paymentStatus === "Partial"
                  ? "Partial Payment"
                  : "Unpaid"}
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="text-lg">{booking.destination}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm mb-1">Booking ID</p>
            <p className="text-2xl font-semibold">{booking.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <CalendarIcon className="w-5 h-5 mb-2 text-white/80" />
            <p className="text-white/80 text-xs mb-1">Travel Dates</p>
            <p className="font-medium">{formatDateRange()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Users className="w-5 h-5 mb-2 text-white/80" />
            <p className="text-white/80 text-xs mb-1">Travelers</p>
            <p className="font-medium">
              {booking.travelers} {booking.travelers > 1 ? "People" : "Person"}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <CreditCard className="w-5 h-5 mb-2 text-white/80" />
            <p className="text-white/80 text-xs mb-1">Total Amount</p>
            <p className="font-medium">₱{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <Clock className="w-5 h-5 mb-2 text-white/80" />
            <p className="text-white/80 text-xs mb-1">Booked On</p>
            <p className="font-medium">{formatDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#1A2B4F]">
                  Customer Information
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Full Name</p>
                <p className="text-[#1A2B4F] font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0A7AFF]" />
                  <p className="text-[#334155]">
                    {booking.user?.email || user?.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Mobile Number</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#14B8A6]" />
                  <p className="text-[#334155]">
                    {user?.mobile || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden">
            {/* Header with gradient accent */}
            <div className="relative p-6 border-b border-[#E5E7EB]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A2B4F] text-lg">
                      Payment Information
                    </h3>
                    <p className="text-sm text-[#64748B]">
                      Track your payment progress
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* UNPAID STATE - Initial state with no payments made */}
              {paymentSectionState === "unpaid" && (
                <>
                  {balance > 0 ? (
                    editingPayment /* EDITING STATE - Original form fields */ ? (
                      <>
                        {/* Payment Type Dropdown */}
                        <div>
                          <Label
                            htmlFor="payment-type"
                            className="text-[#1A2B4F] mb-2 block"
                          >
                            Payment Type
                          </Label>
                          <Select
                            value={paymentType}
                            onValueChange={handlePaymentTypeChange}
                          >
                            <SelectTrigger
                              id="payment-type"
                              className="h-11 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                            >
                              <SelectValue placeholder="Choose payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL">Full Payment</SelectItem>
                              <SelectItem value="PARTIAL">
                                Partial Payment
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* For Full Payment - Show mode of payment immediately */}
                        {paymentType === "FULL" && (
                          <div>
                            <Label className="text-[#1A2B4F] mb-2 block">
                              Mode of Payment
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => handleModeOfPaymentClick("CASH")}
                                className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                  modeOfPayment === "CASH"
                                    ? "border-[#10B981] bg-[rgba(16,185,129,0.1)] text-[#10B981]"
                                    : "border-[#E5E7EB] text-[#64748B] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
                                }`}
                              >
                                <Banknote className="w-5 h-5" />
                                Cash
                              </button>
                              <button
                                onClick={() =>
                                  handleModeOfPaymentClick("GCASH")
                                }
                                className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                  modeOfPayment === "GCASH"
                                    ? "border-[#0A7AFF] bg-[rgba(10,122,255,0.1)] text-[#0A7AFF]"
                                    : "border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
                                }`}
                              >
                                <Smartphone className="w-5 h-5" />
                                Gcash
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Amount Input for Partial Payment with Enhanced Validation */}
                        {paymentType === "PARTIAL" && (
                          <div>
                            <Label
                              htmlFor="amount"
                              className="text-[#1A2B4F] mb-2 block"
                            >
                              Amount
                              <span className="text-[#FF6B6B] ml-1">*</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                                ₱
                              </span>
                              <Input
                                id="amount"
                                type="text"
                                value={partialAmount}
                                onChange={(e) =>
                                  handlePartialAmountChange(e.target.value)
                                }
                                placeholder="0.00"
                                className={`h-11 pl-8 border-2 focus:ring-[#0A7AFF]/10 transition-all ${
                                  partialAmount &&
                                  (parseFloat(partialAmount) === 0 ||
                                    parseFloat(partialAmount) > balance)
                                    ? "border-[#FF6B6B] focus:border-[#FF6B6B]"
                                    : partialAmount &&
                                      parseFloat(partialAmount) > 0 &&
                                      parseFloat(partialAmount) <= balance
                                    ? "border-[#10B981] focus:border-[#10B981]"
                                    : "border-[#E5E7EB] focus:border-[#0A7AFF]"
                                }`}
                                onBlur={(e) => {
                                  if (
                                    e.target.value &&
                                    !isNaN(parseFloat(e.target.value))
                                  ) {
                                    const formatted = parseFloat(
                                      e.target.value
                                    ).toFixed(2);
                                    setPartialAmount(formatted);
                                  }
                                }}
                              />
                            </div>

                            {/* Validation Messages */}
                            <div className="mt-2 space-y-1">
                              {partialAmount &&
                                parseFloat(partialAmount) === 0 && (
                                  <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Amount cannot be 0
                                  </p>
                                )}
                              {partialAmount &&
                                parseFloat(partialAmount) > balance && (
                                  <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Amount exceeds remaining balance
                                  </p>
                                )}
                              {partialAmount &&
                                parseFloat(partialAmount) > 0 &&
                                parseFloat(partialAmount) <= balance && (
                                  <p className="text-xs text-[#10B981] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Valid amount
                                  </p>
                                )}
                            </div>

                            {/* Mode of Payment for Partial Payment - Only show when amount is valid */}
                            {partialAmount &&
                              parseFloat(partialAmount) > 0 &&
                              parseFloat(partialAmount) <= balance && (
                                <div className="mt-4">
                                  <Label className="text-[#1A2B4F] mb-2 block">
                                    Mode of Payment
                                  </Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() =>
                                        handleModeOfPaymentClick("CASH")
                                      }
                                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        modeOfPayment === "CASH"
                                          ? "border-[#10B981] bg-[rgba(16,185,129,0.1)] text-[#10B981]"
                                          : "border-[#E5E7EB] text-[#64748B] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
                                      }`}
                                    >
                                      <Banknote className="w-5 h-5" />
                                      Cash
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleModeOfPaymentClick("GCASH")
                                      }
                                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        modeOfPayment === "GCASH"
                                          ? "border-[#0A7AFF] bg-[rgba(10,122,255,0.1)] text-[#0A7AFF]"
                                          : "border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
                                      }`}
                                    >
                                      <Smartphone className="w-5 h-5" />
                                      Gcash
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Cash Payment Confirmation Upload - Only show when there's an uploaded file */}
                        {modeOfPayment === "CASH" &&
                          cashConfirmationPreview && (
                            <div>
                              <Label className="text-[#1A2B4F] mb-2 block">
                                Proof of Payment
                              </Label>
                              <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
                                <img
                                  src={cashConfirmationPreview}
                                  alt="Cash payment confirmation"
                                  className="w-full max-h-96 object-contain bg-[#F8FAFB]"
                                />
                                <button
                                  onClick={() => {
                                    setCashConfirmation(null);
                                    setCashConfirmationPreview("");
                                  }}
                                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FF6B6B] text-white flex items-center justify-center hover:bg-[#FF5252] transition-all shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-[#10B981] mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Payment confirmation uploaded
                              </p>
                            </div>
                          )}

                        {/* Gcash Proof of Payment Preview */}
                        {modeOfPayment === "GCASH" && proofPreview && (
                          <div>
                            <Label className="text-[#1A2B4F] mb-2 block">
                              Proof of Payment
                            </Label>
                            <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
                              <img
                                src={proofPreview}
                                alt="Gcash proof of payment"
                                className="w-full max-h-96 object-contain bg-[#F8FAFB]"
                              />
                              <button
                                onClick={() => {
                                  setProofOfPayment(null);
                                  setProofPreview("");
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FF6B6B] text-white flex items-center justify-center hover:bg-[#FF5252] transition-all shadow-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-[#10B981] mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Proof of payment uploaded
                            </p>
                          </div>
                        )}

                        {/* Payment Summary in Edit Mode */}
                        <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#64748B]">
                              Total Amount
                            </span>
                            <span className="font-semibold text-[#1A2B4F]">
                              ₱{totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#64748B]">
                              Amount to Pay
                            </span>
                            <span className="font-semibold text-[#10B981]">
                              {paymentType === "PARTIAL"
                                ? `₱${partialAmountNum.toLocaleString()}`
                                : paymentType === "FULL"
                                ? `₱${balance.toLocaleString()}`
                                : `₱${balance.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                            <span className="text-sm font-medium text-[#1A2B4F]">
                              Balance After
                            </span>
                            <span className="font-semibold text-[#FF6B6B]">
                              ₱
                              {(
                                balance -
                                (paymentType === "PARTIAL"
                                  ? partialAmountNum
                                  : paymentType === "FULL"
                                  ? balance
                                  : 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Submit Button with Enhanced Validation */}
                        {paymentType && modeOfPayment && (
                          <div className="pt-4 border-t border-[#E5E7EB]">
                            <button
                              onClick={handleSubmitPayment}
                              disabled={
                                submitPaymentMutation.isPending ||
                                (modeOfPayment === "GCASH" &&
                                  !proofOfPayment) ||
                                (modeOfPayment === "CASH" &&
                                  !cashConfirmation) ||
                                (paymentType === "PARTIAL" &&
                                  (!partialAmount ||
                                    parseFloat(partialAmount) === 0 ||
                                    parseFloat(partialAmount) > balance))
                              }
                              className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                            >
                              <Save className="w-4 h-4" />
                              {submitPaymentMutation.isPending
                                ? "Submitting..."
                                : "Submit Payment"}
                            </button>
                          </div>
                        )}

                        {/* Cancel Edit Button */}
                        <button
                          onClick={() =>
                            handleCancelWithConfirmation(() => {
                              setEditingPayment(false);
                              setPaymentType("");
                              setModeOfPayment("");
                              setPartialAmount("");
                              setProofOfPayment(null);
                              setProofPreview("");
                              setCashConfirmation(null);
                              setCashConfirmationPreview("");
                            })
                          }
                          className="w-full h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F8FAFB] transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : /* Check if there are pending payments to show */
                    payments.length > 0 ? (
                      /* Show pending payments */
                      <>
                        {/* Pending Payments Header */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-[#F59E0B]" />
                            <h4 className="font-semibold text-[#1A2B4F]">
                              Pending Payments
                            </h4>
                          </div>
                          <p className="text-sm text-[#64748B]">
                            You have {payments.length} payment
                            {payments.length !== 1 ? "s" : ""} awaiting
                            verification
                          </p>
                        </div>

                        {/* Payment History - Show pending payments */}
                        <div className="space-y-3">
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {payments.map((payment, index) => (
                              <div
                                key={payment.id}
                                onClick={() => handlePaymentItemClick(payment)}
                                className="group bg-white rounded-xl p-4 border border-[#E5E7EB] hover:border-[#0A7AFF] hover:shadow-md cursor-pointer transition-all duration-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        payment.method === "GCASH"
                                          ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                                          : "bg-[#10B981]/10 text-[#10B981]"
                                      }`}
                                    >
                                      {payment.method === "GCASH" ? (
                                        <Smartphone className="w-5 h-5" />
                                      ) : (
                                        <Banknote className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-[#1A2B4F]">
                                        Payment #{index + 1}
                                      </p>
                                      <p className="text-xs text-[#94A3B8]">
                                        {new Date(
                                          payment.createdAt || ""
                                        ).toLocaleDateString("en-PH", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-bold text-[#10B981]">
                                        ₱
                                        {parseFloat(
                                          payment.amount.toString()
                                        ).toLocaleString()}
                                      </p>
                                      <div className="flex items-center gap-1 justify-end">
                                        {payment.status === "PENDING" ? (
                                          <>
                                            <Clock className="w-3 h-3 text-[#F59E0B]" />
                                            <span className="text-xs text-[#F59E0B]">
                                              Pending
                                            </span>
                                          </>
                                        ) : payment.status === "VERIFIED" ? (
                                          <>
                                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                                            <span className="text-xs text-[#10B981]">
                                              Verified
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <X className="w-3 h-3 text-[#EF4444]" />
                                            <span className="text-xs text-[#EF4444]">
                                              Rejected
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0A7AFF] transition-colors" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Make Payment CTA - Still show even with pending payments */}
                        <div className="pt-4 border-t border-[#E5E7EB]">
                          <button
                            onClick={() => setEditingPayment(true)}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0A7AFF] via-[#0A7AFF] to-[#14B8A6] text-white font-semibold shadow-lg shadow-[#0A7AFF]/30 hover:shadow-xl hover:shadow-[#0A7AFF]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                          >
                            Make Another Payment
                          </button>
                        </div>
                      </>
                    ) : (
                      /* No payments at all - show the original empty state */
                      <>
                        {/* Empty state for unpaid bookings */}
                        <div className="text-center py-8">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#F8FAFB] to-[#E5E7EB] rounded-full flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-[#64748B]" />
                          </div>
                          <h4 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                            No Payments Made
                          </h4>
                          <p className="text-sm text-[#64748B] mb-6">
                            Start your payment process to secure your booking
                          </p>

                          {/* Payment Summary Card */}
                          <div className="bg-gradient-to-br from-[#F8FAFB] to-[#F1F5F9] rounded-2xl p-5 border border-[#E5E7EB] mb-6">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#64748B]">
                                  Total Package Cost
                                </span>
                                <span className="font-bold text-[#1A2B4F] text-lg">
                                  ₱{totalAmount.toLocaleString()}
                                </span>
                              </div>

                              <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent" />

                              <div className="flex justify-between items-center pt-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                                  <span className="text-sm font-medium text-[#1A2B4F]">
                                    Outstanding Balance
                                  </span>
                                </div>
                                <span className="font-bold text-[#EF4444] text-lg">
                                  ₱{balance.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Make Payment CTA */}
                          <button
                            onClick={() => setEditingPayment(true)}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0A7AFF] via-[#0A7AFF] to-[#14B8A6] text-white font-semibold shadow-lg shadow-[#0A7AFF]/30 hover:shadow-xl hover:shadow-[#0A7AFF]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                          >
                            Make First Payment
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-[#1A2B4F] mb-2">
                        Fully Paid
                      </h4>
                      <p className="text-sm text-[#64748B] mb-6">
                        This booking has been completely paid.
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* PARTIAL PAYMENT STATE - Ongoing payments */}
              {paymentSectionState === "partial" && (
                <>
                  {balance > 0 ? (
                    editingPayment ? (
                      /* EDITING STATE - Same as unpaid editing state */
                      <>
                        {/* Payment Type Dropdown */}
                        <div>
                          <Label
                            htmlFor="payment-type"
                            className="text-[#1A2B4F] mb-2 block"
                          >
                            Payment Type
                          </Label>
                          <Select
                            value={paymentType}
                            onValueChange={handlePaymentTypeChange}
                          >
                            <SelectTrigger
                              id="payment-type"
                              className="h-11 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
                            >
                              <SelectValue placeholder="Choose payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL">Full Payment</SelectItem>
                              <SelectItem value="PARTIAL">
                                Partial Payment
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* For Full Payment - Show mode of payment immediately */}
                        {paymentType === "FULL" && (
                          <div>
                            <Label className="text-[#1A2B4F] mb-2 block">
                              Mode of Payment
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => handleModeOfPaymentClick("CASH")}
                                className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                  modeOfPayment === "CASH"
                                    ? "border-[#10B981] bg-[rgba(16,185,129,0.1)] text-[#10B981]"
                                    : "border-[#E5E7EB] text-[#64748B] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
                                }`}
                              >
                                <Banknote className="w-5 h-5" />
                                Cash
                              </button>
                              <button
                                onClick={() =>
                                  handleModeOfPaymentClick("GCASH")
                                }
                                className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                  modeOfPayment === "GCASH"
                                    ? "border-[#0A7AFF] bg-[rgba(10,122,255,0.1)] text-[#0A7AFF]"
                                    : "border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
                                }`}
                              >
                                <Smartphone className="w-5 h-5" />
                                Gcash
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Amount Input for Partial Payment */}
                        {paymentType === "PARTIAL" && (
                          <div>
                            <Label
                              htmlFor="amount"
                              className="text-[#1A2B4F] mb-2 block"
                            >
                              Amount
                              <span className="text-[#FF6B6B] ml-1">*</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                                ₱
                              </span>
                              <Input
                                id="amount"
                                type="text"
                                value={partialAmount}
                                onChange={(e) =>
                                  handlePartialAmountChange(e.target.value)
                                }
                                placeholder="0.00"
                                className={`h-11 pl-8 border-2 focus:ring-[#0A7AFF]/10 transition-all ${
                                  partialAmount &&
                                  (parseFloat(partialAmount) === 0 ||
                                    parseFloat(partialAmount) > balance)
                                    ? "border-[#FF6B6B] focus:border-[#FF6B6B]"
                                    : partialAmount &&
                                      parseFloat(partialAmount) > 0 &&
                                      parseFloat(partialAmount) <= balance
                                    ? "border-[#10B981] focus:border-[#10B981]"
                                    : "border-[#E5E7EB] focus:border-[#0A7AFF]"
                                }`}
                                onBlur={(e) => {
                                  if (
                                    e.target.value &&
                                    !isNaN(parseFloat(e.target.value))
                                  ) {
                                    const formatted = parseFloat(
                                      e.target.value
                                    ).toFixed(2);
                                    setPartialAmount(formatted);
                                  }
                                }}
                              />
                            </div>

                            {/* Validation Messages */}
                            <div className="mt-2 space-y-1">
                              {partialAmount &&
                                parseFloat(partialAmount) === 0 && (
                                  <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Amount cannot be 0
                                  </p>
                                )}
                              {partialAmount &&
                                parseFloat(partialAmount) > balance && (
                                  <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Amount exceeds remaining balance
                                  </p>
                                )}
                              {partialAmount &&
                                parseFloat(partialAmount) > 0 &&
                                parseFloat(partialAmount) <= balance && (
                                  <p className="text-xs text-[#10B981] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Valid amount
                                  </p>
                                )}
                            </div>

                            {/* Mode of Payment for Partial Payment */}
                            {partialAmount &&
                              parseFloat(partialAmount) > 0 &&
                              parseFloat(partialAmount) <= balance && (
                                <div className="mt-4">
                                  <Label className="text-[#1A2B4F] mb-2 block">
                                    Mode of Payment
                                  </Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() =>
                                        handleModeOfPaymentClick("CASH")
                                      }
                                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        modeOfPayment === "CASH"
                                          ? "border-[#10B981] bg-[rgba(16,185,129,0.1)] text-[#10B981]"
                                          : "border-[#E5E7EB] text-[#64748B] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)]"
                                      }`}
                                    >
                                      <Banknote className="w-5 h-5" />
                                      Cash
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleModeOfPaymentClick("GCASH")
                                      }
                                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        modeOfPayment === "GCASH"
                                          ? "border-[#0A7AFF] bg-[rgba(10,122,255,0.1)] text-[#0A7AFF]"
                                          : "border-[#E5E7EB] text-[#64748B] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)]"
                                      }`}
                                    >
                                      <Smartphone className="w-5 h-5" />
                                      Gcash
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Cash Payment Confirmation Upload */}
                        {modeOfPayment === "CASH" &&
                          cashConfirmationPreview && (
                            <div>
                              <Label className="text-[#1A2B4F] mb-2 block">
                                Proof of Payment
                              </Label>
                              <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
                                <img
                                  src={cashConfirmationPreview}
                                  alt="Cash payment confirmation"
                                  className="w-full max-h-96 object-contain bg-[#F8FAFB]"
                                />
                                <button
                                  onClick={() => {
                                    setCashConfirmation(null);
                                    setCashConfirmationPreview("");
                                  }}
                                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FF6B6B] text-white flex items-center justify-center hover:bg-[#FF5252] transition-all shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-[#10B981] mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Payment confirmation uploaded
                              </p>
                            </div>
                          )}

                        {/* Gcash Proof of Payment Preview */}
                        {modeOfPayment === "GCASH" && proofPreview && (
                          <div>
                            <Label className="text-[#1A2B4F] mb-2 block">
                              Proof of Payment
                            </Label>
                            <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
                              <img
                                src={proofPreview}
                                alt="Gcash proof of payment"
                                className="w-full max-h-96 object-contain bg-[#F8FAFB]"
                              />
                              <button
                                onClick={() => {
                                  setProofOfPayment(null);
                                  setProofPreview("");
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FF6B6B] text-white flex items-center justify-center hover:bg-[#FF5252] transition-all shadow-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-[#10B981] mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Proof of payment uploaded
                            </p>
                          </div>
                        )}

                        {/* Payment Summary in Edit Mode */}
                        <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#64748B]">
                              Total Amount
                            </span>
                            <span className="font-semibold text-[#1A2B4F]">
                              ₱{totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#64748B]">
                              Amount to Pay
                            </span>
                            <span className="font-semibold text-[#10B981]">
                              {paymentType === "PARTIAL"
                                ? `₱${partialAmountNum.toLocaleString()}`
                                : paymentType === "FULL"
                                ? `₱${balance.toLocaleString()}`
                                : `₱${balance.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                            <span className="text-sm font-medium text-[#1A2B4F]">
                              Balance After
                            </span>
                            <span className="font-semibold text-[#FF6B6B]">
                              ₱
                              {(
                                balance -
                                (paymentType === "PARTIAL"
                                  ? partialAmountNum
                                  : paymentType === "FULL"
                                  ? balance
                                  : 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Submit Button */}
                        {paymentType && modeOfPayment && (
                          <div className="pt-4 border-t border-[#E5E7EB]">
                            <button
                              onClick={handleSubmitPayment}
                              disabled={
                                submitPaymentMutation.isPending ||
                                (modeOfPayment === "GCASH" &&
                                  !proofOfPayment) ||
                                (modeOfPayment === "CASH" &&
                                  !cashConfirmation) ||
                                (paymentType === "PARTIAL" &&
                                  (!partialAmount ||
                                    parseFloat(partialAmount) === 0 ||
                                    parseFloat(partialAmount) > balance))
                              }
                              className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                            >
                              <Save className="w-4 h-4" />
                              {submitPaymentMutation.isPending
                                ? "Submitting..."
                                : "Submit Payment"}
                            </button>
                          </div>
                        )}

                        {/* Cancel Edit Button */}
                        <button
                          onClick={() =>
                            handleCancelWithConfirmation(() => {
                              setEditingPayment(false);
                              setPaymentType("");
                              setModeOfPayment("");
                              setPartialAmount("");
                              setProofOfPayment(null);
                              setProofPreview("");
                              setCashConfirmation(null);
                              setCashConfirmationPreview("");
                            })
                          }
                          className="w-full h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F8FAFB] transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      /* NON-EDITING STATE - Enhanced Visual Display for Partial Payments */
                      <>
                        {/* Circular Progress & Stats */}
                        <div className="flex items-center gap-3">
                          {/* Circular Progress - Left Side (Larger) */}
                          <div className="relative flex-shrink-0">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#E5E7EB"
                                strokeWidth="10"
                                fill="none"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="url(#progressGradient)"
                                strokeWidth="10"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${
                                  progressPercent * 3.52
                                } 352`}
                                className="transition-all duration-1000 ease-out"
                              />
                              <defs>
                                <linearGradient
                                  id="progressGradient"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="0%"
                                >
                                  <stop offset="0%" stopColor="#10B981" />
                                  <stop offset="100%" stopColor="#14B8A6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-[#1A2B4F]">
                                {progressPercent}%
                              </span>
                              <span className="text-xs text-[#64748B]">
                                Paid
                              </span>
                            </div>
                          </div>
                          {/* Quick Stats - Right Side */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div
                              className="bg-gradient-to-r from-[#10B981]/10 to-[#14B8A6]/10 rounded-xl p-3 border border-[#10B981]/20"
                              style={{
                                background:
                                  "linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))",
                                borderColor: "rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-[#10B981]"
                                  style={{ color: "#10B981" }}
                                />
                                <span
                                  className="text-xs font-medium text-[#10B981]"
                                  style={{ color: "#10B981" }}
                                >
                                  Amount Paid
                                </span>
                              </div>
                              <p
                                className="text-lg font-bold text-[#10B981]"
                                style={{ color: "#10B981" }}
                              >
                                ₱{totalPaid.toLocaleString()}
                              </p>
                            </div>
                            <div
                              className="bg-gradient-to-r from-[#EF4444]/10 to-[#F87171]/10 rounded-xl p-3 border border-[#EF4444]/20"
                              style={{
                                background:
                                  "linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1))",
                                borderColor: "rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Wallet
                                  className="w-3.5 h-3.5 text-[#EF4444]"
                                  style={{ color: "#EF4444" }}
                                />
                                <span
                                  className="text-xs font-medium text-[#EF4444]"
                                  style={{ color: "#EF4444" }}
                                >
                                  Remaining Balance
                                </span>
                              </div>
                              <p
                                className="text-lg font-bold text-[#EF4444]"
                                style={{ color: "#EF4444" }}
                              >
                                ₱{balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Payment Breakdown Card */}
                        <div className="bg-gradient-to-br from-[#F8FAFB] to-[#F1F5F9] rounded-2xl p-5 border border-[#E5E7EB]">
                          <div className="flex items-center gap-2 mb-4">
                            <Receipt className="w-5 h-5 text-[#64748B]" />
                            <h4 className="font-semibold text-[#1A2B4F]">
                              Payment Breakdown
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#64748B]">
                                Total Package Cost
                              </span>
                              <span className="font-bold text-[#1A2B4F] text-lg">
                                ₱{totalAmount.toLocaleString()}
                              </span>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent" />

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                                <span className="text-sm text-[#64748B]">
                                  Total Paid
                                </span>
                              </div>
                              <span className="font-semibold text-[#10B981]">
                                - ₱{totalPaid.toLocaleString()}
                              </span>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent" />

                            <div className="flex justify-between items-center pt-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"
                                  style={{ backgroundColor: "#EF4444" }}
                                />
                                <span className="text-sm font-medium text-[#1A2B4F]">
                                  Outstanding Balance
                                </span>
                              </div>
                              <span
                                className="font-bold text-[#EF4444] text-lg"
                                style={{ color: "#EF4444" }}
                              >
                                ₱{balance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Linear Progress with milestones */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#0A7AFF]" />
                              <span className="text-sm font-medium text-[#1A2B4F]">
                                Payment Progress
                              </span>
                            </div>
                            <span className="text-sm font-bold text-[#1A2B4F]">
                              {progressPercent}%
                            </span>
                          </div>

                          <div className="relative">
                            <div className="h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#10B981] via-[#14B8A6] to-[#0A7AFF] rounded-full transition-all duration-1000 relative"
                                style={{
                                  width: `${progressPercent}%`,
                                  background:
                                    "linear-gradient(to right, #10B981, #14B8A6, #0A7AFF)",
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                              </div>
                            </div>

                            {/* Milestone markers */}
                            <div className="absolute top-0 left-0 right-0 h-3 flex items-center pointer-events-none">
                              {[25, 50, 75].map((milestone) => (
                                <div
                                  key={milestone}
                                  className="absolute w-0.5 h-3 bg-[#CBD5E1]/50"
                                  style={{ left: `${milestone}%` }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between text-xs text-[#94A3B8]">
                            <span>₱0</span>
                            <span>₱{(totalAmount / 2).toLocaleString()}</span>
                            <span>₱{totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Payment History */}
                        {payments.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#64748B]" />
                                <h4 className="font-semibold text-[#1A2B4F]">
                                  Recent Payments
                                </h4>
                              </div>
                              <span className="text-xs text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded-full">
                                {payments.length} transactions
                              </span>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {payments.map((payment, index) => (
                                <div
                                  key={payment.id}
                                  onClick={() =>
                                    handlePaymentItemClick(payment)
                                  }
                                  className="group bg-white rounded-xl p-4 border border-[#E5E7EB] hover:border-[#0A7AFF] hover:shadow-md cursor-pointer transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                          payment.method === "GCASH"
                                            ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                                            : "bg-[#10B981]/10 text-[#10B981]"
                                        }`}
                                      >
                                        {payment.method === "GCASH" ? (
                                          <Smartphone className="w-5 h-5" />
                                        ) : (
                                          <Banknote className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-[#1A2B4F]">
                                          Payment #{index + 1}
                                        </p>
                                        <p className="text-xs text-[#94A3B8]">
                                          {new Date(
                                            payment.createdAt || ""
                                          ).toLocaleDateString("en-PH", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="font-bold text-[#10B981]">
                                          ₱
                                          {parseFloat(
                                            payment.amount.toString()
                                          ).toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-1 justify-end">
                                          {payment.status === "VERIFIED" ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                                              <span className="text-xs text-[#10B981]">
                                                Verified
                                              </span>
                                            </>
                                          ) : payment.status === "PENDING" ? (
                                            <>
                                              <Clock className="w-3 h-3 text-[#F59E0B]" />
                                              <span className="text-xs text-[#F59E0B]">
                                                Pending
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <X className="w-3 h-3 text-[#EF4444]" />
                                              <span className="text-xs text-[#EF4444]">
                                                Rejected
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0A7AFF] transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Make Payment CTA */}
                        <button
                          onClick={() => setEditingPayment(true)}
                          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0A7AFF] via-[#0A7AFF] to-[#14B8A6] text-white font-semibold shadow-lg shadow-[#0A7AFF]/30 hover:shadow-xl hover:shadow-[#0A7AFF]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                          Make a Payment
                        </button>
                      </>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-[#1A2B4F] mb-2">
                        Fully Paid
                      </h4>
                      <p className="text-sm text-[#64748B] mb-6">
                        This booking has been completely paid.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* FULLY PAID STATE */}
              {paymentSectionState === "fullyPaid" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-[#1A2B4F] mb-2">
                    Fully Paid
                  </h4>
                  <p className="text-sm text-[#64748B] mb-6">
                    This booking has been completely paid.
                  </p>

                  {/* Payment Summary for Fully Paid */}
                  <div className="bg-gradient-to-br from-[#10B981]/10 to-[#14B8A6]/10 rounded-xl p-4 border border-[#10B981]/20 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Total Amount Paid
                      </span>
                      <span className="text-xl font-bold text-[#10B981]">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment History - Still show even when fully paid */}
                  {payments.length > 0 && (
                    <div className="text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#64748B]" />
                          <h4 className="font-semibold text-[#1A2B4F]">
                            Payment History
                          </h4>
                        </div>
                        <span className="text-xs text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded-full">
                          {payments.length} transactions
                        </span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {payments.map((payment, index) => (
                          <div
                            key={payment.id}
                            onClick={() => handlePaymentItemClick(payment)}
                            className="group bg-white rounded-xl p-4 border border-[#E5E7EB] hover:border-[#0A7AFF] hover:shadow-md cursor-pointer transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    payment.method === "GCASH"
                                      ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                                      : "bg-[#10B981]/10 text-[#10B981]"
                                  }`}
                                >
                                  {payment.method === "GCASH" ? (
                                    <Smartphone className="w-5 h-5" />
                                  ) : (
                                    <Banknote className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-[#1A2B4F]">
                                    Payment #{index + 1}
                                  </p>
                                  <p className="text-xs text-[#94A3B8]">
                                    {new Date(
                                      payment.createdAt || ""
                                    ).toLocaleDateString("en-PH", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-bold text-[#10B981]">
                                    ₱
                                    {parseFloat(
                                      payment.amount.toString()
                                    ).toLocaleString()}
                                  </p>
                                  <div className="flex items-center gap-1 justify-end">
                                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                                    <span className="text-xs text-[#10B981]">
                                      Verified
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0A7AFF] transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const bookingData = {
                    id: booking.id,
                    customer: user ? `${user.firstName} ${user.lastName}` : "",
                    email: booking.user?.email || user?.email || "",
                    mobile: user?.mobile || "",
                    destination: booking.destination,
                    dates: formatDateRange(),
                    travelers: booking.travelers,
                    total: `₱${totalAmount.toLocaleString()}`,
                    bookedDate: formatDate(booking.createdAt),
                  };
                  const itineraryDays = booking.itinerary || [];
                  exportBookingDetailToPDF(bookingData, itineraryDays);
                  toast.success("Exporting booking as PDF...");
                }}
                className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#FF6B6B] hover:bg-[rgba(255,107,107,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#FF6B6B] font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => {
                  const bookingData = {
                    id: booking.id,
                    customer: user ? `${user.firstName} ${user.lastName}` : "",
                    email: booking.user?.email || user?.email || "",
                    mobile: user?.mobile || "",
                    destination: booking.destination,
                    dates: formatDateRange(),
                    travelers: booking.travelers,
                    total: `₱${totalAmount.toLocaleString()}`,
                    bookedDate: formatDate(booking.createdAt),
                  };
                  const itineraryDays = booking.itinerary || [];
                  exportBookingDetailToExcel(bookingData, itineraryDays);
                  toast.success("Exporting booking as Excel...");
                }}
                className="h-9 px-3 rounded-lg border border-[#E5E7EB] hover:border-[#10B981] hover:bg-[rgba(16,185,129,0.05)] flex items-center justify-center gap-2 text-sm text-[#334155] hover:text-[#10B981] font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
            <button
              onClick={handleBack}
              className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[#F8FAFB] flex items-center justify-center gap-2 text-[#334155] font-medium transition-all"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Right Column - Itinerary */}
        <div className="col-span-2">
          {booking.itinerary && booking.itinerary.length > 0 ? (
            <ItineraryDetailDisplay
              itineraryData={{
                id: booking.id,
                destination: booking.destination,
                duration: `${booking.itinerary.length} Days`,
                days: booking.itinerary.map((day) => ({
                  day: day.dayNumber,
                  title: `Day ${day.dayNumber}`,
                  description: "",
                  activities: day.activities.map((activity) => ({
                    time: activity.time,
                    activity: activity.title,
                    location: activity.description || "",
                  })),
                })),
                inclusions: [],
                exclusions: [],
                pricing: {
                  basePrice: totalAmount,
                  breakdown: [],
                },
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No itinerary details available
            </div>
          )}
        </div>
      </div>

      {/* Cash Receipt Modal */}
      <Dialog
        open={receiptModalOpen}
        onOpenChange={(open) => {
          if (!open && cashConfirmation) {
            // If trying to close with uploaded file, show confirmation
            handleCancelWithConfirmation(() => setReceiptModalOpen(false));
          } else {
            // Otherwise close directly
            setReceiptModalOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col">
          {/* Modern Cash Header - Same design as GCash */}
          <div className="bg-white p-6 text-[#1A2B4F] relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-16 h-15 rounded-xl flex items-center justify-center">
                <div className="w-16 h-13 flex items-center justify-center">
                  <Banknote className="w-14 h-14 text-[#10B981]" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-[#1A2B4F] text-xl font-bold">
                  Cash Payment
                </DialogTitle>
                <DialogDescription className="text-[#64748B]">
                  Secure in-person payment
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div
            className="bg-[#10B981] flex-1 overflow-y-auto p-8"
            style={{ backgroundColor: "#10B981" }}
          >
            {/* White Background Container */}
            <div className="bg-white rounded-2xl">
              <div className="p-4 space-y-4">
                {/* Cash Logo Text - Centered */}
                <div className="flex justify-center py-2">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-2">
                      <Banknote className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B4F]">
                      Cash Payment
                    </h2>
                    <p className="text-sm text-[#64748B]">
                      In-person payment method
                    </p>
                  </div>
                </div>

                {/* Payment Method Tabs - Same design as GCash */}
                <div className="flex gap-2 bg-[#F8FAFB] p-1 rounded-xl max-w-xs mx-auto">
                  <button
                    onClick={() => setCashTab("receipt")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      cashTab === "receipt"
                        ? "bg-white text-[#10B981] shadow-sm"
                        : "text-[#64748B] hover:text-[#1A2B4F]"
                    }`}
                    style={cashTab === "receipt" ? { color: "#10B981" } : {}}
                  >
                    <Receipt className="w-5 h-5" />
                    <span>Receipt</span>
                  </button>
                  <button
                    onClick={() => setCashTab("upload")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      cashTab === "upload"
                        ? "bg-white text-[#10B981] shadow-sm"
                        : "text-[#64748B] hover:text-[#1A2B4F]"
                    }`}
                    style={cashTab === "upload" ? { color: "#10B981" } : {}}
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Receipt Tab Content */}
                {cashTab === "receipt" && (
                  <div className="space-y-4">
                    {/* Receipt Content */}
                    <div
                      ref={receiptRef}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "0.75rem",
                        border: "1px solid #E5E7EB",
                        overflow: "hidden",
                      }}
                    >
                      {/* Receipt Header */}
                      <div
                        style={{
                          position: "relative",
                          background:
                            "linear-gradient(to bottom right, #10b981, #14b8a6, #06b6d4)",
                          padding: "2rem",
                          textAlign: "center",
                          color: "#ffffff",
                          borderTopLeftRadius: "0.75rem",
                          borderTopRightRadius: "0.75rem",
                          overflow: "hidden",
                        }}
                      >
                        {/* Decorative background elements */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "8rem",
                            height: "8rem",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "50%",
                            marginRight: "-4rem",
                            marginTop: "-4rem",
                          }}
                        ></div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "6rem",
                            height: "6rem",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "50%",
                            marginLeft: "-3rem",
                            marginBottom: "-3rem",
                          }}
                        ></div>

                        {/* Icon container - Updated to match EditProfile styling */}
                        <div
                          style={{
                            position: "relative",
                            width: "6rem",
                            height: "6rem",
                            margin: "0 auto 1.25rem",
                            borderRadius: "50%",
                            border: "4px solid #ffffff",
                            boxShadow:
                              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "linear-gradient(135deg, #10b981, #14b8a6)",
                          }}
                        >
                          {profileData.profilePicture ? (
                            <img
                              src={profileData.profilePicture}
                              alt="Company Logo"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                color: "#ffffff",
                                fontSize: "1.5rem",
                                fontWeight: "bold",
                              }}
                            >
                              {getInitials()}
                            </span>
                          )}
                        </div>

                        {/* Company name */}
                        <h3
                          style={{
                            position: "relative",
                            fontSize: "1.75rem",
                            fontWeight: "bold",
                            marginBottom: "0.75rem",
                            letterSpacing: "-0.025em",
                            filter:
                              "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07))",
                            color: "#ffffff",
                          }}
                        >
                          4B'S TRAVEL AND TOURS
                        </h3>

                        {/* Subtitle */}
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.2)",
                              backdropFilter: "blur(4px)",
                              WebkitBackdropFilter: "blur(4px)",
                              paddingLeft: "1.25rem",
                              paddingRight: "1.25rem",
                              paddingTop: "0.5rem",
                              paddingBottom: "0.5rem",
                              borderRadius: "9999px",
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                            }}
                          >
                            <p
                              style={{
                                color: "#ffffff",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                letterSpacing: "0.025em",
                                margin: 0,
                              }}
                            >
                              Official Payment Receipt
                            </p>
                          </div>
                        </div>

                        {/* Bottom wave decoration */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "1rem",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          }}
                        ></div>
                      </div>

                      {/* Receipt Body */}
                      <div style={{ padding: "1.5rem" }}>
                        {/* Receipt Details */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.875rem",
                                color: "#64748B",
                                fontWeight: "500",
                              }}
                            >
                              Booking ID
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#1A2B4F",
                                backgroundColor: "#F1F5F9",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                              }}
                            >
                              {booking.id}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <span
                              style={{ fontSize: "0.875rem", color: "#64748B" }}
                            >
                              Customer Name
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#1A2B4F",
                              }}
                            >
                              {booking.customer}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <span
                              style={{ fontSize: "0.875rem", color: "#64748B" }}
                            >
                              Destination
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#1A2B4F",
                                textAlign: "right",
                              }}
                            >
                              {booking.destination}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <span
                              style={{ fontSize: "0.875rem", color: "#64748B" }}
                            >
                              Payment Type
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#1A2B4F",
                              }}
                            >
                              {paymentType}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <span
                              style={{ fontSize: "0.875rem", color: "#64748B" }}
                            >
                              Date Generated
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#1A2B4F",
                              }}
                            >
                              {new Date().toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Amount Section */}
                          <div
                            style={{
                              background:
                                "linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))",
                              borderRadius: "0.75rem",
                              padding: "1rem",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "500",
                                  color: "#64748B",
                                }}
                              >
                                Amount to Pay
                              </span>
                              <span
                                style={{
                                  fontSize: "1.5rem",
                                  fontWeight: "bold",
                                  color: "#10B981",
                                }}
                              >
                                {paymentType === "Partial Payment"
                                  ? `₱${partialAmountNum.toLocaleString()}`
                                  : paymentType === "Full Payment"
                                  ? `₱${balance.toLocaleString()}`
                                  : booking.amount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Receipt Footer */}
                      <div
                        style={{
                          backgroundColor: "#F8FAFB",
                          borderTop: "1px solid #E5E7EB",
                          padding: "1rem",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748B",
                            margin: 0,
                          }}
                        >
                          📍 Present this receipt at 4B'S TRAVEL AND TOURS
                          office
                        </p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
                      <h4 className="text-lg font-semibold text-[#1A2B4F] mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#10B981]" />
                        How to Complete Cash Payment
                      </h4>

                      <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="flex items-start gap-4 p-3 bg-[#F8FAFB] rounded-xl border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            1
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2B4F] text-sm mb-1">
                              Download Digital Receipt
                            </h5>
                            <p className="text-xs text-[#64748B]">
                              Click the "Download Receipt" button below to save
                              your payment receipt
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-4 p-3 bg-[#F8FAFB] rounded-xl border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            2
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2B4F] text-sm mb-1">
                              Visit 4B'S TRAVEL AND TOURS
                            </h5>
                            <p className="text-xs text-[#64748B]">
                              Bring the downloaded receipt and exact payment
                              amount to our office
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-4 p-3 bg-[#F8FAFB] rounded-xl border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            3
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2B4F] text-sm mb-1">
                              Pay in Person
                            </h5>
                            <p className="text-xs text-[#64748B]">
                              Present your digital receipt and pay the exact
                              amount in cash to our admin staff
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex items-start gap-4 p-3 bg-[#F8FAFB] rounded-xl border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            4
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2B4F] text-sm mb-1">
                              Receive Official Receipt
                            </h5>
                            <p className="text-xs text-[#64748B]">
                              Wait for the admin to process your payment and
                              provide an official receipt
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex items-start gap-4 p-3 bg-[#F8FAFB] rounded-xl border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            5
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2B4F] text-sm mb-1">
                              Upload Proof of Payment
                            </h5>
                            <p className="text-xs text-[#64748B]">
                              Take a clear photo of the official receipt and
                              upload it as proof of payment
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-[#FFF3E0] border border-[#FFB74D] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-[#FF9800] flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-[#1A2B4F]">
                            Important Reminders
                          </h5>
                          <div className="text-xs text-[#64748B] space-y-1">
                            <p>
                              • Keep your digital receipt safe until payment is
                              completed
                            </p>
                            <p>
                              • Bring valid ID for verification at the office
                            </p>
                            <p>
                              • Ensure receipt photo is clear and all details
                              are visible when uploading
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Tab Content */}
                {cashTab === "upload" && (
                  <div className="space-y-4">
                    {/* Upload Section with Smart Preview */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="cash-proof-upload"
                        className="text-[#1A2B4F] font-semibold block"
                      >
                        Upload Proof of Payment *
                      </Label>

                      {cashConfirmationPreview ? (
                        <div className="space-y-3">
                          <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden group">
                            <img
                              src={cashConfirmationPreview}
                              alt="Cash payment confirmation"
                              className="w-full max-h-96 object-contain bg-[#F8FAFB] mx-auto"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label
                                htmlFor="change-cash-proof"
                                className="cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all">
                                  <Pen
                                    className="w-4 h-4 text-[#10B981]"
                                    style={{ color: "#10B981" }}
                                  />
                                </div>
                              </label>
                              <button
                                onClick={() => {
                                  setCashConfirmation(null);
                                  setCashConfirmationPreview("");
                                }}
                                className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all"
                              >
                                <X className="w-4 h-4 text-[#FF6B6B]" />
                              </button>
                            </div>
                          </div>
                          <Input
                            id="change-cash-proof"
                            type="file"
                            accept="image/*"
                            onChange={handleCashConfirmationUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 text-sm text-[#10B981] bg-[#10B981]/10 rounded-lg p-3">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Proof of Payment uploaded successfully</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            id="cash-proof-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleCashConfirmationUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="cash-proof-upload"
                            className="flex flex-col items-center justify-center gap-3 h-32 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white cursor-pointer transition-all hover:border-[#10B981] hover:bg-[#F8FAFB] group"
                          >
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2 group-hover:text-[#10B981] transition-colors" />
                              <p className="text-sm font-medium text-[#64748B] group-hover:text-[#10B981] transition-colors">
                                Tap to Upload
                              </p>
                              <p className="text-xs text-[#64748B] mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Secure Note */}
                    <div
                      className="bg-[#F8FAFB] rounded-xl p-3 border-l-4 border-l-[#10B981]"
                      style={{ borderLeftColor: "#10B981" }}
                    >
                      <div className="flex items-start gap-2">
                        <Shield
                          className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0"
                          style={{ color: "#10B981" }}
                        />
                        <div>
                          <p className="text-sm font-medium text-[#1A2B4F] mb-1">
                            Secure Transaction
                          </p>
                          <div className="text-xs text-[#64748B] space-y-0.5">
                            <p>• Ensure the receipt is clear and readable</p>
                            <p>• Verify all payment details are visible</p>
                            <p>• Keep the original receipt for your records</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons at Bottom - Same Row */}
          <div className="p-6 border-t border-[#E5E7EB] bg-white shrink-0">
            <div className="flex gap-3">
              <button
                onClick={() =>
                  handleCancelWithConfirmation(() => setReceiptModalOpen(false))
                }
                className="flex-1 h-11 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              {cashTab === "receipt" ? (
                <button
                  onClick={downloadReceipt}
                  className="flex-1 h-11 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#0DA271] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!cashConfirmation) {
                      toast.error("Please upload proof of payment");
                      return;
                    }

                    // Show success message
                    toast.success("Payment proof submitted successfully!");

                    // Close modal
                    setReceiptModalOpen(false);
                  }}
                  disabled={!cashConfirmation}
                  className="flex-1 h-11 px-4 rounded-xl bg-[#10B981] text-white font-medium hover:bg-[#0DA271] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#10B981" }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GCash Payment Modal */}
      <Dialog
        open={gcashModalOpen}
        onOpenChange={(open) => {
          if (!open && proofOfPayment) {
            // If trying to close with uploaded file, show confirmation
            handleCancelWithConfirmation(() => setGcashModalOpen(false));
          } else {
            // Otherwise close directly
            setGcashModalOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col">
          {/* Modern GCash Header */}
          <div className="bg-white p-6 text-[#1A2B4F] relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-16 h-15 rounded-xl flex items-center justify-center">
                <img
                  src="/gcash_logo.png"
                  alt="GCash Logo"
                  className="w-16 h-13 object-contain"
                />
              </div>
              <div>
                <DialogTitle className="text-[#1A2B4F] text-xl font-bold">
                  GCash Payment
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  Fast and secure mobile payment
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div
            className="bg-[#0009ff] flex-1 overflow-y-auto p-8"
            style={{ backgroundColor: "#0009ff" }}
          >
            {/* White Background Container */}
            <div className="bg-white rounded-2xl">
              <div className="p-4 space-y-4">
                {/* GCash Logo Text - Centered */}
                <div className="flex flex-col items-center justify-center pt-4 pb-1 space-y-2">
                  <img
                    src="/gcash_logotext.png"
                    alt="GCash"
                    className="h-14 object-contain"
                  />
                  <p className="text-sm text-[#64748B]">
                    Cashless mobile payment
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <div className="flex gap-2 bg-[#F8FAFB] p-1 rounded-xl max-w-xs mx-auto">
                  <button
                    onClick={() => setPaymentMethod("qr")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === "qr"
                        ? "bg-white text-[#0009ff] shadow-sm"
                        : "text-[#64748B] hover:text-[#1A2B4F]"
                    }`}
                    style={paymentMethod === "qr" ? { color: "#0009ff" } : {}}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QR Code</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("manual")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === "manual"
                        ? "bg-white text-[#0009ff] shadow-sm"
                        : "text-[#64748B] hover:text-[#1A2B4F]"
                    }`}
                    style={
                      paymentMethod === "manual" ? { color: "#0009ff" } : {}
                    }
                  >
                    <Keyboard className="w-5 h-5" />
                    <span>Manual</span>
                  </button>
                </div>

                {/* QR Code Section */}
                {paymentMethod === "qr" && (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-2xl border-2 border-[#E5E7EB] shadow-sm">
                      {paymentSettings.gcashQrCode ? (
                        <div className="w-48 h-48 rounded-xl overflow-hidden">
                          <img
                            src={paymentSettings.gcashQrCode}
                            alt="GCash QR Code"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-[#F8FAFB] rounded-xl flex items-center justify-center border-2 border-dashed border-[#E5E7EB]">
                          <div className="text-center">
                            <Smartphone className="w-12 h-12 text-[#64748B] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[#64748B]">
                              GCash QR
                            </p>
                            <p className="text-xs text-[#64748B] mt-1">
                              Scan to Pay
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
                    <span className="text-sm text-[#64748B]">Account Name</span>
                    <span className="text-sm font-semibold text-[#1A2B4F]">
                      {paymentSettings.accountName || "4B'S TRAVEL AND TOURS"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
                    <span className="text-sm text-[#64748B]">GCash Number</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1A2B4F]">
                        {paymentSettings.gcashMobile}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(paymentSettings.gcashMobile)
                        }
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] hover:bg-[#0A7AFF] hover:border-[#0A7AFF] hover:text-white transition-all flex items-center justify-center group"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#64748B] group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#1A2B4F]">
                      Amount to Pay
                    </span>
                    <span className="text-lg font-bold text-[#10B981]">
                      {paymentType === "Partial Payment"
                        ? `₱${partialAmountNum.toLocaleString()}`
                        : paymentType === "Full Payment"
                        ? `₱${balance.toLocaleString()}`
                        : booking.amount}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-[#F8FAFB] border border-[#E5E7EB] rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-[#1A2B4F] mb-3">
                    How to Pay:
                  </h4>
                  {paymentMethod === "qr" ? (
                    <ol className="text-sm text-[#64748B] space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          1
                        </span>
                        Open your GCash app
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          2
                        </span>
                        Tap the QR Code icon
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          3
                        </span>
                        Scan the QR code above or save the QR code image then
                        upload the image to QR Reader
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          4
                        </span>
                        Verify the recipient then input the exact amount
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          5
                        </span>
                        Complete the transaction
                      </li>
                    </ol>
                  ) : (
                    <ol className="text-sm text-[#64748B] space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          1
                        </span>
                        Open GCash app
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          2
                        </span>
                        Tap "Send Money"
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          3
                        </span>
                        Enter the mobile number above
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          4
                        </span>
                        Verify the recipient then input the exact amount
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-[#E5E7EB] text-[#64748B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          5
                        </span>
                        Complete the transaction
                      </li>
                    </ol>
                  )}
                </div>

                {/* Secure Note */}
                <div
                  className="bg-[#F8FAFB] rounded-xl p-3 border-l-4 border-l-[#0009ff]"
                  style={{ borderLeftColor: "#0009ff" }}
                >
                  <div className="flex items-start gap-2">
                    <Shield
                      className="w-4 h-4 text-[#0009ff] mt-0.5 shrink-0"
                      style={{ color: "#0009ff" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1A2B4F] mb-1">
                        Secure Transaction
                      </p>
                      <div className="text-xs text-[#64748B] space-y-0.5">
                        <p>
                          • Verify{" "}
                          <strong>
                            {paymentSettings.accountName ||
                              "4B'S TRAVEL AND TOURS"}
                          </strong>{" "}
                          as recipient
                        </p>
                        <p>• Double-check payment amount</p>
                        <p>
                          • Download or take a screenshot of the transaction
                          receipt
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Section with Smart Preview */}
                <div className="space-y-3">
                  <Label
                    htmlFor="proof-upload"
                    className="text-[#1A2B4F] font-semibold block"
                  >
                    Upload Proof of Payment *
                  </Label>

                  {proofPreview ? (
                    <div className="space-y-3">
                      <div className="relative border-2 border-[#E5E7EB] rounded-xl overflow-hidden group">
                        <img
                          src={proofPreview}
                          alt="Transaction screenshot"
                          className="w-full max-h-96 object-contain bg-[#F8FAFB] mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label
                            htmlFor="change-proof"
                            className="cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all">
                              <Pen
                                className="w-4 h-4 text-[#0009ff]"
                                style={{ color: "#0009ff" }}
                              />
                            </div>
                          </label>
                          <button
                            onClick={() => {
                              setProofOfPayment(null);
                              setProofPreview("");
                            }}
                            className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all"
                          >
                            <X className="w-4 h-4 text-[#FF6B6B]" />
                          </button>
                        </div>
                      </div>
                      <Input
                        id="change-proof"
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 text-sm text-[#10B981] bg-[#10B981]/10 rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Proof of Payment uploaded successfully</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="proof-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="proof-upload"
                        className="flex flex-col items-center justify-center gap-3 h-32 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white cursor-pointer transition-all hover:border-[#0A7AFF] hover:bg-[#F8FAFB] group"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2 group-hover:text-[#0A7AFF] transition-colors" />
                          <p className="text-sm font-medium text-[#64748B] group-hover:text-[#0A7AFF] transition-colors">
                            Tap to Upload
                          </p>
                          <p className="text-xs text-[#64748B] mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Spacer for bottom buttons */}
                <div className="h-4"></div>
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div className="p-6 border-t border-[#E5E7EB] bg-white shrink-0">
            <div className="flex gap-3">
              <button
                onClick={() =>
                  handleCancelWithConfirmation(() => setGcashModalOpen(false))
                }
                className="flex-1 h-11 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!proofOfPayment) {
                    toast.error("Please upload proof of payment");
                    return;
                  }

                  // Launch confetti celebration
                  launchGCashConfetti();

                  // Show success message
                  toast.success("Payment proof submitted successfully!");

                  // Close modal after celebration
                  setTimeout(() => {
                    setGcashModalOpen(false);
                  }, 1000);
                }}
                disabled={!proofOfPayment}
                className="flex-1 h-11 px-4 rounded-xl bg-[#0009ff] text-white font-medium hover:bg-[#0057B8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0009ff" }}
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Modal */}
      <Dialog
        open={paymentDetailModalOpen}
        onOpenChange={setPaymentDetailModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0A7AFF]" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6 p-6">
              {/* Payment Header */}
              <div className="bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] rounded-xl p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedPayment.paymentType}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {new Date(selectedPayment.submittedAt).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Amount Paid</p>
                    <p className="text-2xl font-bold">
                      ₱{selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-[#64748B]">Payment ID</Label>
                    <p className="text-sm font-medium text-[#1A2B4F]">
                      {selectedPayment.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-[#64748B]">
                      Payment Type
                    </Label>
                    <p className="text-sm font-medium text-[#1A2B4F]">
                      {selectedPayment.paymentType}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-[#64748B]">
                      Mode of Payment
                    </Label>
                    <div className="flex items-center gap-2">
                      {selectedPayment.modeOfPayment === "Cash" ? (
                        <Banknote className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-[#0A7AFF]" />
                      )}
                      <p className="text-sm font-medium text-[#1A2B4F]">
                        {selectedPayment.modeOfPayment}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-[#64748B]">Status</Label>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <p className="text-sm font-medium text-[#10B981]">
                        Verified
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proof of Payment Section */}
              <UserPaymentSection
                booking={{
                  id: booking.id,
                  totalAmount: totalAmount,
                  totalPaid: totalPaid,
                  paymentStatus: paymentStatus,
                  paymentHistory: payments.map((payment) => ({
                    id: payment.id,
                    paymentType:
                      payment.type === "FULL"
                        ? "Full Payment"
                        : "Partial Payment",
                    amount: parseFloat(payment.amount),
                    modeOfPayment:
                      payment.method === "GCASH" ? "Gcash" : "Cash",
                    proofOfPayment: payment.proofImage
                      ? `data:${
                          payment.proofMimeType || "image/png"
                        };base64,${btoa(
                          String.fromCharCode(
                            ...new Uint8Array(payment.proofImage.data)
                          )
                        )}`
                      : undefined,
                    submittedAt: payment.createdAt,
                    status: payment.status?.toLowerCase(),
                    transactionId: payment.transactionId,
                  })),
                }}
              />

              {/* Transaction Timeline */}
              <div className="bg-[#F8FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <h4 className="text-sm font-medium text-[#1A2B4F] mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0A7AFF]" />
                  Transaction Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A2B4F]">
                        Payment Submitted
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(
                          selectedPayment.submittedAt
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A2B4F]">
                        Payment Verified
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(
                          selectedPayment.submittedAt
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={showCancelConfirmation}
        onOpenChange={setShowCancelConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-[#1A2B4F]">
              <AlertCircle className="w-5 h-5 text-[#FF6B6B]" />
              Cancel Payment Process?
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              You have an ongoing payment process with uploaded documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-2">
            <div className="bg-[#FFF3F3] border border-[#FFE0E0] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6B6B] flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[#1A2B4F]">
                    Important Notice
                  </h4>
                  <div className="text-xs text-[#64748B] space-y-1">
                    <p>• Uploaded proof of payment will be removed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Files Preview in Confirmation */}
            {(proofPreview || cashConfirmationPreview) && (
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <h5 className="text-sm font-medium text-[#1A2B4F] mb-2">
                  Files to be removed:
                </h5>
                <div className="space-y-2">
                  {proofPreview && (
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <div className="w-2 h-2 bg-[#FF6B6B] rounded-full"></div>
                      <span>GCash Proof of Payment</span>
                    </div>
                  )}
                  {cashConfirmationPreview && (
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <div className="w-2 h-2 bg-[#FF6B6B] rounded-full"></div>
                      <span>Cash Payment Confirmation</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-4">
            <button
              onClick={handleCancelCancellation}
              className="flex-1 h-11 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F8FAFB] transition-all"
            >
              Continue Payment
            </button>
            <button
              onClick={handleConfirmedCancel}
              className="flex-1 h-11 px-4 rounded-xl bg-[#FF6B6B] text-white font-medium hover:bg-[#FF5252] transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Yes, Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <FAQAssistant />
    </div>
  );
}
