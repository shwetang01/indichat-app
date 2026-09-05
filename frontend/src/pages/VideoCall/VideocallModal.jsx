import React, { useEffect, useRef, useMemo } from "react";

import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes, FaVideo, FaVideoSlash } from "react-icons/fa";
import useVideoCallStore from "../../store/videoCallStore";


const VideocallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    callType,
    peerConnection,
    iceCandidatesQueue,
    isCallModalOpen,
    callStatus,

    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  // const rtcConfiguration = {
  //   iceServers: [
  //     {
  //       urls: "stun:stun.l.google.com:19302",
  //     },
  //     {
  //       urls: "stun:stun1.l.google.com:19302",
  //     },
  //     {
  //       urls: "stun:stun2.l.google.com:19302",
  //     },
  //   ],
  // };

  const rtcConfiguration = {
  iceServers: [
    // STUN (keep)
    {
      urls: "stun:stun.l.google.com:19302",
    },

    // TURN (ADD THIS — REQUIRED for real connections)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

  // Memorize display the user info and it is prevent the unnecessary re-render
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }

    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // Connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both peer connection and remote stream is available");
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

  // set up local video  stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // set up remote video  stream when remote stream change
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize media stream

  const initializeMedia = async (video = true) => {
  try {
    const constraints = {
      video: video ? { width: 640, height: 480 } : false,
      audio: true,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("✅ Local media stream", stream.getTracks());
    setLocalStream(stream);
    return stream;

  } catch (error) {
    console.error("❌ Media error", error.name, error.message);

    // Special handling for NotReadableError (device busy)
    if (error.name === "NotReadableError") {
      alert("Your camera/mic is already in use by another tab/app.");
      // Optional: fallback to fake video track so app doesn't crash
      const stream = new MediaStream();
      setLocalStream(stream);
      return stream;
    }

    throw error;
  }
};


  // Create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks immediately
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
        pc.addTrack(track, stream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const { currentCall: liveCall, incomingCall: liveIncoming } = useVideoCallStore.getState();
        const participantId =
          liveCall?.participantId || liveIncoming?.callerId;
        const callId = liveCall?.callId || liveIncoming?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId.toString(),
            callId: callId,
          });
        }
      }
    };

    // handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`role: ${role} :connection state`, pc.connectionState);
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 200);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`${role} :ICE state`, pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`${role} : signaling state `, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  // caller: Initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");
      const { currentCall: liveCall, callType: liveCallType } = useVideoCallStore.getState();

      // get media
      const stream = await initializeMedia(liveCallType === "video");

      // create peer connection with offer
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: liveCallType === "video",
      });

      await pc.setLocalDescription(offer);

      if (liveCall?.participantId) {
        socket.emit("webrtc_offer", {
          offer,
          receiverId: liveCall.participantId.toString(),
          callId: liveCall.callId,
        });
      }
    } catch (error) {
      console.error("caller error", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // receiver: answer call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");
      const { incomingCall: liveIncoming, callType: liveCallType } = useVideoCallStore.getState();

      // get media
      const stream = await initializeMedia(liveCallType === "video");

      // create peer connection with offer
      createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call", {
        callerId: liveIncoming?.callerId?.toString(),
        callId: liveIncoming?.callId,
        receiverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: liveIncoming?.callId,
        participantId: liveIncoming?.callerId,
        participantName: liveIncoming?.callerName,
        participantAvatar: liveIncoming?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver error:", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    const { incomingCall: liveIncoming } = useVideoCallStore.getState();
    if (liveIncoming) {
      socket.emit("reject_call", {
        callerId: liveIncoming.callerId?.toString(),
        callId: liveIncoming.callId,
      });
    }
    endCall();
  };

  const handleEndCall = () => {
    const { currentCall: liveCall, incomingCall: liveIncoming } = useVideoCallStore.getState();
    const participantId = liveCall?.participantId || liveIncoming?.callerId;
    const callId = liveCall?.callId || liveIncoming?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId.toString(),
      });
    }
    endCall();
  };

  // socket event listeners
  useEffect(() => {
    if (!socket) return;

    // call accepted start caller flow
    const handleCallAccepted = ({ receiverName }) => {
      const liveCall = useVideoCallStore.getState().currentCall;
      if (liveCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 300);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => {
      endCall();
    };

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      let pc = useVideoCallStore.getState().peerConnection;
      const { callType: liveCallType } = useVideoCallStore.getState();

      try {
        if (!pc) {
          const stream = await initializeMedia(liveCallType === "video");
          pc = createPeerConnection(stream, "RECEIVER");
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await useVideoCallStore.getState().processQueuedIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId?.toString(),
          callId,
        });

        console.log("✅ Receiver: Answer sent");
      } catch (error) {
        console.error("❌ Receiver offer error", error);
      }
    };

    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      const pc = useVideoCallStore.getState().peerConnection;
      if (!pc) {
        console.log("❌ No peerConnection on caller");
        return;
      }

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        await useVideoCallStore.getState().processQueuedIceCandidates();

        console.log("✅ Caller: Answer received & set");
      } catch (error) {
        console.error("❌ caller answer error", error);
      }
    };

    // Receiver ICE candidates
    const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
      const pc = useVideoCallStore.getState().peerConnection;
      if (pc && pc.signalingState !== "closed") {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            console.log("✅ ICE candidate added");
          } catch (error) {
            console.log("ICE candidate error", error);
          }
        } else {
          console.log("queuing ice candidates");
          useVideoCallStore.getState().addIceCandidate(candidate);
        }
      }
    };

    //Register all events listeners
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    console.log("socket listeners registers");
    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (!isCallModalOpen && !incomingCall) return null;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* //incoming call ui */}

        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="w-full h-full object-cover"
                  onError={(e)=>{
                    e.target.src ="/placeholder.svg"
                  }}
                />
              </div>
              <h2
                className={`text-2xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {displayInfo?.name}
              </h2>
              <p
                className={`text-lg ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Incoming {callType} Call...
              </p>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaPhoneSlash className="w-6 h-6" />
              </button>

              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaVideo className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Active call ui */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            { callType ==='video' && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`
              }/>
            )}

        {/* Avatar / status display */}
        {(!remoteStream || callType !== "video") && (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden">
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="w-full h-full object-cover"
                    onError={(e)=>{
                    e.target.src ="/placeholder.svg"
                  }}

                />
              </div>
              <p className="text-white text-xl">
                {callStatus === "calling"
                  ? `Calling ${displayInfo?.name}...`
                  : callStatus === "connecting"
                  ? "connecting..."
                  : callStatus === "connected"
                  ? displayInfo?.name
                  : callStatus === "failed"
                  ? "Connection failed"
                  : displayInfo?.name}
              </p>
            </div>
          </div>
        )}

        {/* local video (picture in picture) */}
        {callType === "video" && localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* call status */}
        <div className="absolute top-4 left-4">
          <div
            className={`px-4 py-2 rounded-full ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } bg-opacity-75`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {callStatus === "connected" ? "Connected" : callStatus}
            </p>
          </div>
        </div>

        {/* call controls */}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-4">
            {callType === "video" && (
              <button
              onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isVideoEnabled
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }  `}
              >
                {isVideoEnabled ? (
                  <FaVideo className="w-5 h-5" />
                ) : (
                  <FaVideoSlash className="w-5 h-5" />
                )}
              </button>
            )}

            <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }  `}
              >
                {isAudioEnabled ? (
                  <FaMicrophone className="w-5 h-5" />
                ) : (
                  <FaMicrophoneSlash className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleEndCall}
                className="w-12 h-12 bg-red-500 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaPhoneSlash className="w-5 h-5" />
              </button>



          </div>
        </div>
           </div>
        )}

        {/* endcall */}

        {callStatus ==='calling' && (
            <button
                onClick={handleEndCall}
                className=" absolute top-4 right-4 w-8 h-8  bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>

        )}





      </div>
    </div>
  );
};

export default VideocallModal;
