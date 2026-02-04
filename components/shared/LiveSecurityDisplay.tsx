import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function LiveSecurityDisplay() {
  return (
    <Card className="bg-slate-950/90 border-green-500/30">
      <CardContent className="p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm font-semibold">Security Active</span>
         </div>
         <span className="text-xs text-green-400">System Protected</span>
      </CardContent>
    </Card>
  );
}