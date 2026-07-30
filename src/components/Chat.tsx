import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { ChatProvider, useChat } from '../context/ChatContext';
import type { Attachment } from '../context/ChatContext';
import {
  Send, Paperclip, Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  PhoneCall, StopCircle, Image as ImageIcon, Volume2, Wifi, WifiOff, X
} from 'lucide-react';

// ─── Call Overlay ─────────────────────────────────────────────────────────────
const CallOverlay: React.FC = () => {
  const { inCall, localStream, remoteStream, isMuted, isCameraOff, endCall, toggleMute, toggleCamera, callError } = useChat();
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (!inCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-6">
      {/* Network connection error indication */}
      {callError && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 text-red-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-2xl backdrop-blur-sm animate-pulse">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span>{callError}</span>
        </div>
      )}

      {/* Video streams */}
      <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
        {/* Remote (main) */}
        <video ref={remoteVideoRef} autoPlay playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs">Connecting to peer…</span>
          </div>
        )}
        {/* Local (PiP) */}
        <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-indigo-500/40 shadow-xl bg-slate-950">
          <video ref={localVideoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition text-white shadow-lg ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition shadow-xl"
          title="Hang Up"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition text-white shadow-lg ${isCameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          title={isCameraOff ? 'Enable Camera' : 'Disable Camera'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
      </div>

      <p className="text-xs text-slate-500">Peer-to-peer encrypted call</p>
    </div>
  );
};

// ─── Incoming Call Dialog ─────────────────────────────────────────────────────
const IncomingCallDialog: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useChat();
  if (!incomingCall) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 glass-card rounded-2xl p-5 w-72 border border-indigo-500/30 shadow-2xl animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          {incomingCall.callType === 'video' ? <Video className="w-5 h-5 text-indigo-400" /> : <Phone className="w-5 h-5 text-indigo-400" />}
        </div>
        <div>
          <p className="font-semibold text-sm text-white">{incomingCall.callerName}</p>
          <p className="text-xs text-slate-400">Incoming {incomingCall.callType} call…</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={rejectCall}
          className="flex-1 py-2 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-900/60 text-xs font-medium transition">
          Decline
        </button>
        <button onClick={acceptCall}
          className="flex-1 py-2 rounded-xl bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60 text-xs font-medium transition flex items-center justify-center gap-1">
          <PhoneCall className="w-3.5 h-3.5" /> Accept
        </button>
      </div>
    </div>
  );
};

