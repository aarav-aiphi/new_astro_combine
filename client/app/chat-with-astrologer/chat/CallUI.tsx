"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { FiPhone, FiVideo, FiMic, FiMicOff, FiVideoOff, FiMonitor } from "react-icons/fi";
import Image from "next/image";
import { Socket } from "socket.io-client";

interface IncomingCall {
    callerId: string;
    callerName: string;
    callType: "audio" | "video";
    signalData: Peer.SignalData;
}

interface OutgoingCall {
    callType: "audio" | "video";
    recipientId: string;
}

interface User {
    _id: string;
    name: string;
    role?: string;
}

interface Participant {
    _id: string;
    name: string;
    avatar: string;
}

interface CallUIProps {
    socket: Socket;
    user: User;
    participant: Participant;
    chatId: string;
    astrologerId: string;
}

export default function CallUI({
    socket,
    user,
    participant,

}: CallUIProps) {
    // State for call
    const [isCallActive, setIsCallActive] = useState(false);
    const [callType, setCallType] = useState<"audio" | "video" | null>(null);

    // Outgoing call request
    const [outgoingCall, setOutgoingCall] = useState<OutgoingCall | null>(null);

    // Incoming call data
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

    // Peer refs
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer.Instance | null>(null);

    // Track the local media stream we're using
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Toggles
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Debug state
    const [debugInfo, setDebugInfo] = useState({
        localStreamTracks: 0,
        remoteStreamTracks: 0,
        localVideoPlaying: false,
        remoteVideoPlaying: false,
        peerConnected: false
    });

    // Update debug info
    const updateDebugInfo = useCallback(() => {
        setDebugInfo({
            localStreamTracks: localStream?.getTracks().length || 0,
            remoteStreamTracks: remoteStream?.getTracks().length || 0,
            localVideoPlaying: !myVideoRef.current?.paused || false,
            remoteVideoPlaying: !remoteVideoRef.current?.paused || false,
            peerConnected: peerRef.current?.connected || false
        });
    }, [localStream, remoteStream]);

    // Function to safely set video source and handle playback
    const setVideoSource = useCallback(async (videoElement: HTMLVideoElement, stream: MediaStream, label: string) => {
        try {
            console.log(`Setting ${label} video source:`, stream.id);
            
            // Clear any existing source
            if (videoElement.srcObject) {
                const oldStream = videoElement.srcObject as MediaStream;
                oldStream.getTracks().forEach(track => track.stop());
            }
            
            videoElement.srcObject = stream;
            
            // Add event listeners for debugging
            videoElement.onloadedmetadata = () => {
                console.log(`${label} video metadata loaded`);
                updateDebugInfo();
            };
            
            videoElement.onplay = () => {
                console.log(`${label} video started playing`);
                updateDebugInfo();
            };
            
            videoElement.onerror = (e) => {
                console.error(`${label} video error:`, e);
                updateDebugInfo();
            };

            videoElement.oncanplay = () => {
                console.log(`${label} video can play`);
                updateDebugInfo();
            };

            // For local video, ensure it's muted for autoplay
            if (label === 'local') {
                videoElement.muted = true;
                videoElement.playsInline = true;
                videoElement.autoplay = true;
            }

            // Wait for metadata to load
            await new Promise((resolve, reject) => {
                if (videoElement.readyState >= 1) {
                    resolve(true);
                } else {
                    videoElement.onloadedmetadata = () => resolve(true);
                    videoElement.onerror = () => reject(new Error('Video metadata failed to load'));
                    setTimeout(() => reject(new Error('Video metadata timeout')), 5000);
                }
            });

            // Force play with multiple attempts
            let playAttempts = 0;
            const maxAttempts = 3;
            
            while (playAttempts < maxAttempts) {
                try {
                    await videoElement.play();
                    console.log(`${label} video playing successfully on attempt ${playAttempts + 1}`);
                    updateDebugInfo();
                    return; // Success, exit function
                } catch (playError) {
                    playAttempts++;
                    console.warn(`${label} video play attempt ${playAttempts} failed:`, playError);
                    
                    if (playAttempts < maxAttempts) {
                        // Wait a bit before next attempt
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
            
            // If all play attempts failed, handle based on error type
            throw new Error(`Failed to play ${label} video after ${maxAttempts} attempts`);
            
        } catch (error) {
            console.error(`Error setting ${label} video source:`, error);
            
            // For autoplay issues, create a user-interaction button
            if (error instanceof Error && (error.name === 'NotAllowedError' || error.message.includes('play'))) {
                console.log(`Creating play button for ${label} video due to autoplay policy`);
                const playButton = document.createElement("button");
                playButton.textContent = `▶ Play ${label === 'local' ? 'Your' : 'Remote'} Video`;
                playButton.style.cssText = `
                    position: fixed;
                    top: ${label === 'local' ? '60px' : '100px'};
                    ${label === 'local' ? 'left' : 'right'}: 20px;
                    z-index: 1000;
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                `;
                playButton.onclick = async () => {
                    try {
                        videoElement.muted = label === 'local'; // Ensure local is muted
                        await videoElement.play();
                        playButton.remove();
                        updateDebugInfo();
                        console.log(`${label} video played after user interaction`);
                    } catch (e) {
                        console.error(`Still can't play ${label} video:`, e);
                        playButton.textContent = `❌ ${label} Video Failed`;
                        playButton.style.background = '#dc3545';
                    }
                };
                document.body.appendChild(playButton);
                
                // Auto-remove button after 15 seconds
                setTimeout(() => {
                    if (document.body.contains(playButton)) {
                        playButton.remove();
                    }
                }, 15000);
            }
        }
    }, [updateDebugInfo]);

    // Force local video to play (special function for local video issues)
    const forceLocalVideoPlay = useCallback(async (stream: MediaStream) => {
        if (!myVideoRef.current) return;
        
        const videoElement = myVideoRef.current;
        console.log("Force playing local video with stream:", stream.id);
        
        try {
            // Reset video element
            videoElement.srcObject = null;
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Set properties for autoplay
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.autoplay = true;
            videoElement.controls = false;
            
            // Set stream
            videoElement.srcObject = stream;
            
            // Force load and play
            videoElement.load();
            await videoElement.play();
            
            console.log("Local video force play successful");
            updateDebugInfo();
        } catch (error) {
            console.error("Force local video play failed:", error);
            
            // Create immediate play button for local video
            const immediateButton = document.createElement("button");
            immediateButton.textContent = "▶ Click to see your video";
            immediateButton.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 2000;
                background: #28a745;
                color: white;
                border: none;
                padding: 15px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
            `;
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
            
            immediateButton.onclick = async () => {
                try {
                    await videoElement.play();
                    immediateButton.remove();
                    style.remove();
                    updateDebugInfo();
                } catch (e) {
                    console.error("Manual play also failed:", e);
                }
            };
            
            document.body.appendChild(immediateButton);
            
            // Remove after 10 seconds
            setTimeout(() => {
                if (document.body.contains(immediateButton)) {
                    immediateButton.remove();
                    style.remove();
                }
            }, 10000);
        }
    }, [updateDebugInfo]);

    // ===========================
    // 1) Socket: Listen for calls
    // ===========================
    const closePeer = useCallback(() => {
        console.log("Closing peer connection and cleaning up streams");
        
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
    
        if (localStream) {
            console.log("Stopping local stream tracks");
            localStream.getTracks().forEach((track) => {
                track.stop();
                console.log(`Stopped ${track.kind} track`);
            });
        }
        setLocalStream(null);
        
        if (remoteStream) {
            console.log("Stopping remote stream tracks");
            remoteStream.getTracks().forEach((track) => {
                track.stop();
                console.log(`Stopped remote ${track.kind} track`);
            });
        }
        setRemoteStream(null);
    
        // Clean up video elements
        if (myVideoRef.current?.srcObject) {
            const stream = myVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            myVideoRef.current.srcObject = null;
        }
        
        if (remoteVideoRef.current?.srcObject) {
            const stream = remoteVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            remoteVideoRef.current.srcObject = null;
        }
    
        setIsAudioMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        updateDebugInfo();
    }, [localStream, remoteStream, updateDebugInfo]);

    const endCall = useCallback((emitToRemote: boolean = true) => {
        console.log("Ending call, emitToRemote:", emitToRemote);
        setIsCallActive(false);
        setCallType(null);
        setIncomingCall(null);
        setOutgoingCall(null);
    
        if (emitToRemote && socket) {
            socket.emit("endCall", {});
        }
    
        closePeer();
    }, [socket, closePeer]);
    
    useEffect(() => {
        if (!socket) return;
    
        const handleIncomingCall = (data: IncomingCall) => {
            console.log("Received incoming call:", data);
            if (isCallActive) {
                console.log("Already in call, rejecting incoming call");
                socket.emit("rejectCall", { callerId: data.callerId });
            } else {
                setIncomingCall(data);
            }
        };
        socket.on("incomingCall", handleIncomingCall);
    
        const handleCallAccepted = (signalData: Peer.SignalData) => {
            console.log("Caller received `callAccepted` =>", signalData);
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.signal(signalData);
                setIsCallActive(true);
            } else {
                console.error("Cannot signal peer - peer is null or destroyed");
            }
        };
        socket.on("callAccepted", handleCallAccepted);
    
        const handleCallRejected = () => {
            console.log("Call was rejected");
            endCall(false);
            alert("Call was rejected.");
        };
        socket.on("callRejected", handleCallRejected);
    
        const handleCallEnded = () => {
            console.log("Received 'callEnded' from remote side");
            endCall(false);
        };
        socket.on("callEnded", handleCallEnded);
    
        return () => {
            socket.off("incomingCall", handleIncomingCall);
            socket.off("callAccepted", handleCallAccepted);
            socket.off("callRejected", handleCallRejected);
            socket.off("callEnded", handleCallEnded);
        };
    }, [socket, isCallActive, endCall]);
    


    // ===========================
    // 2) Initiate Outgoing Call
    // ===========================
    const initiateCall = async (type: "audio" | "video") => {
        if (!socket || !participant || !participant._id) {
            console.error("Cannot initiate call - missing socket or participant");
            return;
        }

        try {
            console.log(`Initiating ${type} call to:`, participant._id);
            setOutgoingCall({
                callType: type,
                recipientId: participant._id,
            });

            // Get local media with more specific constraints
            const mediaConstraints = {
                video: type === "video" ? {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            console.log("Requesting user media with constraints:", mediaConstraints);
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            console.log("Successfully got local stream:", stream.id, "Tracks:", stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
            
            setLocalStream(stream);

            // Set local video
            if (myVideoRef.current && type === "video") {
                await setVideoSource(myVideoRef.current, stream, "local");
            }

            // Create peer with better configuration
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream,
                config: {
                    iceServers: [
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                        { urls: "stun:stun3.l.google.com:19302" },
                        { urls: "stun:stun4.l.google.com:19302" },
                        { 
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ],
                    iceCandidatePoolSize: 10,
                },
            });

            // Called when our local peer has signal data to send
            peer.on("signal", (data) => {
                console.log("Caller sending signal data");
                socket.emit("callUser", {
                    recipientId: participant._id,
                    signalData: data,
                    callType: type,
                    callerName: user?.name || "Unknown",
                });
            });

            // Called when remote peer's stream arrives
            peer.on("stream", async (incomingRemoteStream) => {
                console.log("Caller received remote stream:", incomingRemoteStream.id, "Tracks:", incomingRemoteStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
                setRemoteStream(incomingRemoteStream);
                
                if (remoteVideoRef.current && type === "video") {
                    await setVideoSource(remoteVideoRef.current, incomingRemoteStream, "remote");
                }
                updateDebugInfo();
            });

            // Connection events
            peer.on("connect", () => {
                console.log("Caller: Peer connected successfully!");
                setIsCallActive(true);
                updateDebugInfo();
            });
            
            peer.on("error", (err) => {
                console.error("Caller peer error:", err);
                alert(`Call error: ${err.message}`);
                endCall(false);
            });

            peer.on("close", () => {
                console.log("Caller: Peer connection closed");
                endCall(false);
            });

            peer.on("iceStateChange", (state) => {
                console.log("Caller: ICE state changed to:", state);
                if (state === "disconnected" || state === "failed" || state === "closed") {
                    console.error("Caller: ICE connection failed");
                    endCall(false);
                }
            });

            peerRef.current = peer;
            setCallType(type);
            
            // Force local video to play after a short delay
            if (type === "video") {
                setTimeout(() => {
                    forceLocalVideoPlay(stream);
                }, 1000);
            }
            
            updateDebugInfo();
        } catch (err) {
            console.error("Error initiating call:", err);
            setOutgoingCall(null);
            alert(`Failed to start call: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // ===========================
    // 3) Accept Incoming Call
    // ===========================
    const acceptCall = async () => {
        if (!incomingCall || !socket) {
            console.error("Cannot accept call - missing incoming call data or socket");
            return;
        }
        
        const { callerId, callType, signalData } = incomingCall;
        console.log(`Accepting ${callType} call from:`, callerId);

        try {
            setIncomingCall(null);
            setIsCallActive(true);
            setCallType(callType);

            // Get media with same constraints as initiator
            const mediaConstraints = {
                video: callType === "video" ? {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            let stream;
            try {
                console.log("Callee requesting user media with constraints:", mediaConstraints);
                stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
                console.log("Callee successfully got local stream:", stream.id, "Tracks:", stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
            } catch (error) {
                console.error("Error getting user media:", error);
                if (callType === "video" && error instanceof Error && 
                    (error.name === "NotReadableError" || error.name === "NotFoundError")) {
                    console.warn("Camera unavailable, falling back to audio only");
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } else {
                    socket.emit("rejectCall", { callerId });
                    setIsCallActive(false);
                    alert(`Failed to access ${callType === "video" ? "camera/microphone" : "microphone"}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return;
                }
            }

            setLocalStream(stream);

            // Set local video if video call - use force play
            if (callType === "video") {
                setTimeout(() => {
                    forceLocalVideoPlay(stream);
                }, 500);
            }

            // Create peer in callee mode
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream,
                config: {
                    iceServers: [
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                        { urls: "stun:stun3.l.google.com:19302" },
                        { urls: "stun:stun4.l.google.com:19302" },
                        { 
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ],
                    iceCandidatePoolSize: 10,
                },
            });

            peer.on("signal", (data) => {
                console.log("Callee sending signal data");
                socket.emit("answerCall", {
                    callerId,
                    signalData: data,
                });
            });

            peer.on("stream", async (incomingRemoteStream) => {
                console.log("Callee received remote stream:", incomingRemoteStream.id, "Tracks:", incomingRemoteStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
                setRemoteStream(incomingRemoteStream);
                
                if (remoteVideoRef.current && callType === "video") {
                    await setVideoSource(remoteVideoRef.current, incomingRemoteStream, "remote");
                }
                updateDebugInfo();
            });

            peer.on("error", (err) => {
                console.error("Callee peer error:", err);
                alert(`Call error: ${err.message}`);
                endCall(false);
            });

            peer.on("connect", () => {
                console.log("Callee: Peer connected successfully!");
                setIsCallActive(true);
                updateDebugInfo();
            });

            peer.on("close", () => {
                console.log("Callee: Peer connection closed");
                endCall(false);
            });

            peer.on("iceStateChange", (state) => {
                console.log("Callee: ICE state changed to:", state);
                if (state === "disconnected" || state === "failed" || state === "closed") {
                    console.error("Callee: ICE connection failed");
                    endCall(false);
                }
            });

            // Signal with caller's data
            peer.signal(signalData);
            peerRef.current = peer;
            updateDebugInfo();
            
        } catch (err) {
            console.error("Error accepting call:", err);
            socket.emit("rejectCall", { callerId });
            setIsCallActive(false);
            alert(`Failed to accept call: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };


    // ===========================
    // 4) Reject / Cancel Call
    // ===========================
    const rejectCall = () => {
        if (!incomingCall || !socket) return;
        console.log("Rejecting call from:", incomingCall.callerId);
        socket.emit("rejectCall", { callerId: incomingCall.callerId });
        setIncomingCall(null);
    };

    const cancelOutgoingCall = () => {
        if (!outgoingCall || !socket) return;
        console.log("Canceling outgoing call");
        socket.emit("rejectCall", { callerId: user?._id });
        setOutgoingCall(null);
        closePeer();
    };

    // ===========================
    // 6) Toggle Audio
    // ===========================
    const toggleAudio = () => {
        if (!localStream) {
            console.warn("No local stream to toggle audio");
            return;
        }

        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach((track) => {
            track.enabled = !track.enabled;
            console.log(`Audio track ${track.enabled ? 'enabled' : 'disabled'}`);
        });
        setIsAudioMuted((prev) => !prev);
        updateDebugInfo();
    };

    // ===========================
    // 7) Toggle Video
    // ===========================
    const toggleVideo = () => {
        if (!localStream) {
            console.warn("No local stream to toggle video");
            return;
        }

        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((track) => {
            track.enabled = !track.enabled;
            console.log(`Video track ${track.enabled ? 'enabled' : 'disabled'}`);
        });
        setIsVideoOff((prev) => !prev);
        updateDebugInfo();
    };

    // ===========================
    // 8) Screen Sharing (Desktop)
    // ===========================
    const startScreenShare = async () => {
        if (!peerRef.current || !localStream) {
            console.warn("Cannot start screen share - no peer or local stream");
            return;
        }
        
        try {
            console.log("Starting screen share");
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });

            // Replace the video track in Peer with screen track
            const screenTrack = screenStream.getVideoTracks()[0];
            const videoTrack = localStream.getVideoTracks()[0];
            
            if (videoTrack && screenTrack) {
                peerRef.current.replaceTrack(
                    videoTrack,
                    screenTrack,
                    localStream
                );

                setIsScreenSharing(true);
                console.log("Screen sharing started");

                // Listen for user to stop share from browser UI
                screenTrack.onended = () => {
                    console.log("Screen share ended by user");
                    stopScreenShare();
                };
            }
        } catch (err) {
            console.error("Error starting screen share:", err);
            alert(`Failed to start screen sharing: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const stopScreenShare = async () => {
        if (!peerRef.current || !localStream) {
            console.warn("Cannot stop screen share - no peer or local stream");
            return;
        }
        
        try {
            console.log("Stopping screen share");
            // Re-acquire camera
            const newCameraStream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video",
                audio: true,
            });
            const newCameraTrack = newCameraStream.getVideoTracks()[0];

            // Replace the screen track with the camera track
            if (peerRef.current.streams[0] && newCameraTrack) {
                const currentVideoTrack = peerRef.current.streams[0].getVideoTracks()[0];
                if (currentVideoTrack) {
                    peerRef.current.replaceTrack(
                        currentVideoTrack,
                        newCameraTrack,
                        peerRef.current.streams[0]
                    );
                }
            }

            setIsScreenSharing(false);
            console.log("Screen sharing stopped");
        } catch (err) {
            console.error("Error stopping screen share:", err);
            alert(`Failed to stop screen sharing: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Update debug info periodically
    useEffect(() => {
        const interval = setInterval(updateDebugInfo, 2000);
        return () => clearInterval(interval);
    }, [updateDebugInfo]);

    return (
        <>
            {/* ========== Header ========== */}
            <div className="p-[14px] border-b flex items-center justify-between">
                <div>
                    {participant ? (
                        <div className="flex items-center">
                            <Image
                                src={participant.avatar}
                                alt="Avatar"
                                width={100}
                                height={100}
                                className="w-8 h-8 rounded-full object-cover mx-2"
                            />
                            <div>{participant.name}</div>
                        </div>
                    ) : (
                        <div>Unknown participant</div>
                    )}
                </div>
                <div className="flex space-x-4 justify-end">
                    <button
                        onClick={() => initiateCall("audio")}
                        className="p-2 rounded bg-gray-200 hover:bg-gray-300"
                        disabled={isCallActive || !!outgoingCall || !!incomingCall}
                    >
                        <FiPhone />
                    </button>
                    <button
                        onClick={() => initiateCall("video")}
                        className="p-2 rounded bg-gray-200 hover:bg-gray-300"
                        disabled={isCallActive || !!outgoingCall || !!incomingCall}
                    >
                        <FiVideo />
                    </button>
                </div>
            </div>

            {/* ========== Debug Info (Development Only) ========== */}
            {process.env.NODE_ENV === 'development' && isCallActive && (
                <div className="fixed top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50 max-w-xs">
                    <div>Local tracks: {debugInfo.localStreamTracks}</div>
                    <div>Remote tracks: {debugInfo.remoteStreamTracks}</div>
                    <div>Local playing: {debugInfo.localVideoPlaying ? '✓' : '✗'}</div>
                    <div>Remote playing: {debugInfo.remoteVideoPlaying ? '✓' : '✗'}</div>
                    <div>Peer connected: {debugInfo.peerConnected ? '✓' : '✗'}</div>
                    <div>User role: {user?.role || 'Unknown'}</div>
                </div>
            )}

            {/* ========== Outgoing Call Overlay ========== */}
            {outgoingCall && !isCallActive && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 w-72 rounded shadow-md text-center">
                        <p className="text-xl font-semibold">Calling...</p>
                        <p className="text-sm mt-2">{participant?.name}</p>
                        <p className="text-xs mt-1 text-gray-500">{outgoingCall.callType} call</p>
                        <button
                            onClick={cancelOutgoingCall}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ========== Incoming Call Overlay ========== */}
            {incomingCall && !isCallActive && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 w-72 rounded shadow-md text-center">
                        <p className="text-xl font-semibold">Incoming Call</p>
                        <p className="text-sm mt-2">
                            {incomingCall.callType === "video" ? "Video" : "Audio"} Call from{" "}
                            {incomingCall.callerName}
                        </p>
                        <div className="flex space-x-4 mt-4 justify-center">
                            <button
                                onClick={acceptCall}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                                Accept
                            </button>
                            <button
                                onClick={rejectCall}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Active Call UI ========== */}
            {isCallActive && (
                <div className="fixed bottom-4 right-4 bg-white p-3 shadow-lg border flex flex-col items-center z-50 rounded w-96">
                    <div className="flex w-full justify-center space-x-2 mb-2">
                        {/* Local video */}
                        {callType === "video" && (
                            <div className="relative">
                                <video
                                    ref={myVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-40 h-32 bg-gray-900 rounded-lg object-cover"
                                />
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                    You {isVideoOff && '(Video Off)'}
                                </div>
                                {!debugInfo.localVideoPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                        <span className="text-white text-xs">Local Video Loading...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Remote video */}
                        {callType === "video" && (
                            <div className="relative">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-40 h-32 bg-gray-900 rounded-lg object-cover"
                                />
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                    {participant?.name || 'Remote'}
                                </div>
                                {!debugInfo.remoteVideoPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                        <span className="text-white text-xs">Waiting for Remote Video...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Audio-call placeholders if video is off */}
                    {callType === "audio" && (
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {user?.name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <span className="text-sm text-gray-700">Audio Call in progress...</span>
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {participant?.name?.charAt(0) || 'P'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        {/* Toggle Audio */}
                        <button
                            onClick={toggleAudio}
                            className={`p-2 rounded hover:bg-gray-300 ${isAudioMuted ? 'bg-red-200' : 'bg-gray-200'}`}
                            title={isAudioMuted ? "Unmute" : "Mute"}
                        >
                            {isAudioMuted ? <FiMicOff className="text-red-600" /> : <FiMic />}
                        </button>

                        {/* Toggle Video (only if callType === "video") */}
                        {callType === "video" && (
                            <button
                                onClick={toggleVideo}
                                className={`p-2 rounded hover:bg-gray-300 ${isVideoOff ? 'bg-red-200' : 'bg-gray-200'}`}
                                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                            >
                                {isVideoOff ? <FiVideoOff className="text-red-600" /> : <FiVideo />}
                            </button>
                        )}

                        {/* Screen Share (only if callType === "video") */}
                        {callType === "video" && (
                            <>
                                {!isScreenSharing ? (
                                    <button
                                        onClick={startScreenShare}
                                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                                        title="Share Screen"
                                    >
                                        <FiMonitor />
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopScreenShare}
                                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                                        title="Stop Sharing"
                                    >
                                        <FiMonitor className="text-red-600" />
                                    </button>
                                )}
                            </>
                        )}

                        {/* End Call */}
                        <button
                            onClick={() => endCall(true)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            title="End Call"
                        >
                            End
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}