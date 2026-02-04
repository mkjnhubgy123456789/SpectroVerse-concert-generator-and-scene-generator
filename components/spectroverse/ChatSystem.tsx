
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assume this exists or use div
import { MessageSquare, Send, Users, Mic } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function ChatSystem() {
  const [messages, setMessages] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat'|'friends'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const msgs = await base44.social.chat.history();
    const usrs = await base44.social.friends.list();
    setMessages(msgs);
    setFriends(usrs);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await base44.social.chat.send(input);
    setInput('');
    loadData();
    // Scroll to bottom
    setTimeout(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  return (
    <Card className="bg-slate-950/95 border-blue-500/30 h-[400px] flex flex-col">
      <CardHeader className="p-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-blue-400"/> Social Hub
            </CardTitle>
            <div className="flex gap-1">
                <Button size="sm" variant={activeTab === 'chat' ? 'default' : 'ghost'} onClick={() => setActiveTab('chat')} className="h-7 text-xs">Chat</Button>
                <Button size="sm" variant={activeTab === 'friends' ? 'default' : 'ghost'} onClick={() => setActiveTab('friends')} className="h-7 text-xs">Friends</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {activeTab === 'chat' ? (
            <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.sender === 'You' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-2 text-xs ${m.sender === 'You' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                <span className="block font-bold text-[10px] opacity-70 mb-0.5">{m.sender}</span>
                                {m.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t border-slate-800 flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400"><Mic className="w-4 h-4"/></Button>
                    <Input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..." 
                        className="h-8 text-xs bg-slate-900 border-slate-700"
                    />
                    <Button size="icon" onClick={handleSend} className="h-8 w-8 bg-blue-600"><Send className="w-3 h-3"/></Button>
                </div>
            </>
        ) : (
            <div className="p-3 space-y-2">
                {friends.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                                {f.name[0]}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{f.name}</div>
                                <div className="text-[10px] text-green-400 capitalize">{f.status}</div>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]">Invite</Button>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
