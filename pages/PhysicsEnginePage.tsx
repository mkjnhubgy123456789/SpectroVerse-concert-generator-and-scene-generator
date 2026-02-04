import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import PhysicsEngine from '@/components/spectroverse/PhysicsEngine';

export default function PhysicsEnginePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Physics Engine</h1>
                <Button variant="outline" onClick={() => navigate('/SpectroVerse')}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
            </div>
            <PhysicsEngine mlImprovements={{physicsAccuracy: 92}} />
        </div>
    </div>
  );
}