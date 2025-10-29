import { useState } from "react";
import { Contact } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Hero } from "../components/Hero";
import { About } from "../components/About";
import { Features } from "../components/Features";
import { HowItWorks } from "../components/HowItWorks";
import { Testimonials } from "../components/Testimonials";
import { Footer } from "../components/Footer";
import { LoginModal } from "../components/LoginModal";
import { Team } from "../components/Team";
import { ForgotPasswordModal } from "../components/ForgotPasswordModal";
import { SignUpModal } from "../components/SignUpModal";

export default function LoginPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openSignUpModal = () => setIsSignUpModalOpen(true);
  const closeSignUpModal = () => setIsSignUpModalOpen(false);

  const openForgotPasswordModal = () => setIsForgotPasswordModalOpen(true);
  const closeForgotPasswordModal = () => setIsForgotPasswordModalOpen(false);

  const switchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const switchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navigation
        onLoginClick={openLoginModal}
        onSignUpClick={openSignUpModal}
      />
      <Hero onStartPlanningClick={openSignUpModal} />
      <About />
      <Features />
      <HowItWorks onStartYourTripClick={openSignUpModal} />
      <Testimonials />
      <Team />
      <Contact />
      <Footer />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSwitchToSignUp={switchToSignUp}
        onForgotPassword={openForgotPasswordModal}
      />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={closeSignUpModal}
        onSwitchToLogin={switchToLogin}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeForgotPasswordModal}
        onBackToLogin={openLoginModal}
      />
    </div>
  );
}
