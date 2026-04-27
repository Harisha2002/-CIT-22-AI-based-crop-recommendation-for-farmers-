import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Upload, Loader2, AlertTriangle, CheckCircle2, Camera } from "lucide-react";

interface DiagnosisResult {
  disease: string;
  confidence: string;
  description: string;
  symptoms: string[];
  solutions: string[];
  preventionTips: string[];
}

const Scan = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("disease-detect", {
        body: { image },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Rate limit")) toast.error("Too many requests. Please wait.");
        else if (data.error.includes("Payment")) toast.error("AI credits exhausted.");
        else throw new Error(data.error);
        return;
      }
      setResult(data.diagnosis);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Disease Scanner</h1>
        <p className="text-muted-foreground mt-1">Upload a crop or leaf image to detect diseases and get treatment advice</p>
      </div>

      {/* Upload area */}
      <div
        className="glass-card rounded-2xl p-8 text-center cursor-pointer animate-fade-in border-2 border-dashed border-border hover:border-primary/50 transition-colors"
        style={{ animationDelay: "0.1s" }}
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {image ? (
          <img src={image} alt="Uploaded crop" className="max-h-80 mx-auto rounded-xl object-contain" />
        ) : (
          <div className="py-12">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="font-semibold text-lg">Drop an image here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG up to 5MB</p>
          </div>
        )}
      </div>

      {image && (
        <div className="flex gap-3 animate-fade-in">
          <Button onClick={analyze} size="lg" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : <><Upload className="w-4 h-4 mr-2" /> Analyze Image</>}
          </Button>
          <Button variant="outline" size="lg" onClick={() => { setImage(null); setResult(null); }}>Clear</Button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">{result.disease}</h2>
                <p className="text-sm text-muted-foreground">Confidence: {result.confidence}</p>
              </div>
            </div>
            <p className="text-muted-foreground">{result.description}</p>
          </div>

          {result.symptoms.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg mb-3">Symptoms</h3>
              <ul className="space-y-2">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> Treatment & Solutions
            </h3>
            <ul className="space-y-2">
              {result.solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {result.preventionTips.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg mb-3">Prevention Tips</h3>
              <ul className="space-y-2">
                {result.preventionTips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scan;
