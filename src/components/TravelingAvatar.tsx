import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Users, CheckCircle, FileText, MessageSquare, LayoutDashboard } from "lucide-react";

type ActivityType = "overview" | "users" | "approvals" | "itinerary" | "feedback";

interface Activity {
  type: ActivityType;
  label: string;
  sublabel: string;
  icon: typeof Users;
  color: string;
}

const activities: Activity[] = [
  { 
    type: "overview", 
    label: "Dashboard Overview", 
    sublabel: "Monitoring all activities",
    icon: LayoutDashboard,
    color: "#0A7AFF" // Ocean Blue
  },
  { 
    type: "users", 
    label: "Managing Users", 
    sublabel: "User permissions & access",
    icon: Users,
    color: "#10B981" // Jade Green
  },
  { 
    type: "approvals", 
    label: "Approving Bookings", 
    sublabel: "Processing requests",
    icon: CheckCircle,
    color: "#FFB84D" // Golden Hour
  },
  { 
    type: "itinerary", 
    label: "Creating Itinerary", 
    sublabel: "Building travel plans",
    icon: FileText,
    color: "#14B8A6" // Tropical Teal
  },
  { 
    type: "feedback", 
    label: "Managing Feedback", 
    sublabel: "Customer insights",
    icon: MessageSquare,
    color: "#FF6B6B" // Sunset Coral
  },
];

