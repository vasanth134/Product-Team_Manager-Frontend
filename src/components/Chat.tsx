import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { ChatProvider, useChat } from '../context/ChatContext';
import type { Attachment, Notification } from '../context/ChatContext';
import {
  Send, Paperclip, Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  PhoneCall, StopCircle, Image as ImageIcon, Volume2, WifiOff, X,
  Minimize2, Maximize2, MonitorUp, Bell, Plus, Hash, MessageSquare
} from 'lucide-react';

const RemoteVideoPlayer: React.FC<{ stream: MediaStream; className?: string }> = ({ stream, className = "w-full h-full object-cover" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Remote video play error:", err));
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={className}
    />
  );
};

const RemoteAudioPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(err => console.warn("Remote audio play error:", err));
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      className="hidden"
    />
  );
};

const CallAudioController: React.FC = () => {
  const { inCall, callType, remoteStreams, isMinimized } = useChat();
  if (!inCall) return null;

  return (
    <>
      {Object.entries(remoteStreams).map(([sid, info]) => {
        const hasVideo = info.stream.getVideoTracks().length > 0;
        // Audio is needed only if: call is minimized, it is audio-only, or the remote participant has no video stream
        const needsAudioOnly = isMinimized || callType === 'audio' || !hasVideo;
        if (!needsAudioOnly) return null;
        return <RemoteAudioPlayer key={sid} stream={info.stream} />;
      })}
    </>
  );
};

