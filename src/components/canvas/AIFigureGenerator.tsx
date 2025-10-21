import { useState, useCallback } from "react";
import { Upload, Sparkles, X, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Canvas as FabricCanvas, FabricImage, Text as FabricText, Group, loadSVGFromString, util } from "fabric";
import { createConnector } from "@/lib/connectorSystem";

interface AIFigureGeneratorProps {
  canvas: FabricCanvas | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedLayout {
  objects: Array<{
    type: string;
    element_index: number;
    icon_id: string;
    icon_name: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    label?: string;
    labelPosition?: "top" | "bottom" | "left" | "right";
  }>;
  connectors: Array<{
    from: number;
    to: number;
    type: string;
    style: string;
    strokeWidth: number;
    color: string;
    startMarker?: string;
    endMarker?: string;
    label?: string;
  }>;
}

interface Check {
  relationship: string;
  relationship_type?: string;
  status: 'pass' | 'corrected' | 'missing';
  issues?: string[];
  corrected_style?: any;
  issue?: string;
}

interface CritiqueIssue {
  type: string;
  severity: 'critical' | 'moderate' | 'minor';
  element_or_connector: string;
  problem: string;
  current_value?: string;
  should_be?: string;
}

interface CritiqueFix {
  fix_type: string;
  target?: number;
  action: string;
  new_x?: number;
  new_y?: number;
  new_scale?: number;
  reason: string;
}

interface Critique {
  overall_accuracy: 'excellent' | 'good' | 'fair' | 'poor';
  issues: CritiqueIssue[];
  recommended_fixes: CritiqueFix[];
  confidence: 'high' | 'medium' | 'low';
}

interface GenerationResponse {
  analysis: any;
  proposed_layout: GeneratedLayout;
  layout: GeneratedLayout;
  checks: Check[];
  metadata: any;
  critique?: Critique | null;
}

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  progress: number;
  details?: string;
}

const initialProgressStages: ProgressStage[] = [
  {
    id: 'element_detection',
    name: 'Analyzing Elements',
    description: 'Identifying biological elements and their positions',
    status: 'pending',
    progress: 0
  },
  {
    id: 'connector_analysis',
    name: 'Analyzing Connectors',
    description: 'Detecting arrows and relationships',
    status: 'pending',
    progress: 0
  },
  {
    id: 'search_term_generation',
    name: 'Generating Search Terms',
    description: 'AI-powered term optimization for icon matching',
    status: 'pending',
    progress: 0
  },
  {
    id: 'icon_verification',
    name: 'Verifying Icon Matches',
    description: 'Semantically ranking best icon matches',
    status: 'pending',
    progress: 0
  },
  {
    id: 'layout_generation',
    name: 'Generating Layout',
    description: 'Creating diagram layout with visual reference',
    status: 'pending',
    progress: 0
  },
  {
    id: 'self_critique',
    name: 'Self-Critique & Refinement',
    description: 'AI reviewing and correcting layout accuracy',
    status: 'pending',
    progress: 0
  },
  {
    id: 'final_processing',
    name: 'Final Processing',
    description: 'Building final layout and running checks',
    status: 'pending',
    progress: 0
  }
];