export function TravelingAvatar() {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const currentActivity = activities[currentActivityIndex];

  const handleActivityClick = () => {
    setCurrentActivityIndex((prev) => (prev + 1) % activities.length);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-8 min-h-[300px]">
      {/* Floating Background Elements */}
      <motion.div
        className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-20 right-12 w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm"
        animate={{
          y: [0, 15, 0],
          x: [0, -15, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Left Side: Activity Label and Buttons */}
      <div className="flex flex-col items-center gap-4 z-10">
        {/* Activity Label with Glassmorphism */}
        <motion.div
          key={`label-${currentActivity.type}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <currentActivity.icon className="w-4 h-4 text-white" strokeWidth={2.5} />
            <div className="text-left">
              <p className="text-white font-semibold text-sm leading-tight">{currentActivity.label}</p>
              <p className="text-white/70 text-xs leading-tight">{currentActivity.sublabel}</p>
            </div>
          </div>
        </motion.div>

        {/* Activity Buttons */}
        <div className="flex gap-2 flex-wrap justify-center max-w-[240px]">
          {activities.map((activity, index) => (
            <motion.button
              key={activity.type}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentActivityIndex(index);
              }}
              className="group relative focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-2"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              title={activity.label}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index === currentActivityIndex
                    ? "bg-white shadow-lg"
                    : "bg-white/20 backdrop-blur-sm group-hover:bg-white/40"
                }`}
                style={{
                  borderColor: index === currentActivityIndex ? activity.color : "transparent",
                  borderWidth: "2px",
                }}
              >
                <activity.icon
                  className="w-5 h-5 transition-colors duration-300"
                  style={{
                    color: index === currentActivityIndex ? activity.color : "white",
                  }}
                  strokeWidth={2.5}
                />
              </div>
              
              {/* Tooltip on hover */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A2B4F] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
              >
                {activity.label}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1A2B4F] rotate-45" />
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Click Hint */}
        <AnimatePresence>
          {currentActivityIndex === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/60 text-xs"
            >
              👆 Click the avatar or buttons to explore!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Right Side: Main Interactive Avatar Container */}
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={handleActivityClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentActivity.type}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <svg
              width="220"
              height="220"
              viewBox="0 0 220 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Glow Effect Background */}
              <motion.circle
                cx="110"
                cy="110"
                r="100"
                fill={currentActivity.color}
                opacity="0.1"
                animate={{
                  scale: isHovered ? [1, 1.1, 1] : 1,
                  opacity: isHovered ? [0.1, 0.2, 0.1] : 0.1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Dashboard Overview - Monitoring */}
              {currentActivity.type === "overview" && (
                <g>
                  {/* Floating Dashboard Screens */}
                  <motion.g
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Main Screen */}
                    <rect x="70" y="80" width="80" height="60" rx="8" fill="white" />
                    <rect x="75" y="85" width="70" height="4" rx="2" fill={currentActivity.color} opacity="0.6" />
                    <rect x="75" y="92" width="50" height="3" rx="1.5" fill="#E5E7EB" />
                    <rect x="75" y="98" width="60" height="3" rx="1.5" fill="#E5E7EB" />
                    
                    {/* Dashboard Charts */}
                    <motion.g
                      animate={{
                        scaleY: [0.8, 1, 0.9, 1, 0.8],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ transformOrigin: "110px 125px" }}
                    >
                      <rect x="80" y="115" width="6" height="15" rx="2" fill={currentActivity.color} opacity="0.8" />
                      <rect x="90" y="110" width="6" height="20" rx="2" fill="#10B981" opacity="0.8" />
                      <rect x="100" y="120" width="6" height="10" rx="2" fill="#FFB84D" opacity="0.8" />
                      <rect x="110" y="105" width="6" height="25" rx="2" fill="#14B8A6" opacity="0.8" />
                      <rect x="120" y="112" width="6" height="18" rx="2" fill="#FF6B6B" opacity="0.8" />
                    </motion.g>
                  </motion.g>

                  {/* Floating Data Points */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.circle
                      key={`data-${i}`}
                      cx={90 + i * 15}
                      cy={70}
                      r="2"
                      fill={currentActivity.color}
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.3,
                      }}
                    />
                  ))}

                  {/* Analytics Sparkles */}
                  {[0, 1, 2].map((i) => (
                    <motion.path
                      key={`sparkle-${i}`}
                      d={`M ${160 + i * 12} ${85 - i * 8} l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z`}
                      fill={currentActivity.color}
                      opacity="0.7"
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0, 1.2, 0],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Managing Users */}
              {currentActivity.type === "users" && (
                <g>
                  <motion.g
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* User Profile Card */}
                    <rect x="60" y="70" width="100" height="80" rx="12" fill="white" opacity="0.95" />
                    
                    {/* Avatar */}
                    <circle cx="110" cy="95" r="12" fill={currentActivity.color} opacity="0.3" />
                    <circle cx="110" cy="95" r="8" fill="white" />
                    <circle cx="108" cy="93" r="1.5" fill="#1A2B4F" />
                    <circle cx="112" cy="93" r="1.5" fill="#1A2B4F" />
                    <path d="M 107 96 Q 110 98 113 96" stroke="#1A2B4F" strokeWidth="1" fill="none" strokeLinecap="round" />
                    
                    {/* User Info Lines */}
                    <rect x="70" y="112" width="80" height="4" rx="2" fill={currentActivity.color} opacity="0.6" />
                    <rect x="80" y="120" width="60" height="3" rx="1.5" fill="#E5E7EB" />
                    <rect x="75" y="127" width="70" height="3" rx="1.5" fill="#E5E7EB" />
                    
                    {/* Action Buttons */}
                    <motion.rect
                      x="70"
                      y="137"
                      width="35"
                      height="8"
                      rx="4"
                      fill={currentActivity.color}
                      opacity="0.8"
                      animate={{
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    />
                    <rect x="115" y="137" width="35" height="8" rx="4" fill="#E5E7EB" />
                  </motion.g>

                  {/* User Icons Floating */}
                  {[0, 1, 2].map((i) => (
                    <motion.circle
                      key={`user-icon-${i}`}
                      cx={45 + i * 25}
                      cy={165}
                      r="6"
                      fill="white"
                      stroke={currentActivity.color}
                      strokeWidth="2"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                      }}
                    />
                  ))}

                  {/* Permission Checkmarks */}
                  {[0, 1].map((i) => (
                    <motion.path
                      key={`check-${i}`}
                      d={`M ${155} ${75 + i * 15} l 3 3 l 6 -6`}
                      stroke={currentActivity.color}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        pathLength: [0, 1],
                        opacity: [0, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 1,
                        delay: i * 0.5,
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Approving Bookings */}
              {currentActivity.type === "approvals" && (
                <g>
                  <motion.g
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Booking Documents Stack */}
                    <rect x="75" y="90" width="70" height="50" rx="6" fill="white" opacity="0.4" />
                    <rect x="72" y="85" width="70" height="50" rx="6" fill="white" opacity="0.7" />
                    <rect x="69" y="80" width="70" height="50" rx="6" fill="white" />
                    
                    {/* Document Content */}
                    <rect x="75" y="87" width="40" height="3" rx="1.5" fill={currentActivity.color} opacity="0.6" />
                    <rect x="75" y="93" width="55" height="2" rx="1" fill="#E5E7EB" />
                    <rect x="75" y="98" width="50" height="2" rx="1" fill="#E5E7EB" />
                    <rect x="75" y="103" width="45" height="2" rx="1" fill="#E5E7EB" />
                    <rect x="75" y="108" width="52" height="2" rx="1" fill="#E5E7EB" />
                  </motion.g>

                  {/* Approval Stamp Animation */}
                  <motion.g
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{
                      scale: [0, 1.2, 1],
                      rotate: [-15, -5, -10],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                    }}
                  >
                    <circle cx="115" cy="105" r="18" fill="none" stroke={currentActivity.color} strokeWidth="3" opacity="0.6" />
                    <motion.path
                      d="M 105 105 l 6 6 l 12 -12"
                      stroke={currentActivity.color}
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        pathLength: [0, 1],
                      }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  </motion.g>

                  {/* Floating Approval Icons */}
                  {[0, 1, 2].map((i) => (
                    <motion.circle
                      key={`approval-${i}`}
                      cx={150 + i * 10}
                      cy={70 + i * 8}
                      r="3"
                      fill={currentActivity.color}
                      animate={{
                        y: [0, -20, -40],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.4,
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Creating Itinerary */}
              {currentActivity.type === "itinerary" && (
                <g>
                  <motion.g
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Document/Itinerary */}
                    <rect x="65" y="70" width="90" height="90" rx="8" fill="white" />
                    
                    {/* Title Line */}
                    <rect x="72" y="78" width="55" height="4" rx="2" fill={currentActivity.color} opacity="0.7" />
                    
                    {/* Timeline Dots and Lines */}
                    {[0, 1, 2, 3].map((i) => (
                      <g key={`timeline-${i}`}>
                        <motion.circle
                          cx="78"
                          cy={95 + i * 14}
                          r="3"
                          fill={currentActivity.color}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                        {i < 3 && (
                          <line
                            x1="78"
                            y1={98 + i * 14}
                            x2="78"
                            y2={95 + (i + 1) * 14}
                            stroke={currentActivity.color}
                            strokeWidth="1.5"
                            opacity="0.4"
                          />
                        )}
                        <rect x="85" y={92 + i * 14} width="60" height="2.5" rx="1.25" fill="#E5E7EB" />
                        <rect x="85" y={96 + i * 14} width="50" height="2" rx="1" fill="#E5E7EB" opacity="0.6" />
                      </g>
                    ))}
                  </motion.g>

                  {/* Writing/Editing Pen */}
                  <motion.g
                    animate={{
                      x: [140, 145, 140],
                      y: [130, 135, 130],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <rect x="145" y="135" width="4" height="15" rx="2" fill={currentActivity.color} transform="rotate(-45 147 142)" />
                    <path d="M 142 145 l -3 3 l 6 -1 Z" fill={currentActivity.color} opacity="0.8" />
                  </motion.g>

                  {/* Sparkles from creation */}
                  {[0, 1, 2].map((i) => (
                    <motion.path
                      key={`create-sparkle-${i}`}
                      d={`M ${160 + i * 8} ${100 - i * 10} l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z`}
                      fill={currentActivity.color}
                      opacity="0.6"
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Managing Feedback */}
              {currentActivity.type === "feedback" && (
                <g>
                  <motion.g
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Feedback Bubble Main */}
                    <path
                      d="M 70 90 Q 70 75 85 75 L 135 75 Q 150 75 150 90 L 150 120 Q 150 135 135 135 L 95 135 L 85 145 L 85 135 Q 70 135 70 120 Z"
                      fill="white"
                      stroke={currentActivity.color}
                      strokeWidth="2"
                      opacity="0.95"
                    />
                    
                    {/* Star Ratings */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.path
                        key={`star-${i}`}
                        d={`M ${85 + i * 11} 95 l 2 6 l 6 0 l -5 4 l 2 6 l -5 -3 l -5 3 l 2 -6 l -5 -4 l 6 0 Z`}
                        fill={currentActivity.color}
                        opacity="0.8"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}

                    {/* Feedback Text Lines */}
                    <rect x="80" y="115" width="60" height="2.5" rx="1.25" fill="#E5E7EB" />
                    <rect x="80" y="121" width="55" height="2.5" rx="1.25" fill="#E5E7EB" />
                    <rect x="80" y="127" width="50" height="2.5" rx="1.25" fill="#E5E7EB" />
                  </motion.g>

                  {/* Additional Feedback Bubbles (smaller) */}
                  {[0, 1].map((i) => (
                    <motion.g
                      key={`bubble-${i}`}
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    >
                      <path
                        d={`M ${45 + i * 110} ${85 + i * 20} Q ${45 + i * 110} ${75 + i * 20} ${55 + i * 110} ${75 + i * 20} L ${75 + i * 110} ${75 + i * 20} Q ${85 + i * 110} ${75 + i * 20} ${85 + i * 110} ${85 + i * 20} L ${85 + i * 110} ${95 + i * 20} Q ${85 + i * 110} ${105 + i * 20} ${75 + i * 110} ${105 + i * 20} L ${60 + i * 110} ${105 + i * 20} L ${55 + i * 110} ${112 + i * 20} L ${55 + i * 110} ${105 + i * 20} Q ${45 + i * 110} ${105 + i * 20} ${45 + i * 110} ${95 + i * 20} Z`}
                        fill="white"
                        opacity="0.6"
                      />
                    </motion.g>
                  ))}

                  {/* Heart icons (positive feedback) */}
                  {[0, 1].map((i) => (
                    <motion.path
                      key={`heart-${i}`}
                      d={`M ${160 + i * 10} ${80 + i * 15} c -2 -2 -5 -2 -7 0 c -2 -2 -5 -2 -7 0 c -2 2 -2 5 0 7 l 7 7 l 7 -7 c 2 -2 2 -5 0 -7 Z`}
                      fill={currentActivity.color}
                      opacity="0.6"
                      animate={{
                        scale: [0, 1.2, 1, 0],
                        opacity: [0, 0.8, 0.6, 0],
                        y: [0, -15, -30, -45],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 1,
                      }}
                    />
                  ))}
                </g>
              )}
            </svg>
          </motion.div>
        </AnimatePresence>

        {/* Pulsing Ring on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/40"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.1, opacity: [0.5, 0, 0.5] }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