// ─── Call Overlay ─────────────────────────────────────────────────────────────
const CallOverlay: React.FC = () => {
  const { user } = useAuth();
  const {
    inCall, callType, localStream, remoteStreams, isMuted, isCameraOff, isScreenSharing,
    endCall, toggleMute, toggleCamera, toggleScreenShare, callError, isMinimized, setIsMinimized, activeCallStatus,
    screenShareSocketId
  } = useChat();

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const pipRef         = useRef<HTMLDivElement>(null);

  const participantNames = useMemo(() => {
    const names = new Set<string>();
    if (user?.name) {
      names.add(user.name);
    }
    Object.values(remoteStreams).forEach(info => {
      if (info.userName) {
        names.add(info.userName);
      }
    });
    if (activeCallStatus?.participants) {
      activeCallStatus.participants.forEach(name => {
        if (name) names.add(name);
      });
    }
    return Array.from(names);
  }, [user?.name, remoteStreams, activeCallStatus?.participants]);

  const [pipPosition, setPipPosition] = useState({ x: 100, y: 100 });
  const [hasInitializedPosition, setHasInitializedPosition] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isCameraOff, isScreenSharing]);

  // Initialize position to bottom right once screen size is known
  useEffect(() => {
    if (inCall && !hasInitializedPosition) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setPipPosition({
        x: width - 192 - 24,
        y: height - 128 - 120
      });
      setHasInitializedPosition(true);
    }
  }, [inCall, hasInitializedPosition]);

  // Keep PIP within viewport bounds when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPipPosition(prev => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const maxX = Math.max(0, width - 192 - 16);
        const maxY = Math.max(0, height - 128 - 16);
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(16, Math.min(prev.y, maxY))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isDragging.current = true;
    setIsDraggingState(true);
    dragStart.current = { x: e.clientX - pipPosition.x, y: e.clientY - pipPosition.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxX = Math.max(0, width - 192 - 16);
    const maxY = Math.max(0, height - 128 - 16);

    setPipPosition({
      x: Math.max(16, Math.min(newX, maxX)),
      y: Math.max(16, Math.min(newY, maxY))
    });
  }, [pipPosition]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setIsDraggingState(false);
  }, []);

  // Touch event handlers for mobile dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    setIsDraggingState(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - pipPosition.x, y: touch.clientY - pipPosition.y };
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxX = Math.max(0, width - 192 - 16);
    const maxY = Math.max(0, height - 128 - 16);

    setPipPosition({
      x: Math.max(16, Math.min(newX, maxX)),
      y: Math.max(16, Math.min(newY, maxY))
    });
  }, [pipPosition]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    setIsDraggingState(false);
  }, []);

  useEffect(() => {
    if (inCall) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [inCall, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (!inCall) {
      setHasInitializedPosition(false);
    }
  }, [inCall]);

  if (!inCall || isMinimized) return null;

  const remotePeers = Object.entries(remoteStreams);
  const isRemoteScreenSharing = screenShareSocketId !== null && !!remoteStreams[screenShareSocketId];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Minimize Button */}
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-6 right-6 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800/80 shadow-lg backdrop-blur-xl z-30"
        title="Minimize Call"
      >
        <Minimize2 className="w-5 h-5" />
      </button>

      {/* Network connection error indication */}
      {callError && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-45 bg-red-900/90 border border-red-500/50 text-red-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-2xl backdrop-blur-sm animate-pulse">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span>{callError}</span>
        </div>
      )}

      {/* Audio / Video display viewport */}
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
        {(callType === 'audio' && !isRemoteScreenSharing && !isScreenSharing) ? (
          // Audio Call UI
          <div className="flex flex-col items-center gap-4 text-center z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping scale-150" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg border border-indigo-400/30">
                🎙️
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Active Room Audio Call</p>
              <p className="text-xs text-indigo-400 mt-1">
                In Call: {participantNames.join(', ') || 'Connecting…'}
              </p>
            </div>
          </div>
        ) : (
          // Video call layout
          <>
            {isRemoteScreenSharing ? (
              // Remote Screen Share Mode
              (() => {
                const sharingPeer = remoteStreams[screenShareSocketId!];
                return (
                  <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
                    <RemoteVideoPlayer stream={sharingPeer.stream} className="w-full h-full object-contain bg-slate-950" />
                    
                    {/* Screen Sharing Indicator */}
                    <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-xl text-xs text-slate-300 font-semibold border border-slate-800/80 shadow-lg z-20 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Viewing {sharingPeer.userName}'s Screen</span>
                    </div>

                    {/* Other participants floating cards */}
                    {(() => {
                      const otherPeers = remotePeers.filter(([sid]) => sid !== screenShareSocketId);
                      if (otherPeers.length === 0) return null;
                      return (
                        <div className="absolute top-24 right-6 flex flex-col gap-4 z-20">
                          {otherPeers.map(([sid, info]) => {
                            const hasVideo = info.stream.getVideoTracks().length > 0;
                            return (
                              <div key={sid} className="w-48 h-32 rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950 flex items-center justify-center relative">
                                {hasVideo ? (
                                  <RemoteVideoPlayer stream={info.stream} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                                      {info.userName.slice(0, 2).toUpperCase()}
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold border border-slate-800">
                                  {info.userName}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()
            ) : (
              // Normal Camera View Mode
              <>
                {remotePeers.length === 0 ? (
                  // Waiting screen
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-3 z-0">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs">Waiting for participants to connect…</span>
                  </div>
                ) : remotePeers.length === 1 ? (
                  // Single remote participant - fullscreen cover
                  (() => {
                    const [, info] = remotePeers[0];
                    const hasVideo = info.stream.getVideoTracks().length > 0;
                    return (
                      <div className="absolute inset-0 z-0 bg-slate-950">
                        {hasVideo ? (
                          <RemoteVideoPlayer stream={info.stream} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
                            <div className="relative">
                              <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-pulse scale-110" />
                              <div className="w-28 h-28 rounded-full bg-slate-800 flex items-center justify-center text-white text-3xl font-bold border border-slate-700 shadow-2xl">
                                {info.userName.slice(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <span className="text-base font-semibold text-slate-300">{info.userName}</span>
                          </div>
                        )}
                        <div className="absolute bottom-28 left-6 bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-xl text-xs text-slate-200 font-semibold border border-slate-800/80 shadow-lg z-20">
                          {info.userName}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Multiple remote participants - Grid layout filling screen
                  <div className={`absolute inset-0 z-10 grid gap-4 p-6 pb-28 pt-20 ${
                    remotePeers.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    remotePeers.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {remotePeers.map(([sid, info]) => {
                      const hasVideo = info.stream.getVideoTracks().length > 0;
                      return (
                        <div key={sid} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center w-full h-full shadow-lg">
                          {hasVideo ? (
                            <RemoteVideoPlayer stream={info.stream} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white text-2xl font-bold border border-slate-700 shadow-inner">
                                {info.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-slate-300">{info.userName}</span>
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-slate-200 font-semibold border border-slate-800">
                            {info.userName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Local Video PiP overlay (draggable & touch-draggable) */}
            {(callType === 'video' || isScreenSharing) && (
              <div
                ref={pipRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  position: 'absolute',
                  top: `${pipPosition.y}px`,
                  left: `${pipPosition.x}px`,
                  cursor: isDraggingState ? 'grabbing' : 'grab',
                }}
                className="w-48 h-32 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-2xl bg-slate-950 z-20 flex items-center justify-center group select-none transition-[border-color] duration-300 hover:border-indigo-500/60"
              >
                {!isCameraOff && callType === 'video' ? (
                  <video ref={localVideoRef} autoPlay playsInline muted
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-slate-500 text-xs pointer-events-none select-none">
                    <MonitorUp className="w-5 h-5 mb-1 text-indigo-400" />
                    <span>Sharing Screen</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold border border-slate-800">
                  You {isScreenSharing && ' (Sharing)'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls Overlay Floating at bottom */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 bg-slate-900/70 backdrop-blur-xl px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-3xl border border-slate-800/80 shadow-2xl flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition text-white shadow-lg ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition text-white shadow-lg ${isCameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            title={isCameraOff ? 'Enable Camera' : 'Disable Camera'}
          >
            {isCameraOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        )}

        {(callType === 'video' || callType === 'audio') && (
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition text-white shadow-lg ${isScreenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition shadow-xl"
          title="Hang Up"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

// ─── Minimized Call Widget ──────────────────────────────────────────────────
const MinimizedCallWidget: React.FC = () => {
  const { user } = useAuth();
  const {
    inCall, callType, remoteStreams, isMuted, isCameraOff, isScreenSharing, endCall,
    toggleMute, toggleCamera, toggleScreenShare, isMinimized, setIsMinimized, activeCallStatus
  } = useChat();

  const participantNames = useMemo(() => {
    const names = new Set<string>();
    if (user?.name) {
      names.add(user.name);
    }
    Object.values(remoteStreams).forEach(info => {
      if (info.userName) {
        names.add(info.userName);
      }
    });
    if (activeCallStatus?.participants) {
      activeCallStatus.participants.forEach(name => {
        if (name) names.add(name);
      });
    }
    return Array.from(names);
  }, [user?.name, remoteStreams, activeCallStatus?.participants]);

  if (!inCall || !isMinimized) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 w-80 backdrop-blur-md animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          <span className="text-xs font-bold text-slate-200">
            {callType === 'video' ? 'Video Call ongoing' : 'Audio Call ongoing'}
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          title="Maximize"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <p className="text-[10px] text-slate-400 truncate">
        Participants: {participantNames.join(', ') || 'Connecting…'}
      </p>

      <div className="flex items-center justify-between gap-2 mt-1">
        <button
          onClick={toggleMute}
          className={`p-2 rounded-xl text-white transition flex-1 flex items-center justify-center ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-850 hover:bg-slate-800'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {(callType === 'video' || callType === 'audio') && (
          <>
            {callType === 'video' && (
              <button
                onClick={toggleCamera}
                className={`p-2 rounded-xl text-white transition flex-1 flex items-center justify-center ${isCameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-850 hover:bg-slate-800'}`}
                title={isCameraOff ? 'Camera On' : 'Camera Off'}
              >
                {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={toggleScreenShare}
              className={`p-2 rounded-xl text-white transition flex-1 flex items-center justify-center ${isScreenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-850 hover:bg-slate-800'}`}
              title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            >
              <MonitorUp className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={endCall}
          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white flex-1 flex items-center justify-center transition"
          title="Hang Up"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
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
  const { activeTeam, setActiveTeam, teams } = useTeam();
  const {
    messages, typingUsers, connected, uploading,
    sendMessage, uploadFile, emitTypingStart, emitTypingStop,
    startCall, inCall, joinActiveCall, activeCallStatus,
    channels, activeChannel, notifications, selectChannel, createChannel, markNotificationRead, fetchNotifications
  } = useChat();

  const [text, setText]               = useState('');
  const [pendingAtt, setPendingAtt]   = useState<Attachment[]>([]);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const typingTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef                 = useRef<HTMLInputElement>(null);
  const audioInputRef                 = useRef<HTMLInputElement>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  // Notifications dropdown state
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Create Channel Modal state
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [createChannelLoading, setCreateChannelLoading] = useState(false);

  // Mentions autocomplete suggestions state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = useCallback(() => {
    if (!text.trim() && pendingAtt.length === 0) return;
    sendMessage(text.trim(), pendingAtt);
    setText('');
    setPendingAtt([]);
    emitTypingStop();
  }, [text, pendingAtt, sendMessage, emitTypingStop]);

  // Filter team members for mention suggestions
  const suggestions = useMemo(() => {
    if (!showMentionSuggestions || !activeTeam) return [];
    return activeTeam.members
      .map(m => m.user)
      .filter((u: any) => 
        u && u._id !== user?.id && // exclude self
        (u.name.toLowerCase().includes(mentionSearch.toLowerCase()) || 
         u.email.toLowerCase().includes(mentionSearch.toLowerCase()))
      );
  }, [showMentionSuggestions, mentionSearch, activeTeam, user?.id]);

  const insertMention = (memberUser: any) => {
    if (!textareaRef.current) return;
    const before = text.slice(0, mentionTriggerIndex);
    const newText = before + `@${memberUser.name} ` + text.slice(mentionTriggerIndex + mentionSearch.length + 1);
    setText(newText);
    setShowMentionSuggestions(false);
    
    // Focus and restore cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionTriggerIndex + memberUser.name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(suggestions[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    emitTypingStart();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(emitTypingStop, 1500);

    // Parse for @ mentions
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]))) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (!/\s/.test(query)) {
        setShowMentionSuggestions(true);
        setMentionSearch(query);
        setMentionTriggerIndex(lastAtIdx);
        setMentionIndex(0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreateChannelLoading(true);
    try {
      const chan = await createChannel(newChannelName, newChannelDesc);
      if (chan) {
        setNewChannelName('');
        setNewChannelDesc('');
        setShowCreateChannelModal(false);
        selectChannel(chan._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateChannelLoading(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    await markNotificationRead([notif._id]);
    if (notif.teamId && notif.teamId._id !== activeTeam?._id) {
      const targetTeam = teams.find(t => t._id === notif.teamId._id);
      if (targetTeam) {
        setActiveTeam(targetTeam);
        setTimeout(() => {
          selectChannel(notif.channelId?._id || '');
        }, 200);
      }
    } else if (notif.channelId) {
      selectChannel(notif.channelId._id);
    }
    setShowNotificationsDropdown(false);
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
    <div className="flex h-full w-full overflow-hidden bg-[#070A0F]">
      
      {/* ── Channels Sidebar ── */}
      <div className="w-56 flex-shrink-0 border-r border-slate-900 bg-[#080B10]/40 flex flex-col h-full backdrop-blur-md">
        <div className="px-5 py-4 border-b border-slate-900/60 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Channels</span>
          <button
            onClick={() => setShowCreateChannelModal(true)}
            className="p-1 rounded-lg bg-slate-950 border border-slate-900 text-indigo-400 hover:text-white transition cursor-pointer"
            title="Create Channel"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(chan => (
            <button
              key={chan._id}
              onClick={() => selectChannel(chan._id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                activeChannel?._id === chan._id
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{chan.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full bg-[#070A0F] overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" style={{ display: connected ? 'block' : 'none' }} />
            {!connected && <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>{activeChannel ? activeChannel.name : activeTeam?.name}</span>
              </h2>
              <p className="text-[10px] text-slate-555">
                {activeChannel?.description || `${connected ? 'Connected' : 'Reconnecting…'} · ${activeTeam?.members.length} members`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`p-2 rounded-xl border border-transparent transition relative cursor-pointer ${
                  showNotificationsDropdown ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center px-1 animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#090D14] border border-slate-900 shadow-2xl z-30 py-2 backdrop-blur-xl max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-900/60 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notifications ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => markNotificationRead()}
                        className="text-[9px] font-black text-indigo-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500 text-xs">
                      No new notifications! 🎉
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-900/50">
                      {notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className="px-4 py-3 hover:bg-indigo-950/10 transition cursor-pointer text-left space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">{n.sender?.name}</span>
                            <span className="text-[8px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                            {n.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-semibold">
                            <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">{n.teamId?.name}</span>
                            {n.channelId && (
                              <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">#{n.channelId?.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Call actions */}
            <div className="flex items-center gap-1.5 border-l border-slate-900 pl-3">
              {activeCallStatus && !inCall ? (
                <button
                  onClick={joinActiveCall}
                  className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs transition shadow-lg shadow-green-600/30 animate-pulse flex items-center gap-1.5 border border-green-500/20"
                  title="Join Active Call"
                >
                  <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                  <span>Join Call ({activeCallStatus.participants.length})</span>
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 py-16">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-sm">No messages yet. Say hi in #{activeChannel?.name || 'chat'}! 👋</p>
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

        {/* Pending Attachments */}
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

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-slate-800/70 flex-shrink-0 relative">
          
          {/* Autocomplete Mentions Suggestions */}
          {showMentionSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-[calc(100%-8px)] left-4 w-64 bg-[#090D14] border border-slate-900 rounded-xl shadow-2xl z-40 max-h-40 overflow-y-auto p-1.5 backdrop-blur-xl">
              <div className="px-2.5 py-1 text-[8px] font-black text-slate-550 uppercase tracking-wider border-b border-slate-900/60 mb-1">
                Mention Team Member
              </div>
              {suggestions.map((s, idx) => (
                <div
                  key={s._id}
                  onClick={() => insertMention(s)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                    mentionIndex === idx
                      ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                      : 'text-slate-350 hover:bg-slate-950 hover:text-white'
                  }`}
                >
                  <img src={s.avatarUrl} alt="avatar" className="w-5 h-5 rounded-md object-cover bg-slate-850" />
                  <div className="truncate">
                    <span className="block font-bold">{s.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-2">
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              title="Attach audio"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <VoiceRecorder onRecorded={handleVoiceRecorded} />

            {uploading && (
              <span className="text-[10px] text-slate-555 ml-1 animate-pulse">Uploading…</span>
            )}
          </div>

          {/* Textarea Input */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChannel ? activeChannel.name : activeTeam?.name || 'chat'}…`}
              rows={1}
              className="flex-1 resize-none glass-input rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() && pendingAtt.length === 0}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 flex-shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[9px] text-slate-700 mt-1.5 pl-1">Enter to send · Shift+Enter for newline</p>
        </div>

      </div>

      {/* ── Create Channel Modal ── */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl space-y-6 relative border border-slate-800/80">
            <button
              onClick={() => setShowCreateChannelModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1 text-center">
              <h3 className="font-bold text-lg text-white font-display">Create New Channel</h3>
              <p className="text-xs text-slate-400">
                Organize chat discussions for different topics or purposes.
              </p>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Channel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. marketing-campaign"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Planning for Q3 marketing strategies..."
                  value={newChannelDesc}
                  rows={2}
                  onChange={e => setNewChannelDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={createChannelLoading || !newChannelName.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-gradient-indigo-purple hover:opacity-95 text-xs transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {createChannelLoading ? 'Creating Channel...' : 'Create Channel'}
              </button>
            </form>
          </div>
        </div>
      )}

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
        <CallAudioController />
        <IncomingCallDialog />
        <MinimizedCallWidget />
        <ChatInner />
      </div>
    </ChatProvider>
  );
};
