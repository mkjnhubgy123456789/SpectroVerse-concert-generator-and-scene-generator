import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, Activity, Zap, TrendingUp, Eye, 
  CheckCircle, Loader2, Play
} from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function AISceneDirector({
  sceneData, 
  onDirectorSuggestion, 
  sessionId = null,
  mlImprovements 
}: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [directorSuggestions, setDirectorSuggestions] = useState<any[]>([]);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [audioAnalysis, setAudioAnalysis] = useState(null);

  useEffect(() => {
    if (autoOptimize && sceneData?.fps) {
      analyzePerformance();
    }
  }, [sceneData?.fps, autoOptimize, mlImprovements]);

  const generateMLSuggestions = (mlImp: any) => {
    if (!mlImp) return [];
    const suggestions = [];
    if (mlImp.avatarIntelligence > 70) {
      suggestions.push({
        type: 'performance',
        title: 'ML Avatar Intelligence',
        suggestion: `ML Avatar Intelligence at ${mlImp.avatarIntelligence.toFixed(0)}% - Avatars can now perform complex choreography.`,
        priority: 'high',
        mlEnhanced: true,
        action: () => onDirectorSuggestion?.({ type: 'ml_suggestion', data: { title: 'ML Insight', suggestion: 'Sync dance' } })
      });
    }
    return suggestions;
  };

  const analyzePerformance = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    let llmSuggestions: any[] = [];

    try {
      const response: any = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze scene performance. FPS: ${sceneData?.fps}. Mode: ${performanceMode}.`
      });

      // Mock parsing the response or just adding dummy suggestions if LLM returns string
      if (typeof response === 'string') {
          llmSuggestions.push({
              type: 'performance',
              title: 'LOD Adjustment',
              suggestion: 'Reduce draw distance for background objects.',
              priority: 'medium',
              action: () => console.log('Applied LOD')
          });
      } else if (response.lod_suggestions) {
         // Handle structured mock response
         if(response.lod_suggestions.adjustment_needed) {
             llmSuggestions.push({
                 type: 'performance',
                 title: 'LOD Tuning',
                 suggestion: 'Adjust LOD bias.',
                 priority: 'medium',
                 action: () => console.log('Applied LOD')
             });
         }
      }

      const mlSpecificSuggestions = generateMLSuggestions(mlImprovements);
      setDirectorSuggestions([...llmSuggestions, ...mlSpecificSuggestions]);

    } catch (error) {
      console.error('AI Director analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (index: number) => {
    const suggestion = directorSuggestions[index];
    if (suggestion.action) suggestion.action();
    setDirectorSuggestions(prev => {
        const up = [...prev];
        up[index].applied = true;
        return up;
    });
  };

  return (
    <Card className="bg-slate-900/90 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Scene Director
          {mlImprovements && Object.values(mlImprovements).some((v: any) => v > 0) && (
            <Badge className="ml-2 bg-green-500 text-white text-xs animate-pulse">ML POWERED</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sceneData?.fps && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Current FPS</span>
              <span className={`font-bold ${sceneData.fps >= 55 ? 'text-green-400' : 'text-yellow-400'}`}>
                {sceneData.fps} FPS
              </span>
            </div>
            <Progress value={(sceneData.fps / 60) * 100} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
          <span className="text-sm text-white">Auto-Optimize</span>
          <Button size="sm" variant={autoOptimize ? "default" : "outline"} onClick={() => setAutoOptimize(!autoOptimize)}>
            {autoOptimize ? 'ON' : 'OFF'}
          </Button>
        </div>

        <Button onClick={analyzePerformance} disabled={isAnalyzing} className="w-full bg-gradient-to-r from-green-600 to-blue-600">
          {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Activity className="w-4 h-4 mr-2" /> Analyze & Optimize</>}
        </Button>
        
        {directorSuggestions.length > 0 && (
          <Card className="bg-slate-800/80 border-purple-500/30">
            <CardHeader><CardTitle className="text-white text-sm">Suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {directorSuggestions.map((suggestion, idx) => (
                <div key={idx} className="p-3 rounded border bg-slate-700/30 border-slate-600">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-white font-semibold text-sm">{suggestion.title}</span>
                    <Badge className="bg-blue-500 text-white text-xs">{suggestion.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{suggestion.suggestion}</p>
                  {!suggestion.applied ? (
                    <Button size="sm" onClick={() => applySuggestion(idx)} className="mt-2 text-xs">Apply</Button>
                  ) : (
                    <div className="flex items-center gap-1 mt-2 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Applied</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}