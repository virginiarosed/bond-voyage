"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Mail, Phone, MapPin, Send, Plane } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSendSystemContact } from "../../../hooks/useContact";
import { toast } from "sonner";


export function Contact() {
  const [messageValue, setMessageValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [showPlaneAnimation, setShowPlaneAnimation] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact form mutation
  const sendSystemContactMutation = useSendSystemContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameValue.trim() || !emailValue.trim() || !messageValue.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendSystemContactMutation.mutateAsync({
        name: nameValue.trim(),
        email: emailValue.trim(),
        message: messageValue.trim(),
      });

      // Trigger paper airplane animation on success
      setShowPlaneAnimation(true);
      setFormSubmitted(true);

      // Play a whoosh sound effect (paper plane flying)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a whoosh sound by sweeping frequency
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.4);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } catch (audioError) {
        // Silently fail if audio doesn't play
      }

      toast.success("Message sent successfully!", {
        description: "We'll get back to you as soon as possible.",
      });

      // Reset animations and form
      setTimeout(() => {
        setShowPlaneAnimation(false);
        setFormSubmitted(false);
        setMessageValue("");
        setNameValue("");
        setEmailValue("");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to send message. Please try again.";
      toast.error("Error", {
        description: errorMessage,
      });
      setShowPlaneAnimation(false);
      setFormSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "bondvoyage.system@gmail.com",
      href: "mailto:bondvoyage.system@gmail.com"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+63 994 631 1233",
      href: "tel:+639946311233"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Santa Rosa City, Laguna, PH",
      href: null
    }
  ];

  return (
    <section id="contact" className="py-20 md:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10, 122, 255, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-16">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="uppercase tracking-wider mb-3"
            style={{ fontSize: "14px", fontWeight: 500, color: "var(--ocean-blue)", letterSpacing: "1.5px" }}
          >
            Contact Us
          </p>
          <h2 style={{ fontSize: "40px", fontWeight: 600, color: "var(--deep-navy)" }}>
            Get In Touch
          </h2>
          <p className="mt-4 max-w-2xl mx-auto" style={{ fontSize: "18px", color: "var(--slate)" }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[var(--silver)] relative overflow-hidden">
              {/* Success overlay */}
              <AnimatePresence>
                {formSubmitted && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[var(--ocean-blue)]/10 to-[var(--tropical-teal)]/10 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="bg-white rounded-2xl p-6 shadow-xl text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[var(--ocean-blue)] to-[var(--tropical-teal)] mx-auto flex items-center justify-center mb-3">
                        <Plane className="w-8 h-8 text-white" />
                      </div>
                      <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--deep-navy)" }}>
                        Message Sent!
                      </p>
                      <p className="mt-1" style={{ fontSize: "14px", color: "var(--slate)" }}>
                        We'll be in touch soon!
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h3 className="mb-6" style={{ fontSize: "24px", fontWeight: 600, color: "var(--deep-navy)" }}>
                Send us a message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" style={{ fontSize: "14px", fontWeight: 500, color: 'var(--deep-navy)' }}>
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="mt-2 h-12 rounded-xl border-[var(--silver)] bg-[var(--cloud-gray)] focus:bg-white focus:border-[var(--ocean-blue)] focus:ring-2 focus:ring-[var(--ocean-blue)] focus:ring-opacity-20 transition-all duration-200"
                    style={{ fontSize: "16px" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" style={{ fontSize: "14px", fontWeight: 500, color: 'var(--deep-navy)' }}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="mt-2 h-12 rounded-xl border-[var(--silver)] bg-[var(--cloud-gray)] focus:bg-white focus:border-[var(--ocean-blue)] focus:ring-2 focus:ring-[var(--ocean-blue)] focus:ring-opacity-20 transition-all duration-200"
                    style={{ fontSize: "16px" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message" style={{ fontSize: "14px", fontWeight: 500, color: 'var(--deep-navy)' }}>
                    Your Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what you're thinking..."
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    className="mt-2 min-h-[160px] rounded-xl resize-none border-[var(--silver)] bg-[var(--cloud-gray)] focus:bg-white focus:border-[var(--ocean-blue)] focus:ring-2 focus:ring-[var(--ocean-blue)] focus:ring-opacity-20 transition-all duration-200"
                    style={{ fontSize: "16px" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="relative">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-[var(--ocean-blue)] hover:bg-[var(--sky-blue)] text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ fontSize: "16px", fontWeight: 500 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Contact Info Card */}
<motion.div
  initial={{ opacity: 0, x: 20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, delay: 0.4 }}
  className="flex flex-col gap-6"
>
  <div
    className="rounded-3xl p-6 md:p-8 text-white shadow-2xl flex-1 flex flex-col relative overflow-hidden"
    style={{ 
      background: `linear-gradient(135deg, #0891b2 0%, #14b8a6 50%, #2dd4bf 100%)`,
    }}
  >
    {/* Animated background elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
    
    <div className="relative z-10">
      {/* Main Tagline */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Get In Touch
          </h3>
        </div>
        <p className="text-white/95" style={{ fontSize: "18px", fontWeight: 500, lineHeight: "1.7" }}>
          Our inbox never sleeps — but humans reply <span className="font-semibold">9 AM–6 PM</span>
        </p>
      </div>

      {/* Contact Details */}
      <div className="space-y-6 mb-10">
        {contactInfo.map((item, index) => (
          <motion.div
            key={item.label}
            className="flex items-start gap-4 group cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ x: 4 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 group-hover:bg-white/35 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 pt-1">
              <p className="mb-1 text-white/80 uppercase tracking-wider" style={{ fontSize: "11px", fontWeight: 600 }}>
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:underline transition-all duration-200 block"
                  style={{ fontSize: "17px", fontWeight: 600 }}
                >
                  {item.value}
                </a>
              ) : (
                <p style={{ fontSize: "17px", fontWeight: 600 }}>
                  {item.value}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <motion.div 
        className="mt-auto pt-6 border-t border-white/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0"></div>
            <p className="text-white/90" style={{ fontSize: "15px", lineHeight: "1.6", fontWeight: 500 }}>
              Human responses typically within 2-4 hours during business hours
            </p>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0"></div>
            <p className="text-white/90" style={{ fontSize: "15px", lineHeight: "1.6", fontWeight: 500 }}>
              Weekend messages answered first thing Monday morning
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</motion.div>
        </div>

        {/* Flying Paper Airplane Animation */}
        <AnimatePresence>
        {showPlaneAnimation && (
          <motion.div
            className="fixed pointer-events-none z-50"
            initial={{ 
              x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
              y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
              rotate: -10,
              scale: 1
            }}
            animate={{ 
              x: [
                typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
                typeof window !== 'undefined' ? window.innerWidth * 0.7 : 700,
                typeof window !== 'undefined' ? window.innerWidth + 200 : 1200
              ],
              y: [
                typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
                typeof window !== 'undefined' ? window.innerHeight * 0.3 : 200,
                -200
              ],
              rotate: [-10, 20, 45],
              scale: [1, 1.3, 1.8]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.8, 
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.3,
                repeat: 5,
                ease: "easeInOut"
              }}
            >
              <Plane 
                className="w-12 h-12"
                style={{ color: 'var(--ocean-blue)' }}
              />
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </section>
  );
}
