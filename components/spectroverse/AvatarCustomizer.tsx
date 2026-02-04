
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Sparkles, Save, RefreshCw, Eye, Shirt, Brain, Zap, Ruler } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function AvatarCustomizer({ sceneContext = 'general', onSave, onChange, mlImprovements }: any) {
  const [avatarName, setAvatarName] = useState('');
  const [loading, setLoading] = useState(false);
  const [facial, setFacial] = useState({ eye_size: 0.5, skin_tone: '#ffdbac', jaw_width: 0.5 });
  const [body, setBody] = useState({ height: 1.7, build: 0.5, shoulder_width: 0.5 });
  const [clothing, setClothing] = useState({ top: 'tshirt', color_primary: '#445588', color_secondary: '#1a1a2e' });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Trigger onChange whenever local state changes
  useEffect(() => {
      if(onChange) {
          onChange({
              avatar_name: avatarName || 'Preview',
              facial_features: facial,
              body_type: body,
              clothing: clothing
          });
      }
  }, [avatarName, facial, body, clothing]);

  const applyMLSuggestions = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate processing
    // Simulate ML optimizing proportions
    setBody({ height: 1.80, build: 0.7, shoulder_width: 0.8 });
    setFacial(prev => ({ ...prev, jaw_width: 0.7 }));
    setAiSuggestions({
        confidence: 0.92,
        recommendations: { mlQualityBoost: "+25% Realism" }
    });
    setLoading(false);
  };

  const saveAvatar = async () => {
      if(!avatarName) return alert('Enter name');
      setLoading(true);
      await base44.entities.AvatarCustomization.create({
          avatar_name: avatarName,
          facial_features: facial,
          body_type: body, 
          clothing: clothing,
          generation_method: 'generative_ai'
      });
      setLoading(false);
      alert('Avatar saved to SpectroVerse Cloud!');
      if(onSave) onSave();
  };

  const randomize = () => {
      setBody({ height: 1.5 + Math.random() * 0.5, build: Math.random(), shoulder_width: Math.random() });
      setFacial({ ...facial, eye_size: Math.random() });
      setClothing({ ...clothing, color_primary: `hsl(${Math.random()*360}, 60%, 50%)` });
  };

  return (
    <Card className="bg-slate-950/95 border-purple-500/30 h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2"><User className="w-5 h-5 text-purple-400"/> Rig Studio</CardTitle>
            {mlImprovements && <Badge className="bg-green-500">ML: {(mlImprovements.avatarIntelligence || 30).toFixed(0)}%</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ML Suggestion Box */}
        <div className="p-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-lg flex justify-between items-center">
            <div>
                <h4 className="text-purple-300 font-semibold flex items-center gap-2 text-sm"><Brain className="w-4 h-4"/> Auto-Optimize Rig</h4>
                <p className="text-[10px] text-purple-400 mt-1">Uses population data to fix proportions</p>
            </div>
            <Button onClick={applyMLSuggestions} disabled={loading} size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"><Sparkles className="w-3 h-3 mr-1"/> Auto-Fix</Button>
        </div>

        <Input placeholder="Avatar Name" value={avatarName} onChange={e => setAvatarName(e.target.value)} className="bg-slate-900 border-slate-700 text-white"/>

        <Tabs defaultValue="body" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="body"><Ruler className="w-3 h-3 mr-2"/> Body</TabsTrigger>
                <TabsTrigger value="facial"><Eye className="w-3 h-3 mr-2"/> Face</TabsTrigger>
                <TabsTrigger value="clothing"><Shirt className="w-3 h-3 mr-2"/> Gear</TabsTrigger>
            </TabsList>
            
            <TabsContent value="body" className="space-y-4 mt-4 p-1">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Height</span><span>{body.height.toFixed(2)}m</span></div>
                        <Slider value={[body.height * 100]} onValueChange={([v]) => setBody({...body, height: v/100})} min={140} max={220} />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Muscle / Build</span><span>{(body.build * 100).toFixed(0)}%</span></div>
                        <Slider value={[body.build * 100]} onValueChange={([v]) => setBody({...body, build: v/100})} max={100} />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Shoulder Width</span><span>{(body.shoulder_width * 100).toFixed(0)}%</span></div>
                        <Slider value={[body.shoulder_width * 100]} onValueChange={([v]) => setBody({...body, shoulder_width: v/100})} max={100} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="facial" className="space-y-4 mt-4 p-1">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Eye Size</span></div>
                        <Slider value={[facial.eye_size * 100]} onValueChange={([v]) => setFacial({...facial, eye_size: v/100})} max={100} />
                    </div>
                    <div>
                         <label className="text-xs text-slate-400 block mb-1">Skin Tone</label>
                         <div className="flex gap-2">
                             {['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#3c2103'].map(c => (
                                 <button key={c} onClick={() => setFacial({...facial, skin_tone: c})} className={`w-6 h-6 rounded-full border-2 ${facial.skin_tone===c?'border-white':'border-transparent'}`} style={{backgroundColor: c}}/>
                             ))}
                         </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="clothing" className="space-y-4 mt-4 p-1">
                 <div>
                    <label className="text-xs text-slate-400 block mb-1">Primary Color</label>
                    <input type="color" value={clothing.color_primary} onChange={e => setClothing({...clothing, color_primary: e.target.value})} className="w-full h-8 bg-slate-800 rounded border border-slate-700" />
                 </div>
            </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-2">
            <Button onClick={saveAvatar} disabled={loading} className="bg-green-600 hover:bg-green-700 flex-1"><Save className="w-4 h-4 mr-2"/> Save Rig</Button>
            <Button variant="outline" onClick={randomize} className="border-cyan-500/30 hover:bg-cyan-500/20"><RefreshCw className="w-4 h-4 mr-2"/> Randomize</Button>
        </div>
      </CardContent>
    </Card>
  );
}
