import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, ImagePlus, Loader2, Lock, Plus, Share2, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fitverseAiApi, FitverseAiClothesType, FitverseAiModel, FitverseAiTryOnType, WearType } from "@/services/api";

type ModelSlotStatus = "checking" | "verified" | "rejected";

type ModelSlot = {
  id: string;
  name: string;
  gender: FitverseAiModel["gender"];
  file: File | null;
  imageUrl: string;
  previewUrl: string;
  status: ModelSlotStatus;
  goodTypes: FitverseAiClothesType[];
  note?: string;
};

type ClothesCheckState = {
  status: "idle" | "checking" | "ready" | "warn" | "error";
  message?: string;
  detectedType?: FitverseAiClothesType;
};

export type TryOnPrefill = {
  imageUrl: string;
  wearType: WearType;
  productId?: string;
  source?: "shop" | "thrift";
  category?: string;
};

const TRY_ON_LABELS: Record<FitverseAiTryOnType, string> = {
  upper: "Top",
  lower: "Bottom",
  combo: "Top + Bottom",
  full_set: "Full Outfit",
};

const DEFAULT_FRAME_HEIGHT = "h-[340px]";

const formatGender = (value?: FitverseAiModel["gender"]) => {
  if (!value) return "";
  return `${value.charAt(0)}${value.slice(1).toLowerCase()}`;
};

type AITryOnProps = {
  availableCredits?: number;
  onCreditsRefresh?: () => void;
  prefill?: TryOnPrefill | null;
};


