// components/UserPaymentSection.tsx
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
} from "lucide-react";
import { useState } from "react";

export interface UserPaymentSubmission {
  id: string;
  paymentType: string;
  amount: number;
  modeOfPayment: string;
  proofOfPayment?: string;
  submittedAt: string;
  status?: string;
  transactionId?: string;
}

interface UserPaymentSectionProps {
  booking: {
    id: string;
    totalAmount: number;
    totalPaid: number;
    paymentStatus: string;
    paymentHistory?: UserPaymentSubmission[];
  };
}

export function UserPaymentSection({ booking }: UserPaymentSectionProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<UserPaymentSubmission | null>(null);
  const [paymentDetailModalOpen, setPaymentDetailModalOpen] = useState(false);

  const {
    totalAmount,
    totalPaid,
    paymentStatus,
    paymentHistory = [],
  } = booking;
  const balance = totalAmount - totalPaid;
  const progressPercent =
    totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const paymentSectionState =
    paymentStatus === "Paid"
      ? "fullyPaid"
      : paymentStatus === "Partial"
      ? "partial"
      : "unpaid";

  const handlePaymentItemClick = (payment: UserPaymentSubmission) => {
    setSelectedPayment(payment);
    setPaymentDetailModalOpen(true);
  };

  const handleDownloadProof = (payment: UserPaymentSubmission) => {
    if (payment.proofOfPayment) {
      const link = document.createElement("a");
      link.href = payment.proofOfPayment;
      link.download = `payment-proof-${payment.id}.png`;
      link.click();
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return CheckCircle2;
      case "rejected":
        return Shield;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "text-[#10B981] bg-[#10B981]/10";
      case "rejected":
        return "text-[#EF4444] bg-[#EF4444]/10";
      default:
        return "text-[#FFB84D] bg-[#FFB84D]/10";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <>
      {/* Payment Information Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden">
        <div className="relative p-6 border-b border-[#E5E7EB]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A2B4F] text-lg">
                  Your Payment Information
                </h3>
                <p className="text-sm text-[#64748B]">
                  View your payment progress and history
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-gradient-to-br from-[#F8FAFB] to-[#F1F5F9] rounded-2xl p-5 border border-[#E5E7EB]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">
                  Total Package Cost
                </span>
                <span className="font-bold text-[#1A2B4F] text-lg">
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B]">Amount Paid</span>
                <span className="font-bold text-[#10B981] text-lg">
                  ₱{totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent" />

              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      balance > 0
                        ? "bg-[#EF4444] animate-pulse"
                        : "bg-[#10B981]"
                    }`}
                  />
                  <span className="text-sm font-medium text-[#1A2B4F]">
                    {balance > 0 ? "Outstanding Balance" : "Fully Paid"}
                  </span>
                </div>
                <span
                  className={`font-bold text-lg ${
                    balance > 0 ? "text-[#EF4444]" : "text-[#10B981]"
                  }`}
                >
                  ₱{balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#64748B]">Payment Progress</span>
                <span className="text-xs font-medium text-[#1A2B4F]">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#64748B]" />
                  <h4 className="font-semibold text-[#1A2B4F]">
                    Payment History
                  </h4>
                </div>
                <span className="text-xs text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded-full">
                  {paymentHistory.length} transaction
                  {paymentHistory.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {paymentHistory.map((payment, index) => {
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
                              payment.modeOfPayment === "Gcash"
                                ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                                : "bg-[#10B981]/10 text-[#10B981]"
                            }`}
                          >
                            {payment.modeOfPayment === "Gcash" ? (
                              <Smartphone className="w-5 h-5" />
                            ) : (
                              <Banknote className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A2B4F]">
                              {payment.paymentType} #{index + 1}
                            </p>
                            <p className="text-xs text-[#94A3B8]">
                              {new Date(payment.submittedAt).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-[#10B981]">
                              ₱{payment.amount.toLocaleString()}
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
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-50" />
              <h4 className="text-lg font-semibold text-[#1A2B4F] mb-2">
                No Payment History
              </h4>
              <p className="text-sm text-[#64748B]">
                No payments have been made for this booking yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal - User View Only */}
      {selectedPayment && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity ${
            paymentDetailModalOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }`}
          onClick={() => setPaymentDetailModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative p-6 border-b border-[#E5E7EB] shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 via-[#14B8A6]/5 to-[#0A7AFF]/5" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#14B8A6] flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A2B4F]">
                      Payment Details
                    </h3>
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
                      {selectedPayment.paymentType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Amount</p>
                    <p className="text-lg font-bold text-[#10B981]">
                      ₱{selectedPayment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">
                      Payment Method
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedPayment.modeOfPayment === "Gcash"
                            ? "bg-[#0A7AFF]/10 text-[#0A7AFF]"
                            : "bg-[#10B981]/10 text-[#10B981]"
                        }`}
                      >
                        {selectedPayment.modeOfPayment === "Gcash" ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Banknote className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#1A2B4F]">
                        {selectedPayment.modeOfPayment}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Submitted On</p>
                    <p className="text-sm font-medium text-[#1A2B4F]">
                      {new Date(selectedPayment.submittedAt).toLocaleDateString(
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
                    <p className="text-xs text-[#64748B] mb-1">
                      Transaction ID
                    </p>
                    <p className="text-sm font-medium text-[#1A2B4F] font-mono">
                      {selectedPayment.transactionId}
                    </p>
                  </div>
                )}

                {/* Proof of Payment */}
                {selectedPayment.proofOfPayment && (
                  <div>
                    <p className="text-xs text-[#64748B] mb-2">
                      Proof of Payment
                    </p>
                    <div className="relative rounded-lg overflow-hidden border border-[#E5E7EB]">
                      <img
                        src={selectedPayment.proofOfPayment}
                        alt="Payment proof"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <button
                          onClick={() => handleDownloadProof(selectedPayment)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white text-[#1A2B4F] text-sm font-medium rounded-lg hover:bg-[#F8FAFB]"
                        >
                          <Download className="w-4 h-4" />
                          Download Proof
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
      )}
    </>
  );
}
