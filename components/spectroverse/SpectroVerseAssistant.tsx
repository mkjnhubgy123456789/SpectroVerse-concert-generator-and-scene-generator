import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function SpectroVerseAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState([{role: 'assistant', content: 'Hi! I am your SpectroVerse AI.'}]);

  const send = async () => {
      if(!input) return;
      const userMsg = { role: 'user', content: input };
      setMessages(p => [...p, userMsg]);
      setInput('');
      setProcessing(true);
      try {
        const res: any = await base44.integrations.Core.InvokeLLM({ prompt: input });
        setMessages(p => [...p, {role: 'assistant', content: typeof res === 'string' ? res : 'Processed.'}]);
      } catch(e) {
          setMessages(p => [...p, {role: 'assistant', content: 'Error.'}]);
      }
      setProcessing(false);
  };

  return (
    <>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 shadow-2xl animate-pulse">
            <Sparkles className="w-6 h-6 text-white"/>
        </Button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-80 md:w-96">
            <Card className="bg-slate-900/95 border-cyan-500/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 p-3">
                    <div className="flex justify-between items-center text-white">
                        <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Assistant</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 text-white hover:bg-white/20"><X className="w-4 h-4"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                    <div className="h-64 overflow-y-auto space-y-2 pr-1">
                        {messages.map((m,i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg text-sm max-w-[85%] ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.content}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Textarea value={input} onChange={e => setInput(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Ask anything..." rows={1} />
                        <Button onClick={send} disabled={processing} size="sm" className="bg-cyan-600">{processing ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Send'}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}