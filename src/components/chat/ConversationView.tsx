'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Send, Search, MoreVertical, X, Info, ArrowLeft, Loader2,
  Check, Reply, CheckCheck, Trash2, Pencil, Plus, Tag, Mail, AtSign,
  BarChart2, UserPlus, Forward, MessageSquare, User, 
  Smile, Palette, Paintbrush, Save, Pin, Clock, Mic, StopCircle,
  Play, Pause, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { 
  doc, query, collection, serverTimestamp, 
  getDocs, where, addDoc, updateDoc, increment, onSnapshot, writeBatch,
  arrayUnion, arrayRemove, deleteField, setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// STATIC CONSTANTS
const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

const FACIAL_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👻', '👽', '👾', '🤖'
];

const THEMES = [
  { id: 'default', name: 'Midnight Pro', bg: 'bg-[#050505]', preview: '#050505' },
  { id: 'grid', name: 'Cyber Mesh', bg: 'bg-[#050505] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:24px_24px]', preview: '#111' },
  { id: 'nebula', name: 'Space Nebula', bg: 'bg-[#050505] bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(126,34,206,0.15),transparent_40%)]', preview: '#2e1065' },
  { id: 'desert', name: 'Desert Night', bg: 'bg-gradient-to-br from-[#1a0f02] via-[#431407] to-[#1a0f02]', preview: '#431407' },
  { id: 'ocean', name: 'Ocean Depth', bg: 'bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e293b]', preview: '#164e63' },
  { id: 'sunset', name: 'Sunset Violet', bg: 'bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95]', preview: '#312e81' },
  { id: 'crimson', name: 'Crimson Edge', bg: 'bg-gradient-to-tr from-[#000] via-[#450a0a] to-[#000]', preview: '#450a0a' },
  { id: 'emerald', name: 'Emerald Peak', bg: 'bg-[#050505] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)]', preview: '#064e3b' },
  { id: 'matrix', name: 'Matrix Code', bg: 'bg-[#000] bg-[linear-gradient(rgba(0,255,70,0.05)_1px,transparent_1px)] [background-size:100%_4px]', preview: '#003300' },
  { id: 'rose', name: 'Midnight Rose', bg: 'bg-gradient-to-br from-[#1a0510] via-[#3d0a24] to-[#1a0510]', preview: '#3d0a24' },
  { id: 'gold', name: 'Golden Noir', bg: 'bg-[#050505] bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.08),transparent_50%)]', preview: '#d4af37' },
  { id: 'aurora', name: 'Aurora Borealis', bg: 'bg-[#050505] bg-[radial-gradient(circle_at_50%_-20%,rgba(0,255,255,0.15),transparent_60%),radial-gradient(circle_at_50%_120%,rgba(126,34,206,0.15),transparent_60%)]', preview: '#0d9488' },
  { id: 'volcano', name: 'Volcanic Ash', bg: 'bg-gradient-to-t from-[#000] via-[#1a1a1a] to-[#2b1004]', preview: '#431407' },
  { id: 'amethyst', name: 'Deep Amethyst', bg: 'bg-[#020005] bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.1),transparent_70%)]', preview: '#581c87' },
  { id: 'solar', name: 'Solar Flare', bg: 'bg-gradient-to-tr from-[#000] via-[#2d1a01] to-[#633200]', preview: '#92400e' },
  { id: 'onyx', name: 'Onyx Stealth', bg: 'bg-[#080808] bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-90', preview: '#1a1a1a' },
];

const BUBBLE_COLORS = [
  { id: 'primary', name: 'Happy Green', class: 'bg-primary text-primary-foreground', hex: '#00c853' },
  { id: 'blue', name: 'Royal Blue', class: 'bg-blue-600 text-white', hex: '#2563eb' },
  { id: 'purple', name: 'Deep Purple', class: 'bg-purple-600 text-white', hex: '#9333ea' },
  { id: 'red', name: 'Ruby Red', class: 'bg-red-600 text-white', hex: '#dc2626' },
  { id: 'amber', name: 'Amber Glow', class: 'bg-amber-500 text-black', hex: '#f59e0b' },
  { id: 'pink', name: 'Rose Pink', class: 'bg-pink-600 text-white', hex: '#db2777' },
  { id: 'teal', name: 'Teal Ocean', class: 'bg-teal-600 text-white', hex: '#0d9488' },
  { id: 'indigo', name: 'Indigo Night', class: 'bg-indigo-600 text-white', hex: '#4f46e5' },
  { id: 'orange', name: 'Electric Orange', class: 'bg-orange-600 text-white', hex: '#ea580c' },
  { id: 'cyan', name: 'Cyber Cyan', class: 'bg-cyan-600 text-black', hex: '#0891b2' },
  { id: 'lime', name: 'Lime Burst', class: 'bg-lime-600 text-black', hex: '#65a30d' },
  { id: 'fuchsia', name: 'Neon Fuchsia', class: 'bg-fuchsia-600 text-white', hex: '#c026d3' },
  { id: 'violet', name: 'Vivid Violet', class: 'bg-violet-700 text-white', hex: '#7c3aed' },
  { id: 'rose_deep', name: 'Crimson Rose', class: 'bg-rose-700 text-white', hex: '#be123c' },
  { id: 'slate', name: 'Slate Stealth', class: 'bg-slate-700 text-white', hex: '#334155' },
  { id: 'white', name: 'Classic White', class: 'bg-white text-black', hex: '#ffffff' },
];

type Message = {
  id: string;
  senderId: string;
  conversationId: string;
  text: string;
  createdAt: any;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedFor?: string[];
  status?: 'sent' | 'delivered' | 'read';
  updatedAt?: any;
  forwarded?: boolean;
  reactions?: Record<string, string>;
  isAudio?: boolean;
  audioData?: string;
  replyTo?: {
    id?: string;
    text: string;
    senderId?: string;
    senderName: string;
    isStatus?: boolean;
    statusUid?: string;
  };
  poll?: {
    question: string;
    options: string[];
    voters?: Record<string, number>;
  };
  sharedContact?: {
    uid: string;
    name: string;
    username: string;
  };
};