// ─── Voice Recorder ───────────────────────────────────────────────────────────
const VoiceRecorder: React.FC<{ onRecorded: (file: File) => void }> = ({ onRecorded }) => {
  const [recording, setRecording]     = useState(false);
  const [seconds, setSeconds]         = useState(0);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        onRecorded(file);
      };
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-medium ${
        recording
          ? 'bg-red-600/20 border border-red-500/40 text-red-300 animate-pulse'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
      title={recording ? 'Stop recording' : 'Record voice message'}
    >
      {recording ? (
        <><StopCircle className="w-4 h-4" /><span>{seconds}s</span></>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};

// ─── Call History Bubble ──────────────────────────────────────────────────────
const CallHistoryBubble: React.FC<{ msg: any }> = ({ msg }) => {
  const { callHistory } = msg;
  if (!callHistory) return null;

  const isVideo = callHistory.callType === 'video';
  const isMissed = callHistory.duration === 0;
  const joinedCount = callHistory.joinedParticipants?.length || 0;

  return (
    <div className="flex justify-center my-4 w-full">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 max-w-sm w-full flex items-start gap-3 shadow-lg backdrop-blur-sm">
        <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${
          isMissed
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-green-500/10 border border-green-500/20 text-green-400'
        }`}>
          {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white">
              {isVideo ? 'Video Call' : 'Voice Call'}
            </p>
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-200 mt-0.5">
            {isMissed ? 'Missed Call' : `Call Ended · ${callHistory.duration}s`}
          </p>
          {joinedCount > 0 && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-800/60 pt-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Participants ({joinedCount})</span>
              <span className="text-xs text-slate-300 truncate">
                {callHistory.joinedParticipants.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: any; isOwn: boolean }> = ({ msg, isOwn }) => {
  const [imgExpanded, setImgExpanded] = useState<string | null>(null);

  if (msg.isCallHistory) {
    return <CallHistoryBubble msg={msg} />;
  }

  return (
    <div className={`flex gap-2.5 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <img
        src={msg.sender?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.name}`}
        alt={msg.sender?.name}
        className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
      />
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && (
          <span className="text-[10px] text-slate-500 font-medium px-1">{msg.sender?.name}</span>
        )}
        {msg.text && (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'bg-indigo-600/80 text-white rounded-tr-sm'
              : 'bg-slate-800/80 text-slate-100 rounded-tl-sm'
          }`}>
            {msg.text}
          </div>
        )}
        {msg.attachments?.map((att: Attachment, i: number) => (
          <div key={i} className="max-w-xs">
            {att.type === 'image' ? (
              <>
                <img
                  src={att.url}
                  alt="attachment"
                  className="rounded-xl max-w-full max-h-48 object-cover cursor-zoom-in border border-slate-700/50"
                  onClick={() => setImgExpanded(att.url)}
                />
                {imgExpanded === att.url && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setImgExpanded(null)}
                  >
                    <img src={att.url} alt="expanded" className="max-w-full max-h-full rounded-xl" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/50">
                <Volume2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <audio controls src={att.url} className="h-8 max-w-[220px]" />
              </div>
            )}
          </div>
        ))}
        <span className="text-[9px] text-slate-600 px-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// ─── Chat Inner (uses ChatContext) ────────────────────────────────────────────
const ChatInner: React.FC = () => {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const {
    messages, typingUsers, connected, uploading,
    sendMessage, uploadFile, emitTypingStart, emitTypingStop,
    startCall, inCall,
  } = useChat();

  const [text, setText]               = useState('');
  const [pendingAtt, setPendingAtt]   = useState<Attachment[]>([]);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const typingTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef                 = useRef<HTMLInputElement>(null);
  const audioInputRef                 = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!text.trim() && pendingAtt.length === 0) return;
    sendMessage(text.trim(), pendingAtt);
    setText('');
    setPendingAtt([]);
    emitTypingStop();
  }, [text, pendingAtt, sendMessage, emitTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTypingStart();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(emitTypingStop, 1500);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const att = await uploadFile(file);
    if (att) setPendingAtt(prev => [...prev, att]);
    e.target.value = '';
  };

  const handleVoiceRecorded = async (file: File) => {
    const att = await uploadFile(file);
    if (att) {
      sendMessage('', [att]);
    }
  };

  const removePending = (idx: number) => setPendingAtt(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/70 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" style={{ display: connected ? 'block' : 'none' }} />
          {!connected && <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
          <div>
            <h2 className="text-sm font-bold text-white">{activeTeam?.name}</h2>
            <p className="text-[10px] text-slate-500">{connected ? 'Connected' : 'Reconnecting…'} · {activeTeam?.members.length} members</p>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => startCall('audio')}
            disabled={inCall}
            className="p-2 rounded-xl text-slate-400 hover:text-green-400 hover:bg-green-950/20 border border-transparent hover:border-green-800/50 transition disabled:opacity-40"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall('video')}
            disabled={inCall}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20 border border-transparent hover:border-indigo-800/50 transition disabled:opacity-40"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 py-16">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <p className="text-sm">No messages yet. Say hi to your team! 👋</p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg._id} msg={msg} isOwn={msg.sender?._id === user?.id} />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Pending attachments preview ── */}
      {pendingAtt.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-slate-800/50">
          {pendingAtt.map((att, i) => (
            <div key={i} className="relative group">
              {att.type === 'image' ? (
                <img src={att.url} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700" />
              ) : (
                <div className="h-16 w-32 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center gap-1.5 px-2">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] text-slate-400 truncate">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => removePending(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-950 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="px-4 py-3 border-t border-slate-800/70 flex-shrink-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 mb-2">
          {/* Image attach */}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Audio attach */}
          <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => audioInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            title="Attach audio"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice recorder */}
          <VoiceRecorder onRecorded={handleVoiceRecorded} />

          {uploading && (
            <span className="text-[10px] text-slate-500 ml-1 animate-pulse">Uploading…</span>
          )}
        </div>

        {/* Text input + send */}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeTeam?.name}…`}
            rows={1}
            className="flex-1 resize-none glass-input rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() && pendingAtt.length === 0}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 flex-shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-700 mt-1.5 pl-1">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
};

// ─── Chat (exported — wraps provider) ────────────────────────────────────────
export const Chat: React.FC = () => {
  const { activeTeam } = useTeam();

  if (!activeTeam) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
        Select a team to start chatting
      </div>
    );
  }

  return (
    <ChatProvider teamId={activeTeam._id}>
      <div className="flex flex-col h-full bg-[#070A0F]">
        <CallOverlay />
        <IncomingCallDialog />
        <ChatInner />
      </div>
    </ChatProvider>
  );
};
