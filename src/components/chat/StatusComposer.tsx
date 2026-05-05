
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Type, Image as ImageIcon, X, Send, 
  Loader2, RefreshCw, Sparkles, Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadProfileImageToMega } from '@/app/actions/profile';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function StatusComposer({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [mode, setMode] = useState<'text' | 'camera'>('text');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'camera') {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
          setHasCameraPermission(false);
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please allow camera access in settings.' });
          setMode('text');
        }
      };
      getCameraPermission();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [mode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(blob));
      }
    }, 'image/jpeg');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!user || !db || isPosting) return;
    if (!inputText && !imageFile) return;

    setIsPosting(true);
    try {
      let content = inputText;
      let type: 'text' | 'image' = 'text';

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const result = await uploadProfileImageToMega(formData);
        if (result && 'url' in result) {
          content = result.url;
          type = 'image';
        } else {
          throw new Error('Image upload failed');
        }
      }

      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        content,
        type,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      toast({ title: "Moment Shared", description: "Your status is now live for 24 hours." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Post Failed', description: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem]">
      <DialogHeader className="p-8 pb-4">
        <DialogTitle className="text-2xl font-bold font-headline italic uppercase tracking-tight text-gradient">
          Share a Moment
        </DialogTitle>
        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Your update will vanish in 24 hours
        </DialogDescription>
      </DialogHeader>

      <div className="px-8 pb-8 space-y-6">
        <div className="flex gap-4 border-b border-white/5 pb-4">
          <Button 
            variant="ghost" 
            onClick={() => setMode('text')}
            className={cn("flex-1 rounded-xl h-12 gap-2 font-bold uppercase text-[10px] tracking-widest", mode === 'text' ? "bg-primary/20 text-primary" : "text-muted-foreground")}
          >
            <Type className="w-4 h-4" /> Text
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setMode('camera')}
            className={cn("flex-1 rounded-xl h-12 gap-2 font-bold uppercase text-[10px] tracking-widest", mode === 'camera' ? "bg-primary/20 text-primary" : "text-muted-foreground")}
          >
            <Camera className="w-4 h-4" /> Camera
          </Button>
        </div>

        <div className="relative aspect-[4/5] bg-white/5 rounded-3xl overflow-hidden group">
          <AnimatePresence mode="wait">
            {mode === 'text' && !imagePreview ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-emerald-900/20">
                <Textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="bg-transparent border-none text-2xl font-black font-headline text-center resize-none placeholder:text-white/20 h-full flex items-center justify-center italic tracking-tighter"
                />
              </motion.div>
            ) : imagePreview ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
                <img src={imagePreview} className="w-full h-full object-cover" />
                <Button 
                  size="icon" variant="ghost" 
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-4 right-4 bg-black/40 text-white rounded-full h-10 w-10 backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </Button>
              </motion.div>
            ) : mode === 'camera' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <Button 
                    size="icon" 
                    onClick={handleCapture}
                    className="h-16 w-16 rounded-full bg-white border-4 border-primary shadow-2xl hover:scale-110 transition-transform active:scale-90"
                  />
                  <Button 
                    size="icon" variant="ghost" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 rounded-full bg-black/40 text-white border border-white/10"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button 
          onClick={handlePost}
          disabled={isPosting || (!inputText && !imageFile)}
          className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl"
        >
          {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Post Update <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}