type UserProfile = {
  id: string;
  displayName?: string;
  fullName?: string;
  username: string;
  email: string;
  about?: string;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  showTypingStatus?: boolean;
  preferredTheme?: string;
  preferredBubbleColor?: string;
};

type ContactRecord = {
  id: string;
  userId: string;
  customName?: string;
  addedAt?: any;
};

type Conversation = {
  id: string;
  participantIds: string[];
  typing?: Record<string, boolean>;
  hiddenFor?: string[];
  unreadCount?: Record<string, number>;
  pinnedMessageId?: string;
  pinnedMessageText?: string;
};

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-Selection State
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isNewChat = conversationId.startsWith('new-');
  const targetUid = isNewChat ? conversationId.replace('new-', '') : null;

  const convRef = useMemoFirebase(() => {
    if (!db || isNewChat || !user?.uid) return null;
    return doc(db, 'conversations', conversationId);
  }, [db, conversationId, isNewChat, user?.uid]);
  
  const { data: conversation } = useDoc<Conversation>(convRef);

  const msgQuery = useMemoFirebase(() => {
    if (!db || isNewChat || !user?.uid) return null;
    return query(collection(db, 'conversations', conversationId, 'messages'));
  }, [db, conversationId, isNewChat, user?.uid]);
  
  const { data: rawMessages } = useCollection<Message>(msgQuery);

  const userProfileRef = useMemoFirebase(() => (user?.uid ? doc(db, 'users', user.uid) : null), [db, user?.uid]);
  const { data: currentUserProfile } = useDoc<UserProfile>(userProfileRef);

  const activeTheme = useMemo(() => {
    return THEMES.find(t => t.id === currentUserProfile?.preferredTheme) || THEMES[0];
  }, [currentUserProfile?.preferredTheme]);

  const activeBubbleColor = useMemo(() => {
    return BUBBLE_COLORS.find(c => c.id === currentUserProfile?.preferredBubbleColor) || BUBBLE_COLORS[0];
  }, [currentUserProfile?.preferredBubbleColor]);

  const messages = useMemo(() => {
    if (!rawMessages || !user?.uid) return [];
    return [...rawMessages]
      .filter(m => !m.deletedFor?.includes(user.uid))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  }, [rawMessages, user?.uid]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [contactRecord, setContactRecord] = useState<ContactRecord | null>(null);

  useEffect(() => {
    if (!user?.uid || !db || isNewChat || !conversationId || !currentUserProfile) return;
    if (currentUserProfile.showTypingStatus === false) return;

    const setTyping = (isTyping: boolean) => {
      updateDoc(doc(db, 'conversations', conversationId), {
        [`typing.${user.uid}`]: isTyping
      }).catch(() => {});
    };

    if (inputText.length > 0) {
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
    } else {
      setTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, user?.uid, db, conversationId, isNewChat, currentUserProfile]);

  useEffect(() => {
    if (!db || isNewChat || !user?.uid || !rawMessages) return;

    const unreadFromOther = rawMessages.filter(m => m.senderId !== user.uid && m.status !== 'read');
    if (unreadFromOther.length > 0) {
      const batch = writeBatch(db);
      unreadFromOther.forEach(m => {
        const mRef = doc(db, 'conversations', conversationId, 'messages', m.id);
        batch.update(mRef, { status: 'read', updatedAt: serverTimestamp() });
      });
      batch.commit().catch(() => {});
    }

    const cRef = doc(db, 'conversations', conversationId);
    updateDoc(cRef, { [`unreadCount.${user.uid}`]: 0 }).catch(() => {});

  }, [db, conversationId, isNewChat, user?.uid, rawMessages]);

  useEffect(() => {
    if (searchParams.get('info') === 'true') setShowProfile(true);
  }, [searchParams]);

  useEffect(() => {
    const uid = targetUid || conversation?.participantIds.find(id => id !== user?.uid);
    if (!uid || !db || !user?.uid) {
      setOtherProfile(null);
      setContactRecord(null);
      return;
    }
    const unsubProfile = onSnapshot(doc(db, 'users', uid), (snap) => snap.exists() && setOtherProfile(snap.data() as UserProfile));
    const unsubContact = onSnapshot(doc(db, 'users', user.uid, 'contacts', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ContactRecord;
        setContactRecord(data);
      } else {
        setContactRecord(null);
      }
    });
    return () => {
      unsubProfile();
      unsubContact();
    }
  }, [conversation, targetUid, user?.uid, db]);

  useEffect(() => {
    if (scrollRef.current && filteredMessages.length > 0 && selectedMessageIds.length === 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, selectedMessageIds]);

  const handleSendMessage = async (payloadOverride?: Partial<Message>) => {
    if ((!inputText.trim() && !payloadOverride) || !user?.uid || !db || !otherProfile) return;
    
    if (editingMessage) {
      const text = inputText;
      const ref = doc(db, 'conversations', conversationId, 'messages', editingMessage.id);
      updateDoc(ref, { text, isEdited: true, updatedAt: serverTimestamp() }).catch(() => {});
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const text = inputText;
    let replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      senderId: replyingTo.senderId,
      senderName: replyingTo.senderId === user.uid ? 'You' : (contactRecord?.customName || otherProfile?.fullName || 'User')
    } : null;

    setInputText('');
    setReplyingTo(null);
    setShowActionMenu(false);
    setShowPollCreator(false);
    setShowContactPicker(false);

    let activeId = conversationId;
    let pIds = (conversation?.participantIds || [user.uid, otherProfile.id]).sort();

    if (isNewChat) {
      const existing = await getDocs(query(collection(db, 'conversations'), where('participantIds', '==', pIds)));
      if (existing.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participantIds: pIds,
          updatedAt: serverTimestamp(),
          lastMessage: text || (payloadOverride?.poll ? 'Shared a Poll' : payloadOverride?.isAudio ? 'Sent a voice note' : 'Shared a Contact'),
          unreadCount: { [otherProfile.id]: 1, [user.uid]: 0 },
          hiddenFor: []
        });
        activeId = newConv.id;
        router.replace(`/chat/${activeId}`);
      } else {
        activeId = existing.docs[0].id;
        router.replace(`/chat/${activeId}`);
        await updateDoc(doc(db, 'conversations', activeId), {
          hiddenFor: arrayRemove(user.uid)
        });
      }
    } else {
      await updateDoc(doc(db, 'conversations', activeId), { hiddenFor: [] });
    }

    const msg = {
      text: text || '',
      senderId: user.uid,
      conversationId: activeId,
      createdAt: serverTimestamp(),
      status: 'sent',
      replyTo: replyData,
      ...payloadOverride
    };

    addDoc(collection(db, 'conversations', activeId, 'messages'), msg).catch(() => {});

    updateDoc(doc(db, 'conversations', activeId), {
      lastMessage: text || (payloadOverride?.poll ? 'Shared a Poll' : payloadOverride?.sharedContact ? 'Shared a Contact' : payloadOverride?.isAudio ? 'Sent a voice note' : 'Message'),
      updatedAt: serverTimestamp(),
      [`unreadCount.${otherProfile.id}`]: increment(1),
      [`typing.${user.uid}`]: false
    }).catch(() => {});
  };

  const handleTogglePin = async () => {
    if (!user || !db || selectedMessageIds.length === 0 || isNewChat) return;
    const msgToPin = messages.find(m => m.id === selectedMessageIds[0]);
    if (!msgToPin) return;

    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        pinnedMessageId: msgToPin.id,
        pinnedMessageText: msgToPin.text.substring(0, 100)
      });
      setSelectedMessageIds([]);
      toast({ title: "Message Pinned" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Pin failed." });
    }
  };

  const handleUnpin = async () => {
    if (!user || !db || isNewChat) return;
    await updateDoc(doc(db, 'conversations', conversationId), {
      pinnedMessageId: deleteField(),
      pinnedMessageText: deleteField()
    });
    toast({ title: "Message Unpinned" });
  };

  const updatePreference = async (key: string, value: string) => {
    if (!user || !db) return;
    updateDoc(doc(db, 'users', user.uid), { [key]: value }).catch(() => {});
  };

  const deleteMessages = async (mode: 'me' | 'everyone') => {
    if (!user?.uid || !db || selectedMessageIds.length === 0) return;
    
    const batch = writeBatch(db);
    selectedMessageIds.forEach(id => {
      const ref = doc(db, 'conversations', conversationId, 'messages', id);
      const msg = messages.find(m => m.id === id);
      if (mode === 'me') {
        batch.update(ref, { deletedFor: arrayUnion(user.uid) });
      } else if (mode === 'everyone' && msg?.senderId === user.uid) {
        batch.update(ref, { isDeleted: true, text: 'This message was deleted' });
      }
    });
    
    await batch.commit();
    setSelectedMessageIds([]);
    setShowDeleteDialog(false);
    toast({ title: `${selectedMessageIds.length} Messages Deleted` });
  };

  const handleForwardMessages = async (targetConvId: string) => {
    if (!user?.uid || !db || selectedMessageIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const id of selectedMessageIds) {
        const msg = messages.find(m => m.id === id);
        if (!msg) continue;

        const newMsgRef = doc(collection(db, 'conversations', targetConvId, 'messages'));
        batch.set(newMsgRef, {
          text: msg.text,
          senderId: user.uid,
          conversationId: targetConvId,
          createdAt: serverTimestamp(),
          status: 'sent',
          forwarded: true,
          isAudio: msg.isAudio || false,
          audioData: msg.audioData || null
        });
      }

      await batch.commit();
      
      const latestMsg = messages.find(m => m.id === selectedMessageIds[selectedMessageIds.length - 1]);
      await updateDoc(doc(db, 'conversations', targetConvId), {
        lastMessage: latestMsg?.text || 'Shared content',
        updatedAt: serverTimestamp(),
        [`unreadCount.${targetConvId.split('-')[1] || ''}`]: increment(selectedMessageIds.length)
      });

      setSelectedMessageIds([]);
      setShowForwardPicker(false);
      toast({ title: "Messages Shared" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Share failed." });
    }
  };

  // Interaction Handlers
  const handleToggleSelect = useCallback((msgId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  }, []);

  const handleReact = useCallback(async (message: Message, emoji: string) => {
    if (!user || !db || message.isDeleted) return;
    const msgRef = doc(db, 'conversations', message.conversationId, 'messages', message.id);
    if (message.reactions?.[user.uid] === emoji) {
      await updateDoc(msgRef, { [`reactions.${user.uid}`]: deleteField() });
    } else {
      await updateDoc(msgRef, { [`reactions.${user.uid}`]: emoji });
    }
  }, [user, db]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac'];
      const mimeType = types.find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleSendMessage({ isAudio: true, audioData: base64Audio, text: 'Voice note' });
        };
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    } catch (err) {
      toast({ variant: 'destructive', title: "Microphone Access Denied" });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const isOtherTyping = useMemo(() => {
    if (!conversation?.typing || !otherProfile) return false;
    return conversation.typing[otherProfile.id] === true && otherProfile.showTypingStatus !== false;
  }, [conversation?.typing, otherProfile]);

  const isOtherOnline = useMemo(() => {
    if (!otherProfile) return false;
    return otherProfile.isOnline === true && otherProfile.showOnlineStatus !== false;
  }, [otherProfile]);

  const mainName = contactRecord?.customName || otherProfile?.displayName || otherProfile?.fullName || 'User';
  const initial = (otherProfile?.fullName || otherProfile?.username || 'U').charAt(0).toUpperCase();

  const HeaderMenuContent = () => (
    <div className="space-y-10 pb-10">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <Palette className="w-4 h-4 text-primary" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Nexus Themes</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {THEMES.map(theme => (
            <button key={theme.id} onClick={() => { updatePreference('preferredTheme', theme.id); if (!isMobile) setIsHeaderMenuOpen(false); }} className={cn("flex flex-col items-start gap-3 p-3 rounded-[1.5rem] border transition-all group relative overflow-hidden", activeTheme.id === theme.id ? "bg-primary/20 border-primary/40 ring-1 ring-primary/20" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08]")}>
              <div className="w-full aspect-[16/9] rounded-xl border border-white/10 shrink-0 shadow-2xl relative overflow-hidden" style={{ backgroundColor: theme.preview }}>
                 <div className={cn("absolute inset-0 opacity-40", theme.bg)} />
                 {activeTheme.id === theme.id && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"><Check className="w-6 h-6 text-white" /></div>}
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-[0.15em] px-1", activeTheme.id === theme.id ? "text-white" : "text-white/40 group-hover:text-white")}>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <Paintbrush className="w-4 h-4 text-primary" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Bubble Styles</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {BUBBLE_COLORS.map(color => (
            <button key={color.id} onClick={() => { updatePreference('preferredBubbleColor', color.id); if (!isMobile) setIsHeaderMenuOpen(false); }} className={cn("flex flex-col items-center gap-3 p-3 rounded-2xl border transition-all group relative", activeBubbleColor.id === color.id ? "bg-white/10 border-primary/40" : "bg-white/[0.03] border-white/5 hover:bg-white/10")}>
              <div className="w-10 h-10 rounded-full shadow-2xl group-hover:scale-110 transition-transform flex items-center justify-center relative" style={{ backgroundColor: color.hex }}>
                {activeBubbleColor.id === color.id && <Check className={cn("w-4 h-4", color.id === 'white' ? "text-black" : "text-white")} />}
              </div>
              <span className={cn("text-[8px] font-bold uppercase tracking-widest text-center leading-tight", activeBubbleColor.id === color.id ? "text-white" : "text-white/30")}>{color.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isUserLoading) return null;

  return (
    <div className={cn("flex-1 flex flex-row min-w-0 overflow-hidden relative transition-all duration-1000", activeTheme.bg)}>
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="flex-none h-20 px-4 border-b border-white/5 flex flex-col justify-center z-[60] bg-black/80 backdrop-blur-3xl">
          <AnimatePresence mode="wait">
            {selectedMessageIds.length > 0 ? (
              <motion.div key="selection-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-between w-full h-full px-2">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMessageIds([])} className="text-primary hover:bg-primary/10 rounded-full"><X className="w-5 h-5" /></Button>
                  <span className="text-lg font-black font-headline text-white uppercase tracking-tighter">{selectedMessageIds.length} selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    {selectedMessageIds.length === 1 && (
                      <>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { const msg = messages.find(m => m.id === selectedMessageIds[0]); if (msg) { setReplyingTo(msg); setSelectedMessageIds([]); } }} className="text-white hover:text-primary rounded-xl"><Reply className="w-5 h-5" /></Button></TooltipTrigger><TooltipContent className="bg-[#111] border-white/10 text-[10px] font-bold uppercase text-primary">Reply</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleTogglePin} className="text-white hover:text-primary rounded-xl"><Pin className="w-5 h-5" /></Button></TooltipTrigger><TooltipContent className="bg-[#111] border-white/10 text-[10px] font-bold uppercase text-primary">Pin</TooltipContent></Tooltip>
                        {messages.find(m => m.id === selectedMessageIds[0])?.senderId === user?.uid && (
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { const msg = messages.find(m => m.id === selectedMessageIds[0]); if (msg) { setEditingMessage(msg); setInputText(msg.text); setSelectedMessageIds([]); } }} className="text-white hover:text-primary rounded-xl"><Pencil className="w-5 h-5" /></Button></TooltipTrigger><TooltipContent className="bg-[#111] border-white/10 text-[10px] font-bold uppercase text-primary">Edit</TooltipContent></Tooltip>
                        )}
                      </>
                    )}
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowForwardPicker(true)} className="text-white hover:text-primary rounded-xl"><Forward className="w-5 h-5" /></Button></TooltipTrigger><TooltipContent className="bg-[#111] border-white/10 text-[10px] font-bold uppercase text-primary">Share</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)} className="text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="w-5 h-5" /></Button></TooltipTrigger><TooltipContent className="bg-[#111] border-white/10 text-[10px] font-bold uppercase text-destructive">Delete</TooltipContent></Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>
            ) : isSearchMode ? (
              <motion.div key="search-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 w-full h-full">
                <Button variant="ghost" size="icon" onClick={() => { setIsSearchMode(false); setSearchQuery(''); }} className="text-primary"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus placeholder="Search messages..." className="bg-white/5 border-none h-11 pl-10 rounded-full w-full text-white" />
                </div>
              </motion.div>
            ) : (
              <motion.div key="normal-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between w-full min-w-0 h-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="md:hidden text-muted-foreground shrink-0"><ArrowLeft className="w-6 h-6" /></Button>
                  <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => setShowProfile(true)}>
                    <div className="w-11 h-11 rounded-full border border-primary/20 bg-[#111] flex items-center justify-center shrink-0">
                      <span className="text-base font-bold text-primary not-italic flex items-center justify-center h-full w-full leading-none">{initial}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm md:text-base font-bold text-white truncate uppercase tracking-tight font-headline">{mainName}</h3>
                      <p className={cn("text-[10px] uppercase font-bold tracking-widest truncate", isOtherTyping ? "text-primary animate-pulse" : isOtherOnline ? "text-primary" : "text-muted-foreground")}>{isOtherTyping ? 'Typing...' : isOtherOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsSearchMode(true)} className="text-muted-foreground hover:text-primary"><Search className="w-5 h-5" /></Button>
                  {isMobile ? (
                    <Sheet open={isHeaderMenuOpen} onOpenChange={setIsHeaderMenuOpen}>
                      <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button></SheetTrigger>
                      <SheetContent side="bottom" className="bg-[#0a0a0a] border-white/5 rounded-t-[2.5rem] p-0 max-h-[85vh] flex flex-col outline-none overflow-hidden">
                        <SheetHeader className="p-8 pb-4 shrink-0"><SheetTitle className="text-2xl font-black font-headline uppercase italic text-gradient tracking-tight">Personalize</SheetTitle><SheetDescription className="text-[10px] font-bold uppercase tracking-[0.3em]">Configure your mesh aesthetic</SheetDescription></SheetHeader>
                        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
                           <button onClick={() => { setShowProfile(true); setIsHeaderMenuOpen(false); }} className="w-full flex items-center gap-3 p-5 rounded-2xl uppercase font-black text-[11px] tracking-widest text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer border border-primary/20 mb-8 transition-all"><Info className="w-4 h-4" /> User Intelligence</button>
                           <HeaderMenuContent />
                        </div>
                      </SheetContent>
                    </Sheet>
                  ) : (
                    <DropdownMenu open={isHeaderMenuOpen} onOpenChange={setIsHeaderMenuOpen}>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10 p-0 rounded-[2.5rem] w-[380px] shadow-2xl z-[120] overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 shrink-0"><button onClick={() => { setShowProfile(true); setIsHeaderMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-xl uppercase font-black text-[11px] tracking-widest text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer border border-primary/20 transition-all"><Info className="w-4 h-4" /> User Intelligence</button></div>
                        <DropdownMenuSeparator className="bg-white/5 m-0" />
                        <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar"><HeaderMenuContent /></div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {conversation?.pinnedMessageId && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between z-50 backdrop-blur-md">
             <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => { const el = document.getElementById(`msg-${conversation.pinnedMessageId}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" /><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-widest text-primary">Pinned Message</p><p className="text-[10px] text-white truncate italic font-medium">{conversation.pinnedMessageText}</p></div>
             </div>
             <Button variant="ghost" size="icon" onClick={handleUnpin} className="h-7 w-7 text-white/40 hover:text-white"><X className="w-3 h-3" /></Button>
          </div>
        )}

        <ScrollArea className="flex-1 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-12">
            {filteredMessages.map((msg) => (
              <MessageRow 
                key={msg.id} msg={msg} user={user} isMobile={isMobile}
                bubbleClass={activeBubbleColor.class}
                onSelect={() => handleToggleSelect(msg.id)}
                onReply={() => { setReplyingTo(msg); setSelectedMessageIds([]); }}
                onReact={handleReact}
                isSelected={selectedMessageIds.includes(msg.id)}
                isSelectionMode={selectedMessageIds.length > 0}
                highlight={searchQuery}
              />
            ))}
            <div ref={scrollRef} className="h-4" />
          </div>
        </ScrollArea>

        <footer className="bg-black/80 backdrop-blur-3xl border-t border-white/5 p-4 relative z-50">
          <AnimatePresence>
            {showPollCreator && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 md:p-8 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,200,83,0.5)] overflow-hidden"><PollCreatorInline onClose={() => setShowPollCreator(false)} onSend={(poll) => handleSendMessage({ poll })} /></motion.div>)}
            {showContactPicker && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 md:p-8 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,200,83,0.5)] overflow-hidden"><ContactPickerInline onClose={() => setShowContactPicker(false)} onSend={(contact) => handleSendMessage({ sharedContact: contact })} /></motion.div>)}
            {showActionMenu && !showPollCreator && !showContactPicker && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,200,83,0.5)]"><div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
                  <button onClick={() => setShowPollCreator(true)} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:glow-green transition-all"><BarChart2 className="w-5 h-5 text-primary" /></div><span className="text-[9px] font-black uppercase tracking-widest text-white">Poll</span></button>
                  <button onClick={() => setShowContactPicker(true)} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:glow-green transition-all"><UserPlus className="w-5 h-5 text-primary" /></div><span className="text-[9px] font-black uppercase tracking-widest text-white">Contact</span></button>
                </div></motion.div>)}
          </AnimatePresence>
          <div className="max-w-4xl mx-auto space-y-4">
            {replyingTo && (<div className="px-4 py-2 bg-white/5 border-l-2 border-primary mb-3 flex justify-between items-center rounded-r-xl shadow-lg animate-in slide-in-from-bottom-1"><div className="min-w-0 flex-1"><p className="text-[9px] font-black text-primary uppercase tracking-widest">Reply to {replyingTo.senderId === user?.uid ? 'You' : otherProfile?.fullName || 'User'}</p><p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p></div><Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 shrink-0 text-white/40 hover:text-white"><X className="w-4 h-4" /></Button></div>)}
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => { if (showPollCreator || showContactPicker) { setShowPollCreator(false); setShowContactPicker(false); } else { setShowActionMenu(!showActionMenu); } }} className={cn("rounded-xl h-11 w-11 md:h-12 md:w-12 shrink-0 bg-white/5 hover:bg-white/10 transition-all", (showActionMenu || showPollCreator || showContactPicker) && "bg-primary/20 text-primary rotate-45")}>{(showActionMenu || showPollCreator || showContactPicker) ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}</Button>
              <div className="flex-1 relative min-w-0"><Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={editingMessage ? "Update message..." : "Type message..."} className="bg-white/10 border-white/10 h-11 md:h-12 rounded-xl focus:ring-primary focus-visible:ring-offset-0 text-sm w-full text-white" /></div>
              {isRecording ? (<div className="flex items-center gap-2"><span className="text-[10px] font-black text-primary animate-pulse">{Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}</span><Button onClick={stopVoiceRecording} className="bg-destructive hover:bg-destructive/80 text-white h-11 w-11 md:h-12 md:w-12 rounded-xl shrink-0 animate-pulse"><StopCircle className="w-5 h-5" /></Button></div>) : inputText.trim() ? (<Button onClick={() => handleSendMessage()} className="bg-primary hover:glow-green text-primary-foreground h-11 w-11 md:h-12 md:w-12 rounded-xl shrink-0 transition-all active:scale-90"><Send className="w-5 h-5" /></Button>) : (<Button onClick={startVoiceRecording} className="bg-white/5 hover:bg-white/10 text-white h-11 w-11 md:h-12 md:w-12 rounded-xl shrink-0"><Mic className="w-5 h-5" /></Button>)}
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>{showProfile && otherProfile && (<UserProfileSidebar profile={otherProfile} contact={contactRecord} currentUserId={user?.uid} onClose={() => setShowProfile(false)} />)}</AnimatePresence>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}><AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden max-w-[calc(100%-2rem)] md:max-w-sm shadow-2xl"><AlertDialogHeader className="p-8 pb-4 shrink-0"><AlertDialogTitle className="font-headline uppercase tracking-tight text-gradient">Delete {selectedMessageIds.length} Messages?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><div className="px-8 pb-8 flex flex-col gap-2"><Button onClick={() => deleteMessages('me')} className="h-12 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Delete for Me</Button><Button onClick={() => deleteMessages('everyone')} variant="destructive" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Delete for Everyone</Button><AlertDialogCancel className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white h-10">Cancel</AlertDialogCancel></div></AlertDialogContent></AlertDialog>
      <ForwardPicker open={showForwardPicker} onClose={() => setShowForwardPicker(false)} onForward={handleForwardMessages} />
    </div>
  );
}

// MEMOIZED COMPONENTS FOR PERFORMANCE
const MessageRow = React.memo(({ msg, user, isMobile, onSelect, onReply, onReact, isSelected, isSelectionMode, highlight, bubbleClass }: any) => {
  const db = useFirestore();
  const isOwn = msg.senderId === user?.uid;
  const isSystem = msg.isDeleted;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const x = useMotionValue(0);
  const swipeOpacity = useTransform(x, [0, 80], [0, 1]);
  const swipeScale = useTransform(x, [0, 80], [0.8, 1.2]);

  const handlePointerDown = (e: any) => {
    if (!isMobile) return;
    holdTimerRef.current = setTimeout(() => { 
      if (!isSelectionMode) onSelect(); 
      if (window.navigator.vibrate) window.navigator.vibrate(50); 
    }, 600); 
  };
  const handlePointerUp = () => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } };

  const onDragEnd = (event: any, info: any) => {
    if (info.offset.x > 80 && !isSelectionMode) {
      onReply();
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    }
  };
  
  const renderText = (text: string) => {
    if (!highlight || !highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-primary/40 text-white rounded-sm px-0.5 glow-green">{part}</span> : part);
  };

  const handleVote = async (optionIndex: number) => {
    if (!user || !db || isSystem || !msg.poll || isSelectionMode) return;
    const msgRef = doc(db, 'conversations', msg.conversationId, 'messages', msg.id);
    updateDoc(msgRef, { [`poll.voters.${user.uid}`]: optionIndex }).catch(() => {});
  };

  const voters = msg.poll?.voters || {};
  const totalVotes = Object.keys(voters).length;
  const myVote = voters[user?.uid || ''];

  const pollResults = useMemo(() => {
    if (!msg.poll) return [];
    const counts = new Array(msg.poll.options.length).fill(0);
    Object.values(voters).forEach((val: any) => { if (counts[val] !== undefined) counts[val]++; });
    return counts.map(c => totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0);
  }, [msg.poll, voters, totalVotes]);

  const reactionSummary = useMemo(() => {
    if (!msg.reactions) return null;
    const counts: Record<string, number> = {};
    Object.values(msg.reactions).forEach(emoji => {
      counts[emoji as string] = (counts[emoji as string] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [msg.reactions]);

  return (
    <div id={`msg-${msg.id}`} className={cn("flex w-full group relative mb-1 min-w-0 items-center overflow-visible", isOwn ? "justify-end" : "justify-start")}>
      <motion.div 
        drag={isMobile && !isSelectionMode ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 150 }}
        dragSnapToOrigin={true}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 30 }}
        style={{ x }}
        onDragEnd={onDragEnd}
        onPointerDown={handlePointerDown} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp} 
        onClick={() => { if (isSelectionMode || !isMobile) onSelect(); }}
        className={cn("max-w-full flex z-10 items-center gap-2 overflow-visible group/row flex-1", isOwn ? "flex-row-reverse" : "flex-row")}
      >
        <motion.div style={{ opacity: swipeOpacity, scale: swipeScale }} className="absolute -left-12 flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary z-[5] pointer-events-none">
          <Reply className="w-5 h-5" />
        </motion.div>
        
        <div className={cn("relative overflow-visible max-w-[85%]", isOwn ? "flex justify-end" : "flex justify-start")}>
          <div className={cn("p-2 px-3 rounded-2xl text-[13px] relative transition-all duration-300 break-words min-w-0 shadow-sm cursor-pointer", isSelected ? "ring-2 ring-primary bg-primary/20 scale-[1.02]" : isSystem ? "bg-white/10 text-muted-foreground italic text-center px-6 py-2 border border-dashed border-white/20 text-[11px]" : isOwn ? cn(bubbleClass || "bg-primary text-primary-foreground", "rounded-tr-none shadow-lg") : "bg-[#181818]/90 backdrop-blur-md text-white rounded-tl-none border border-white/10")}>
            {msg.forwarded && <div className="flex items-center gap-1.5 mb-1 opacity-60 text-[8px] font-black uppercase italic tracking-widest"><Forward className="w-2 h-2" /> Forwarded</div>}
            {msg.replyTo && <div className="mb-2 p-1.5 bg-black/40 rounded-lg border-l-2 border-primary text-[10px] opacity-80 truncate max-w-full"><p className="font-bold text-primary mb-0.5 uppercase tracking-widest text-[8px]">{msg.replyTo.senderName}</p><span className="block truncate">{msg.replyTo.text}</span></div>}
            {msg.isAudio && msg.audioData && (<AudioPlayer data={msg.audioData} isOwn={isOwn} isSystem={isSystem} />)}
            {msg.poll && (<div className="mb-2 p-3 bg-black/60 rounded-xl border border-white/10 space-y-2.5 shadow-2xl min-w-[180px] max-w-full"><div className="flex items-center gap-2 text-primary"><BarChart2 className="w-3 h-3 shrink-0" /><span className="font-black uppercase tracking-tight text-[10px] truncate">{msg.poll.question}</span></div><div className="space-y-1">{msg.poll.options.map((opt: string, i: number) => { const pct = pollResults[i] || 0; const isMyVote = myVote === i; return (<button key={i} onClick={(e) => { e.stopPropagation(); handleVote(i); }} disabled={isSystem || isSelectionMode} className={cn("w-full relative h-8 bg-white/5 border rounded-lg px-3 overflow-hidden group transition-all", isMyVote ? "border-primary/50" : "border-white/5 hover:border-primary/20")}><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={cn("absolute inset-y-0 left-0", isMyVote ? "bg-primary/20" : "bg-primary/10")} /><div className="relative flex justify-between items-center w-full z-10 gap-2"><span className={cn("text-[10px] font-bold truncate", isMyVote ? "text-primary" : "text-white/70 group-hover:text-white")}>{opt}</span><span className="text-[8px] font-black opacity-50 shrink-0">{pct}%</span></div></button>); })}</div></div>)}
            {msg.sharedContact && (<div className="mb-2 p-3 bg-[#0d0d0d] rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl max-w-full"><div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-sm shrink-0">{msg.sharedContact.name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase tracking-tight truncate text-white">{msg.sharedContact.name}</p><p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest truncate">@{msg.sharedContact.username}</p></div></div>)}
            {msg.text && !msg.isAudio && <p className="leading-relaxed whitespace-pre-wrap font-medium">{renderText(msg.text)}</p>}
            <div className="flex justify-end gap-1.5 items-center mt-1 text-[7px] font-black uppercase tracking-widest">{msg.isEdited && <span className="mr-1 italic-bold opacity-70">(edited)</span>}<span className="opacity-60">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''}</span>{isOwn && !isSystem && (<div className="flex items-center ml-1">{msg.status === 'read' ? <CheckCheck strokeWidth={5} className="w-3.5 h-3.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" /> : <Check strokeWidth={4} className="w-3.5 h-3.5 text-white" />}</div>)}</div>
          </div>
          
          {reactionSummary && reactionSummary.length > 0 && (<div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>{reactionSummary.map(([emoji, count]) => (<div key={emoji} className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5 shadow-lg transition-all hover:scale-110"><span className="text-xs">{emoji}</span>{count > 1 && <span className="text-[8px] font-black text-primary uppercase">{count}</span>}</div>))}</div>)}
        </div>
        
        {isSelected && (<div className={cn("absolute inset-y-0 w-1 bg-primary rounded-full blur-[2px]", isOwn ? "-right-2" : "-left-2")} />)}
      </motion.div>
    </div>
  );
});
MessageRow.displayName = 'MessageRow';

const AudioPlayer = React.memo(({ data, isOwn, isSystem }: { data: string, isOwn: boolean, isSystem?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [data]);

  const togglePlay = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    if (!audioRef.current || isSystem) return; 
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
        toast({ variant: 'destructive', title: "Playback Error", description: "Audio protocol link failed." });
      });
    }
  };
  
  const onTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const onLoadedMetadata = () => { 
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (isFinite(d)) setDuration(d);
    } 
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 py-2 px-2 min-w-[220px] bg-black/20 rounded-2xl border border-white/5">
      <audio 
        ref={audioRef} 
        src={data} 
        preload="auto"
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} 
        onTimeUpdate={onTimeUpdate} 
        onLoadedMetadata={onLoadedMetadata} 
        className="hidden" 
      />
      <button 
        onClick={togglePlay} 
        disabled={isSystem}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-2xl", 
          isOwn ? "bg-white text-black" : "bg-primary text-primary-foreground glow-green"
        )}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex gap-[3px] items-center h-5">
          {[...Array(24)].map((_, i) => {
            const progress = (i / 24) * duration;
            const isActive = currentTime >= progress;
            return (
              <motion.div 
                key={i} 
                animate={{ 
                  height: isPlaying ? [8, 18, 8] : 8, 
                  opacity: isActive ? 1 : 0.2 
                }} 
                transition={{ 
                  duration: 0.5 + Math.random(), 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: i * 0.05
                }} 
                className={cn("w-1 rounded-full", isOwn ? "bg-white" : "bg-primary")} 
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black opacity-80 uppercase tracking-tighter">{formatTime(currentTime)}</span>
          <span className="text-[9px] font-black opacity-80 uppercase tracking-tighter">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
});
AudioPlayer.displayName = 'AudioPlayer';

function UserProfileSidebar({ profile, contact, currentUserId, onClose }: { profile: UserProfile, contact: ContactRecord | null, currentUserId?: string, onClose: () => void }) {
  const db = useFirestore();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(contact?.customName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNickname = async () => {
    if (!currentUserId || !db || isSaving) return;
    setIsSaving(true);
    try {
      const contactRef = doc(db, 'users', currentUserId, 'contacts', profile.id);
      await setDoc(contactRef, { userId: profile.id, customName: nicknameInput.trim() || profile.fullName || profile.username, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Nickname Updated" });
      setIsEditingNickname(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Update failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const mainTitle = contact?.customName || profile.fullName || profile.username;
  const subTitle = contact?.customName ? `~ ${profile.fullName}` : null;
  const isOnline = profile.isOnline && profile.showOnlineStatus !== false;

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full md:w-80 lg:w-96 bg-[#0a0a0a] border-l border-white/5 h-full z-[100] flex flex-col shadow-2xl relative">
      <header className="h-20 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-xl"><h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">User Information</h3><Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 text-white/40 hover:text-white hover:bg-white/5 transition-all"><X className="w-5 h-5" /></Button></header>
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8 flex flex-col items-center">
          <div className="relative group"><div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/20 bg-[#111] flex items-center justify-center overflow-hidden shadow-2xl relative"><span className="text-4xl md:text-5xl font-bold text-primary not-italic">{(contact?.customName || profile.fullName || profile.username)[0].toUpperCase()}</span><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><User className="w-8 h-8 text-white" /></div></div>{isOnline && (<div className="absolute bottom-3 right-3 w-7 h-7 bg-primary rounded-full border-4 border-[#0a0a0a] shadow-lg glow-green" />)}</div>
          <div className="w-full text-center space-y-1"><h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-white leading-tight">{mainTitle}</h2>{subTitle && (<p className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">{subTitle}</p>)}<p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"><AtSign className="w-3 h-3" /> {profile.username}</p></div>
          <div className="w-full space-y-6 pt-4">
            <div className="space-y-4"><div className="flex items-center justify-between px-1"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">About User</Label></div><div className="bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 text-left shadow-inner"><p className="text-sm text-white/80 leading-relaxed font-medium">{profile.about || "Secure communication active on the HappyChat mesh protocol."}</p></div></div>
            <div className="space-y-4"><div className="flex items-center justify-between px-1"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Personalize</Label></div><div className="bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 space-y-4 shadow-inner"><div className="flex items-center gap-3 mb-2"><Tag className="w-4 h-4 text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Contact Nickname</span></div>{isEditingNickname ? (<div className="flex gap-2"><Input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="e.g. Bestie" className="bg-black/40 border-white/10 h-11 rounded-xl text-xs focus:ring-primary" autoFocus /><Button size="icon" onClick={handleSaveNickname} disabled={isSaving} className="h-11 w-11 rounded-xl bg-primary hover:glow-green shrink-0">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</Button><Button size="icon" variant="ghost" onClick={() => setIsEditingNickname(false)} className="h-11 w-11 rounded-xl text-white/40 hover:text-white hover:bg-white/5 shrink-0"><X className="w-4 h-4" /></Button></div>) : (<Button variant="ghost" onClick={() => setIsEditingNickname(true)} className="w-full h-12 bg-white/5 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between px-5"><span>{contact?.customName || "Add Nickname"}</span><Pencil className="w-3 h-3 opacity-40" /></Button>)}</div></div>
          </div>
        </div>
      </ScrollArea>
    </motion.aside>
  );
}

function PollCreatorInline({ onClose, onSend }: { onClose: () => void, onSend: (poll: any) => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const handleAddOption = () => setOptions([...options, '']);
  const handleOptionChange = (idx: number, val: string) => { const newOptions = [...options]; newOptions[idx] = val; setOptions(newOptions); };
  const handleCreate = () => { if (!question.trim() || options.filter(o => o.trim()).length < 2) return; onSend({ question: question.trim(), options: options.filter(o => o.trim() !== ''), voters: {} }); setQuestion(''); setOptions(['', '']); };
  return (<div className="max-w-4xl mx-auto space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg md:text-xl font-black font-headline uppercase italic text-gradient tracking-tight">Create Poll</h2><p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ask a question to the group</p></div><Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></Button></div><div className="grid md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">The Question</Label><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Meet at 8 PM?" className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary text-sm shadow-inner" autoFocus /></div><div className="space-y-2"><Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Options</Label><div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">{options.map((opt, i) => (<Input key={`opt-${i}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Option ${i+1}`} className="bg-white/5 border-white/10 rounded-xl h-10 focus:ring-primary text-xs" />))}</div><Button variant="ghost" onClick={handleAddOption} className="text-[8px] uppercase font-black text-primary tracking-widest p-0 h-6 hover:bg-transparent hover:text-white transition-colors"><Plus className="w-3 h-3 mr-1" /> Add Option</Button></div></div><Button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2} className="w-full h-14 bg-primary hover:glow-green text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">Send Poll</Button></div>);
}

function ContactPickerInline({ onClose, onSend }: { onClose: () => void, onSend: (contact: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user || !db) return;
    const fetchContacts = async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'contacts'));
      const contactIds = snap.docs.map(d => d.id);
      if (contactIds.length === 0) { setProfiles([]); setLoading(false); return; }
      const usersSnap = await getDocs(query(collection(db, 'users'), where('id', 'in', contactIds)));
      setProfiles(usersSnap.docs.map(d => d.data() as UserProfile));
      setLoading(false);
    };
    fetchContacts();
  }, [user, db]);
  return (<div className="max-w-4xl mx-auto space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg md:text-xl font-black font-headline uppercase italic text-gradient tracking-tight">Share Contact</h2><p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Send a contact to this chat</p></div><Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></Button></div><ScrollArea className="h-64 rounded-3xl bg-white/[0.02] border border-white/5 p-3">{loading ? (<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>) : profiles.length === 0 ? (<div className="text-center py-20 opacity-30 text-[9px] font-black uppercase tracking-widest italic">No Contacts Found</div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{profiles.map(p => (<button key={`contact-${p.id}`} onClick={() => onSend({ uid: p.id, name: p.fullName || p.displayName || p.username, username: p.username })} className="w-full flex items-center h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-4 gap-3 hover:bg-primary/10 group transition-all text-left"><div className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center font-bold text-primary group-hover:glow-green transition-all uppercase text-xs">{p.username[0]}</div><div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase truncate group-hover:text-primary transition-colors text-white">{p.fullName}</p><p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest truncate">@{p.username}</p></div></button>))}</div>)}</ScrollArea></div>);
}

function ForwardPicker({ open, onClose, onForward }: { open: boolean, onClose: () => void, onForward: (id: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [convs, setConvs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  useEffect(() => {
    if (!user || !db || !open) return;
    const unsub = onSnapshot(query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConvs(data);
      data.forEach(c => { const otherId = c.participantIds.find((id: string) => id !== user.uid); if (otherId && !profiles[otherId]) { onSnapshot(doc(db, 'users', otherId), s => { if (s.exists()) setProfiles(prev => ({ ...prev, [otherId]: s.data() as UserProfile })); }); } });
    });
    return () => unsub();
  }, [user, db, open]);
  return (<Dialog open={open} onOpenChange={onClose}><DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden max-w-[calc(100%-2rem)] md:max-w-sm shadow-2xl"><DialogHeader className="p-6 pb-4"><DialogTitle className="text-xl font-black font-headline uppercase italic text-gradient tracking-tight text-center md:text-left">Share Message</DialogTitle><DialogDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center md:text-left">Send this to another chat</DialogDescription></DialogHeader><ScrollArea className="h-80 px-4 pb-6"><div className="space-y-1.5">{convs.map(c => { const otherId = c.participantIds.find((id: string) => id !== user?.uid); const p = profiles[otherId]; const name = p?.displayName || p?.fullName || 'User'; return (<Button key={`forward-${c.id}`} onClick={() => onForward(c.id)} variant="ghost" className="w-full justify-start h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-4 gap-3 hover:bg-primary/10 group transition-all"><div className="w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center font-bold text-primary group-hover:glow-green transition-all text-sm">{name[0].toUpperCase()}</div><div className="text-left min-w-0 flex-1"><p className="text-11px] font-black uppercase truncate group-hover:text-primary transition-colors text-white">{name}</p><p className="text-[9px] uppercase font-bold text-muted-foreground truncate tracking-widest">{c.lastMessage || 'Recent chat'}</p></div></Button>); })}</div></ScrollArea></DialogContent></Dialog>);
}

