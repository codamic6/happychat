
'use client';

import React from 'react';
import { 
  Settings, Shield, Bell, Eye, Lock, 
  Smartphone, Globe, ArrowLeft, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const settingsGroups = [
    {
      title: "Security & Privacy",
      items: [
        { icon: Shield, label: "End-to-End Protocol", desc: "Signal Mesh v2.6 active", type: "status" },
        { icon: Lock, label: "Two-Factor Auth", desc: "Hardware key recommended", type: "toggle", checked: true },
        { icon: Eye, label: "Read Receipts", desc: "Let others see when you read", type: "toggle", checked: true },
      ]
    },
    {
      title: "Interface",
      items: [
        { icon: Smartphone, label: "Haptic Feedback", desc: "Force gesture response", type: "toggle", checked: true },
        { icon: Bell, label: "Pulse Notifications", desc: "Critical priority only", type: "toggle", checked: false },
      ]
    },
    {
      title: "Network",
      items: [
        { icon: Globe, label: "Proxy Sharding", desc: "Hide IP via global nodes", type: "toggle", checked: false },
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden">
      <header className="h-24 px-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-xl z-[60] sticky top-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="text-white/60 hover:text-white rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-gradient tracking-tight uppercase italic">Settings</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Protocol Nexus Config</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12 pb-32">
          {settingsGroups.map((group, idx) => (
            <div key={idx} className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">{group.title}</h3>
              <div className="grid gap-4">
                {group.items.map((item, i) => (
                  <Card key={i} className="glass p-6 border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:glow-green transition-all">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase tracking-tight text-sm font-headline">{item.label}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    {item.type === 'toggle' ? (
                      <Switch defaultChecked={item.checked} />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-12 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">System Build: 0x2026AF-STABLE</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
