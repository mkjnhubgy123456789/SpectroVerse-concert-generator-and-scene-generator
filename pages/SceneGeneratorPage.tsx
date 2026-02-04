import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import MetaverseSceneGenerator from '@/components/shared/MetaverseSceneGenerator';

export default function SceneGeneratorPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Scene Generator</h1>
                <Button variant="outline" onClick={() => navigate('/SpectroVerse')}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
            </div>
            <MetaverseSceneGenerator />
        </div>
    </div>
  );
}