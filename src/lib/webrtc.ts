import SocketManager from './socket';

export interface CallOptions {
  video: boolean;
  audio: boolean;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socketManager: SocketManager;
  private isInitiator = false;

  constructor() {
    this.socketManager = SocketManager.getInstance();
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    const socket = this.socketManager.getSocket();
    if (!socket) return;

    socket.on('incoming_call', this.handleIncomingCall.bind(this));
    socket.on('call_answered', this.handleCallAnswered.bind(this));
    socket.on('call_rejected', this.handleCallRejected.bind(this));
    socket.on('call_ended', this.handleCallEnded.bind(this));
    socket.on('ice_candidate', this.handleIceCandidate.bind(this));
  }

  async initializeCall(targetUserId: string, options: CallOptions): Promise<void> {
    this.isInitiator = true;
    
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send call invitation
      const socket = this.socketManager.getSocket();
      if (socket) {
        socket.emit('call_user', {
          to: targetUserId,
          from: socket.id,
          callType: options.video ? 'video' : 'voice',
          offer: offer,
        });
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      throw error;
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit): Promise<void> {
    this.isInitiator = false;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true, // You might want to make this configurable
        audio: true,
      });

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Set remote description
      await this.peerConnection!.setRemoteDescription(offer);

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer
      const socket = this.socketManager.getSocket();
      if (socket) {
        socket.emit('answer_call', {
          to: socket.id, // This should be the caller's socket ID
          answer: answer,
        });
      }
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  rejectCall(targetUserId: string): void {
    const socket = this.socketManager.getSocket();
    if (socket) {
      socket.emit('reject_call', {
        to: targetUserId,
      });
    }
  }

  endCall(targetUserId: string): void {
    const socket = this.socketManager.getSocket();
    if (socket) {
      socket.emit('end_call', {
        to: targetUserId,
      });
    }
    this.cleanup();
  }

  private createPeerConnection(): void {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = this.socketManager.getSocket();
        if (socket) {
          socket.emit('ice_candidate', {
            to: socket.id, // This should be the other peer's socket ID
            candidate: event.candidate,
          });
        }
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      // Emit event for UI to handle
      this.onRemoteStream?.(this.remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      this.onConnectionStateChange?.(this.peerConnection?.connectionState || 'closed');
    };
  }

  private async handleIncomingCall(data: any): Promise<void> {
    // Emit event for UI to show incoming call modal
    this.onIncomingCall?.(data);
  }

  private async handleCallAnswered(data: any): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(data.answer);
    }
  }

  private handleCallRejected(): void {
    this.onCallRejected?.();
    this.cleanup();
  }

  private handleCallEnded(): void {
    this.onCallEnded?.();
    this.cleanup();
  }

  private async handleIceCandidate(data: any): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(data.candidate);
    }
  }

  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  // Event handlers (to be set by the UI)
  onIncomingCall?: (data: any) => void;
  onCallRejected?: () => void;
  onCallEnded?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;

  // Getters
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }
}
