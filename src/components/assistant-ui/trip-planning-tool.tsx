import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { X, ExternalLink, MapPin, Calendar, Utensils, Bed, Camera, NotebookTabs } from "lucide-react";

interface TripPlanningToolProps {
  args: {
    destination?: string;
    duration?: string;
    interests?: string;
  };
  result?: unknown;
}

interface MockUrl {
  id: string;
  title: string;
  url: string;
  favicon: string;
  description: string;
}

export function TripPlanningTool({ args }: TripPlanningToolProps) {
  const [planName, setPlanName] = useState(
    `Trip to ${args.destination || "Destination"} - ${new Date().toLocaleDateString()}`
  );
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  
  const [urls, setUrls] = useState<MockUrl[]>([
    {
      id: "1",
      title: "Booking.com - Find Hotels",
      url: "https://booking.com",
      favicon: "🏨",
      description: "Book accommodations for your trip"
    },
    {
      id: "2", 
      title: "TripAdvisor - Top Attractions",
      url: "https://tripadvisor.com",
      favicon: "🦉",
      description: "Discover popular attractions and reviews"
    },
    {
      id: "3",
      title: "Skyscanner - Flight Deals",
      url: "https://skyscanner.com", 
      favicon: "✈️",
      description: "Compare flight prices and book tickets"
    },
    {
      id: "4",
      title: "Google Maps - Navigation",
      url: "https://maps.google.com",
      favicon: "🗺️", 
      description: "Plan routes and explore locations"
    },
    {
      id: "5",
      title: "Yelp - Local Restaurants",
      url: "https://yelp.com",
      favicon: "🍽️",
      description: "Find and review local dining options"
    }
  ]);

  const [itinerary, setItinerary] = useState([
    { day: 1, activity: "", notes: "" },
    { day: 2, activity: "", notes: "" },
    { day: 3, activity: "", notes: "" }
  ]);

  const removeUrl = (id: string) => {
    setUrls(urls.filter(url => url.id !== id));
  };

  const updateItinerary = (index: number, field: 'activity' | 'notes', value: string) => {
    const updated = [...itinerary];
    if (updated[index]) {
      updated[index] = { 
        day: updated[index].day, 
        activity: updated[index].activity, 
        notes: updated[index].notes,
        [field]: value 
      };
      setItinerary(updated);
    }
  };

  const addItineraryDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, activity: "", notes: "" }]);
  };

  const removeItineraryDay = (indexToRemove: number) => {
    if (itinerary.length > 1) { // Keep at least one day
      const updated = itinerary.filter((_, index) => index !== indexToRemove);
      // Renumber the remaining days
      const renumbered = updated.map((day, index) => ({ ...day, day: index + 1 }));
      setItinerary(renumbered);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Trip Planning Assistant
        </CardTitle>
        {args.destination && (
          <p className="text-sm text-muted-foreground">
            Planning your trip to {args.destination}
            {args.duration && ` for ${args.duration}`}
            {args.interests && ` • Interests: ${args.interests}`}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trip Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Trip Name</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Name your trip plan"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$2,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Quick Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special considerations..."
              />
            </div>
          </div>
        </div>
        <hr></hr>

        {/* Helpful URLs Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <NotebookTabs className="h-4 w-4" />
            Your Current Tabs
          </h3>
          <p className="text-xs text-muted-foreground">
           We brought in your current tabs to help! Feel free to close any that do not have to do with this trip!
          </p>
          <div className="space-y-2">
            {urls.map((url) => (
              <div
                key={url.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{url.favicon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{url.title}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {url.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(url.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <hr></hr>

        {/* Planning Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="itinerary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="accommodation" className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="dining" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              <span className="hidden sm:inline">Dining</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span className="hidden sm:inline">Sights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="space-y-4">
            <div className="space-y-3">
              {itinerary.map((day, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Day {day.day}</h4>
                    {itinerary.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItineraryDay(index)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`activity-${index}`}>Main Activity</Label>
                      <Input
                        id={`activity-${index}`}
                        value={day.activity}
                        onChange={(e) => updateItinerary(index, 'activity', e.target.value)}
                        placeholder="Visit museum, hike trail, etc."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`notes-${index}`}>Notes</Label>
                      <Input
                        id={`notes-${index}`}
                        value={day.notes}
                        onChange={(e) => updateItinerary(index, 'notes', e.target.value)}
                        placeholder="Times, reservations, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addItineraryDay} className="w-full">
                Add Another Day
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="accommodation" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Bed className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Hotel Planning</h3>
              <p className="text-sm">
                Track your accommodation options and bookings here.
                <br />
                <span className="text-xs">(Feature coming soon)</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="dining" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Restaurant Planning</h3>
              <p className="text-sm">
                Save restaurants and dining experiences you want to try.
                <br />
                <span className="text-xs">(Feature coming soon)</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="attractions" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Attractions & Sightseeing</h3>
              <p className="text-sm">
                Plan your must-see attractions and photo spots.
                <br />
                <span className="text-xs">(Feature coming soon)</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button className="flex-1">Save Trip Plan</Button>
          <Button variant="outline">Export</Button>
          <Button variant="outline">Share</Button>
        </div>
      </CardContent>
    </Card>
  );
}