import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, API_BASE_URL } from './AuthContext';
import { soundManager } from '../utils/soundEffects';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export interface Attachment {
  type: 'image' | 'audio';
  url: string;
  name?: string;
}

export interface CallHistory {
  callType: 'audio' | 'video';
  duration: number; // in seconds
  joinedParticipants: string[];
  startedAt: string;
  endedAt: string;
}

export interface ChatMessage {
  _id: string;
  teamId: string;
  sender: { _id: string; name: string; avatarUrl: string };
  text?: string;
  attachments: Attachment[];
  isCallHistory?: boolean;
  callHistory?: CallHistory;
  createdAt: string;
}

export interface IncomingCall {
  from: string;
  callerName: string;
  callType: 'audio' | 'video';
}

interface ChatContextType {
  messages: ChatMessage[];
  typingUsers: string[];
  connected: boolean;
  uploading: boolean;
  inCall: boolean;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callError: string | null;
  sendMessage: (text: string, attachments?: Attachment[]) => void;
  uploadFile: (file: File) => Promise<Attachment | null>;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  joinRoom: (teamId: string) => void;
  startCall: (callType: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode; teamId: string }> = ({ children, teamId }) => {
  const { user, token } = useAuth();
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [typingMap, setTypingMap]       = useState<Record<string, string>>({});
  const [connected, setConnected]       = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [inCall, setInCall]             = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream]   = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted]           = useState(false);
  const [isCameraOff, setIsCameraOff]   = useState(false);
  const [callError, setCallError]       = useState<string | null>(null);

  const socketRef  = useRef<Socket | null>(null);
  const pcRef      = useRef<RTCPeerConnection | null>(null);
  const peerIdRef  = useRef<string>(''); // remote socket ID for signaling
  const localStreamRef = useRef<MediaStream | null>(null);

  // Derived array of usernames currently typing
  const typingUsers = Object.values(typingMap);

  // Helper for cleanup
  const cleanupCall = useCallback(() => {
    soundManager.stopAll();
    pcRef.current?.close();
    pcRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    peerIdRef.current = '';
    setCallError(null);
  }, []);

  // Monitor loss of signaling connection during calls
  useEffect(() => {
    if (!connected && inCall) {
      setCallError('Signaling server connection lost. Trying to reconnect...');
    }
  }, [connected, inCall]);

  // ── Socket connection ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { teamId, userId: user?.id, userName: user?.name });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user_typing', ({ userId, userName }: { userId: string; userName: string }) => {
      setTypingMap(prev => ({ ...prev, [userId]: userName }));
    });

    socket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
      setTypingMap(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on('user_left', ({ userId }: { userId: string }) => {
      setTypingMap(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    // ── WebRTC Signaling events ──────────────────────────────────────────────
    socket.on('incoming_call', (data: IncomingCall) => {
      setIncomingCall(data);
      peerIdRef.current = data.from;
      soundManager.startRingtone();
    });

    socket.on('call_accepted', async ({ from }: { from: string }) => {
      soundManager.stopAll();
      peerIdRef.current = from;
      await createOffer();
    });

    socket.on('call_rejected', () => {
      cleanupCall();
      alert('Call was declined.');
    });

    socket.on('webrtc_offer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      peerIdRef.current = from;
      if (!pcRef.current) await setupPeerConnection();
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      socket.emit('webrtc_answer', { to: from, sdp: answer });
    });

    socket.on('webrtc_answer', async ({ sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('webrtc_ice_candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* ignore */ }
    });

    socket.on('call_ended', ({ from }: { from: string }) => {
      // Only end the call if the signal originates from our call partner or ourselves
      if (from === peerIdRef.current || from === socketRef.current?.id) {
        cleanupCall();
      }
    });

    return () => {
      socket.emit('leave_room', { teamId });
      socket.disconnect();
      soundManager.stopAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user?.id]);

  // ── Load message history ───────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId) return;
    setMessages([]);
    setTypingMap({});
    fetch(`${API_BASE_URL}/chat/messages?teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${token || 'bypass_token'}` },
    })
      .then(r => r.json())
      .then((data: ChatMessage[]) => Array.isArray(data) && setMessages(data))
      .catch(console.error);
  }, [teamId, token]);

  // ── Typing ──────────────────────────────────────────────────────────────────
  const emitTypingStart = useCallback(() => {
    socketRef.current?.emit('typing_start', { teamId, userName: user?.name });
  }, [teamId, user?.name]);

  const emitTypingStop = useCallback(() => {
    socketRef.current?.emit('typing_stop', { teamId });
  }, [teamId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string, attachments: Attachment[] = []) => {
    if (!text.trim() && attachments.length === 0) return;
    socketRef.current?.emit('send_message', {
      teamId,
      senderId: user?.id,
      text,
      attachments,
    });
  }, [teamId, user?.id]);

  // ── File upload ────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || 'bypass_token'}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return { type: data.type, url: data.url, name: file.name };
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  }, [token]);

  const joinRoom = useCallback((newTeamId: string) => {
    socketRef.current?.emit('join_room', { teamId: newTeamId, userId: user?.id, userName: user?.name });
  }, [user?.id, user?.name]);

  // ── WebRTC helpers ─────────────────────────────────────────────────────────
  const setupPeerConnection = useCallback(async (stream?: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;

    const mediaStream = stream || localStreamRef.current;
    mediaStream?.getTracks().forEach(track => pc.addTrack(track, mediaStream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit('webrtc_ice_candidate', { to: peerIdRef.current, candidate });
      }
    };

    // Monitor WebRTC Connection State
    pc.onconnectionstatechange = () => {
      console.log('RTCPeerConnection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        setCallError('Network connection failed. Reconnecting or try calling again.');
      } else if (pc.connectionState === 'disconnected') {
        setCallError('Network disconnected. Attempting to restore connection...');
      } else if (pc.connectionState === 'connected') {
        setCallError(null);
      }
    };

    // Monitor ICE Connection State
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        setCallError('ICE negotiation failed. Firewalls might be blocking WebRTC.');
      }
    };

    const newRemote = new MediaStream();
    setRemoteStream(newRemote);
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => newRemote.addTrack(track));
      setRemoteStream(new MediaStream(newRemote.getTracks()));
    };

    return pc;
  }, []);

  const createOffer = useCallback(async () => {
    if (!pcRef.current) await setupPeerConnection();
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);
    socketRef.current?.emit('webrtc_offer', { to: peerIdRef.current, sdp: offer });
  }, [setupPeerConnection]);

  const getMedia = useCallback(async (callType: 'audio' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
  }, []);

  const startCall = useCallback(async (callType: 'audio' | 'video') => {
    try {
      setCallError(null);
      const stream = await getMedia(callType);
      await setupPeerConnection(stream);
      setInCall(true);
      soundManager.startRingback();
      socketRef.current?.emit('call_user', { teamId, callerName: user?.name, callType });
    } catch (err) {
      console.error('startCall error:', err);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  }, [teamId, user?.name, getMedia, setupPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      setCallError(null);
      soundManager.stopAll();
      const stream = await getMedia(incomingCall.callType);
      await setupPeerConnection(stream);
      setInCall(true);
      setIncomingCall(null);
      socketRef.current?.emit('call_accepted', { to: incomingCall.from, callerName: user?.name });
    } catch (err) {
      console.error('acceptCall error:', err);
    }
  }, [incomingCall, getMedia, setupPeerConnection, user?.name]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    soundManager.stopAll();
    socketRef.current?.emit('call_rejected', { to: incomingCall.from });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    socketRef.current?.emit('call_ended', { teamId });
    cleanupCall();
  }, [teamId, cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    setIsMuted(m => !m);
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    setIsCameraOff(c => !c);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages, typingUsers, connected, uploading, inCall, incomingCall,
      localStream, remoteStream, isMuted, isCameraOff, callError,
      sendMessage, uploadFile, emitTypingStart, emitTypingStop, joinRoom,
      startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};
