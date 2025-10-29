"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  XCircle,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";
import { DialogTitle, DialogDescription } from "./ui/dialog";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/auth";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function SignUpModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignUpModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const { setIsAuthenticated } = useAuthStore();

  const [securityQuestion1, setSecurityQuestion1] = useState("");
  const [securityAnswer1, setSecurityAnswer1] = useState("");
  const [securityQuestion2, setSecurityQuestion2] = useState("");
  const [securityAnswer2, setSecurityAnswer2] = useState("");
  const [securityQuestion3, setSecurityQuestion3] = useState("");
  const [securityAnswer3, setSecurityAnswer3] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState<{
    type: "error" | "success";
    title: string;
    message: string;
  } | null>(null);

  const securityQuestions = [
    {
      value: "movie",
      label: "What was the first movie you watched in theater?",
    },
    { value: "friend", label: "What year did you meet your oldest friend?" },
    {
      value: "purchase",
      label: "What is the first thing you bought with your own money?",
    },
    { value: "toy", label: "What is the name of your favorite childhood toy?" },
    {
      value: "pet",
      label: "What is the name of your first pet that wasn't a dog or cat?",
    },
    {
      value: "book",
      label: "What was the title of the first book you ever read by yourself?",
    },
    {
      value: "character",
      label: "What is the name of the first fictional character you admired?",
    },
  ];

  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      number: /\d/.test(pass),
      lowercase: /[a-z]/.test(pass),
      uppercase: /[A-Z]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(password);
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const validateEmail = (value: string) => {
    if (!value) return "Please enter a valid email address";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const validateMobile = (value: string) => {
    if (!value) return "Mobile number is required";
    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(value))
      return "Invalid format. Please enter as 09*********";
    return "";
  };

  const validateBirthday = (value: string) => {
    if (!value) return "Birthday is required";
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      if (age - 1 < 15) return "You must be at least 15 years old";
    } else {
      if (age < 15) return "You must be at least 15 years old";
    }
    return "";
  };

  // Check if Step 1 form is valid
  const isStep1Valid = () => {
    return (
      firstName &&
      lastName &&
      email &&
      !validateEmail(email) &&
      mobile &&
      !validateMobile(mobile) &&
      birthday &&
      !validateBirthday(birthday) &&
      password &&
      allRequirementsMet &&
      passwordConfirmation &&
      password === passwordConfirmation
    );
  };

  // Check if Step 2 form is valid
  const isStep2Valid = () => {
    return (
      securityQuestion1 &&
      securityAnswer1 &&
      securityQuestion2 &&
      securityAnswer2 &&
      securityQuestion3 &&
      securityAnswer3 &&
      securityQuestion1 !== securityQuestion2 &&
      securityQuestion2 !== securityQuestion3 &&
      securityQuestion1 !== securityQuestion3
    );
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });

    const newErrors = { ...errors };

    switch (field) {
      case "email":
        newErrors.email = validateEmail(email);
        break;
      case "mobile":
        newErrors.mobile = validateMobile(mobile);
        break;
      case "birthday":
        newErrors.birthday = validateBirthday(birthday);
        break;
      case "password":
        if (!allRequirementsMet) {
          newErrors.password = "Password does not meet requirements";
        } else {
          delete newErrors.password;
        }
        break;
      case "passwordConfirmation":
        if (password !== passwordConfirmation) {
          newErrors.passwordConfirmation = "Passwords do not match";
        } else {
          delete newErrors.passwordConfirmation;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleNext = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName) newErrors.firstName = "First name is required";
    if (!lastName) newErrors.lastName = "Last name is required";

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const mobileError = validateMobile(mobile);
    if (mobileError) newErrors.mobile = mobileError;

    const birthdayError = validateBirthday(birthday);
    if (birthdayError) newErrors.birthday = birthdayError;

    if (!allRequirementsMet)
      newErrors.password = "Password does not meet requirements";
    if (password !== passwordConfirmation)
      newErrors.passwordConfirmation = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        birthday: true,
        password: true,
        passwordConfirmation: true,
      });
      setShowToast({
        type: "error",
        title: "Validation Error",
        message: "Please fix all errors before proceeding",
      });
      setTimeout(() => setShowToast(null), 4000);
      return;
    }

    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questions = [securityQuestion1, securityQuestion2, securityQuestion3];
    const uniqueQuestions = new Set(questions.filter((q) => q !== ""));

    if (uniqueQuestions.size !== 3) {
      setShowToast({
        type: "error",
        title: "Security Questions Error",
        message: "Please select three unique security questions",
      });
      setTimeout(() => setShowToast(null), 4000);
      return;
    }

    if (!securityAnswer1 || !securityAnswer2 || !securityAnswer3) {
      setShowToast({
        type: "error",
        title: "Security Questions Error",
        message: "Please answer all security questions",
      });
      setTimeout(() => setShowToast(null), 4000);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowToast({
        type: "success",
        title: "Account Created!",
        message: "Welcome to BondVoyage. Redirecting to your dashboard...",
      });

      setTimeout(() => {
        setShowToast(null);
        onClose();
        resetForm();
        setIsAuthenticated(true);
        navigate("/");
      }, 2000);
    }, 1500);
  };

  const resetForm = () => {
    setStep(1);
    setFirstName("");
    setLastName("");
    setEmail("");
    setMobile("");
    setBirthday("");
    setPassword("");
    setPasswordConfirmation("");
    setSecurityQuestion1("");
    setSecurityAnswer1("");
    setSecurityQuestion2("");
    setSecurityAnswer2("");
    setSecurityQuestion3("");
    setSecurityAnswer3("");
    setErrors({});
    setTouched({});
    setShowToast(null);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  }, [isOpen]);

  return (
    <>
      <style>{`
        @keyframes slideInTop {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideInTopSmall {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-toast { animation: slideInTop 300ms ease-out; }
        .animate-error { animation: slideInTopSmall 200ms ease-out; }
        
        /* Modern Normal Scrollbar Styles */
        .signup-modal-scroll::-webkit-scrollbar {
          width: 10px;
        }
        
        .signup-modal-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
          margin: 4px 0;
        }
        
        .signup-modal-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
          border: 2px solid #f1f5f9;
          transition: background 200ms ease;
        }
        
        .signup-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .signup-modal-scroll::-webkit-scrollbar-thumb:active {
          background: #64748b;
        }
        
        /* Firefox */
        .signup-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>

      <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />
          <DialogPrimitive.Content className="fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-[1200px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none gap-0 bg-white rounded-xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Left Column: Visual Hero */}
              <div className="relative hidden lg:block lg:w-[48%] overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1080&q=80"
                  alt="Travel Adventure"
                  className="w-full h-full object-cover brightness-75"
                />

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(10, 122, 255, 0.6) 0%, rgba(20, 184, 166, 0.8) 100%)",
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="max-w-[350px] text-white">
                    <div
                      className="mb-6 h-10 w-auto text-2xl font-bold"
                      style={{
                        filter: "drop-shadow(0 2px 16px rgba(0,0,0,0.3))",
                      }}
                    >
                      BondVoyage
                    </div>

                    <h2
                      className="mb-3 text-white"
                      style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        lineHeight: 1.2,
                        textShadow: "0 2px 16px rgba(0,0,0,0.3)",
                      }}
                    >
                      Start Your Journey
                    </h2>

                    <p
                      className="mb-6 text-white opacity-95"
                      style={{ fontSize: "16px" }}
                    >
                      Join thousands of travelers planning their dream
                      adventures.
                    </p>

                    <div className="flex flex-col gap-3">
                      {[
                        "AI-powered itinerary builder",
                        "Organize all your travel plans",
                        "Collaborate with travel companions",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                          <span className="text-white text-sm opacity-90">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sign Up Form */}
              <div className="flex-1 bg-white overflow-hidden flex flex-col relative min-w-0">
                <DialogPrimitive.Close className="absolute top-4 right-4 rounded-lg p-2 opacity-70 transition-all hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none text-[#64748B] hover:text-[#1A2B4F] hover:bg-[#F8FAFB] z-10">
                  <X className="w-5 h-5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto signup-modal-scroll">
                  <div className="p-6 md:p-10 max-w-[500px] mx-auto w-full">
                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                      <>
                        <div className="mb-8">
                          <div
                            className="text-[#0A7AFF] mb-2 uppercase tracking-wider"
                            style={{ fontSize: "12px", fontWeight: 600 }}
                          >
                            Sign Up
                          </div>
                          <DialogTitle asChild>
                            <h2
                              className="text-[#1A2B4F] mb-2"
                              style={{ fontSize: "28px", fontWeight: 700 }}
                            >
                              Create Your{" "}
                              <span
                                style={{
                                  background:
                                    "linear-gradient(135deg, #0A7AFF 0%, #14B8A6 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                }}
                              >
                                Account
                              </span>
                            </h2>
                          </DialogTitle>
                          <DialogDescription asChild>
                            <p
                              className="text-[#64748B]"
                              style={{ fontSize: "15px" }}
                            >
                              Start planning your next adventure today
                            </p>
                          </DialogDescription>
                        </div>

                        {showToast && (
                          <div
                            className={`mb-6 flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border-l-4 animate-toast ${
                              showToast.type === "error"
                                ? "border-[#FF6B6B]"
                                : "border-[#10B981]"
                            }`}
                          >
                            {showToast.type === "error" ? (
                              <XCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div
                                className="text-[#1A2B4F]"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                {showToast.title}
                              </div>
                              <div
                                className="text-[#64748B] mt-1"
                                style={{ fontSize: "13px" }}
                              >
                                {showToast.message}
                              </div>
                            </div>
                            <button
                              onClick={() => setShowToast(null)}
                              className="text-[#64748B] hover:text-[#1A2B4F] transition-colors flex-shrink-0"
                              style={{ fontSize: "20px" }}
                            >
                              ×
                            </button>
                          </div>
                        )}

                        <form className="space-y-5">
                          {/* Name Fields */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="firstName"
                                className="block text-[#1A2B4F] mb-2"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                First Name
                              </label>
                              <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onBlur={() => handleBlur("firstName")}
                                placeholder="John"
                                className={`w-full h-12 px-4 rounded-xl transition-all duration-200 outline-none ${
                                  touched.firstName && errors.firstName
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              {touched.firstName && errors.firstName && (
                                <div className="flex items-start gap-2 mt-2 animate-error">
                                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                  <span
                                    className="text-[#FF6B6B]"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {errors.firstName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="lastName"
                                className="block text-[#1A2B4F] mb-2"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                Last Name
                              </label>
                              <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onBlur={() => handleBlur("lastName")}
                                placeholder="Doe"
                                className={`w-full h-12 px-4 rounded-xl transition-all duration-200 outline-none ${
                                  touched.lastName && errors.lastName
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              {touched.lastName && errors.lastName && (
                                <div className="flex items-start gap-2 mt-2 animate-error">
                                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                  <span
                                    className="text-[#FF6B6B]"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {errors.lastName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Email Address
                            </label>
                            <div className="relative">
                              <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => handleBlur("email")}
                                placeholder="you@example.com"
                                className={`w-full h-12 px-4 rounded-xl transition-all duration-200 outline-none ${
                                  touched.email && errors.email
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : email && !errors.email
                                    ? "border-2 border-[#10B981] bg-white"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              {email && !errors.email && (
                                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10B981]" />
                              )}
                            </div>
                            {touched.email && errors.email && (
                              <div className="flex items-start gap-2 mt-2 animate-error">
                                <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                <span
                                  className="text-[#FF6B6B]"
                                  style={{ fontSize: "13px", fontWeight: 500 }}
                                >
                                  {errors.email}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Mobile and Birthday */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="mobile"
                                className="block text-[#1A2B4F] mb-2"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                Mobile Number
                              </label>
                              <input
                                id="mobile"
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                onBlur={() => handleBlur("mobile")}
                                placeholder="09*********"
                                className={`w-full h-12 px-4 rounded-xl transition-all duration-200 outline-none ${
                                  touched.mobile && errors.mobile
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              {touched.mobile && errors.mobile && (
                                <div className="flex items-start gap-2 mt-2 animate-error">
                                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                  <span
                                    className="text-[#FF6B6B]"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {errors.mobile}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="birthday"
                                className="block text-[#1A2B4F] mb-2"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                Birthday
                              </label>
                              <input
                                id="birthday"
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                onBlur={() => handleBlur("birthday")}
                                className={`w-full h-12 px-4 rounded-xl transition-all duration-200 outline-none ${
                                  touched.birthday && errors.birthday
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              {touched.birthday && errors.birthday && (
                                <div className="flex items-start gap-2 mt-2 animate-error">
                                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                  <span
                                    className="text-[#FF6B6B]"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {errors.birthday}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <label
                              htmlFor="password"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Password
                            </label>
                            <div className="relative">
                              <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() =>
                                  setShowPasswordRequirements(true)
                                }
                                onBlur={() => {
                                  setShowPasswordRequirements(false);
                                  handleBlur("password");
                                }}
                                placeholder="Enter your password"
                                className={`w-full h-12 px-4 pr-12 rounded-xl transition-all duration-200 outline-none ${
                                  touched.password && errors.password
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.08)] p-1.5 rounded-md transition-all"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {showPasswordRequirements && (
                              <div className="mt-3 p-3 bg-[#F8FAFB] rounded-lg">
                                <p
                                  className="text-[#1A2B4F] mb-2"
                                  style={{ fontSize: "13px", fontWeight: 600 }}
                                >
                                  Password must contain:
                                </p>
                                <ul className="space-y-1">
                                  {[
                                    {
                                      key: "length",
                                      label: "At least 8 characters length",
                                    },
                                    {
                                      key: "number",
                                      label: "At least 1 number (0-9)",
                                    },
                                    {
                                      key: "lowercase",
                                      label:
                                        "At least 1 lowercase letter (a-z)",
                                    },
                                    {
                                      key: "special",
                                      label:
                                        "At least 1 special symbol (!,$, etc.)",
                                    },
                                    {
                                      key: "uppercase",
                                      label:
                                        "At least 1 uppercase letter (A-Z)",
                                    },
                                  ].map(({ key, label }) => (
                                    <li
                                      key={key}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          passwordRequirements[
                                            key as keyof typeof passwordRequirements
                                          ]
                                            ? "bg-[#10B981]"
                                            : "bg-[#E5E7EB]"
                                        }`}
                                      />
                                      <span
                                        className={
                                          passwordRequirements[
                                            key as keyof typeof passwordRequirements
                                          ]
                                            ? "text-[#10B981]"
                                            : "text-[#64748B]"
                                        }
                                        style={{ fontSize: "12px" }}
                                      >
                                        {label}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label
                              htmlFor="passwordConfirmation"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Confirm Password
                            </label>
                            <div className="relative">
                              <input
                                id="passwordConfirmation"
                                type={
                                  showPasswordConfirmation ? "text" : "password"
                                }
                                value={passwordConfirmation}
                                onChange={(e) =>
                                  setPasswordConfirmation(e.target.value)
                                }
                                onBlur={() =>
                                  handleBlur("passwordConfirmation")
                                }
                                placeholder="Confirm your password"
                                className={`w-full h-12 px-4 pr-12 rounded-xl transition-all duration-200 outline-none ${
                                  touched.passwordConfirmation &&
                                  errors.passwordConfirmation
                                    ? "border-2 border-[#FF6B6B] bg-white shadow-[0_0_0_4px_rgba(255,107,107,0.08)]"
                                    : passwordConfirmation &&
                                      password === passwordConfirmation
                                    ? "border-2 border-[#10B981] bg-white"
                                    : "border-2 border-[#E5E7EB] bg-[#F8FAFB]"
                                } focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]`}
                                style={{ fontSize: "15px" }}
                                required
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswordConfirmation(
                                    !showPasswordConfirmation
                                  )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A7AFF] hover:bg-[rgba(10,122,255,0.08)] p-1.5 rounded-md transition-all"
                              >
                                {showPasswordConfirmation ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                              {passwordConfirmation &&
                                password === passwordConfirmation && (
                                  <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10B981]" />
                                )}
                            </div>
                            {touched.passwordConfirmation &&
                              errors.passwordConfirmation && (
                                <div className="flex items-start gap-2 mt-2 animate-error">
                                  <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                                  <span
                                    className="text-[#FF6B6B]"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {errors.passwordConfirmation}
                                  </span>
                                </div>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={handleNext}
                            disabled={!isStep1Valid()}
                            className={`w-full h-12 px-6 rounded-xl border-none text-white transition-all flex items-center justify-center gap-2 ${
                              !isStep1Valid()
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                            }`}
                            style={{
                              background:
                                "linear-gradient(135deg, #0A7AFF 0%, #14B8A6 100%)",
                              boxShadow: "0 4px 12px rgba(10, 122, 255, 0.25)",
                              fontSize: "15px",
                              fontWeight: 600,
                              letterSpacing: "0.3px",
                            }}
                          >
                            Next
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </form>

                        <p
                          className="text-center text-[#64748B] mt-6 pb-4"
                          style={{ fontSize: "14px" }}
                        >
                          Already have an account?{" "}
                          <button
                            onClick={onSwitchToLogin}
                            className="text-[#0A7AFF] hover:text-[#3B9EFF] hover:underline transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            Log In
                          </button>
                        </p>
                      </>
                    )}

                    {/* Step 2: Security Questions */}
                    {step === 2 && (
                      <>
                        <div className="mb-8">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-[#0A7AFF] hover:text-[#3B9EFF] mb-4 transition-colors"
                            style={{ fontSize: "14px", fontWeight: 600 }}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                          </button>
                          <div
                            className="text-[#0A7AFF] mb-2 uppercase tracking-wider"
                            style={{ fontSize: "12px", fontWeight: 600 }}
                          >
                            Step 2 of 2
                          </div>
                          <DialogTitle asChild>
                            <h2
                              className="text-[#1A2B4F] mb-2"
                              style={{ fontSize: "28px", fontWeight: 700 }}
                            >
                              Security{" "}
                              <span
                                style={{
                                  background:
                                    "linear-gradient(135deg, #0A7AFF 0%, #14B8A6 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                }}
                              >
                                Questions
                              </span>
                            </h2>
                          </DialogTitle>
                          <DialogDescription asChild>
                            <p
                              className="text-[#64748B]"
                              style={{ fontSize: "15px" }}
                            >
                              Help us secure your account for future recovery
                            </p>
                          </DialogDescription>
                        </div>

                        {showToast && (
                          <div
                            className={`mb-6 flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border-l-4 animate-toast ${
                              showToast.type === "error"
                                ? "border-[#FF6B6B]"
                                : "border-[#10B981]"
                            }`}
                          >
                            {showToast.type === "error" ? (
                              <XCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div
                                className="text-[#1A2B4F]"
                                style={{ fontSize: "14px", fontWeight: 600 }}
                              >
                                {showToast.title}
                              </div>
                              <div
                                className="text-[#64748B] mt-1"
                                style={{ fontSize: "13px" }}
                              >
                                {showToast.message}
                              </div>
                            </div>
                            <button
                              onClick={() => setShowToast(null)}
                              className="text-[#64748B] hover:text-[#1A2B4F] transition-colors flex-shrink-0"
                              style={{ fontSize: "20px" }}
                            >
                              ×
                            </button>
                          </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                          {/* Security Question 1 */}
                          <div>
                            <label
                              htmlFor="securityQuestion1"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Security Question 1
                            </label>
                            <select
                              id="securityQuestion1"
                              value={securityQuestion1}
                              onChange={(e) =>
                                setSecurityQuestion1(e.target.value)
                              }
                              className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                              style={{ fontSize: "15px" }}
                              required
                            >
                              <option value="">Select a question</option>
                              {securityQuestions.map((q) => (
                                <option
                                  key={q.value}
                                  value={q.value}
                                  disabled={
                                    q.value === securityQuestion2 ||
                                    q.value === securityQuestion3
                                  }
                                >
                                  {q.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {securityQuestion1 && (
                            <div>
                              <input
                                type="text"
                                value={securityAnswer1}
                                onChange={(e) =>
                                  setSecurityAnswer1(e.target.value)
                                }
                                placeholder="Your answer"
                                className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                                style={{ fontSize: "15px" }}
                                required
                              />
                            </div>
                          )}

                          {/* Security Question 2 */}
                          <div>
                            <label
                              htmlFor="securityQuestion2"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Security Question 2
                            </label>
                            <select
                              id="securityQuestion2"
                              value={securityQuestion2}
                              onChange={(e) =>
                                setSecurityQuestion2(e.target.value)
                              }
                              className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                              style={{ fontSize: "15px" }}
                              required
                            >
                              <option value="">Select a question</option>
                              {securityQuestions.map((q) => (
                                <option
                                  key={q.value}
                                  value={q.value}
                                  disabled={
                                    q.value === securityQuestion1 ||
                                    q.value === securityQuestion3
                                  }
                                >
                                  {q.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {securityQuestion2 && (
                            <div>
                              <input
                                type="text"
                                value={securityAnswer2}
                                onChange={(e) =>
                                  setSecurityAnswer2(e.target.value)
                                }
                                placeholder="Your answer"
                                className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                                style={{ fontSize: "15px" }}
                                required
                              />
                            </div>
                          )}

                          {/* Security Question 3 */}
                          <div>
                            <label
                              htmlFor="securityQuestion3"
                              className="block text-[#1A2B4F] mb-2"
                              style={{ fontSize: "14px", fontWeight: 600 }}
                            >
                              Security Question 3
                            </label>
                            <select
                              id="securityQuestion3"
                              value={securityQuestion3}
                              onChange={(e) =>
                                setSecurityQuestion3(e.target.value)
                              }
                              className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                              style={{ fontSize: "15px" }}
                              required
                            >
                              <option value="">Select a question</option>
                              {securityQuestions.map((q) => (
                                <option
                                  key={q.value}
                                  value={q.value}
                                  disabled={
                                    q.value === securityQuestion1 ||
                                    q.value === securityQuestion2
                                  }
                                >
                                  {q.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {securityQuestion3 && (
                            <div>
                              <input
                                type="text"
                                value={securityAnswer3}
                                onChange={(e) =>
                                  setSecurityAnswer3(e.target.value)
                                }
                                placeholder="Your answer"
                                className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F8FAFB] transition-all duration-200 outline-none focus:border-[#0A7AFF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(10,122,255,0.08)]"
                                style={{ fontSize: "15px" }}
                                required
                              />
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isLoading || !isStep2Valid()}
                            className={`w-full h-12 px-6 rounded-xl border-none text-white transition-all flex items-center justify-center ${
                              isLoading || !isStep2Valid()
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                            }`}
                            style={{
                              background:
                                "linear-gradient(135deg, #0A7AFF 0%, #14B8A6 100%)",
                              boxShadow: "0 4px 12px rgba(10, 122, 255, 0.25)",
                              fontSize: "15px",
                              fontWeight: 600,
                              letterSpacing: "0.3px",
                            }}
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating Account...
                              </span>
                            ) : (
                              "Create Account"
                            )}
                          </button>
                        </form>

                        <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                          <span
                            className="text-[#64748B]"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            Your data is encrypted and secure
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <div
                className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl"
                style={{ pointerEvents: "none" }}
              >
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-[#0A7AFF] animate-spin mx-auto" />
                  <p
                    className="text-[#1A2B4F] mt-3"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  >
                    Creating your account...
                  </p>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
