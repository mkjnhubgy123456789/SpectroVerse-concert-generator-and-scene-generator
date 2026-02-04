
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import AvatarCustomizer from '@/components/spectroverse/AvatarCustomizer';
import Avatar3DRenderer from '@/components/spectroverse/Avatar3DRenderer';
import { base44 } from '@/api/base44Client';

export default function AvatarCustomizerPage() {
  const navigate = useNavigate();
  // State for immediate preview without saving
  const [previewAvatar, setPreviewAvatar] = useState<any>({
      avatar_name: "Live Preview",
      facial_features: { skin_tone: '#ffdbac', eye_size: 0.5 },
      body_type: { height: 1.7, build: 0.5 },
      clothing: { color_primary: '#445588' }
  });

  // Listen for global ML updates to improve preview quality live
  const [mlImprovements, setMlImprovements] = useState({ avatarIntelligence: 30, animationQuality: 30, accuracy: 0.5 });
  
  useEffect(() => {
      base44.events.on('ml.update', setMlImprovements);
      return () => base44.events.off('ml.update', setMlImprovements);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Avatar Lab</h1>
                <Button variant="outline" onClick={() => navigate('/SpectroVerse')}><ArrowLeft className="w-4 h-4 mr-2"/> Dashboard</Button>
            </div>
            
            <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                    <AvatarCustomizer 
                        onChange={(data: any) => setPreviewAvatar(data)}
                        onSave={() => alert('Avatar saved to cloud.')} 
                        mlImprovements={mlImprovements} 
                    />
                </div>
                <div className="md:col-span-8">
                    <div className="h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
                        <Avatar3DRenderer 
                            avatarData={previewAvatar} 
                            mlImprovements={mlImprovements}
                        />
                        <div className="absolute top-4 left-4 pointer-events-none">
                            <h2 className="text-white font-bold text-lg drop-shadow-md">{previewAvatar.avatar_name}</h2>
                            <p className="text-slate-300 text-xs">Real-time WebGL Preview</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
