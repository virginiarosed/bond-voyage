import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Camera, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useProfile } from "../components/ProfileContext";

export function EditProfile() {
  const navigate = useNavigate();
  const { profileData, updateProfile } = useProfile();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state - Initialize from context
  const [profileForm, setProfileForm] = useState({
    companyName: profileData.companyName,
    email: profileData.email,
    phone: profileData.phone,
    location: profileData.location,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Show password requirements panel
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Password validation function (same as SignUpModal)
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
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // Update profile context with new data
    updateProfile({
      companyName: profileForm.companyName,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
    });
    
    toast.success("Profile updated successfully!", {
      description: "Your profile information has been saved.",
    });
    setIsEditingProfile(false);
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
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
    if (!allRequirementsMet) {
      toast.error("Password does not meet all requirements");
      return;
    }

    // Simulate password change
    toast.success("Password changed successfully!", {
      description: "Your password has been updated securely.",
    });

    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back</span>
      </button>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl shadow-[0_0_20px_var(--shadow-color)] border border-border overflow-hidden">
        {/* Header with gradient */}
        <div className="h-32 relative" style={{ background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))` }}>
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-card shadow-lg overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))` }}>
                <span className="text-white text-4xl font-bold">AD</span>
              </div>
              <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Camera className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-foreground text-2xl font-semibold mb-1">
                {profileForm.companyName}
              </h2>
              <p className="text-muted-foreground">System Administrator</p>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
                isEditingProfile
                  ? "bg-secondary text-muted-foreground hover:bg-secondary-hover"
                  : "text-white hover:opacity-90"
              }`}
              style={!isEditingProfile ? { background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))` } : {}}
            >
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="col-span-2">
              <label className="block text-foreground font-medium mb-2">Company Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-foreground font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-foreground font-medium mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Location */}
            <div className="col-span-2">
              <label className="block text-foreground font-medium mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-input-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditingProfile && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="px-8 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all shadow-lg"
                style={{ 
                  background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
                  boxShadow: `0 4px 20px var(--shadow-color-strong)`
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-2xl shadow-[0_0_20px_var(--shadow-color)] border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground text-xl font-semibold">Change Password</h3>
            <p className="text-muted-foreground text-sm">Keep your account secure with a strong password</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-foreground font-medium mb-2">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                placeholder="Enter your current password"
                className="w-full h-12 pl-12 pr-12 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-foreground font-medium mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                placeholder="Enter your new password"
                className="w-full h-12 pl-12 pr-12 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements - Show on focus using same pattern as SignUpModal */}
            {showPasswordRequirements && (
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                <p className="text-foreground mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Password must contain:
                </p>
                <ul className="space-y-1">
                  {[
                    { key: 'length', label: 'At least 8 characters length' },
                    { key: 'number', label: 'At least 1 number (0-9)' },
                    { key: 'lowercase', label: 'At least 1 lowercase letter (a-z)' },
                    { key: 'special', label: 'At least 1 special symbol (!,$, etc.)' },
                    { key: 'uppercase', label: 'At least 1 uppercase letter (A-Z)' },
                  ].map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements[key as keyof typeof passwordRequirements] ? 'bg-success' : 'bg-border'}`} />
                      <span className={passwordRequirements[key as keyof typeof passwordRequirements] ? 'text-success' : 'text-muted-foreground'} style={{ fontSize: "12px" }}>
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
            <label className="block text-foreground font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                placeholder="Confirm your new password"
                className={`w-full h-12 pl-12 pr-12 rounded-xl border transition-all ${
                  passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
                    ? "border-2 border-success bg-card"
                    : "border border-border bg-input-background"
                } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <Check className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
              )}
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                <X className="w-4 h-4" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleChangePassword}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !allRequirementsMet || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="px-8 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: `linear-gradient(90deg, var(--gradient-from), var(--gradient-to))`,
                boxShadow: `0 4px 20px var(--shadow-color-strong)`
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-primary/10 rounded-2xl border border-primary/20 p-6">
        <h4 className="text-foreground font-semibold mb-3">Security Tips</h4>
        <ul className="space-y-2 text-muted-foreground text-sm">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>Use a unique password that you don't use for other accounts</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>Avoid using personal information in your password</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>Consider using a password manager for better security</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>Change your password regularly and never share it with anyone</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
