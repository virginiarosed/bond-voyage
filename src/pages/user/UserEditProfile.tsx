import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronLeft,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from "../../hooks/useAuth";
import { ImageCropModal } from "../../components/ImageCropModal";
import { FAQAssistant } from "../../components/FAQAssistant";

export function UserEditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth hooks
  const { data: profileResponse, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile({
      onSuccess: (response) => {
        toast.success("Profile updated successfully!", {
          description: "Your profile information has been saved.",
        });
        setIsEditingProfile(false);
      },
      onError: (error: any) => {
        toast.error("Failed to update profile", {
          description:
            error.response?.data?.message || "Please try again later.",
        });
      },
    });

  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword({
      onSuccess: (response) => {
        toast.success("Password changed successfully!", {
          description: "Your password has been updated securely.",
        });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsEditingPassword(false);
      },
      onError: (error: any) => {
        toast.error("Failed to change password", {
          description:
            error.response?.data?.message ||
            "Please check your current password and try again.",
        });
      },
    });

  // State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  // Image cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Get user data from profile response
  const userData = profileResponse?.data?.user;

  // Profile form state - Initialize from API data
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    mobile: "",
    birthday: "",
    avatarUrl: "",
  });

  // Update form when profile data loads
  useEffect(() => {
    if (userData) {
      setProfileForm({
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        mobile: userData.mobile || "",
        birthday: userData.birthday || "",
        avatarUrl: userData.avatarUrl || "",
      });
    }
  }, [userData]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password validation function
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

  const passwordRequirements = validatePassword(passwordForm.newPassword);
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // Call API to update profile
    updateProfile({
      firstName: profileForm.firstName,
      middleName: profileForm.middleName || null,
      lastName: profileForm.lastName,
      email: profileForm.email,
      mobile: profileForm.mobile,
      birthday: profileForm.birthday || null,
      avatarUrl: profileForm.avatarUrl,
    });
  };

  const handleChangePassword = () => {
    // Validation
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error("New password is required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Check all password requirements
    if (!allRequirementsMet) {
      toast.error("Password does not meet all requirements");
      return;
    }

    // Call API to change password
    changePassword({
      oldPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Convert to base64 and show crop modal
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setProfileForm((prev) => ({ ...prev, avatarUrl: croppedImage }));

    // Auto-save profile picture
    updateProfile({
      ...profileForm,
      avatarUrl: croppedImage,
    });

    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  // Get initials from first and last name
  const getInitials = () => {
    if (!userData) return "U";
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }

    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No user data
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border-2 border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-[#64748B]" />
        </button>
        <div>
          <h2 className="text-[#1A2B4F] font-semibold">Edit Profile</h2>
          <p className="text-sm text-[#64748B]">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl shadow-[0_0_20px_var(--shadow-color)] border border-border overflow-hidden">
        {/* Header with gradient */}
        <div
          className="h-32 relative"
          style={{
            background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
          }}
        >
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full border-4 border-card shadow-lg overflow-hidden flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
                }}
              >
                {userData.avatarUrl ? (
                  <img
                    src={profileForm.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {getInitials()}
                  </span>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingProfile}
                className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="pt-20 px-8 pb-8">
          {/* Header with title and buttons */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-foreground text-2xl font-semibold mb-1">
                {profileForm.firstName} {profileForm.lastName}
              </h2>
              <p className="text-muted-foreground">Traveler</p>
            </div>
            <div className="flex gap-3">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      // Reset form to current user data
                      setProfileForm({
                        firstName: userData.firstName || "",
                        middleName: userData.middleName || "",
                        lastName: userData.lastName || "",
                        email: userData.email || "",
                        mobile: userData.mobile || "",
                        birthday: userData.birthday || "",
                        avatarUrl: userData.avatarUrl || "",
                      });
                    }}
                    disabled={isUpdatingProfile}
                    className="px-6 py-3 rounded-xl font-medium transition-all shadow-md bg-secondary text-muted-foreground hover:bg-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
                      boxShadow: `0 4px 20px var(--shadow-color-strong)`,
                    }}
                  >
                    {isUpdatingProfile && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-6 py-3 rounded-xl font-medium transition-all shadow-md text-white hover:opacity-90"
                  style={{
                    background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firstName: e.target.value,
                    })
                  }
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                Middle Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileForm.middleName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      middleName: e.target.value,
                    })
                  }
                  disabled={!isEditingProfile}
                  placeholder="Optional"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                Birthday
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={profileForm.birthday}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, birthday: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-foreground font-medium mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={profileForm.mobile}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, mobile: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-2xl shadow-[0_0_20px_var(--shadow-color)] border border-border p-8">
        {/* Header with title and button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground text-xl font-semibold">
                Change Password
              </h3>
              <p className="text-muted-foreground text-sm">
                Keep your account secure with a strong password
              </p>
            </div>
          </div>
          {!isEditingPassword ? (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="px-6 py-3 rounded-xl font-medium transition-all shadow-md text-white hover:opacity-90"
              style={{
                background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
              }}
            >
              Change Password
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditingPassword(false);
                  // Reset password form
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setShowPasswordRequirements(false);
                }}
                disabled={isChangingPassword}
                className="px-6 py-3 rounded-xl font-medium transition-all shadow-md bg-secondary text-muted-foreground hover:bg-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  !allRequirementsMet ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  isChangingPassword
                }
                className="px-6 py-3 rounded-xl font-medium transition-all shadow-md text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
                  boxShadow: `0 4px 20px var(--shadow-color-strong)`,
                }}
              >
                {isChangingPassword && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-foreground font-medium mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                disabled={!isEditingPassword}
                placeholder="Enter your current password"
                className="w-full h-12 pl-12 pr-12 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={!isEditingPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-foreground font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                disabled={!isEditingPassword}
                placeholder="Enter your new password"
                className="w-full h-12 pl-12 pr-12 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={!isEditingPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Requirements - Only show when editing */}
            {showPasswordRequirements && isEditingPassword && (
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                <p
                  className="text-foreground mb-2"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  Password must contain:
                </p>
                <ul className="space-y-1">
                  {[
                    { key: "length", label: "At least 8 characters length" },
                    { key: "number", label: "At least 1 number (0-9)" },
                    {
                      key: "lowercase",
                      label: "At least 1 lowercase letter (a-z)",
                    },
                    {
                      key: "special",
                      label: "At least 1 special symbol (!,$, etc.)",
                    },
                    {
                      key: "uppercase",
                      label: "At least 1 uppercase letter (A-Z)",
                    },
                  ].map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          passwordRequirements[
                            key as keyof typeof passwordRequirements
                          ]
                            ? "bg-success"
                            : "bg-border"
                        }`}
                      />
                      <span
                        className={
                          passwordRequirements[
                            key as keyof typeof passwordRequirements
                          ]
                            ? "text-success"
                            : "text-muted-foreground"
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
            <label className="block text-foreground font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                disabled={!isEditingPassword}
                placeholder="Confirm your new password"
                className={`w-full h-12 pl-12 pr-12 rounded-xl border transition-all ${
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? "border-2 border-success bg-card"
                    : "border border-border bg-input-background"
                } text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!isEditingPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              {passwordForm.confirmPassword &&
                passwordForm.newPassword === passwordForm.confirmPassword &&
                isEditingPassword && (
                  <Check className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
            </div>
            {passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword &&
              isEditingPassword && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Passwords do not match
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-primary/10 rounded-2xl border border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h4 className="text-foreground font-semibold">Security Tips</h4>
        </div>
        <ul className="space-y-2 text-muted-foreground text-sm">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>
              Use a unique password that you don't use for other accounts
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Avoid using personal information in your password</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Consider using a password manager for better security</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>
              Change your password regularly and never share it with anyone
            </span>
          </li>
        </ul>
      </div>

      {/* FAQ Assistant */}
      <FAQAssistant />

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
