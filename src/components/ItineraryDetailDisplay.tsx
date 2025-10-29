import { MapPin, Calendar, Package, Plane, Hotel, Camera, UtensilsCrossed, Car } from "lucide-react";

interface ItineraryActivity {
  time: string;
  icon: any;
  title: string;
  description: string;
  location?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

interface ItineraryDetailDisplayProps {
  itinerary: ItineraryDay[];
  daysCount?: number;
}

export function ItineraryDetailDisplay({ itinerary, daysCount }: ItineraryDetailDisplayProps) {
  const displayDays = daysCount || itinerary.length;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-6 border-b border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFB] to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB84D] to-[#FF9800] flex items-center justify-center shadow-lg shadow-[#FFB84D]/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A2B4F]">Trip Itinerary</h3>
            <p className="text-sm text-[#64748B]">{displayDays} Days of Adventure</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {itinerary.length > 0 ? (
          <div className="space-y-8">
            {itinerary.map((day) => (
              <div key={day.day} className="relative">
                {/* Day Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A7AFF] to-[#3B9EFF] flex items-center justify-center shadow-lg shadow-[#0A7AFF]/20">
                    <span className="text-white font-semibold">D{day.day}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1A2B4F]">Day {day.day}</h4>
                    <p className="text-sm text-[#64748B]">{day.title}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="ml-6 border-l-2 border-[#E5E7EB] pl-6 space-y-6">
                  {day.activities.map((activity, idx) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={idx} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-white border-2 border-[#0A7AFF]" />
                        
                        {/* Activity Card */}
                        <div className="bg-gradient-to-br from-[#F8FAFB] to-white rounded-xl p-4 border border-[#E5E7EB] hover:border-[#0A7AFF] hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A7AFF]/10 to-[#14B8A6]/10 flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-5 h-5 text-[#0A7AFF]" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-medium text-[#1A2B4F]">{activity.title}</h5>
                                  <p className="text-sm text-[#64748B]">{activity.description}</p>
                                </div>
                                <span className="text-xs font-medium text-[#0A7AFF] bg-[#0A7AFF]/10 px-2 py-1 rounded-lg whitespace-nowrap">
                                  {activity.time}
                                </span>
                              </div>
                              {activity.location && (
                                <div className="flex items-center gap-1 text-xs text-[#64748B]">
                                  <MapPin className="w-3 h-3" />
                                  <span>{activity.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
            <p className="text-[#64748B] mb-2">No itinerary details available</p>
            <p className="text-sm text-[#94A3B8]">Itinerary information will be added soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
