import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, MapPin, Clock, TrendingUp, Lightbulb, Calendar, X, Minimize2, MessageCircle, Zap, Star, Compass } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";

interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  description?: string;
}

interface Day {
  id: string;
  day: number;
  title: string;
  activities: Activity[];
}

interface Message {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionButtons?: { label: string; action: string }[];
}

interface AITravelAssistantProps {
  itineraryDays: Day[];
  destination?: string;
  onClose?: () => void;
  onSuggestionApply?: (suggestion: any) => void;
}

export function AITravelAssistant({ 
  itineraryDays, 
  destination,
  onClose,
  onSuggestionApply
}: AITravelAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "ai",
      content: `👋 Hi! I'm your AI Travel Assistant for BondVoyage. I'm here to help you create the perfect ${destination || 'Philippine'} itinerary!\n\nI can help you with:\n• Route optimization and travel planning\n• Activity suggestions and recommendations\n• Time management and scheduling\n• Destination insights and tips\n• Itinerary improvements\n\nWhat would you like to work on?`,
      timestamp: new Date(),
      suggestions: [
        "Optimize my routes",
        "Suggest activities",
        "Check my schedule",
        "Destination tips"
      ]
    };
    setMessages([welcomeMessage]);
  }, [destination]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Set unread when new AI message arrives and chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === "ai" && lastMessage.id !== "welcome") {
        setHasUnread(true);
      }
    }
  }, [messages, isOpen]);

  // Clear unread when opening chat
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  // Analyze current itinerary context
  const analyzeItinerary = () => {
    const totalDays = itineraryDays.length;
    const totalActivities = itineraryDays.reduce((sum, day) => sum + day.activities.length, 0);
    const activitiesWithLocations = itineraryDays.reduce(
      (sum, day) => sum + day.activities.filter(a => a.location).length, 
      0
    );
    const activitiesWithTime = itineraryDays.reduce(
      (sum, day) => sum + day.activities.filter(a => a.time).length, 
      0
    );

    return {
      totalDays,
      totalActivities,
      activitiesWithLocations,
      activitiesWithTime,
      hasContent: totalActivities > 0,
      isComplete: totalActivities > 0 && activitiesWithLocations === totalActivities,
    };
  };

  // Generate AI response based on user input
  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    const context = analyzeItinerary();

    // Route optimization
    if (lowerMessage.includes("optimize") || lowerMessage.includes("route") || lowerMessage.includes("efficient")) {
      if (context.activitiesWithLocations < 2) {
        return {
          id: Date.now().toString(),
          type: "ai",
          content: "To optimize your routes, I need at least 2 activities with locations. Let me help you add locations to your activities first!\n\nWould you like suggestions for popular destinations in the Philippines?",
          timestamp: new Date(),
          suggestions: ["Yes, suggest locations", "I'll add them myself"],
        };
      }
      
      return {
        id: Date.now().toString(),
        type: "ai",
        content: `Great! I've analyzed your ${context.totalDays}-day itinerary with ${context.activitiesWithLocations} locations.\n\n🗺️ **Route Optimization Insights:**\n• Your current route covers multiple destinations\n• I can help reorder activities to minimize travel time\n• Consider grouping nearby attractions together\n\nCheck the Route Optimization panel above to see the optimized path. I've calculated that you could save significant travel time by reordering some activities.`,
        timestamp: new Date(),
        suggestions: ["Show me the savings", "Explain the optimization", "Keep current order"],
      };
    }

    // Activity suggestions
    if (lowerMessage.includes("suggest") || lowerMessage.includes("activity") || lowerMessage.includes("activities") || lowerMessage.includes("do")) {
      const philippineActivities = {
        beach: ["Island hopping in El Nido", "Snorkeling at Apo Reef", "Sunset at White Beach, Boracay", "Beach volleyball at Alona Beach"],
        adventure: ["Hike Mt. Pulag", "Canyoneering at Kawasan Falls", "Zip-lining in Dahilayan", "Surfing at Cloud 9, Siargao"],
        culture: ["Tour Intramuros, Manila", "Visit Chocolate Hills, Bohol", "Explore Vigan Heritage Village", "See Mayon Volcano"],
        food: ["Food trip in BGC", "Try lechon in Cebu", "Street food tour in Manila", "Fresh seafood at Dampa"],
      };

      const suggestions = Object.values(philippineActivities).flat();
      const randomSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);

      return {
        id: Date.now().toString(),
        type: "ai",
        content: `Based on your ${destination || 'Philippine'} itinerary, here are some amazing activities I recommend:\n\n${randomSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWould you like me to add any of these to your itinerary? I can also provide more specific suggestions based on your interests!`,
        timestamp: new Date(),
        suggestions: ["Beach activities", "Adventure activities", "Cultural experiences", "Food experiences"],
      };
    }

    // Schedule check
    if (lowerMessage.includes("schedule") || lowerMessage.includes("time") || lowerMessage.includes("timing")) {
      if (context.activitiesWithTime === 0) {
        return {
          id: Date.now().toString(),
          type: "ai",
          content: "I notice you haven't set times for your activities yet. Good timing is crucial for a smooth trip!\n\n⏰ **Time Management Tips:**\n• Start with arrival time on Day 1\n• Allow 2-3 hours for meals\n• Factor in travel time between locations\n• Leave buffer time for unexpected delays\n\nWould you like me to suggest a sample timeline?",
          timestamp: new Date(),
          suggestions: ["Yes, suggest timeline", "I'll set them manually"],
        };
      }

      return {
        id: Date.now().toString(),
        type: "ai",
        content: `I've reviewed your schedule for ${context.totalDays} days:\n\n✅ **Schedule Analysis:**\n• ${context.activitiesWithTime} activities have set times\n• ${context.totalActivities - context.activitiesWithTime} activities need timing\n\nRemember to account for:\n• Travel time between locations (check Route Optimization)\n• Meal breaks (2-3 hours daily)\n• Rest periods\n• Check-in/check-out times\n\nThe route optimizer above will help ensure your timing is realistic!`,
        timestamp: new Date(),
        suggestions: ["Check route timing", "Add buffer time", "Reschedule activities"],
      };
    }

    // Destination tips
    if (lowerMessage.includes("tip") || lowerMessage.includes("advice") || lowerMessage.includes("recommend")) {
      const tips = [
        "🌴 **Best Time to Visit:** November to February offers the best weather in the Philippines.",
        "💰 **Budget Tip:** Book flights 2-3 months in advance for better rates.",
        "🚗 **Transportation:** Grab/Angkas are widely available in major cities.",
        "🏖️ **Island Hopping:** Book tours a day in advance for better prices.",
        "🍽️ **Food:** Don't miss trying local specialties at each destination!",
        "📱 **Connectivity:** Get a local SIM card at the airport for affordable data.",
      ];

      const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

      return {
        id: Date.now().toString(),
        type: "ai",
        content: `Here are some insider tips for your ${destination || 'Philippine'} adventure:\n\n${randomTips.join('\n\n')}\n\nWould you like more specific advice about any destination in your itinerary?`,
        timestamp: new Date(),
        suggestions: ["Weather info", "Budget tips", "Transportation", "Local customs"],
      };
    }

    // Create itinerary
    if (lowerMessage.includes("create") || lowerMessage.includes("generate") || lowerMessage.includes("make itinerary")) {
      return {
        id: Date.now().toString(),
        type: "ai",
        content: "I can help you create an amazing itinerary! Let me know:\n\n1. **Destination**: Where do you want to go?\n2. **Duration**: How many days?\n3. **Interests**: Beach, adventure, culture, food, or mix?\n4. **Budget**: Budget, mid-range, or luxury?\n\nTell me your preferences and I'll create a customized day-by-day itinerary!",
        timestamp: new Date(),
        suggestions: ["Beach vacation 5D", "Adventure trip 3D", "Cultural tour 7D", "Food tour 4D"],
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: "ai",
      content: `I understand you're asking about "${userMessage}". \n\nI'm here to help with your ${destination || 'Philippine'} itinerary planning! I can:\n\n🗺️ **Optimize Routes** - Find the most efficient path between your activities\n📍 **Suggest Activities** - Recommend amazing experiences\n⏰ **Manage Time** - Help with scheduling and timing\n💡 **Provide Insights** - Share tips and destination knowledge\n\nWhat specific aspect would you like help with?`,
      timestamp: new Date(),
      suggestions: ["Optimize routes", "Suggest activities", "Check schedule", "Get tips"],
    };
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] shadow-2xl shadow-[#0A7AFF]/30 flex items-center justify-center z-[100] group"
          >
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] border-2 border-white flex items-center justify-center"
              >
                <span className="text-[10px] text-white">1</span>
              </motion.div>
            )}
            
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bot className="w-7 h-7 text-white" />
            </motion.div>

            {/* Pulse Ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full mb-3 right-0 px-3 py-2 rounded-lg bg-[#1A2B4F] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              AI Travel Assistant
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1A2B4F]" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: isMinimized ? 0 : 1, 
              scale: isMinimized ? 0.8 : 1, 
              y: isMinimized ? 20 : 0 
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-[420px] h-[600px] rounded-2xl bg-white shadow-2xl border-2 border-[#E5E7EB] flex flex-col z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-4 bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] overflow-hidden flex-shrink-0">
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-white flex items-center gap-2">
                      AI Travel Assistant
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[#10B981]"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <p className="text-xs text-white/90">Online & ready to help</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMinimize}
                    className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minimize2 className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleChat}
                    className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="relative mt-3 grid grid-cols-3 gap-2">
                {[
                  { icon: Calendar, label: "Days", value: itineraryDays.length, color: "#FFFFFF" },
                  { icon: MapPin, label: "Places", value: itineraryDays.reduce((sum, day) => sum + day.activities.filter(a => a.location).length, 0), color: "#FFFFFF" },
                  { icon: Star, label: "Activities", value: itineraryDays.reduce((sum, day) => sum + day.activities.length, 0), color: "#FFFFFF" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2 rounded-lg bg-white/15 backdrop-blur-sm text-center"
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <stat.icon className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] text-white/80">{stat.label}</span>
                    </div>
                    <p className="text-base text-white">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#F8FAFB] to-white">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "ai" && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center flex-shrink-0 shadow-md">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`flex-1 max-w-[85%] ${message.type === "user" ? "ml-auto" : ""}`}>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`p-3.5 rounded-2xl shadow-sm ${
                            message.type === "user"
                              ? "bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white ml-auto"
                              : "bg-white text-[#1A2B4F] border border-[#E5E7EB]"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                        </motion.div>
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <motion.button
                                key={idx}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#0A7AFF] hover:bg-[rgba(10,122,255,0.05)] text-xs text-[#1A2B4F] transition-all shadow-sm"
                              >
                                {suggestion}
                              </motion.button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-[10px] text-[#94A3B8] mt-1.5">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.type === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#64748B] to-[#475569] flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-xs text-white">You</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A7AFF] to-[#14B8A6] flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-[#0A7AFF]"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-2 border-[#E5E7EB] bg-white flex-shrink-0">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-3">
                {[
                  { icon: Sparkles, label: "Optimize", action: "Optimize my routes" },
                  { icon: Lightbulb, label: "Ideas", action: "Suggest activities" },
                  { icon: Clock, label: "Schedule", action: "Check my schedule" },
                  { icon: Compass, label: "Tips", action: "Destination tips" },
                ].map((btn) => (
                  <motion.button
                    key={btn.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestionClick(btn.action)}
                    className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg bg-gradient-to-br from-[#F8FAFB] to-white hover:from-[rgba(10,122,255,0.05)] hover:to-[rgba(20,184,166,0.05)] border border-[#E5E7EB] hover:border-[#0A7AFF] transition-all"
                  >
                    <btn.icon className="w-3.5 h-3.5 text-[#0A7AFF]" />
                    <span className="text-[10px] text-[#64748B]">{btn.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 rounded-xl border-2 border-[#E5E7EB] focus:border-[#0A7AFF] focus:ring-4 focus:ring-[rgba(10,122,255,0.1)] transition-all"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#0A7AFF] to-[#14B8A6] text-white hover:shadow-lg hover:shadow-[#0A7AFF]/30 transition-all disabled:opacity-50 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
