import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  companyName: string;
  yearsInOperation: string;
  customerRating: string;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
  setCustomerRatingFromFeedback: (avgRating: number) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = "bondvoyage-profile-data";

const defaultProfileData: ProfileData = {
  firstName: "Admin",
  lastName: "User",
  email: "4bstravelandtours@gmail.com",
  phone: "+63 917 123 4567",
  location: "Manila, Philippines",
  companyName: "4B's Travel and Tours",
  yearsInOperation: "6+ Years",
  customerRating: "4.8 / 5 Stars",
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultProfileData, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse profile data:", e);
        }
      }
    }
    return defaultProfileData;
  });

  // Save to localStorage whenever profile data changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
    }
  }, [profileData]);

  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  }, []);

  const setCustomerRatingFromFeedback = useCallback((avgRating: number) => {
    const newRating = `${avgRating.toFixed(1)} / 5 Stars`;
    setProfileData((prev) => {
      // Only update if the rating has actually changed
      if (prev.customerRating !== newRating) {
        return { ...prev, customerRating: newRating };
      }
      return prev;
    });
  }, []);

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, setCustomerRatingFromFeedback }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
