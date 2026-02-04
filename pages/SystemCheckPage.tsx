import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function SystemCheckPage() {
  const [checks, setChecks] = useState<any>({
    auth: { status: 'pending' },
    entities: { status: 'pending' },
    integrations: { status: 'pending' },
    sdk: { status: 'pending' }
  });
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = async () => {
    setIsRunning(true);
    const newChecks = { ...checks };

    // SDK
    newChecks.sdk = base44 ? { status: 'success', message: 'SDK Loaded' } : { status: 'error', message: 'SDK Failed' };
    setChecks({...newChecks});

    // Auth
    try {
        const user = await base44.auth.me();
        newChecks.auth = { status: 'success', message: `Auth: ${user.email}` };
    } catch(e) { newChecks.auth = { status: 'error', message: 'Auth Failed' }; }
    setChecks({...newChecks});

    // Entities
    try {
        await base44.entities.MusicAnalysis.list();
        newChecks.entities = { status: 'success', message: 'Entities Access OK' };
    } catch(e) { newChecks.entities = { status: 'error', message: 'Entities Failed' }; }
    setChecks({...newChecks});

    // Integrations
    try {
        await base44.integrations.Core.InvokeLLM({ prompt: 'Test' });
        newChecks.integrations = { status: 'success', message: 'LLM OK' };
    } catch(e) { newChecks.integrations = { status: 'error', message: 'Integrations Failed' }; }
    setChecks({...newChecks});

    setIsRunning(false);
  };

  useEffect(() => { runChecks(); }, []);

  const getIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-400" />;
    return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex justify-center">
        <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 h-fit">
            <CardHeader><CardTitle className="text-white flex justify-between">System Diagnostic <Button onClick={runChecks} disabled={isRunning} size="sm"><RefreshCw className={`w-4 h-4 mr-2 ${isRunning?'animate-spin':''}`}/> Rerun</Button></CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(checks).map(([k, v]: any) => (
                    <div key={k} className="p-4 bg-slate-700/50 rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getIcon(v.status)}
                            <div>
                                <h3 className="text-white font-bold capitalize">{k}</h3>
                                <p className="text-xs text-slate-300">{v.message || 'Checking...'}</p>
                            </div>
                        </div>
                        <Badge className={v.status==='success'?'bg-green-500/20 text-green-300':'bg-slate-600 text-slate-300'}>{v.status.toUpperCase()}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}