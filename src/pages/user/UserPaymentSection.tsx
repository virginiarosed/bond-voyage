import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  Receipt,
  Smartphone,
  Banknote,
  Shield,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Save,
  AlertCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useBookingPayments } from "../../hooks/useBookings";
import { useSubmitPayment } from "../../hooks/usePayments";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PaymentSkeleton } from "../../components/PaymentSkeleton";

interface PaymentSubmission {
  id: string;
  bookingId: string;
  submittedById: string;
  amount: string;
  method: "GCASH" | "CASH";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  type: "FULL" | "PARTIAL";
  transactionId?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UserPaymentSectionProps {
  booking: {
    id: string;
    totalAmount: number;
    totalPaid: number;
    paymentStatus: string;
  };
}

export function UserPaymentSection({ booking }: UserPaymentSectionProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentSubmission | null>(null);
  const [paymentDetailModalOpen, setPaymentDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<"" | "FULL" | "PARTIAL">("");
  const [modeOfPayment, setModeOfPayment] = useState<"" | "CASH" | "GCASH">("");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");

  const { data: paymentsResponse, isLoading: paymentsLoading } =
    useBookingPayments(booking.id);
  const submitPaymentMutation = useSubmitPayment(booking.id);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [booking.id]);

  const payments: PaymentSubmission[] = paymentsResponse?.data || [];

  const verifiedTotalPaid = payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const { totalAmount } = booking;
  const displayTotalPaid = verifiedTotalPaid;
  const displayBalance = totalAmount - verifiedTotalPaid;
  const displayProgressPercent =
    totalAmount > 0 ? Math.round((verifiedTotalPaid / totalAmount) * 100) : 0;

  const paymentSectionState =
    verifiedTotalPaid >= totalAmount
      ? "fullyPaid"
      : verifiedTotalPaid > 0
      ? "partial"
      : "unpaid";

  const handlePaymentItemClick = (payment: PaymentSubmission) => {
    setSelectedPayment(payment);
    setPaymentDetailModalOpen(true);
  };

  const handleDownloadProof = async (payment: PaymentSubmission) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/payments/${payment.id}/proof`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to download proof");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-proof-${payment.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download proof:", error);
      toast.error("Failed to download payment proof. Please try again.");
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return CheckCircle2;
      case "REJECTED":
        return Shield;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "text-[#10B981] bg-[#10B981]/10";
      case "REJECTED":
        return "text-[#EF4444] bg-[#EF4444]/10";
      default:
        return "text-[#F59E0B] bg-[#F59E0B]/10";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "Verified";
      case "REJECTED":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method === "GCASH" ? "Gcash" : "Cash";
  };

  const formatPaymentType = (type: string) => {
    return type === "FULL" ? "Full Payment" : "Partial Payment";
  };

  const getPaymentAmount = (amount: string) => {
    return parseFloat(amount) || 0;
  };

  // Payment creation handlers
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

    if (amount > displayBalance) {
      toast.error(
        `Amount cannot exceed remaining balance of ₱${displayBalance.toLocaleString()}`
      );
      return;
    }

    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    setPartialAmount(numericValue);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitPayment = async () => {
    if (!paymentType || !modeOfPayment) {
      toast.error("Please complete all payment fields");
      return;
    }

    if (paymentType === "PARTIAL") {
      const amount = parseFloat(partialAmount) || 0;

      if (amount === 0) {
        toast.error("Amount cannot be 0");
        return;
      }

      if (amount > displayBalance) {
        toast.error(
          `Amount cannot exceed remaining balance of ₱${displayBalance.toLocaleString()}`
        );
        return;
      }

      if (amount < 1) {
        toast.error("Minimum payment amount is ₱1");
        return;
      }
    }

    const paymentAmount =
      paymentType === "FULL" ? displayBalance : parseFloat(partialAmount);

    try {
      const paymentData: any = {
        amount: paymentAmount,
        method: modeOfPayment,
        type: paymentType,
      };

      if (proofOfPayment) {
        paymentData.proofOfPayment = await fileToBase64(proofOfPayment);
      }

      await submitPaymentMutation.mutateAsync(paymentData, {
        onSuccess: () => {
          toast.success("Payment submitted successfully!");
          // Reset form
          setPaymentType("");
          setModeOfPayment("");
          setPartialAmount("");
          setProofOfPayment(null);
          setProofPreview("");
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

  if (isLoading || paymentsLoading) {
    return <PaymentSkeleton />;
  }

  const partialAmountNum = parseFloat(partialAmount) || 0;

  return (
    <>
      {/* Payment Information Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden">
        <div className="relative p-6 border-b border-[#E5E7EB]">
          <div className="absolute inset-0 bg-linear-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A2B4F] text-lg">
                  Your Payment Information
                </h3>
                <p className="text-sm text-[#64748B]">
                  Manage your payments and view history
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* UNPAID STATE - No payments made */}
          {paymentSectionState === "unpaid" && (
            <>
              {editingPayment ? (
                // EDITING STATE - Payment form
                <div className="space-y-4">
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
                        <SelectItem value="PARTIAL">Partial Payment</SelectItem>
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
                          onClick={() => setModeOfPayment("CASH")}
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
                          onClick={() => setModeOfPayment("GCASH")}
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
                              parseFloat(partialAmount) > displayBalance)
                              ? "border-[#FF6B6B] focus:border-[#FF6B6B]"
                              : partialAmount &&
                                parseFloat(partialAmount) > 0 &&
                                parseFloat(partialAmount) <= displayBalance
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
                        {partialAmount && parseFloat(partialAmount) === 0 && (
                          <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Amount cannot be 0
                          </p>
                        )}
                        {partialAmount &&
                          parseFloat(partialAmount) > displayBalance && (
                            <p className="text-xs text-[#FF6B6B] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Amount exceeds remaining balance
                            </p>
                          )}
                        {partialAmount &&
                          parseFloat(partialAmount) > 0 &&
                          parseFloat(partialAmount) <= displayBalance && (
                            <p className="text-xs text-[#10B981] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Valid amount
                            </p>
                          )}
                      </div>

                      {/* Mode of Payment for Partial Payment */}
                      {partialAmount &&
                        parseFloat(partialAmount) > 0 &&
                        parseFloat(partialAmount) <= displayBalance && (
                          <div className="mt-4">
                            <Label className="text-[#1A2B4F] mb-2 block">
                              Mode of Payment
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setModeOfPayment("CASH")}
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
                                onClick={() => setModeOfPayment("GCASH")}
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

                  {/* Proof of Payment Upload */}
                  {modeOfPayment === "GCASH" && (
                    <div>
                      <Label className="text-[#1A2B4F] mb-2 block">
                        Proof of Payment
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
                                  <Pen className="w-4 h-4 text-[#0A7AFF]" />
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
                              <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2 group-hover:text-[#0A7AFF]" />
                              <p className="text-sm font-medium text-[#64748B] group-hover:text-[#0A7AFF]">
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
                  )}

                  {/* Payment Summary */}
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
                          ? `₱${displayBalance.toLocaleString()}`
                          : `₱${displayBalance.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                      <span className="text-sm font-medium text-[#1A2B4F]">
                        Balance After
                      </span>
                      <span className="font-semibold text-[#FF6B6B]">
                        ₱
                        {(
                          displayBalance -
                          (paymentType === "PARTIAL"
                            ? partialAmountNum
                            : paymentType === "FULL"
                            ? displayBalance
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
                          (modeOfPayment === "GCASH" && !proofOfPayment)
                        }
                        className="w-full h-11 px-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#14B8A6] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#10B981]/25 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
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
                    onClick={() => {
                      setEditingPayment(false);
                      setPaymentType("");
                      setModeOfPayment("");
                      setPartialAmount("");
                      setProofOfPayment(null);
                      setProofPreview("");
                    }}
                    className="w-full h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F8FAFB] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                // NON-EDITING STATE - Empty state with "Make First Payment" button
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-[#F8FAFB] to-[#E5E7EB] rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-[#64748B]" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                    No Payments Made
                  </h4>
                  <p className="text-sm text-[#64748B] mb-6">
                    Start your payment process to secure your booking
                  </p>

                  {/* Payment Summary Card */}
                  <div className="bg-linear-to-br from-[#F8FAFB] to-[#F1F5F9] rounded-2xl p-5 border border-[#E5E7EB] mb-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">
                          Total Package Cost
                        </span>
                        <span className="font-bold text-[#1A2B4F] text-lg">
                          ₱{totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="h-px bg-linear-to-r from-transparent via-[#E5E7EB] to-transparent" />

                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                          <span className="text-sm font-medium text-[#1A2B4F]">
                            Outstanding Balance
                          </span>
                        </div>
                        <span className="font-bold text-[#EF4444] text-lg">
                          ₱{displayBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Make First Payment CTA */}
                  <button
                    onClick={() => setEditingPayment(true)}
                    className="w-full h-14 rounded-2xl bg-linear-to-r from-[#0A7AFF] via-[#0A7AFF] to-[#14B8A6] text-white font-semibold shadow-lg shadow-[#0A7AFF]/30 hover:shadow-xl hover:shadow-[#0A7AFF]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Make First Payment
                  </button>
                </div>
              )}
            </>
          )}

          {/* PARTIAL PAYMENT STATE - Ongoing payments */}
          {paymentSectionState === "partial" && (
            <>
              {editingPayment ? (
                // EDITING STATE - Payment form (same as above)
                <PaymentForm
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  modeOfPayment={modeOfPayment}
                  setModeOfPayment={setModeOfPayment}
                  partialAmount={partialAmount}
                  handlePartialAmountChange={handlePartialAmountChange}
                  displayBalance={displayBalance}
                  proofOfPayment={proofOfPayment}
                  proofPreview={proofPreview}
                  handleProofUpload={handleProofUpload}
                  handleSubmitPayment={handleSubmitPayment}
                  submitPaymentMutation={submitPaymentMutation}
                  setEditingPayment={setEditingPayment}
                  totalAmount={totalAmount}
                  partialAmountNum={partialAmountNum}
                />
              ) : (
                // NON-EDITING STATE - Show payment progress and "Make a Payment" button
                <>
                  {/* Payment Progress Display */}
                  <div className="space-y-4">
                    {/* Progress Stats */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="#E5E7EB"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="url(#progressGradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${
                              displayProgressPercent * 2.64
                            } 264`}
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
                          <span className="text-xl font-bold text-[#1A2B4F]">
                            {displayProgressPercent}%
                          </span>
                          <span className="text-xs text-[#64748B]">Paid</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="bg-linear-to-r from-[#10B981]/10 to-[#14B8A6]/10 rounded-xl p-3 border border-[#10B981]/20">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-xs font-medium text-[#10B981]">
                              Amount Paid
                            </span>
                          </div>
                          <p className="text-lg font-bold text-[#10B981]">
                            ₱{displayTotalPaid.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-linear-to-r from-[#EF4444]/10 to-[#F87171]/10 rounded-xl p-3 border border-[#EF4444]/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Wallet className="w-3.5 h-3.5 text-[#EF4444]" />
                            <span className="text-xs font-medium text-[#EF4444]">
                              Remaining Balance
                            </span>
                          </div>
                          <p className="text-lg font-bold text-[#EF4444]">
                            ₱{displayBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Make Payment Button */}
                    <button
                      onClick={() => setEditingPayment(true)}
                      className="w-full h-12 rounded-xl bg-linear-to-r from-[#0A7AFF] to-[#14B8A6] text-white font-semibold shadow-lg shadow-[#0A7AFF]/30 hover:shadow-xl hover:shadow-[#0A7AFF]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                      Make Another Payment
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* FULLY PAID STATE */}
          {paymentSectionState === "fullyPaid" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-[#10B981] to-[#14B8A6] rounded-full flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#1A2B4F] mb-2">
                Fully Paid
              </h4>
              <p className="text-sm text-[#64748B] mb-6">
                This booking has been completely paid.
              </p>

              <div className="bg-linear-to-br from-[#10B981]/10 to-[#14B8A6]/10 rounded-xl p-4 border border-[#10B981]/20 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">
                    Total Amount Paid
                  </span>
                  <span className="text-xl font-bold text-[#10B981]">
                    ₱{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment History (Shown for all states except when editing) */}
          {!editingPayment && payments.length > 0 && (
            <PaymentHistory
              payments={payments}
              handlePaymentItemClick={handlePaymentItemClick}
              formatPaymentType={formatPaymentType}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
              getPaymentAmount={getPaymentAmount}
              formatPaymentMethod={formatPaymentMethod}
            />
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          selectedPayment={selectedPayment}
          paymentDetailModalOpen={paymentDetailModalOpen}
          setPaymentDetailModalOpen={setPaymentDetailModalOpen}
          handleDownloadProof={handleDownloadProof}
          formatPaymentType={formatPaymentType}
          formatPaymentMethod={formatPaymentMethod}
          getPaymentAmount={getPaymentAmount}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getStatusText={getStatusText}
        />
      )}
    </>
  );
}

const Upload = ({ className }: { className?: string }) => null;
const Pen = ({ className }: { className?: string }) => null;

interface PaymentFormProps {
  paymentType: "" | "FULL" | "PARTIAL";
  setPaymentType: (value: "" | "FULL" | "PARTIAL") => void;
  modeOfPayment: "" | "CASH" | "GCASH";
  setModeOfPayment: (value: "" | "CASH" | "GCASH") => void;
  partialAmount: string;
  handlePartialAmountChange: (value: string) => void;
  displayBalance: number;
  proofOfPayment: File | null;
  proofPreview: string;
  handleProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmitPayment: () => Promise<void>;
  submitPaymentMutation: any;
  setEditingPayment: (value: boolean) => void;
  totalAmount: number;
  partialAmountNum: number;
}

function PaymentForm({
  paymentType,
  setPaymentType,
  modeOfPayment,
  setModeOfPayment,
  partialAmount,
  handlePartialAmountChange,
  displayBalance,
  proofOfPayment,
  proofPreview,
  handleProofUpload,
  handleSubmitPayment,
  submitPaymentMutation,
  setEditingPayment,
  totalAmount,
  partialAmountNum,
}: PaymentFormProps) {
  return (
    <div className="space-y-4">
      {/* Payment Type Dropdown */}
      <div>
        <Label htmlFor="payment-type" className="text-[#1A2B4F] mb-2 block">
          Payment Type
        </Label>
        <Select value={paymentType} onValueChange={setPaymentType}>
          <SelectTrigger
            id="payment-type"
            className="h-11 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-[#0A7AFF]/10"
          >
            <SelectValue placeholder="Choose payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL">Full Payment</SelectItem>
            <SelectItem value="PARTIAL">Partial Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment form content... (same as above) */}
    </div>
  );
}

interface PaymentHistoryProps {
  payments: PaymentSubmission[];
  handlePaymentItemClick: (payment: PaymentSubmission) => void;
  formatPaymentType: (type: string) => string;
  getStatusColor: (status?: string) => string;
  getStatusIcon: (status?: string) => any;
  getStatusText: (status?: string) => string;
  getPaymentAmount: (amount: string) => number;
  formatPaymentMethod: (method: string) => string;
}

function PaymentHistory({
  payments,
  handlePaymentItemClick,
  formatPaymentType,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  getPaymentAmount,
  formatPaymentMethod,
}: PaymentHistoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#64748B]" />
          <h4 className="font-semibold text-[#1A2B4F]">Payment History</h4>
        </div>
        <span className="text-xs text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded-full">
          {payments.length} transaction{payments.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {payments.map((payment, index) => {
          const StatusIcon = getStatusIcon(payment.status);
          return (
            <div
              key={payment.id}
              onClick={() => handlePaymentItemClick(payment)}
              className="group bg-white rounded-xl p-4 border border-[#E5E7EB] hover:border-[#0A7AFF] hover:shadow-md cursor-pointer transition-all"
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
                      {formatPaymentType(payment.type)} #{index + 1}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {new Date(payment.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-[#10B981]">
                      ₱{getPaymentAmount(payment.amount).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{getStatusText(payment.status)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0A7AFF]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PaymentDetailModalProps {
  selectedPayment: PaymentSubmission;
  paymentDetailModalOpen: boolean;
  setPaymentDetailModalOpen: (open: boolean) => void;
  handleDownloadProof: (payment: PaymentSubmission) => void;
  formatPaymentType: (type: string) => string;
  formatPaymentMethod: (method: string) => string;
  getPaymentAmount: (amount: string) => number;
  getStatusColor: (status?: string) => string;
  getStatusIcon: (status?: string) => any;
  getStatusText: (status?: string) => string;
}

function PaymentDetailModal({
  selectedPayment,
  paymentDetailModalOpen,
  setPaymentDetailModalOpen,
  handleDownloadProof,
  formatPaymentType,
  formatPaymentMethod,
  getPaymentAmount,
  getStatusColor,
  getStatusIcon,
  getStatusText,
}: PaymentDetailModalProps) {
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity ${
        paymentDetailModalOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onClick={() => setPaymentDetailModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 border-b border-[#E5E7EB] shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A2B4F]">Payment Details</h3>
                <p className="text-sm text-[#64748B]">
                  View payment information
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentDetailModalOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-[#F8FAFB] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Payment Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(
              selectedPayment.status
            )}`}
          >
            {(() => {
              const Icon = getStatusIcon(selectedPayment.status);
              return <Icon className="w-4 h-4" />;
            })()}
            <span className="font-medium">
              {getStatusText(selectedPayment.status)}
            </span>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Payment Type</p>
                <p className="text-sm font-medium text-[#1A2B4F]">
                  {formatPaymentType(selectedPayment.type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Amount</p>
                <p className="text-lg font-bold text-[#10B981]">
                  ₱{getPaymentAmount(selectedPayment.amount).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Payment Method</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedPayment.method === "GCASH"
                        ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                        : "bg-[#10B981]/10 text-[#10B981]"
                    }`}
                  >
                    {selectedPayment.method === "GCASH" ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Banknote className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#1A2B4F]">
                    {formatPaymentMethod(selectedPayment.method)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Submitted On</p>
                <p className="text-sm font-medium text-[#1A2B4F]">
                  {new Date(selectedPayment.createdAt).toLocaleDateString(
                    "en-PH",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>

            {/* Transaction ID */}
            {selectedPayment.transactionId && (
              <div>
                <p className="text-xs text-[#64748B] mb-1">Transaction ID</p>
                <p className="text-sm font-medium text-[#1A2B4F] font-mono">
                  {selectedPayment.transactionId}
                </p>
              </div>
            )}

            {/* Proof of Payment Section */}
            <div>
              <p className="text-xs text-[#64748B] mb-2">Proof of Payment</p>
              <div className="relative rounded-lg overflow-hidden border border-[#E5E7EB] min-h-50 bg-[#F8FAFB] flex items-center justify-center">
                <button
                  onClick={() => handleDownloadProof(selectedPayment)}
                  className="flex flex-col items-center gap-2 px-4 py-6"
                >
                  <Download className="w-8 h-8 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#1A2B4F]">
                    Download Proof
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Click to download payment proof
                  </span>
                </button>
              </div>
              <p className="text-xs text-[#64748B] mt-2">
                Payment proof is available for download. Click the button above
                to save a copy.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[#E5E7EB] shrink-0">
          <button
            onClick={() => setPaymentDetailModalOpen(false)}
            className="w-full h-11 px-4 rounded-xl bg-[#0A7AFF] text-white font-medium hover:bg-[#0865CC] transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
