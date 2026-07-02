'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, Sparkles, Check, Wifi, WifiOff, FileText, 
  Download, Bold, Italic, Underline, Heading, List, ListOrdered, 
  Code, Link as LinkIcon, Search, Undo2, Redo2, Settings,
  Users, History, FolderOpen, MessageSquare, Copy, X, Shield, Globe, Link2, PenTool
} from 'lucide-react';
import BackgroundBlobs from '@/components/BackgroundBlobs';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = React.use(params);
  const router = useRouter();
  
  // content holds the raw HTML string for the rich text editor
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(12);

  // User presence & roles
  const [myUserId, setMyUserId] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<{id: string, role: string}[]>([]);

  // Typing Lock State
  const [typingLock, setTypingLock] = useState<{ user_id: string | null, role: string | null, timestamp: number }>({
    user_id: null,
    role: null,
    timestamp: 0
  });
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocked = typingLock.user_id !== null && typingLock.user_id !== myUserId;

  // Active toolbar formats
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    list: false,
    orderedList: false,
    code: false,
  });

  // Undo/Redo History Stack
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'users'>('users');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Link Modal
  const [insertLinkModalOpen, setInsertLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const selectionRangeRef = useRef<Range | null>(null);

  // Socket and refs
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 1. Verify if the room exists on load & setup identity
  useEffect(() => {
    let active = true;

    async function checkRoom() {
      try {
        // Setup identity
        let storedUserId = localStorage.getItem('notepad_user_id');
        if (!storedUserId) {
          storedUserId = crypto.randomUUID();
          localStorage.setItem('notepad_user_id', storedUserId);
        }
        setMyUserId(storedUserId);

        const response = await fetch(`${API_BASE}/api/room/${roomId}`);
        if (!response.ok) {
          throw new Error('Room not found');
        }
        const data = await response.json();
        if (active) {
          const initialContent = data.content || '';
          setContent(initialContent);
          if (editorRef.current) {
            editorRef.current.innerHTML = initialContent;
          }
          historyRef.current = [initialContent];
          historyIndexRef.current = 0;
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setRoomError(true);
          setLoading(false);
        }
      }
    }

    checkRoom();

    return () => {
      active = false;
    };
  }, [roomId, API_BASE]);

  // Track selection changes to update toolbar active states
  const updateActiveFormats = () => {
    setTimeout(() => {
      if (!editorRef.current) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
        let isHeading = false;
        let isCode = false;
        let isList = false;
        let isOrderedList = false;
        
        let node = sel.anchorNode as Node | null;
        while (node && node !== editorRef.current) {
          const tag = node?.nodeName.toLowerCase();
          if (tag === 'h3') isHeading = true;
          if (tag === 'pre') isCode = true;
          if (tag === 'ul') isList = true;
          if (tag === 'ol') isOrderedList = true;
          node = node?.parentNode || null;
        }

        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          heading: isHeading,
          list: isList || document.queryCommandState('insertUnorderedList'),
          orderedList: isOrderedList || document.queryCommandState('insertOrderedList'),
          code: isCode,
        });
      }
    }, 0);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => {
      document.removeEventListener('selectionchange', updateActiveFormats);
    };
  }, []);

  // 2. Manage WebSocket connection
  useEffect(() => {
    if (loading || roomError || !myUserId) return;

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', { room: roomId, userId: myUserId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('users_update', (users: {id: string, role: string}[]) => {
      setActiveUsers(users);
    });

    socket.on('lock_status', (lock: { user_id: string | null, role: string | null, timestamp: number }) => {
      setTypingLock(lock);
    });

    // Handle latency check
    const latencyInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('ping_latency', () => {
        const duration = Date.now() - start;
        setLatency(duration);
      });
    }, 5000);

    socket.on('load_content', (data: string) => {
      setContent(data);
      if (editorRef.current && editorRef.current.innerHTML !== data) {
        editorRef.current.innerHTML = data;
      }
      if (historyRef.current.length <= 1) {
        historyRef.current = [data];
        historyIndexRef.current = 0;
      }
    });

    socket.on('update', (data: string) => {
      setContent(data);
      if (editorRef.current && editorRef.current.innerHTML !== data) {
        // Only update innerHTML if it's strictly different to avoid cursor jumps when local user is typing
        editorRef.current.innerHTML = data;
      }
      addToHistory(data);
    });

    return () => {
      clearInterval(latencyInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId, loading, roomError, API_BASE, myUserId]);

  const addToHistory = (val: string) => {
    const hist = historyRef.current;
    const idx = historyIndexRef.current;
    if (hist[idx] === val) return;

    const newHist = hist.slice(0, idx + 1);
    newHist.push(val);
    historyRef.current = newHist;
    historyIndexRef.current = newHist.length - 1;
  };

  // Typing lock management
  const handleTypingActivity = () => {
    if (isLocked) return;

    if (typingLock.user_id !== myUserId) {
      socketRef.current?.emit('typing_start', { room: roomId, userId: myUserId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_end', { room: roomId, userId: myUserId });
    }, 2000);
  };

  // 3. Emit updates on contentEditable input
  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    
    handleTypingActivity();

    const val = e.currentTarget.innerHTML;
    setContent(val);
    addToHistory(val);
    if (socketRef.current) {
      socketRef.current.emit('update', { room: roomId, content: val, userId: myUserId });
    }
  };

  // Formatting Native WYSIWYG commands
  const handleFormat = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault(); 
    if (isLocked) return;
    
    handleTypingActivity();
    document.execCommand(command, false, value);
    
    updateActiveFormats(); // Instantly update UI

    if (editorRef.current) {
      const val = editorRef.current.innerHTML;
      setContent(val);
      addToHistory(val);
      if (socketRef.current) {
        socketRef.current.emit('update', { room: roomId, content: val, userId: myUserId });
      }
    }
  };

  const toggleBlockFormat = (e: React.MouseEvent, format: string) => {
    e.preventDefault();
    if (isLocked) return;
    
    handleTypingActivity();
    
    let isActive = false;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node = sel.anchorNode as Node | null;
      while (node && node !== editorRef.current) {
        if (node?.nodeName.toLowerCase() === format.toLowerCase()) {
          isActive = true;
          break;
        }
        node = node?.parentNode || null;
      }
    }
    
    // Toggle off if already active by switching back to a paragraph
    if (isActive) {
      document.execCommand('formatBlock', false, 'P');
    } else {
      document.execCommand('formatBlock', false, format);
    }
    
    updateActiveFormats(); // Instantly update UI

    if (editorRef.current) {
      const val = editorRef.current.innerHTML;
      setContent(val);
      addToHistory(val);
      if (socketRef.current) {
        socketRef.current.emit('update', { room: roomId, content: val, userId: myUserId });
      }
    }
  };

  const openLinkModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRangeRef.current = sel.getRangeAt(0);
    }
    setInsertLinkModalOpen(true);
  };

  const confirmInsertLink = () => {
    if (selectionRangeRef.current && linkUrl && !isLocked) {
      handleTypingActivity();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selectionRangeRef.current);
      document.execCommand('createLink', false, linkUrl);
      
      if (editorRef.current) {
        const val = editorRef.current.innerHTML;
        setContent(val);
        addToHistory(val);
        if (socketRef.current) socketRef.current.emit('update', { room: roomId, content: val, userId: myUserId });
      }
    }
    setInsertLinkModalOpen(false);
    setLinkUrl('');
  };

  // Undo/Redo logic
  const handleUndo = () => {
    if (isLocked) return;
    handleTypingActivity();
    
    const idx = historyIndexRef.current;
    if (idx > 0) {
      const prevVal = historyRef.current[idx - 1];
      historyIndexRef.current = idx - 1;
      setContent(prevVal);
      if (editorRef.current) editorRef.current.innerHTML = prevVal;
      if (socketRef.current) {
        socketRef.current.emit('update', { room: roomId, content: prevVal, userId: myUserId });
      }
    }
  };

  const handleRedo = () => {
    if (isLocked) return;
    handleTypingActivity();
    
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) {
      const nextVal = historyRef.current[idx + 1];
      historyIndexRef.current = idx + 1;
      setContent(nextVal);
      if (editorRef.current) editorRef.current.innerHTML = nextVal;
      if (socketRef.current) {
        socketRef.current.emit('update', { room: roomId, content: nextVal, userId: myUserId });
      }
    }
  };

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const downloadText = () => {
    const element = document.createElement("a");
    // Strip HTML tags for clean text export
    const plainText = content.replace(/<[^>]+>/g, '\n').replace(/\n\n+/g, '\n');
    const file = new Blob([plainText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `notes-${roomId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Approximate word and character counts from raw text
  const rawText = content.replace(/<[^>]+>/g, '');
  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden theme-sepia">
        <BackgroundBlobs />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
          <p className="text-xs text-text-sub font-sans tracking-wide">Syncing notepad workspace...</p>
        </div>
      </main>
    );
  }

  if (roomError && roomId !== 'demo-space') {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden theme-sepia">
        <BackgroundBlobs />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-paper rounded-xl p-8 z-10 text-center flex flex-col items-center gap-6 border border-border-main/50 shadow-xl"
        >
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
            <WifiOff className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-bold text-text-main mb-2">Workspace Lost</h2>
            <p className="text-xs text-text-sub leading-relaxed font-sans">
              This collaborative room does not exist, or the connection to our notepad server timed out.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 rounded-lg btn-secondary font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col justify-between selection:bg-ink/10 selection:text-ink theme-sepia transition-colors duration-450`}>
      {/* Background mesh animations */}
      <BackgroundBlobs />

      {/* Floating Glass Navbar Panel */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-40 rounded-xl bg-paper/70 backdrop-blur-md px-6 py-2.5 flex items-center justify-between border border-border-main/50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-black/5 text-text-sub hover:text-text-main transition-all cursor-pointer"
            title="Go to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-ink/10 text-ink rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-sans font-bold text-text-main flex items-center gap-1.5">
                {roomId === 'demo-space' ? 'Demo Sandbox' : `Notepad: ${roomId}`}
                <span className={`w-1.5 h-1.5 rounded-full ${connected || roomId === 'demo-space' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </h1>
              <p className="text-[9px] text-text-sub">Co-writing desk space</p>
            </div>
          </div>
        </div>

        {/* User Avatars & Share */}
        <div className="flex items-center gap-4">
          
          <div className="hidden sm:flex items-center -space-x-1.5">
            {activeUsers.slice(0, 3).map((u) => (
              <span key={u.id} className="w-6 h-6 rounded-full bg-ink/10 border border-paper text-[9px] flex items-center justify-center font-bold text-ink shadow-sm relative group cursor-default">
                {u.id === myUserId ? 'You' : u.role.charAt(0)}
                <div className="absolute top-full mt-2 hidden group-hover:block bg-paper text-text-main text-[10px] px-2 py-1 rounded shadow-lg border border-border-main/50 whitespace-nowrap z-50">
                  {u.id === myUserId ? `You (${u.role})` : u.role}
                </div>
              </span>
            ))}
            {activeUsers.length > 3 && (
              <span className="w-6 h-6 rounded-full bg-border-main/30 border border-paper text-[9px] flex items-center justify-center font-bold text-text-sub shadow-sm">
                +{activeUsers.length - 3}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg btn-primary text-xs flex items-center gap-1.5 cursor-pointer shadow-sm glow-ink"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${sidebarOpen ? 'bg-border-main/20 border-border-main text-ink' : 'btn-secondary shadow-sm'}`}
              title="Toggle Sidebar"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex pt-24 pb-18 px-6 max-w-6xl w-full mx-auto relative gap-6 z-10 items-stretch">
        
        {/* Editor Central Canvas */}
        <div className="flex-1 flex flex-col gap-4 items-center relative">
          
          {/* Typing Indicator Overlay */}
          <AnimatePresence>
            {isLocked && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-16 z-30 px-4 py-1.5 rounded-full bg-ink text-white font-sans text-xs font-semibold shadow-lg shadow-ink/30 flex items-center gap-2"
              >
                <div className="flex items-center gap-1">
                  <motion.div className="w-1.5 h-1.5 bg-white/70 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-white/70 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-white/70 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                </div>
                <span>{typingLock.role} is writing...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass Formatting Toolbar (Disabled if locked) */}
          <div className={`rounded-lg glass-surface p-1.5 flex items-center gap-1 border border-border-main/50 shadow-sm shrink-0 transition-opacity ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <button onMouseDown={handleUndo} className="p-1.5 rounded-lg hover:bg-ink/10 text-text-sub hover:text-ink transition-all cursor-pointer" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button onMouseDown={handleRedo} className="p-1.5 rounded-lg hover:bg-ink/10 text-text-sub hover:text-ink transition-all cursor-pointer" title="Redo"><Redo2 className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-border-main mx-1" />
            
            <button 
              onMouseDown={(e) => handleFormat(e, 'bold')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer font-bold ${activeFormats.bold ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={(e) => handleFormat(e, 'italic')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer font-italic ${activeFormats.italic ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={(e) => handleFormat(e, 'underline')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeFormats.underline ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={(e) => toggleBlockFormat(e, 'H3')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeFormats.heading ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Heading"
            >
              <Heading className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-border-main mx-1" />
            <button 
              onMouseDown={(e) => handleFormat(e, 'insertUnorderedList')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeFormats.list ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={(e) => handleFormat(e, 'insertOrderedList')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeFormats.orderedList ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={(e) => toggleBlockFormat(e, 'PRE')} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeFormats.code ? 'bg-ink/15 text-ink shadow-sm scale-105' : 'hover:bg-ink/10 text-text-sub hover:text-ink'}`} 
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button 
              onMouseDown={openLinkModal} 
              className="p-1.5 rounded-lg hover:bg-ink/10 text-text-sub hover:text-ink transition-all cursor-pointer" 
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-border-main mx-1" />
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 rounded-lg hover:bg-ink/10 text-text-sub hover:text-ink transition-all cursor-pointer pointer-events-auto" title="Search"><Search className="w-4 h-4" /></button>
            <button onClick={downloadText} className="p-1.5 rounded-lg hover:bg-ink/10 text-text-sub hover:text-ink transition-all cursor-pointer pointer-events-auto" title="Export HTML"><Download className="w-4 h-4" /></button>
          </div>

          {/* Search Bar Panel (Toggleable) */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-2xl bg-paper rounded-lg px-4 py-2 flex items-center gap-2 border border-border-main/50 shadow-sm overflow-hidden"
              >
                <Search className="w-4 h-4 text-text-sub" />
                <input
                  type="text"
                  placeholder="Find text in journal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-text-main placeholder:text-text-sub"
                />
                <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-text-sub hover:text-text-main cursor-pointer"><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* High-Aesthetic Ruled Notepad with corner fold & glow shadows */}
          <div className="flex-1 w-full max-w-3xl paper-sheet pt-10 shadow-lg glow-ink page-fold overflow-hidden flex flex-col relative">
            
            {/* Canvas Header Info Decor */}
            <div className="px-6 py-2 border-b border-black/[0.04] flex items-center justify-between text-[10px] text-text-sub pl-[76px] shrink-0 select-none">
              <span className="font-sans flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-ink" />
                ruled notepad &bull; active sync
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider">room workspace</span>
            </div>

            {/* Rich Text contentEditable */}
            <div
              ref={editorRef}
              onInput={handleContentInput}
              onKeyUp={updateActiveFormats}
              onClick={updateActiveFormats}
              contentEditable={!isLocked}
              suppressContentEditableWarning
              data-placeholder="Start typing your notes here... Everything syncs with your team in real-time."
              className={`ruled-textarea overflow-y-auto ${isLocked ? 'opacity-80' : ''}`}
            />
          </div>
        </div>

        {/* Clean Sidebar Panel */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="hidden md:flex flex-col bg-paper border border-border-main/50 rounded-xl overflow-hidden shadow-lg shrink-0"
            >
              {/* Tab Selector */}
              <div className="flex border-b border-border-main bg-border-main/20 p-1 gap-1">
                <button
                  onClick={() => setSidebarTab('users')}
                  className={`flex-1 py-2 text-[10px] font-semibold font-sans rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${sidebarTab === 'users' ? 'bg-paper text-text-main shadow-sm border border-border-main/50' : 'text-text-sub hover:text-text-main'}`}
                >
                  <Users className="w-3 h-3" />
                  Users
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-4 overflow-y-auto text-xs text-text-sub leading-relaxed flex flex-col gap-4">
                {sidebarTab === 'users' && (
                  <div className="flex flex-col gap-3">
                    <div className="font-semibold text-[10px] uppercase text-text-sub tracking-wider mb-1 flex items-center justify-between">
                      Participants <span className="bg-ink/10 text-ink px-1.5 py-0.5 rounded-full">{activeUsers.length}</span>
                    </div>
                    {activeUsers.map(u => {
                      const isTyping = typingLock.user_id === u.id;
                      return (
                        <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${u.id === myUserId ? 'bg-border-main/20 border-border-main' : 'bg-transparent border-transparent'}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-ink/10 border border-paper text-[10px] flex items-center justify-center font-bold text-ink shadow-sm">
                              {u.id === myUserId ? 'Y' : u.role.charAt(0)}
                            </span>
                            <span className="font-sans font-medium text-text-main text-xs">
                              {u.id === myUserId ? `You (${u.role})` : u.role}
                            </span>
                          </div>
                          {isTyping && (
                            <span className="text-[9px] text-ink font-sans font-medium flex items-center gap-1">
                              <PenTool className="w-2.5 h-2.5" /> writing
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Status Bar */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-40 rounded-lg bg-paper/70 backdrop-blur-md px-6 py-2 flex items-center justify-between border border-border-main/50 shadow-sm text-[10px] text-text-sub">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> saved in memory</span>
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-emerald-500" /> {latency}ms latency</span>
          <span className="hidden sm:inline">Desk Collaborators: {activeUsers.length}</span>
        </div>
      </footer>

      {/* Insert Link Custom Modal */}
      <AnimatePresence>
        {insertLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-sm bg-paper rounded-xl p-6 border border-border-main/60 shadow-2xl relative flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-ink/10 text-ink rounded-lg">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-main">Insert Hyperlink</h3>
                </div>
                <button
                  onClick={() => setInsertLinkModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-border-main/50 text-text-sub hover:text-text-main transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-text-sub uppercase tracking-wider font-sans">Target URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmInsertLink();
                  }}
                  className="w-full bg-border-main/10 border border-border-main/50 rounded-lg p-3 text-xs text-text-main outline-none focus:border-ink transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => setInsertLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmInsertLink}
                  className="px-5 py-2 btn-primary text-xs font-bold shadow-sm glow-ink cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Envelope Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-md bg-paper rounded-xl p-6 border border-border-main/60 shadow-2xl relative flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-ink/10 text-ink rounded-lg">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-main">Share Notepad</h3>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-border-main/50 text-text-sub hover:text-text-main transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Link Input Row */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-text-sub uppercase tracking-wider font-sans">Workspace Link</label>
                <div className="flex items-center gap-2 bg-border-main/20 border border-border-main/50 rounded-lg p-1.5 pl-3">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 bg-transparent outline-none border-none text-xs text-text-main"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-1.5 btn-primary text-[10px] font-bold flex items-center gap-1.5 cursor-pointer text-white shadow-sm glow-ink"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Permissions settings */}
              <div className="flex flex-col gap-2 border-t border-border-main/80 pt-4">
                <span className="text-[10px] font-semibold text-text-sub uppercase tracking-wider font-sans mb-1">Access Permissions</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-border-main/20 border border-border-main">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-ink" />
                    <span className="text-xs font-sans font-medium text-text-main">Public Desk</span>
                  </div>
                  <span className="text-[10px] font-sans font-semibold text-ink">Can Write</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-border-main/10 opacity-60">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-text-sub" />
                    <span className="text-xs font-sans font-medium text-text-sub">Invite Only</span>
                  </div>
                  <span className="text-[10px] font-sans font-semibold text-text-sub">Disabled</span>
                </div>
              </div>

              {/* Active list */}
              <div className="flex flex-col gap-2 border-t border-border-main/80 pt-4">
                <span className="text-[10px] font-semibold text-text-sub uppercase tracking-wider font-sans mb-2">Active Collaborators</span>
                <div className="flex -space-x-1.5">
                  {activeUsers.map(u => (
                    <span key={u.id} className="w-7 h-7 rounded-full bg-ink/10 border border-paper text-xs flex items-center justify-center font-bold text-ink shadow-sm relative group cursor-default">
                      {u.id === myUserId ? 'You' : u.role.charAt(0)}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-paper text-text-main text-[10px] px-2 py-1 rounded shadow-lg border border-border-main/50 whitespace-nowrap z-50">
                        {u.id === myUserId ? `You (${u.role})` : u.role}
                      </div>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
