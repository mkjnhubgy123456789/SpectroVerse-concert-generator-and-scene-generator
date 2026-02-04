import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function AdvancedSecurityMonitor({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;
  return (
    <Card className="bg-slate-900 border-red-500/50 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-sm">Admin Security Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-slate-300">
            <p>Traffic Analysis: Normal</p>
            <p>Injection Attempts: 0</p>
        </div>
      </CardContent>
    </Card>
  );
}