import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MarketItem {
  crop: string;
  currentPrice: string;
  previousPrice: string;
  trend: "up" | "down" | "stable";
  unit: string;
  market: string;
}

const Market = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("market-prices", {
          body: { region: "India" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setItems(data.prices || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load market data");
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, []);

  const filtered = items.filter((item) =>
    item.crop.toLowerCase().includes(search.toLowerCase())
  );

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Market Prices</h1>
        <p className="text-muted-foreground mt-1">Latest crop market rates and trends</p>
      </div>

      <div className="relative max-w-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search crops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Crop</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Market</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Current Price</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Previous</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{item.crop}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.market}</td>
                    <td className="px-6 py-4 text-right font-semibold">₹{item.currentPrice}/{item.unit}</td>
                    <td className="px-6 py-4 text-right text-sm text-muted-foreground">₹{item.previousPrice}/{item.unit}</td>
                    <td className="px-6 py-4 text-center"><TrendIcon trend={item.trend} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No crops found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
