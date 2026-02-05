'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface ProductVideoProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
}

export default function ProductVideo({ src, poster, title, className = '' }: ProductVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const video = document.getElementById(`video-${src.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.getElementById(`video-${src.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        id={`video-${src.replace(/[^a-zA-Z0-9]/g, '')}`}
        className="w-full h-full object-cover"
        poster={poster}
        playsInline
        muted={isMuted}
        loop
        onClick={togglePlay}
      >
        <source src={src} type="video/mp4" />
        <source src={src.replace('.mp4', '.webm')} type="video/webm" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none">
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 transition-all duration-200 hover:scale-105"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 transition-all duration-200 hover:scale-105"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Center Play Button for Desktop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!isPlaying && (
          <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all duration-200 hover:scale-105 pointer-events-auto">
            <Play className="h-8 w-8 text-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
}