export const AIFigureGenerator = ({ canvas, open, onOpenChange }: AIFigureGeneratorProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  const [activeTab, setActiveTab] = useState("reference");
  const [progressStages, setProgressStages] = useState<ProgressStage[]>(initialProgressStages);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResponse(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async (strictMode = false) => {
    if (!image || !canvas) return;

    setIsGenerating(true);
    
    // Reset progress stages
    setProgressStages(initialProgressStages.map(s => ({ 
      ...s, 
      status: 'pending', 
      progress: 0 
    })));

    // Simulate progress tracking based on estimated timings
    const stageTimings = [
      { id: 'element_detection', duration: 7000 },
      { id: 'connector_analysis', duration: 7000 },
      { id: 'search_term_generation', duration: 12000 },
      { id: 'icon_verification', duration: 12000 },
      { id: 'layout_generation', duration: 9000 },
      { id: 'self_critique', duration: 9000 },
      { id: 'final_processing', duration: 2500 }
    ];

    let elapsed = 0;
    const updateProgress = () => {
      elapsed += 100; // Update every 100ms
      
      let totalDuration = 0;
      for (let i = 0; i < stageTimings.length; i++) {
        const stage = stageTimings[i];
        totalDuration += stage.duration;
        
        if (elapsed < totalDuration) {
          const stageElapsed = elapsed - (totalDuration - stage.duration);
          const stageProgress = Math.min(100, (stageElapsed / stage.duration) * 100);
          
          setProgressStages(stages => stages.map(s => {
            if (s.id === stage.id) {
              return { ...s, status: 'active', progress: stageProgress };
            } else if (stageTimings.findIndex(st => st.id === s.id) < i) {
              return { ...s, status: 'complete', progress: 100 };
            }
            return s;
          }));
          break;
        }
      }
    };

    const progressInterval = setInterval(updateProgress, 100);

    try {
      const { data, error } = await supabase.functions.invoke('generate-figure-from-reference', {
        body: {
          image,
          description: description.trim(),
          canvasWidth: canvas.width || 800,
          canvasHeight: canvas.height || 600,
          strict: strictMode,
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data.error) {
        // Mark current stage as error
        setProgressStages(stages => stages.map(s => 
          s.status === 'active' ? { ...s, status: 'error' } : s
        ));
        toast.error(data.error);
      } else {
        // Mark all as complete
        setProgressStages(stages => stages.map(s => ({ 
          ...s, 
          status: 'complete', 
          progress: 100 
        })));
        
        setResponse(data);
        setActiveTab("checks");
        
        const { metadata } = data;
        toast.success(
          `Generated ${metadata.total_objects} objects, ${metadata.total_connectors} connectors. ` +
          `Checks: ${metadata.checks_passed} passed, ${metadata.checks_corrected} corrected.`
        );
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      // Mark current stage as error
      setProgressStages(stages => stages.map(s => 
        s.status === 'active' ? { ...s, status: 'error' } : s
      ));
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate figure");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyLayout = async (useProposed = false) => {
    if (!response || !canvas) return;

    const layoutToApply = useProposed ? response.proposed_layout : response.layout;

    try {
      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;

      // Build a mapping from layout object index -> addedObjects index to keep connectors valid
      const objects = layoutToApply.objects || [];
      const isValidUuid = (v: string) =>
        typeof v === 'string' &&
        v.length === 36 &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

      // Collect valid indices and icon ids to fetch in one round-trip
      const validIdxs: number[] = [];
      const iconIds: string[] = [];
      objects.forEach((obj, i) => {
        if (obj.icon_id && isValidUuid(obj.icon_id)) {
          validIdxs.push(i);
          iconIds.push(obj.icon_id);
        }
      });

      if (validIdxs.length === 0) {
        toast.error("No valid icons to add to canvas");
        return;
      }

      const { data: icons, error } = await supabase
        .from('icons')
        .select('id, svg_content, name')
        .in('id', iconIds);

      if (error) {
        throw new Error(`Failed to fetch icons: ${error.message}`);
      }

      const iconMap = new Map(icons?.map(icon => [icon.id, icon]) || []);

      const addedObjects: any[] = [];
      const indexMap: Record<number, number> = {}; // maps layout index -> addedObjects index

      for (const i of validIdxs) {
        const obj = objects[i];
        const iconData = iconMap.get(obj.icon_id);
        if (!iconData) continue;

        try {
          const { objects: svgObjects, options } = await loadSVGFromString(iconData.svg_content);
          const group = util.groupSVGElements(svgObjects, options);

          const originalWidth = group.width || 100;
          const originalHeight = group.height || 100;
          const TARGET_SIZE = 200;
          const maxDimension = Math.max(originalWidth, originalHeight);
          const normalizationScale = TARGET_SIZE / maxDimension;
          const finalScale = normalizationScale * obj.scale;

          const x = (obj.x / 100) * canvasWidth;
          const y = (obj.y / 100) * canvasHeight;

          group.set({
            left: x,
            top: y,
            scaleX: finalScale,
            scaleY: finalScale,
            angle: obj.rotation,
          });

          canvas.add(group);
          addedObjects.push(group);
          indexMap[i] = addedObjects.length - 1; // remember mapping

          if (obj.label) {
            const labelOffsets = {
              top: { x: 0, y: -40 },
              bottom: { x: 0, y: 40 },
              left: { x: -60, y: 0 },
              right: { x: 60, y: 0 },
            } as const;
            const offset = labelOffsets[obj.labelPosition || 'bottom'];

            const text = new FabricText(obj.label, {
              left: x + offset.x,
              top: y + offset.y,
              fontSize: 14,
              fill: '#000000',
              fontFamily: 'Arial',
            });
            canvas.add(text);
          }
        } catch (err) {
          console.error(`Failed to load icon ${iconData?.name || obj.icon_id}:`, err);
        }
      }

      for (const conn of layoutToApply.connectors) {
        const fromAdded = indexMap[conn.from];
        const toAdded = indexMap[conn.to];

        const fromObj = addedObjects[fromAdded];
        const toObj = addedObjects[toAdded];

        if (fromObj && toObj) {
          const startX = (fromObj.left || 0) + ((fromObj.width || 0) * (fromObj.scaleX || 1)) / 2;
          const startY = (fromObj.top || 0) + ((fromObj.height || 0) * (fromObj.scaleY || 1)) / 2;
          const endX = (toObj.left || 0) + ((toObj.width || 0) * (toObj.scaleX || 1)) / 2;
          const endY = (toObj.top || 0) + ((toObj.height || 0) * (toObj.scaleY || 1)) / 2;

          createConnector(canvas, {
            startX,
            startY,
            endX,
            endY,
            startMarker: (conn.startMarker || 'none') as any,
            endMarker: (conn.endMarker || 'arrow') as any,
            lineStyle: (conn.style === 'dashed' ? 'dashed' : 'solid') as any,
            routingStyle: (conn.type === 'curved' ? 'curved' : 'straight') as any,
            strokeColor: conn.color || '#000000',
            strokeWidth: conn.strokeWidth || 2,
          });

          if (conn.label) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const text = new FabricText(conn.label, {
              left: midX,
              top: midY - 10,
              fontSize: 11,
              fill: '#333333',
              backgroundColor: '#FFFFFF',
              padding: 2,
              selectable: false,
            });
            canvas.add(text);
          }
        }
      }

      canvas.renderAll();
      
      toast.success(`Added ${addedObjects.length} icons to canvas${useProposed ? ' (raw AI layout)' : ' (corrected layout)'}`);
      onOpenChange(false);
      
      setImage(null);
      setDescription("");
      setResponse(null);
    } catch (error: any) {
      console.error("Apply to canvas error:", error);
      toast.error(error.message || "Failed to apply layout to canvas");
    }
  };

  const handleReset = () => {
    setImage(null);
    setDescription("");
    setResponse(null);
    setActiveTab("reference");
    setProgressStages(initialProgressStages);
  };

  const ProgressDisplay = ({ stages }: { stages: ProgressStage[] }) => {
    const currentStage = stages.find(s => s.status === 'active');
    const completedCount = stages.filter(s => s.status === 'complete').length;
    const totalProgress = (completedCount / stages.length) * 100;
    
    return (
      <div className="space-y-3">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {currentStage ? currentStage.name : 'Processing...'}
            </span>
            <span className="text-muted-foreground">
              {completedCount}/{stages.length} stages
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          {currentStage && (
            <p className="text-xs text-muted-foreground">
              {currentStage.description}
            </p>
          )}
        </div>
        
        {/* Stage List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stages.map((stage) => (
            <div 
              key={stage.id} 
              className={`flex items-start gap-3 p-2 rounded-lg border ${
                stage.status === 'active' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' :
                stage.status === 'complete' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
                stage.status === 'error' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                'bg-muted/50 border-border'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {stage.status === 'complete' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                {stage.status === 'active' && (
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                )}
                {stage.status === 'error' && (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                {stage.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{stage.name}</div>
                <div className="text-xs text-muted-foreground">
                  {stage.description}
                </div>
                
                {stage.status === 'active' && stage.progress > 0 && (
                  <div className="mt-1">
                    <Progress value={stage.progress} className="h-1" />
                  </div>
                )}
                
                {stage.details && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {stage.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>AI Figure Generator</DialogTitle>
            <Badge variant="secondary">Admin Only</Badge>
          </div>
          <DialogDescription>
            Upload a reference image and let AI recreate it with intelligent connector styling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Reference Image</Label>
            {!image ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileUpload}
                />
              </label>
            ) : (
              <Card className="relative p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img src={image} alt="Reference" className="w-full rounded-lg max-h-64 object-contain" />
              </Card>
            )}
          </div>

          {/* Optional Description */}
          {image && !response && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="e.g., 'metabolic pathway with mitochondria and glucose molecules'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Progress Display */}
              {isGenerating && (
                <Card className="p-4">
                  <ProgressDisplay stages={progressStages} />
                </Card>
              )}

              {/* Generate Buttons */}
              {!isGenerating && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleGenerate(false)}
                    className="flex-1"
                    disabled={isGenerating}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Figure
                  </Button>
                  <Button 
                    onClick={() => handleGenerate(true)}
                    variant="outline"
                    disabled={isGenerating}
                  >
                    Strict Mode
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Preview & Checks */}
          {response && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reference">Reference</TabsTrigger>
                <TabsTrigger value="checks">
                  Checks ({response.metadata.checks_passed}/{response.checks.length})
                </TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="reference" className="space-y-2">
                <img src={image!} alt="Reference" className="w-full rounded-lg max-h-96 object-contain border" />
              </TabsContent>

              <TabsContent value="checks" className="space-y-2">
                <Card className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {response.checks.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                        {check.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                        {check.status === 'corrected' && <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                        {check.status === 'missing' && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{check.relationship}</div>
                          {check.relationship_type && (
                            <div className="text-xs text-muted-foreground">Type: {check.relationship_type}</div>
                          )}
                          {check.issues && check.issues.length > 0 && (
                            <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                              {check.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                            </ul>
                          )}
                          {check.issue && (
                            <div className="text-xs text-red-600 mt-1">{check.issue}</div>
                          )}
                          {check.corrected_style && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Corrected: {check.corrected_style.type}, {check.corrected_style.style}, {check.corrected_style.endMarker}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="text-xs text-muted-foreground text-center">
                  {response.metadata.checks_corrected > 0 && (
                    <p className="text-yellow-600">
                      {response.metadata.checks_corrected} connector{response.metadata.checks_corrected > 1 ? 's' : ''} auto-corrected for accuracy
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-2">
                <Card className="p-4 bg-accent/50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Elements identified:</span>
                      <span className="ml-2 font-semibold">{response.metadata.elements_identified}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Icons matched:</span>
                      <span className="ml-2 font-semibold">{response.metadata.icons_matched}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Objects:</span>
                      <span className="ml-2 font-semibold">{response.metadata.total_objects}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Connectors:</span>
                      <span className="ml-2 font-semibold">{response.metadata.total_connectors}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg position deviation:</span>
                      <span className="ml-2 font-semibold">{response.metadata.avg_position_deviation_percent}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Checks passed:</span>
                      <span className="ml-2 font-semibold text-green-600">{response.metadata.checks_passed}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Connector styles:</span>
                      <div className="ml-2 text-xs mt-1">
                        {Object.entries(response.metadata.connector_styles).map(([style, count]) => (
                          <Badge key={style} variant="outline" className="mr-1 mb-1">
                            {style}: {count as number}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Self-Critique Section */}
                    {response.metadata.self_critique && (
                      <div className="col-span-2 mt-2 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">AI Self-Critique</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Overall accuracy:</span>
                            <span className={`ml-2 font-semibold ${
                              response.metadata.self_critique.overall_accuracy === 'excellent' ? 'text-green-600' :
                              response.metadata.self_critique.overall_accuracy === 'good' ? 'text-blue-600' :
                              response.metadata.self_critique.overall_accuracy === 'fair' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {response.metadata.self_critique.overall_accuracy}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="ml-2 font-semibold">{response.metadata.self_critique.confidence}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Issues found:</span>
                            <span className="ml-2">{response.metadata.self_critique.issues_found}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fixes applied:</span>
                            <span className="ml-2">{response.metadata.self_critique.fixes_recommended}</span>
                          </div>
                          {response.metadata.self_critique.critical_issues > 0 && (
                            <div className="col-span-2">
                              <span className="text-red-600">⚠ {response.metadata.self_critique.critical_issues} critical issue(s)</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Detailed Issues */}
                        {response.critique && response.critique.issues && response.critique.issues.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium mb-1">Identified Issues:</div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {response.critique.issues.map((issue: CritiqueIssue, idx: number) => (
                                <div key={idx} className="text-xs p-2 rounded bg-background/50 border">
                                  <div className="flex items-start gap-2">
                                    <Badge variant={
                                      issue.severity === 'critical' ? 'destructive' :
                                      issue.severity === 'moderate' ? 'default' : 'secondary'
                                    } className="text-[10px] px-1 py-0">
                                      {issue.severity}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium">{issue.element_or_connector}</div>
                                      <div className="text-muted-foreground">{issue.problem}</div>
                                      {issue.should_be && (
                                        <div className="text-green-600 mt-0.5">→ {issue.should_be}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Actions */}
          {response && (
            <div className="flex gap-2">
              <Button onClick={() => applyLayout(false)} className="flex-1">
                Apply Corrected Layout
              </Button>
              <Button onClick={() => applyLayout(true)} variant="outline">
                Apply Raw AI
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                Reset
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};