// ── Resolution check hook ────────────────────────────────────────────────
function useResolutionCheck(file: File | null) {
  const [isLowRes, setIsLowRes] = useState(false);

  useEffect(() => {
    if (!file) {
      setIsLowRes(false);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setIsLowRes(img.width < 800 || img.height < 800);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setIsLowRes(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  return isLowRes;
}

export function AITryOn({ availableCredits, onCreditsRefresh, prefill }: AITryOnProps) {
  const [models, setModels] = useState<ModelSlot[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [modelNotice, setModelNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelGender, setNewModelGender] = useState<FitverseAiModel["gender"] | "">("");
  const [newModelFile, setNewModelFile] = useState<File | null>(null);
  const [newModelMessage, setNewModelMessage] = useState<string | null>(null);
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [tryOnType, setTryOnType] = useState<FitverseAiTryOnType>("upper");
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [fullFile, setFullFile] = useState<File | null>(null);
  const [topCheck, setTopCheck] = useState<ClothesCheckState>({ status: "idle" });
  const [bottomCheck, setBottomCheck] = useState<ClothesCheckState>({ status: "idle" });
  const [fullCheck, setFullCheck] = useState<ClothesCheckState>({ status: "idle" });
  const [hdMode, setHdMode] = useState(false);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultTaskId, setResultTaskId] = useState<string | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const isBusy = taskStatus === "CREATED" || taskStatus === "PROCESSING";

  const newModelPreview = useObjectPreview(newModelFile);
  const isLowRes = useResolutionCheck(newModelFile);
  const mustCreateModel = models.length === 0;

  const pollRef = useRef<number | null>(null);
  const prefillKeyRef = useRef<string | null>(null);

  const activeModel = useMemo(() => models.find((model) => model.id === activeModelId) || null, [models, activeModelId]);

  const topPreview = useObjectPreview(topFile);
  const bottomPreview = useObjectPreview(bottomFile);
  const fullPreview = useObjectPreview(fullFile);

  const modelSupportsSelection = useMemo(() => {
    if (!activeModel) return false;
    if (!activeModel.goodTypes?.length) return true;
    if (tryOnType === "combo") {
      return activeModel.goodTypes.includes("upper") && activeModel.goodTypes.includes("lower");
    }
    if (tryOnType === "full_set") {
      return activeModel.goodTypes.includes("full");
    }
    return activeModel.goodTypes.includes(tryOnType);
  }, [activeModel, tryOnType]);

  const creditCost = hdMode ? 2 : 1;
  const hasCredits = availableCredits == null || availableCredits >= creditCost;

  const requiredReady = useMemo(() => {
    if (!activeModel || activeModel.status !== "verified") return false;
    if (!modelSupportsSelection) return false;
    if (!hasCredits) return false;

    if (tryOnType === "combo") {
      return !!topFile && !!bottomFile;
    }
    if (tryOnType === "upper") return !!topFile;
    if (tryOnType === "lower") return !!bottomFile;
    return !!fullFile;
  }, [activeModel, modelSupportsSelection, hasCredits, tryOnType, topFile, bottomFile, fullFile]);

  useEffect(() => {
    if (tryOnType === "upper") {
      setBottomFile(null);
      setBottomCheck({ status: "idle" });
      setFullFile(null);
      setFullCheck({ status: "idle" });
    } else if (tryOnType === "lower") {
      setTopFile(null);
      setTopCheck({ status: "idle" });
      setFullFile(null);
      setFullCheck({ status: "idle" });
    } else if (tryOnType === "combo") {
      setFullFile(null);
      setFullCheck({ status: "idle" });
    } else {
      setTopFile(null);
      setTopCheck({ status: "idle" });
      setBottomFile(null);
      setBottomCheck({ status: "idle" });
    }
    setResultUrl(null);
    setResultTaskId(null);
    setError(null);
  }, [tryOnType]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fitverseAiApi.getModels();
        const list = response.data || [];
        const mapped = list.map((item, index) => mapModelRecord(item, index));
        setModels(mapped);
        if (mapped.length > 0) {
          setActiveModelId(mapped[0].id);
        } else {
          setDialogOpen(true);
        }
      } catch (err) {
        setModelNotice("Could not load saved models.");
        setDialogOpen(true);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (resultPreviewUrl) {
        URL.revokeObjectURL(resultPreviewUrl);
      }
    };
  }, [resultPreviewUrl]);

  useEffect(() => {
    if (!prefill?.imageUrl || !prefill.wearType) return;

    const key = `${prefill.wearType}:${prefill.imageUrl}`;
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    let canceled = false;

    const applyPrefill = async () => {
      setError(null);
      setResultUrl(null);
      setResultTaskId(null);
      setResultPreviewUrl(null);

      // KURTI category → use full_set (not upper)
      const nextType: FitverseAiTryOnType = prefill.category === 'KURTI'
        ? "full_set"
        : prefill.wearType === "BOTTOMWEAR" ? "lower" : "upper";
      setTryOnType(nextType);

      try {
        const file = await fetchClothFile(prefill.imageUrl, prefill.productId || "product");
        if (canceled) return;

        if (nextType === "full_set") {
          setFullFile(file);
          setFullCheck({ status: "ready", message: "Selected from product", detectedType: "full" });
        } else if (nextType === "upper") {
          setTopFile(file);
          setTopCheck({ status: "ready", message: "Selected from product", detectedType: "upper" });
        } else {
          setBottomFile(file);
          setBottomCheck({ status: "ready", message: "Selected from product", detectedType: "lower" });
        }
      } catch (err) {
        if (canceled) return;
        setError("Failed to load product image for try-on.");
      }
    };

    applyPrefill();

    return () => {
      canceled = true;
    };
  }, [prefill]);

  const resetDialog = () => {
    setNewModelName("");
    setNewModelGender("");
    setNewModelFile(null);
    setNewModelMessage(null);
    setIsCreatingModel(false);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetDialog();
  };

  const openModelDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const updateModel = (id: string, updates: Partial<ModelSlot>) => {
    setModels((prev) => prev.map((model) => (model.id === id ? { ...model, ...updates } : model)));
  };

  const handleCreateModel = async () => {
    if (models.length >= 2) {
      setNewModelMessage("You can save up to 2 models.");
      return;
    }
    if (!newModelName.trim()) {
      setNewModelMessage("Please enter a model name.");
      return;
    }
    if (!newModelGender) {
      setNewModelMessage("Please select a gender.");
      return;
    }
    if (!newModelFile) {
      setNewModelMessage("Please upload a full-body photo.");
      return;
    }

    setResultUrl(null);
    setResultTaskId(null);
    setTaskStatus(null);
    setProgress(0);
    setError(null);
    setNewModelMessage("Verifying model...");
    setIsCreatingModel(true);

    try {
      const response = await fitverseAiApi.createModel(newModelFile, newModelName.trim(), newModelGender);
      const payload = response.data;
      const check = payload?.check;
      const model = payload?.model;

      if (!check?.is_good || !model) {
        setNewModelMessage("Model rejected. Please upload a clearer full-body photo.");
        setIsCreatingModel(false);
        return;
      }

      const mapped = mapModelRecord(model, models.length, newModelFile);
      setModels((prev) => [mapped, ...prev].slice(0, 2));
      setActiveModelId(mapped.id);
      setModelNotice(check.error_code ? "Model verified with a warning" : "Model verified");
      setIsCreatingModel(false);
      setDialogOpen(false);
      resetDialog();
    } catch (err) {
      setIsCreatingModel(false);
      setNewModelMessage("Model verification failed. Please try again.");
    }
  };

  const handleClothUpload = async (file: File, kind: "top" | "bottom" | "full") => {
    setResultUrl(null);
    setResultTaskId(null);
    setTaskStatus(null);
    setProgress(0);
    setError(null);

    if (kind === "top") {
      setTopFile(file);
      setTopCheck({ status: "checking" });
    }
    if (kind === "bottom") {
      setBottomFile(file);
      setBottomCheck({ status: "checking" });
    }
    if (kind === "full") {
      setFullFile(file);
      setFullCheck({ status: "checking" });
    }

    try {
      const response = await fitverseAiApi.checkClothes(file);
      const data = response.data;
      const isValid = data?.is_clothes;
      const detectedType = data?.clothes_type;
      const message = isValid ? `Detected ${detectedType}` : "Image may not be a valid clothing item";
      const status = isValid ? "ready" : "warn";

      if (kind === "top") setTopCheck({ status, message, detectedType });
      if (kind === "bottom") setBottomCheck({ status, message, detectedType });
      if (kind === "full") setFullCheck({ status, message, detectedType });
    } catch (err) {
      const fallback = { status: "error", message: "Could not validate this image" } as ClothesCheckState;
      if (kind === "top") setTopCheck(fallback);
      if (kind === "bottom") setBottomCheck(fallback);
      if (kind === "full") setFullCheck(fallback);
    }
  };

  const handleShareResult = async () => {
    if (!resultUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Fitverse AI Try-On",
          url: resultUrl,
        });
      } catch (err) {
        // Ignore share cancellations.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(resultUrl);
    } catch (err) {
      // Ignore clipboard failures silently.
    }
  };

  const loadResultPreview = async (taskId: string) => {
    try {
      const blob = await fitverseAiApi.getTryOnResult(taskId);
      const objectUrl = URL.createObjectURL(blob);
      setResultPreviewUrl(objectUrl);
      return true;
    } catch (err) {
      setResultPreviewUrl(null);
      setError("Unable to load the result image. Please try again.");
      return false;
    }
  };

  const handleDownloadResult = async () => {
    if (resultPreviewUrl) {
      const link = document.createElement("a");
      link.href = resultPreviewUrl;
      link.download = "fitverse-tryon.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    if (!resultTaskId && !resultUrl) return;
    try {
      const blob = resultTaskId
        ? await fitverseAiApi.getTryOnResult(resultTaskId)
        : await (async () => {
            const response = await fetch(resultUrl as string);
            if (!response.ok) {
              throw new Error("Download failed");
            }
            return response.blob();
          })();
      const contentType = blob.type || "image/jpeg";
      const ext = contentType.split("/")[1] || "jpg";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitverse-tryon.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Download failed. Please try again.");
    }
  };

  const handleConfirmRemove = (id: string) => {
    if (!window.confirm("Delete this model?")) return;
    handleRemoveModel(id);
  };

  const handleGenerate = async () => {
    if (!activeModel || !requiredReady) return;
    if (availableCredits != null && availableCredits < creditCost) {
      setError(`Not enough credits. ${creditCost} credits required.`);
      return;
    }
    setError(null);
    setResultUrl(null);
    setResultTaskId(null);
    setResultPreviewUrl(null);
    setTaskStatus("CREATED");
    setProgress(0);

    let modelFile = activeModel.file;
    if (!modelFile && activeModel.imageUrl) {
      try {
        setModelLoading(true);
        modelFile = await fetchModelFile(activeModel.imageUrl, activeModel.id);
        updateModel(activeModel.id, { file: modelFile });
      } catch (err) {
        setModelLoading(false);
        setError("Failed to load the saved model.");
        setTaskStatus(null);
        return;
      }
      setModelLoading(false);
    }

    try {
      const response = await fitverseAiApi.createTryOnTask({
        modelImage: modelFile as File,
        clothType: tryOnType,
        clothImage: tryOnType === "upper" || tryOnType === "combo"
          ? topFile || undefined
          : tryOnType === "lower"
            ? bottomFile || undefined
            : fullFile || undefined,
        lowerClothImage: tryOnType === "combo" ? bottomFile || undefined : undefined,
        hdMode,
      });

      const taskId = response.data?.task_id;
      if (!taskId) {
        throw new Error("Failed to create task");
      }
      setResultTaskId(taskId);
      pollStatus(taskId, 0);
    } catch (err) {
      const message = (err as any)?.response?.data?.message;
      setError(message || "Failed to start try-on. Please retry.");
      setTaskStatus(null);
    }
  };

  const pollStatus = async (taskId: string, attempt: number) => {
    try {
      const response = await fitverseAiApi.getTryOnStatus(taskId);
      const data = response.data;
      if (!data) throw new Error("Missing task data");

      setTaskStatus(data.status);
      setProgress(data.progress || 0);

      if (data.status === "COMPLETED") {
        const nextUrl = data.result_url || null;
        setResultUrl(nextUrl);
        setResultTaskId(taskId);
        const loaded = await loadResultPreview(taskId);
        if (loaded && onCreditsRefresh) onCreditsRefresh();
        return;
      }

      if (data.status === "FAILED") {
        setError(data.error || "Try-on failed. Please retry.");
        return;
      }

      const delay = Math.min(2000 + attempt * 300, 4000);
      pollRef.current = window.setTimeout(() => pollStatus(taskId, attempt + 1), delay);
    } catch (err) {
      setError("Failed to fetch task status.");
    }
  };

  const handleRemoveModel = async (id: string) => {
    try {
      await fitverseAiApi.deleteModel(id);
    } catch (err) {
      // Ignore delete errors for now.
    }
    setModels((prev) => {
      const removed = prev.find((model) => model.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const next = prev.filter((model) => model.id !== id);
      if (activeModelId === id) {
        setActiveModelId(next[0]?.id || null);
      }
      if (next.length === 0) {
        setDialogOpen(true);
      }
      return next;
    });
  };

  const renderUploadFrame = (
    label: string,
    file: File | null,
    previewUrl: string | null,
    onSelect: (file: File) => void,
    status: ClothesCheckState,
    disabled?: boolean
  ) => (
    <label className={cn("flex flex-col gap-3 h-full", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const fileInput = event.target.files?.[0];
          if (fileInput) onSelect(fileInput);
        }}
      />
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border/70 bg-secondary/40 flex items-center justify-center overflow-hidden",
          "transition-colors hover:border-foreground/40",
          DEFAULT_FRAME_HEIGHT
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <ImagePlus className="w-8 h-8 mb-2" />
            <p className="font-medium">Add {label}</p>
            <p className="text-xs">PNG or JPG, 1024px recommended</p>
          </div>
        )}
      </div>
      {file && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {status.status === "checking" && <Loader2 className="w-3 h-3 animate-spin" />}
          {status.status === "ready" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          {status.status === "warn" && <AlertCircle className="w-3 h-3 text-amber-500" />}
          {status.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
          <span>{status.message || file.name}</span>
        </div>
      )}
    </label>
  );

  return (
    <>
      {/* ─── Create Model Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className={cn("max-w-2xl")}>
          <DialogHeader>
            <DialogTitle>Create a model</DialogTitle>
            <DialogDescription>
              Add a name, choose a gender, and upload a full-body photo. We verify the image before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
            {/* ── Left: Dropzone ── */}
            <div className="space-y-2">
              <Label>Model photo</Label>
              <label className="relative rounded-2xl border border-dashed border-border/70 bg-secondary/40 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-foreground/40 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setNewModelFile(file);
                      setNewModelMessage(null);
                    }
                  }}
                />
                <div className={cn("relative w-full", DEFAULT_FRAME_HEIGHT)}>
                  {newModelPreview ? (
                    <img src={newModelPreview} alt="New model" className="h-full w-full object-contain relative z-10" />
                  ) : (
                    <>
                      {/* Centered text overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="font-semibold text-foreground">Upload Full Body Picture</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* ── Right: Form fields + Requirements + Privacy ── */}
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model-name">Model name</Label>
                <Input
                  id="model-name"
                  value={newModelName}
                  placeholder="e.g. Summer look"
                  onChange={(event) => {
                    setNewModelName(event.target.value);
                    if (newModelMessage) setNewModelMessage(null);
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label>Gender</Label>
                <Select
                  value={newModelGender}
                  onValueChange={(value) => {
                    setNewModelGender(value as FitverseAiModel["gender"]);
                    if (newModelMessage) setNewModelMessage(null);
                  }}
                >
                  <SelectTrigger className="h-10 cursor-pointer">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Generation Requirements ── */}
              <div className="text-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80 mb-2">Generation Requirements</p>
                <ul className="space-y-1.5 text-foreground/70">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">•</span>
                    <span>Full Body Stance: Capture yourself facing forward, standing straight.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">•</span>
                    <span>All Limbs Clear: Keep arms slightly out and legs uncrossed.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">•</span>
                    <span>Bright Lighting: Ensure your surroundings are sharp and well-lit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">•</span>
                    <span>Fitted Apparel: Wear simple, tighter clothes for the best AI accuracy.</span>
                  </li>
                </ul>
              </div>

              {/* ── Low resolution warning ── */}
              {isLowRes && (
                <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Low resolution image detected. Using images smaller than 800×800px may cause blurry or distorted try-on results.</span>
                </div>
              )}
            </div>
          </div>

          {newModelMessage && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isCreatingModel ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
              <span>{newModelMessage}</span>
            </div>
          )}

          {/* ── Privacy Banner ── */}
          <div className="flex items-start gap-2.5 bg-secondary/50 border border-border/60 rounded-lg px-3.5 py-2.5">
            <Lock className="w-3.5 h-3.5 text-foreground/60 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-foreground/80">
              <span className="font-semibold text-foreground">Privacy Guarantee:</span> Your uploaded images are entirely private, processed over encrypted tunnels, and can be completely and permanently purged from your profile at any moment via your account settings.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isCreatingModel}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateModel} disabled={isCreatingModel}>
              {isCreatingModel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_1.4fr] gap-6 cursor-default">
      {/* Column 1: Model */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Select Model</h3>
          </div>
          
        </div>

        <div
          className={cn(
            "relative rounded-2xl border border-dashed border-border/70 bg-secondary/40 flex items-center justify-center overflow-hidden",
            DEFAULT_FRAME_HEIGHT
          )}
        >
          {activeModel ? (
            <>
              <img src={activeModel.previewUrl} alt={activeModel.name} className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => handleConfirmRemove(activeModel.id)}
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/80 text-red-500 shadow-sm border border-border/60 flex items-center justify-center"
                aria-label="Delete model"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="text-center text-muted-foreground space-y-2">
              <ImagePlus className="w-8 h-8 mx-auto" />
              <p className="font-medium">Create your first model</p>
              <p className="text-xs">2048px recommended for best results</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => setActiveModelId(model.id)}
              className={cn(
                "w-12 h-12 rounded-full border-2 overflow-hidden",
                activeModelId === model.id ? "border-foreground" : "border-border/60"
              )}
            >
              <img src={model.previewUrl} alt={model.name} className="w-full h-full object-cover" />
            </button>
          ))}
          {models.length < 2 && (
            <button
              type="button"
              onClick={openModelDialog}
              className="w-12 h-12 rounded-full border border-foreground/40 bg-foreground/10 flex items-center justify-center text-foreground"
              aria-label="Add model"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {activeModel && (
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{activeModel.name} - {formatGender(activeModel.gender)}</span>
          </div>
        )}
      </div>

      {/* Column 2: Outfit */}
      <div className={cn("rounded-3xl border border-border/60 bg-card p-6 shadow-soft flex flex-col gap-4", !activeModel ? "opacity-60" : "")}> 
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold">Select Outfit</h3>
          <Select value={tryOnType} onValueChange={(value) => setTryOnType(value as FitverseAiTryOnType)}>
            <SelectTrigger className="h-10 w-[100%] mx-auto text-sm cursor-pointer">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRY_ON_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!modelSupportsSelection && activeModel && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
            This model photo may not support the selected outfit type.
          </div>
        )}

        {tryOnType === "combo" ? (
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              {renderUploadFrame("Top", topFile, topPreview, (file) => handleClothUpload(file, "top"), topCheck, !activeModel)}
            </div>
            <div className="flex-1">
              {renderUploadFrame("Bottom", bottomFile, bottomPreview, (file) => handleClothUpload(file, "bottom"), bottomCheck, !activeModel)}
            </div>
          </div>
        ) : tryOnType === "full_set" ? (
          renderUploadFrame("Full Outfit", fullFile, fullPreview, (file) => handleClothUpload(file, "full"), fullCheck, !activeModel)
        ) : tryOnType === "upper" ? (
          renderUploadFrame("Top", topFile, topPreview, (file) => handleClothUpload(file, "top"), topCheck, !activeModel)
        ) : (
          renderUploadFrame("Bottom", bottomFile, bottomPreview, (file) => handleClothUpload(file, "bottom"), bottomCheck, !activeModel)
        )}

        <label className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>HD mode (slower, better quality)</span>
          <input type="checkbox" checked={hdMode} onChange={(event) => setHdMode(event.target.checked)} />
        </label>

        
      </div>

      {/* Column 3: Output */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Try-On Result</h3>
          {taskStatus && <span className="text-xs text-muted-foreground">{taskStatus}</span>}
        </div>

        <div className="relative rounded-2xl border border-dashed border-border/70 bg-secondary/40 flex items-center justify-center overflow-hidden h-[420px]">
          {resultUrl && (
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadResult}
                className="h-9 w-9 rounded-full bg-background/80 text-foreground shadow-sm border border-border/60 flex items-center justify-center"
                aria-label="Download result"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          )}
          {resultPreviewUrl ? (
            <img src={resultPreviewUrl} alt="Try-on result" className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-muted-foreground">
              {taskStatus === "PROCESSING" || taskStatus === "CREATED" ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                  <p className="text-sm">Generating your try-on...</p>
                  <p className="text-xs">Progress {progress}%</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImagePlus className="w-8 h-8 mx-auto" />
                  <p className="text-sm">Virtual try-on result will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>
        )}
        <Button
          onClick={handleGenerate}
          disabled={!requiredReady || isBusy || modelLoading}
          variant="ai"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          {isBusy || modelLoading ? "Generating..." : "Generate Try-On"}
        </Button>
      </div>
    </div>
    </>
  );
}

function useObjectPreview(file: File | null) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return preview;
}

const addTokenToUrl = (url: string): string => {
  const token = localStorage.getItem('token');
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

const mapModelRecord = (record: FitverseAiModel, index: number, file?: File | null): ModelSlot => {
  const status: ModelSlotStatus = record.status === "VERIFIED"
    ? "verified"
    : record.status === "REJECTED"
      ? "rejected"
      : "checking";

  const imgUrl = addTokenToUrl(record.imageUrl);

  return {
    id: record.id,
    name: record.name || `Model ${index + 1}`,
    gender: record.gender || "OTHER",
    file: file || null,
    imageUrl: imgUrl,
    previewUrl: imgUrl,
    status,
    goodTypes: record.goodClothesTypes || [],
    note: record.note || undefined,
  };
};

const fetchModelFile = async (url: string, id: string) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to download model image');
  }

  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1] || 'jpg';
  return new File([blob], `model-${id}.${ext}`, { type });
};

const fetchClothFile = async (url: string, id: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download clothing image');
  }

  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1] || 'jpg';
  return new File([blob], `product-${id}.${ext}`, { type });
};