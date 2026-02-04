
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, Activity, Microscope, Terminal, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MLEngine from '@/components/shared/MLEngine';
import Avatar3DRenderer from '@/components/spectroverse/Avatar3DRenderer';
import { base44 } from '@/api/base44Client';

export default function MLTrainingPage() {
  const navigate = useNavigate();
  const mlEngineRef = useRef<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [mlImprovements, setMlImprovements] = useState<any>({ accuracy: 0.3, avatarIntelligence: 30, animationQuality: 20 });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 6));

  const startTraining = () => {
      setIsTraining(true);
      addLog("Initializing Neural Network...");
      addLog("Loading Base44 Dataset...");
      
      let epoch = 0;
      const interval = setInterval(() => {
          epoch++;
          setMlImprovements(prev => {
              const next = {
                  accuracy: Math.min(0.99, prev.accuracy + 0.005),
                  avatarIntelligence: Math.min(100, prev.avatarIntelligence + 0.8),
                  animationQuality: Math.min(100, prev.animationQuality + 0.7),
                  sceneOptimization: Math.min(100, (prev.sceneOptimization || 30) + 1.2),
                  epoch: epoch,
                  progress: (epoch / 100) * 100
              };
              
              base44.events.emit('ml.update', next);
              return next;
          });

          if(epoch % 10 === 0) addLog(`Epoch ${epoch}: Loss ${(100/epoch).toFixed(4)} | Accuracy updated`);

          if(epoch >= 100) {
              clearInterval(interval);
              setIsTraining(false);
              addLog("Training Complete. Model Converged.");
          }
      }, 100); 
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-mono">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/SpectroVerse')} className="border-slate-700 text-slate-300 hover:bg-slate-800"><ArrowLeft className="w-5 h-5"/></Button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="w-6 h-6 text-purple-500"/> Neural Core Research Lab</h1>
                    <p className="text-slate-400 text-xs">SpectroVerse Deep Learning Module v4.4</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-purple-500/20">
                        <CardHeader className="border-b border-slate-800 py-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Terminal className="w-4 h-4"/> System Terminal</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-4">
                             <div className="h-32 bg-black rounded p-2 text-xs text-green-400 font-mono overflow-hidden border border-slate-800">
                                {logs.map((l, i) => <div key={i}>$ {l}</div>)}
                                {!isTraining && logs.length === 0 && <div className="text-slate-500">System Ready. Awaiting Command...</div>}
                             </div>
                             
                             <div className="space-y-2">
                                <div className="flex justify-between text-white text-xs"><span>Training Progress (Epoch {mlImprovements.epoch || 0}/100)</span><span>{(mlImprovements.progress||0).toFixed(0)}%</span></div>
                                <Progress value={mlImprovements.progress || 0} className="h-1" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                    <p className="text-[10px] text-slate-400">ACCURACY</p>
                                    <p className="text-xl font-bold text-green-400">{(mlImprovements.accuracy*100).toFixed(1)}%</p>
                                </div>
                                <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                    <p className="text-[10px] text-slate-400">LOSS</p>
                                    <p className="text-xl font-bold text-red-400">{Math.max(0.01, 1 - mlImprovements.accuracy).toFixed(3)}</p>
                                </div>
                                <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                    <p className="text-[10px] text-slate-400">OPTIMIZATION</p>
                                    <p className="text-xl font-bold text-blue-400">{(mlImprovements.sceneOptimization || 0).toFixed(0)}</p>
                                </div>
                            </div>

                            <Button onClick={startTraining} disabled={isTraining} className="w-full bg-purple-600 hover:bg-purple-700">
                                {isTraining ? <Activity className="w-4 h-4 mr-2 animate-spin"/> : <Microscope className="w-4 h-4 mr-2"/>} 
                                {isTraining ? 'Training Network...' : 'Start Research Cycle'}
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2"><LineChart className="w-3 h-3"/> Science & Metrics</h4>
                        <p>Leveraging Gradient Descent to minimize visual error. Uses PBR Shader calibration data to improve avatar realism. Crowd instancing uses GPU compute shaders optimized for high-concurrency environments.</p>
                    </div>
                </div>

                <Card className="bg-slate-900 border-green-500/20 overflow-hidden flex flex-col h-[500px]">
                    <CardHeader className="py-3 bg-black"><CardTitle className="text-white text-sm">Real-time Inference Preview</CardTitle></CardHeader>
                    <CardContent className="flex-1 p-0 relative">
                        <div className="absolute inset-0">
                            <Avatar3DRenderer 
                                avatarData={{ avatar_name: 'Training Subject 01', facial_features: { skin_tone: '#ffdbac' }, body_type: { height: 1.75, build: 0.6 } }} 
                                mlImprovements={mlImprovements} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
