import React, { useState, useRef } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

export default function ProRes4KPage() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generate = () => {
      setGenerating(true);
      setProgress(0);
      const int = setInterval(() => {
          setProgress(p => {
              if(p >= 100) { clearInterval(int); setGenerating(false); return 100; }
              return p + 2;
          });
      }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">ProRes 4K Generator</h1>
                <Button variant="outline" onClick={() => navigate('/SpectroVerse')}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
            </div>
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6 space-y-6">
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-slate-700">
                        {generating ? <div className="text-center"><p className="text-purple-400 font-bold text-2xl mb-2">{progress}%</p><p className="text-slate-400">Rendering 4K...</p></div> : <Video className="w-16 h-16 text-slate-600"/>}
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button onClick={generate} disabled={generating} className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto">Generate 4K Cinema Video</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}