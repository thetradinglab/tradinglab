import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoHash: string;
  fallbackUrl: string;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoHash, fallbackUrl, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement && onComplete) {
      const handleEnded = () => {
        onComplete();
      };
      
      videoElement.addEventListener('ended', handleEnded);
      
      return () => {
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [onComplete]);

  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        src={fallbackUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {/* Hidden video element for future IPFS implementation */}
      <video 
        ref={videoRef}
        className="hidden"
        controls
        data-ipfs-hash={videoHash}
      >
        <source type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer;