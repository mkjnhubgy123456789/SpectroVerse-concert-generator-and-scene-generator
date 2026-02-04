import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Zap, Play, Pause, RotateCcw, Activity } from 'lucide-react';

export default function PhysicsEngine({ mlImprovements }: any) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [gravity, setGravity] = useState(9.81);
  const [particleCount, setParticleCount] = useState(50);
  const [particles, setParticles] = useState<any[]>([]);
  const frameRef = useRef<number>(0);

  const initParticles = () => {
      const p = [];
      for(let i=0; i<particleCount; i++) {
          p.push({
              id: i,
              x: Math.random() * 100,
              y: Math.random() * 100,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: `hsl(${Math.random() * 360}, 70%, 60%)`
          });
      }
      setParticles(p);
  };

  useEffect(() => { initParticles(); }, [particleCount]);

  useEffect(() => {
      const update = () => {
          if(isSimulating) {
              setParticles(prev => prev.map(p => {
                  let ny = p.y + p.vy * 0.1;
                  let nx = p.x + p.vx * 0.1;
                  let nvy = p.vy - (gravity * 0.05);
                  // Bounce
                  if(ny < 0) { ny = 0; nvy *= -0.8; }
                  if(nx < 0 || nx > 100) { p.vx *= -0.8; nx = Math.max(0, Math.min(100, nx)); }
                  return { ...p, x: nx, y: ny, vy: nvy };
              }));
          }
          frameRef.current = requestAnimationFrame(update);
      };
      update();
      return () => { if(frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isSimulating, gravity]);

  return (
    <Card className="bg-slate-950/95 border-cyan-500/30">
        <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400"/> Physics Engine</div>
                {mlImprovements && <Badge className="bg-purple-500">ML: {(mlImprovements.physicsAccuracy || 0).toFixed(0)}%</Badge>}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="relative h-64 bg-slate-900/50 rounded-lg border border-cyan-500/20 overflow-hidden">
                {particles.map(p => (
                    <div key={p.id} className="absolute w-2 h-2 rounded-full" style={{ left: `${p.x}%`, bottom: `${p.y}%`, backgroundColor: p.color }} />
                ))}
            </div>
            
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm text-white mb-2"><span>Gravity</span><span>{gravity.toFixed(2)}</span></div>
                    <Slider value={[gravity]} onValueChange={([v]) => setGravity(v)} max={20} step={0.1} />
                </div>
                <div>
                    <div className="flex justify-between text-sm text-white mb-2"><span>Particles</span><span>{particleCount}</span></div>
                    <Slider value={[particleCount]} onValueChange={([v]) => setParticleCount(v)} min={10} max={200} />
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={() => setIsSimulating(!isSimulating)} className={isSimulating ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}>
                    {isSimulating ? <><Pause className="w-4 h-4 mr-2"/> Pause</> : <><Play className="w-4 h-4 mr-2"/> Start</>}
                </Button>
                <Button variant="outline" onClick={initParticles}><RotateCcw className="w-4 h-4 mr-2"/> Reset</Button>
            </div>
        </CardContent>
    </Card>
  );
}