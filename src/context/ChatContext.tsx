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

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  teamId: string;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: { _id: string; name: string; avatarUrl: string };
  teamId: { _id: string; name: string };
  channelId?: { _id: string; name: string };
  messageId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  teamId: string;
  channelId?: string;
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
  callType: 'audio' | 'video' | null;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams: Record<string, { stream: MediaStream; userName: string }>;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  screenShareSocketId: string | null;
  callError: string | null;
  activeCallStatus: { callType: 'audio' | 'video'; participants: string[] } | null;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  sendMessage: (text: string, attachments?: Attachment[]) => void;
  uploadFile: (file: File) => Promise<Attachment | null>;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  joinRoom: (teamId: string) => void;
  startCall: (callType: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  joinActiveCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  channels: Channel[];
  activeChannel: Channel | null;
  notifications: Notification[];
  selectChannel: (channelId: string) => void;
  createChannel: (name: string, description?: string) => Promise<Channel | null>;
  markNotificationRead: (notificationIds?: string[]) => Promise<void>;
  fetchNotifications: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode; teamId: string }> = ({ children, teamId }) => {
  const { user, token } = useAuth();
  const [messages, setMessages]                 = useState<ChatMessage[]>([]);
  const [typingMap, setTypingMap]               = useState<Record<string, string>>({});
  const [connected, setConnected]               = useState(false);
  const [uploading, setUploading]               = useState(false);
  const [inCall, setInCall]                     = useState(false);
  const [callType, setCallType]                 = useState<'audio' | 'video' | null>(null);
  const [incomingCall, setIncomingCall]         = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream]           = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream]         = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams]       = useState<Record<string, { stream: MediaStream; userName: string }>>({});
  const [isMuted, setIsMuted]                   = useState(false);
  const [isCameraOff, setIsCameraOff]           = useState(false);
  const [isScreenSharing, setIsScreenSharing]   = useState(false);
  const [screenShareSocketId, setScreenShareSocketId] = useState<string | null>(null);
  const [callError, setCallError]               = useState<string | null>(null);
  const [activeCallStatus, setActiveCallStatus] = useState<{ callType: 'audio' | 'video'; participants: string[] } | null>(null);
  const [isMinimized, setIsMinimized]           = useState(false);

  const [channels, setChannels]                 = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel]       = useState<Channel | null>(null);
  const [notifications, setNotifications]       = useState<Notification[]>([]);

  const socketRef  = useRef<Socket | null>(null);
  const activeChannelRef = useRef<Channel | null>(null);
  activeChannelRef.current = activeChannel;
  const pcsRef     = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerNamesRef = useRef<Record<string, string>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Derived array of usernames currently typing
  const typingUsers = Object.values(typingMap);

  // Helper for cleanup
  const cleanupCall = useCallback(() => {
    soundManager.stopAll();
    
    // Close all active peer connections
    for (const [_, pc] of pcsRef.current) {
      pc.close();
    }
    pcsRef.current.clear();
    peerNamesRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteStreams({});
    setInCall(false);
    setCallType(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setScreenShareSocketId(null);
    setCallError(null);
    setIsMinimized(false);
  }, []);

  // Monitor loss of signaling connection during calls
  useEffect(() => {
    if (!connected && inCall) {
      setCallError('Signaling server connection lost. Trying to reconnect...');
    }
  }, [connected, inCall]);

  // ── WebRTC helpers ─────────────────────────────────────────────────────────
  const setupPeerConnection = useCallback(async (peerSocketId: string, stream?: MediaStream) => {
    // Close existing connection if any
    if (pcsRef.current.has(peerSocketId)) {
      pcsRef.current.get(peerSocketId)?.close();
      pcsRef.current.delete(peerSocketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:openrelay.metered.ca:80' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
    });
    pcsRef.current.set(peerSocketId, pc);

    const mediaStream = stream || localStreamRef.current;
    mediaStream?.getTracks().forEach(track => pc.addTrack(track, mediaStream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit('webrtc_ice_candidate', { to: peerSocketId, candidate });
      }
    };

    // Monitor WebRTC Connection State
    pc.onconnectionstatechange = () => {
      console.log(`RTCPeerConnection state for ${peerSocketId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        setCallError('Network connection failed with a participant.');
      } else if (pc.connectionState === 'disconnected') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[peerSocketId];
          return next;
        });
      }
    };

    const newRemote = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        if (!newRemote.getTracks().some(t => t.id === track.id)) {
          newRemote.addTrack(track);
        }
      });
      
      setRemoteStreams(prev => ({
        ...prev,
        [peerSocketId]: {
          stream: newRemote,
          userName: peerNamesRef.current[peerSocketId] || prev[peerSocketId]?.userName || 'Participant'
        }
      }));

      // Keep single remoteStream updated for backward compat
      setRemoteStream(new MediaStream(newRemote.getTracks()));
    };

    return pc;
  }, []);

  const createOffer = useCallback(async (peerSocketId: string) => {
    let pc = pcsRef.current.get(peerSocketId);
    if (!pc) pc = await setupPeerConnection(peerSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('webrtc_offer', { to: peerSocketId, sdp: offer });
  }, [setupPeerConnection]);

  const fetchNotifications = useCallback(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/chat/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then((data: Notification[]) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(console.error);
  }, [token]);

  const markNotificationRead = useCallback(async (notificationIds?: string[]) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/notifications/mark-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });
      if (res.ok) {
        if (notificationIds && notificationIds.length > 0) {
          setNotifications(prev => prev.filter(n => !notificationIds.includes(n._id)));
        } else {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  }, [token]);

  const createChannel = useCallback(async (name: string, description?: string): Promise<Channel | null> => {
    if (!teamId || !token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/teams/${teamId}/channels`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });
      if (!res.ok) throw new Error('Failed to create channel');
      const data = await res.json();
      setChannels(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Failed to create channel:', err);
      return null;
    }
  }, [teamId, token]);

  const selectChannel = useCallback((channelId: string) => {
    const channel = channels.find(c => c._id === channelId);
    if (channel) {
      setActiveChannel(channel);
      socketRef.current?.emit('join_channel', { channelId });
    }
  }, [channels]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser online - syncing notifications...');
      fetchNotifications();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchNotifications]);

  // ── Socket connection ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { teamId, userId: user?.id, userName: user?.name });
      if (activeChannelRef.current) {
        socket.emit('join_channel', { channelId: activeChannelRef.current._id });
      }
      fetchNotifications();
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        const currentActive = activeChannelRef.current;
        if (msg.channelId) {
          if (currentActive && currentActive._id === msg.channelId) {
            return [...prev, msg];
          }
        } else {
          if (!currentActive || currentActive.name === 'General') {
            return [...prev, msg];
          }
        }
        return prev;
      });
    });

    socket.on('new_notification', (notif: Notification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
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

    // ── Active Call Room Indicators ──────────────────────────────────────────
    socket.on('active_call_update', (status: { callType: 'audio' | 'video'; participants: string[] } | null) => {
      setActiveCallStatus(status);
      if (!status && inCall) {
        cleanupCall();
      }
    });

    // ── WebRTC Signaling events ──────────────────────────────────────────────
    socket.on('incoming_call', (data: IncomingCall) => {
      peerNamesRef.current[data.from] = data.callerName;
      setIncomingCall(data);
      soundManager.startRingtone();
    });

    socket.on('call_accepted', async ({ from, callerName }: { from: string; callerName: string }) => {
      soundManager.stopAll();
      peerNamesRef.current[from] = callerName;
      setRemoteStreams(prev => ({
        ...prev,
        [from]: { stream: new MediaStream(), userName: callerName }
      }));
      await setupPeerConnection(from);
      await createOffer(from);
    });

    socket.on('peer_joined_call', async ({ socketId, userName }: { socketId: string; userName: string }) => {
      soundManager.stopAll();
      peerNamesRef.current[socketId] = userName;
      setRemoteStreams(prev => ({
        ...prev,
        [socketId]: { stream: new MediaStream(), userName }
      }));
      await setupPeerConnection(socketId);
      await createOffer(socketId);
      if (screenStreamRef.current) {
        socket.emit('screen_share_status', { teamId, isSharing: true });
      }
    });

    socket.on('call_joined_success', async ({ peers, callType: incomingType }: { peers: Array<{ socketId: string; userName: string }>; callType: 'audio' | 'video' }) => {
      try {
        soundManager.stopAll();
        setCallError(null);
        const stream = await getMedia(incomingType);
        setInCall(true);
        setCallType(incomingType);
        setIncomingCall(null);

        for (const peer of peers) {
          peerNamesRef.current[peer.socketId] = peer.userName;
          setRemoteStreams(prev => ({
            ...prev,
            [peer.socketId]: { stream: new MediaStream(), userName: peer.userName }
          }));
          await setupPeerConnection(peer.socketId, stream);
          await createOffer(peer.socketId);
        }
      } catch (err) {
        console.error("Failed to setup streams on join call:", err);
      }
    });

    socket.on('call_rejected', () => {
      cleanupCall();
      alert('Call was declined.');
    });

    socket.on('webrtc_offer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      if (!pcsRef.current.has(from)) {
        await setupPeerConnection(from);
      }
      const pc = pcsRef.current.get(from)!;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { to: from, sdp: answer });
    });

    socket.on('webrtc_answer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = pcsRef.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on('webrtc_ice_candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = pcsRef.current.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch { /* ignore */ }
    });

    socket.on('screen_share_status', ({ socketId, isSharing }: { socketId: string; isSharing: boolean }) => {
      setScreenShareSocketId(isSharing ? socketId : null);
    });

    socket.on('call_ended', ({ from }: { from: string }) => {
      const pc = pcsRef.current.get(from);
      if (pc) {
        pc.close();
        pcsRef.current.delete(from);
      }
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
      setScreenShareSocketId(prev => prev === from ? null : prev);
    });

    return () => {
      socket.emit('leave_room', { teamId });
      socket.disconnect();
      soundManager.stopAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user?.id]);

  // ── Fetch channels when teamId changes ──────────────────────────────────────
  useEffect(() => {
    if (!teamId) {
      setChannels([]);
      setActiveChannel(null);
      return;
    }
    fetch(`${API_BASE_URL}/teams/${teamId}/channels`, {
      headers: { Authorization: `Bearer ${token || 'bypass_token'}` },
    })
      .then(r => r.json())
      .then((data: Channel[]) => {
        if (Array.isArray(data)) {
          setChannels(data);
          const general = data.find(c => c.name === 'General') || data[0] || null;
          setActiveChannel(general);
          if (general) {
            socketRef.current?.emit('join_channel', { channelId: general._id });
          }
        }
      })
      .catch(console.error);
  }, [teamId, token]);

  // ── Load message history ───────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId) return;
    setMessages([]);
    setTypingMap({});
    const channelParam = activeChannel ? `&channelId=${activeChannel._id}` : '';
    fetch(`${API_BASE_URL}/chat/messages?teamId=${teamId}${channelParam}`, {
      headers: { Authorization: `Bearer ${token || 'bypass_token'}` },
    })
      .then(r => r.json())
      .then((data: ChatMessage[]) => Array.isArray(data) && setMessages(data))
      .catch(console.error);
  }, [teamId, activeChannel, token]);

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
      channelId: activeChannelRef.current?._id || undefined,
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

  const getMedia = useCallback(async (callType: 'audio' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
  }, []);

  const startCall = useCallback(async (selectedType: 'audio' | 'video') => {
    try {
      setCallError(null);
      await getMedia(selectedType);
      setInCall(true);
      setCallType(selectedType);
      soundManager.startRingback();
      socketRef.current?.emit('call_user', { teamId, callerName: user?.name, callType: selectedType });
    } catch (err) {
      console.error('startCall error:', err);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  }, [teamId, user?.name, getMedia]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      setCallError(null);
      soundManager.stopAll();
      await getMedia(incomingCall.callType);
      setInCall(true);
      setCallType(incomingCall.callType);
      setIncomingCall(null);
      socketRef.current?.emit('call_accepted', { to: incomingCall.from, callerName: user?.name });
    } catch (err) {
      console.error('acceptCall error:', err);
    }
  }, [incomingCall, getMedia, user?.name]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    soundManager.stopAll();
    socketRef.current?.emit('call_rejected', { to: incomingCall.from });
    setIncomingCall(null);
  }, [incomingCall]);

  const joinActiveCall = useCallback(() => {
    setCallError(null);
    socketRef.current?.emit('join_active_call', { teamId });
  }, [teamId]);

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

  const toggleCamera = useCallback(async () => {
    if (isCameraOff) {
      // Turn camera ON
      let videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (!videoTrack) {
        try {
          // Camera track is missing (e.g. call started as audio only), fetch it dynamically
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoTrack = cameraStream.getVideoTracks()[0];
          
          if (localStreamRef.current) {
            localStreamRef.current.addTrack(videoTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }

          // Distribute track to all active peer connections
          for (const [peerId, pc] of pcsRef.current) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(videoTrack);
            } else {
              pc.addTrack(videoTrack, localStreamRef.current!);
              // Renegotiate offer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socketRef.current?.emit('webrtc_offer', { to: peerId, sdp: offer });
            }
          }
        } catch (err) {
          console.error("Failed to acquire camera track:", err);
          alert("Could not access camera. Please check permissions.");
          return;
        }
      } else {
        videoTrack.enabled = true;
      }
      setIsCameraOff(false);
    } else {
      // Turn camera OFF
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
      }
      setIsCameraOff(true);
    }
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop Screen Sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      socketRef.current?.emit('screen_share_status', { teamId, isSharing: false });

      // Restore camera track
      const originalTrack = localStreamRef.current?.getVideoTracks()[0];
      for (const [_, pc] of pcsRef.current) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(originalTrack || null);
        }
      }
    } else {
      // Start Screen Sharing
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error("getDisplayMedia is not supported on this browser or mobile device");
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        socketRef.current?.emit('screen_share_status', { teamId, isSharing: true });

        const screenTrack = stream.getVideoTracks()[0];

        // Replace/Add track in active peer connections
        for (const [peerId, pc] of pcsRef.current) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, stream);
            // Send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit('webrtc_offer', { to: peerId, sdp: offer });
          }
        }

        // Detect stop sharing click from browser native panel
        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
          socketRef.current?.emit('screen_share_status', { teamId, isSharing: false });

          const originalTrack = localStreamRef.current?.getVideoTracks()[0];
          for (const [_, pc] of pcsRef.current) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(originalTrack || null);
            }
          }
        };
      } catch (err) {
        console.error("Screen sharing cancelled or failed:", err);
        alert("Screen sharing is not supported or was denied on this device/browser.");
        setIsScreenSharing(false);
      }
    }
  }, [isScreenSharing, teamId]);

  return (
    <ChatContext.Provider value={{
      messages, typingUsers, connected, uploading, inCall, callType, incomingCall,
      localStream, remoteStream, remoteStreams, isMuted, isCameraOff, isScreenSharing,
      callError, activeCallStatus, isMinimized, setIsMinimized,
      sendMessage, uploadFile, emitTypingStart, emitTypingStop, joinRoom,
      startCall, acceptCall, rejectCall, joinActiveCall, endCall, toggleMute, toggleCamera, toggleScreenShare,
      screenShareSocketId,
      channels, activeChannel, notifications, selectChannel, createChannel, markNotificationRead, fetchNotifications
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
