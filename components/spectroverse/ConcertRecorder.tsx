import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Camera, Square, Download, Brain, Activity } from 'lucide-react';

export default function ConcertRecorder({ mlImprovements }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);

  const start = () => {
      setIsRecording(true);
      setProgress(0);
      const int = setInterval(() => {
          setProgress(p => {
              if(p >= 100) { clearInterval(int); setIsRecording(false); return 100; }
              return p + 1;
          });
      }, 50);
  };

  return (
    <Card className="bg-slate-950/95 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2"><Video className="w-5 h-5 text-red-400"/> Concert Recorder {mlImprovements && <Badge className="bg-purple-500"><Brain className="w-3 h-3 mr-1"/> ML</Badge>}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRecording && (
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-white"><span>Recording...</span><Badge className="bg-red-500 animate-pulse">LIVE</Badge></div>
                <Progress value={progress} className="h-3" />
            </div>
        )}
        <div className="flex gap-2">
            {!isRecording ? <Button onClick={start} className="bg-red-600 hover:bg-red-700"><Camera className="w-4 h-4 mr-2"/> Record</Button> : <Button disabled className="bg-gray-600"><Square className="w-4 h-4 mr-2"/> Stop</Button>}
        </div>
      </CardContent>
    </Card>
  );
}