import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Wheat, IndianRupee, CalendarDays, Droplets, Thermometer } from "lucide-react";

interface CropSuggestion {
  name: string;
  season: string;
  marketPrice: string;
  waterRequirement: string;
  growthDuration: string;
  description: string;
  suitabilityScore: number;
}

const Crops = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);
  const [form, setForm] = useState({
    soilType: "",
    region: "",
    season: "",
    rainfall: "",
    temperature: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
  });

  const handleChange = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("crop-recommend", {
        body: form,
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Rate limit")) toast.error("Too many requests. Please wait a moment.");
        else if (data.error.includes("Payment")) toast.error("AI credits exhausted. Please try later.");
        else throw new Error(data.error);
        return;
      }
      setSuggestions(data.suggestions || []);
      if (!data.suggestions?.length) toast.info("No suggestions found. Try adjusting your inputs.");
    } catch (err: any) {
      toast.error(err.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Crop Advisor</h1>
        <p className="text-muted-foreground mt-1">Enter your soil and climate details for AI-powered crop suggestions</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Soil Type</Label>
            <Select onValueChange={(v) => handleChange("soilType", v)} required>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select soil" /></SelectTrigger>
              <SelectContent>
                {["Sandy", "Clay", "Loamy", "Silt", "Red", "Black", "Alluvial", "Laterite"].map((s) => (
                  <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Region</Label>
            <Input placeholder="e.g. Punjab, India" value={form.region} onChange={(e) => handleChange("region", e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Season</Label>
            <Select onValueChange={(v) => handleChange("season", v)} required>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select season" /></SelectTrigger>
              <SelectContent>
                {["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Avg. Rainfall (mm)</Label>
            <Input type="number" placeholder="e.g. 800" value={form.rainfall} onChange={(e) => handleChange("rainfall", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Temperature (°C)</Label>
            <Input type="number" placeholder="e.g. 30" value={form.temperature} onChange={(e) => handleChange("temperature", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Nitrogen (N) kg/ha</Label>
            <Input type="number" placeholder="e.g. 80" value={form.nitrogen} onChange={(e) => handleChange("nitrogen", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Phosphorus (P) kg/ha</Label>
            <Input type="number" placeholder="e.g. 40" value={form.phosphorus} onChange={(e) => handleChange("phosphorus", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Potassium (K) kg/ha</Label>
            <Input type="number" placeholder="e.g. 50" value={form.potassium} onChange={(e) => handleChange("potassium", e.target.value)} className="mt-1" />
          </div>
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : "Get Crop Suggestions"}
        </Button>
      </form>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-2xl font-display font-bold">Recommended Crops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((crop, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Wheat className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-display font-bold text-lg">{crop.name}</h3>
                  </div>
                  <span className="text-sm font-bold text-primary">{crop.suitabilityScore}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{crop.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-primary" /><span>{crop.season}</span></div>
                  <div className="flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-secondary" /><span>{crop.marketPrice}</span></div>
                  <div className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-primary" /><span>{crop.waterRequirement}</span></div>
                  <div className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-secondary" /><span>{crop.growthDuration}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Crops;
