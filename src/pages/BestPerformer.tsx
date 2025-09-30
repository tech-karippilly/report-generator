import { useState, useEffect } from 'react';
import bestPerformerImage from '../assets/images/best_perfomer.jpeg';
import starPerformerImage from '../assets/images/star_perfomer.jpeg';
import outstandingPerformerImage from '../assets/images/out_standing_perfomer.jpeg';
import celebrationVideo from '../assets/vedio/WhatsApp Video 2025-09-29 at 10.08.05 PM.mp4';

export default function BestPerformerPage() {
  const [currentPhase, setCurrentPhase] = useState('none'); // 'none', 'sequence', 'all-together'
  const [currentPerformerIndex, setCurrentPerformerIndex] = useState(0);
  const [showImageContainer, setShowImageContainer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(0);

  const performerImages = [
    starPerformerImage,
    outstandingPerformerImage,
    bestPerformerImage,
  ];

  const performerNames = [
    "Star Performer Certificate",
    "Outstanding Performer Certificate", 
    "Best Performer Certificate",
  ];

  const revealBestPerformer = () => {
    setCurrentPhase('sequence');
    setCurrentPerformerIndex(0);
    setShowImageContainer(false);
    setShowCelebration(false);
    setShowVideo(true);
    startCountdown();
  };

  const startCountdown = () => {
    const countdownDuration = getCountdownDuration(currentPerformerIndex);
    setCountdownNumber(countdownDuration);
    setShowCountdown(true);
    
    const countdownInterval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          setShowImageContainer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getCountdownDuration = (index: number) => {
    switch (index) {
      case 0: return 8; // Star Performer - 8 seconds
      case 1: return 8; // Outstanding Performer - 8 seconds  
      case 2: return 10; // Best Performer - 10 seconds
      default: return 8;
    }
  };

  // Control video playback - show video briefly then stop for all-together
  useEffect(() => {
    if (currentPhase === 'sequence') {
      setShowVideo(true);
    } else if (currentPhase === 'all-together') {
      setShowVideo(true);
      // Stop video after 0.35 seconds and show images
      setTimeout(() => {
        setShowVideo(false);
        setShowImageContainer(true);
        setShowCelebration(true);
      }, 350);
    } else {
      setShowVideo(false);
    }
  }, [currentPhase]);

  // Handle sequence transitions
  useEffect(() => {
    if (currentPhase === 'sequence') {
      // Start celebration after slide-up completes
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(true);
      }, 800);

      // Move to next performer after 11.5 seconds (to match video duration)
      const nextPerformerTimer = setTimeout(() => {
        if (currentPerformerIndex < performerImages.length - 1) {
          // Start flip out animation
          setShowImageContainer(false);
          setShowCelebration(false);
          setTimeout(() => {
            // Change to next performer
            setCurrentPerformerIndex(prev => prev + 1);
            // Start countdown for next performer
            startCountdown();
          }, 350); // Half of flip animation duration for smooth transition
        } else {
          // After showing best performer for 11.5 seconds, show all together
          setTimeout(() => {
            setCurrentPhase('all-together');
            setShowImageContainer(false);
            setShowCelebration(false);
            setTimeout(() => {
              setShowImageContainer(true);
              setShowCelebration(true);
            }, 400); // Longer delay for dramatic transition to all-together
          }, 11500);
        }
      }, 11500);

      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(nextPerformerTimer);
      };
    }
  }, [currentPhase, currentPerformerIndex, performerImages.length]);

  return (
    <div className="min-h-screen w-full bg-gray-50 overflow-x-hidden relative">
      <div className="w-full max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Best Performer Page
        </h1>
        
        <div className="text-center mb-8">
          <button
            onClick={revealBestPerformer}
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            🏆 Reveal Performers
          </button>
        </div>

        {/* Full Width Video with Overlay Posters */}
        {showVideo && (
          <div className="w-full h-[600px] mb-8 rounded-lg overflow-hidden shadow-lg relative">
            <video
              autoPlay
              loop
              className="w-full h-full object-cover"
            >
              <source src={celebrationVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Sequence Phase - Show performer poster over video */}
            {currentPhase === 'sequence' && showImageContainer && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative perspective-1000">
                  <div 
                    className={`relative transition-transform duration-700 ease-in-out ${showImageContainer ? 'animate-flip-in' : 'animate-flip-out'}`}
                    key={currentPerformerIndex}
                  >
                    <img 
                      src={performerImages[currentPerformerIndex]} 
                      alt={performerNames[currentPerformerIndex]}
                      className={`w-full max-w-2xl mx-auto rounded-lg shadow-2xl relative z-0 transition-all duration-500 ease-in-out ${showCelebration ? 'animate-celebration-glow' : ''}`}
                      style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    />
                    
                    {/* Image transition overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Celebration Effects */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Confetti */}
                <div className="absolute top-0 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 right-1/4 w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
                <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
                <div className="absolute top-1/4 right-1/6 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}></div>
                <div className="absolute top-1/2 left-1/3 w-5 h-5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '3s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '1.2s', animationDuration: '3s' }}></div>
                <div className="absolute top-3/4 left-1/5 w-4 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }}></div>
                <div className="absolute top-3/4 right-1/5 w-4 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '2.2s' }}></div>
                
                {/* Sparkles */}
                <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                
                {/* Celebration Text */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl animate-pulse">
                  🎉
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-trophy-move">
                  🏆
                </div>
                
                {/* Falling Confetti */}
                <div className="absolute top-0 left-1/5 w-3 h-3 bg-yellow-400 rounded-full animate-confetti-fall" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-0 left-2/5 w-3 h-3 bg-pink-400 rounded-full animate-confetti-fall" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-0 left-3/5 w-3 h-3 bg-blue-400 rounded-full animate-confetti-fall" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-0 left-4/5 w-3 h-3 bg-green-400 rounded-full animate-confetti-fall" style={{ animationDelay: '2.5s' }}></div>
                
                {/* Paper Confetti */}
                <div className="absolute top-0 left-1/6 w-2 h-4 bg-red-500 animate-paper-fall" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-0 left-2/6 w-2 h-4 bg-orange-500 animate-paper-fall" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-0 left-3/6 w-2 h-4 bg-yellow-500 animate-paper-fall" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-0 left-4/6 w-2 h-4 bg-green-500 animate-paper-fall" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-0 left-5/6 w-2 h-4 bg-blue-500 animate-paper-fall" style={{ animationDelay: '2.5s' }}></div>
                
                {/* Streamers */}
                <div className="absolute top-0 left-1/4 w-1 h-20 bg-gradient-to-b from-yellow-400 to-orange-500 animate-streamer-fall" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute top-0 left-2/4 w-1 h-20 bg-gradient-to-b from-pink-400 to-red-500 animate-streamer-fall" style={{ animationDelay: '1.2s' }}></div>
                <div className="absolute top-0 left-3/4 w-1 h-20 bg-gradient-to-b from-blue-400 to-purple-500 animate-streamer-fall" style={{ animationDelay: '1.6s' }}></div>
                
                {/* Additional Sparkles */}
                <div className="absolute top-1/3 left-1/5 w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.7s' }}></div>
                <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle" style={{ animationDelay: '1.1s' }}></div>
                <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-pink-300 rounded-full animate-sparkle" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Celebration Stars */}
                <div className="absolute top-1/6 left-1/8 text-2xl animate-star-twinkle" style={{ animationDelay: '0.5s' }}>⭐</div>
                <div className="absolute top-1/6 right-1/8 text-2xl animate-star-twinkle" style={{ animationDelay: '1s' }}>⭐</div>
                <div className="absolute top-5/6 left-1/8 text-2xl animate-star-twinkle" style={{ animationDelay: '1.5s' }}>⭐</div>
                <div className="absolute top-5/6 right-1/8 text-2xl animate-star-twinkle" style={{ animationDelay: '2s' }}>⭐</div>
              </div>
            )}
          </div>
        )}

        {/* All Together Phase - Show all three images in a row with Best Performer in middle */}
        {currentPhase === 'all-together' && showImageContainer && (
          <div className="mt-8 text-center animate-slideUp relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              {/* Star Performer (Left) */}
              <div className="relative animate-fade-in-scale" style={{ animationDelay: '0s' }}>
                <img 
                  src={performerImages[0]} 
                  alt={performerNames[0]}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-2xl animate-celebration-glow transition-all duration-500 hover:scale-105"
                  style={{ maxHeight: '50vh', objectFit: 'contain' }}
                />
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                  🥈
                </div>
              </div>
              
              {/* Best Performer (Middle) */}
              <div className="relative animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
                <img 
                  src={performerImages[2]} 
                  alt={performerNames[2]}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-2xl animate-celebration-glow transition-all duration-500 hover:scale-105"
                  style={{ maxHeight: '50vh', objectFit: 'contain' }}
                />
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
                  🥇
                </div>
              </div>
              
              {/* Outstanding Performer (Right) */}
              <div className="relative animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
                <img 
                  src={performerImages[1]} 
                  alt={performerNames[1]}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-2xl animate-celebration-glow transition-all duration-500 hover:scale-105"
                  style={{ maxHeight: '50vh', objectFit: 'contain' }}
                />
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl animate-slide-in-right" style={{ animationDelay: '0.7s' }}>
                  🥉
                </div>
              </div>
            </div>
            
            {/* Firework Celebration Effects */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Sky Fireworks */}
                <div className="absolute top-1/4 left-1/4 text-6xl animate-firework-explosion" style={{ animationDelay: '0.5s' }}>💥</div>
                <div className="absolute top-1/3 right-1/4 text-5xl animate-firework-explosion" style={{ animationDelay: '1s' }}>✨</div>
                <div className="absolute top-1/5 left-1/2 text-4xl animate-firework-explosion" style={{ animationDelay: '1.5s' }}>🎆</div>
                <div className="absolute top-1/6 right-1/3 text-5xl animate-firework-explosion" style={{ animationDelay: '2s' }}>🎇</div>
                <div className="absolute top-1/4 left-2/3 text-4xl animate-firework-explosion" style={{ animationDelay: '2.5s' }}>💫</div>
                
                {/* Falling Sparkles */}
                <div className="absolute top-0 left-1/5 w-2 h-2 bg-yellow-400 rounded-full animate-sparkle-fall" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute top-0 left-2/5 w-2 h-2 bg-pink-400 rounded-full animate-sparkle-fall" style={{ animationDelay: '1.2s' }}></div>
                <div className="absolute top-0 left-3/5 w-2 h-2 bg-blue-400 rounded-full animate-sparkle-fall" style={{ animationDelay: '1.6s' }}></div>
                <div className="absolute top-0 left-4/5 w-2 h-2 bg-green-400 rounded-full animate-sparkle-fall" style={{ animationDelay: '2s' }}></div>
                
                {/* Celebration Text */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-5xl animate-pulse">
                  🎊
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-5xl animate-pulse" style={{ animationDelay: '0.5s' }}>
                  🏆
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Together Phase - Show all three images in a row */}
        {currentPhase === 'all-together' && showImageContainer && (
          <div className="mt-8 text-center animate-slideUp relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              {performerImages.map((image, index) => (
                <div 
                  key={index} 
                  className="relative animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <img 
                    src={image} 
                    alt={performerNames[index]}
                    className="w-full max-w-sm mx-auto rounded-lg shadow-2xl animate-celebration-glow transition-all duration-500 hover:scale-105"
                    style={{ maxHeight: '50vh', objectFit: 'contain' }}
                  />
                  <div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.2 + 0.3}s` }}
                  >
                    {index === 0 ? '🥉' : index === 1 ? '🥈' : '🥇'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Celebration Effects for all together */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Enhanced celebration for all three */}
                <div className="absolute top-0 left-1/6 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 left-2/6 w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 left-3/6 w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 left-4/6 w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 left-5/6 w-4 h-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1.2s', animationDuration: '2s' }}></div>
                
                {/* Celebration Text */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-5xl animate-pulse">
                  🎊
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-5xl animate-pulse" style={{ animationDelay: '0.5s' }}>
                  🏆
                </div>
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(100px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes celebrationGlow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 165, 0, 0.6);
            }
          }
          
          @keyframes confettiFall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(300px) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes trophyMove {
            0% {
              transform: translate(-50%, -50%) scale(0.5);
              top: 100%;
              opacity: 0;
            }
            20% {
              transform: translate(-50%, -50%) scale(1.2);
              top: 85%;
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.5);
              top: 85%;
              opacity: 1;
            }
          }
          
          @keyframes trophyStay {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1.5);
              top: 85%;
              opacity: 1;
            }
          }
          
          .animate-slideUp {
            animation: slideUp 0.8s ease-out;
          }
          
          .animate-celebration-glow {
            animation: celebrationGlow 2s ease-in-out infinite;
          }
          
          .animate-confetti-fall {
            animation: confettiFall 3s linear infinite;
          }
          
          .animate-trophy-move {
            animation: trophyMove 2s ease-in-out, trophyStay 0.1s ease-in-out 2s forwards;
          }
          
          @keyframes paperFall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(400px) rotate(180deg);
              opacity: 0;
            }
          }
          
          @keyframes streamerFall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(500px) rotate(45deg);
              opacity: 0;
            }
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 0;
              transform: scale(0.5);
            }
            50% {
              opacity: 1;
              transform: scale(1.5);
            }
          }
          
          @keyframes starTwinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.2) rotate(180deg);
            }
          }
          
          .animate-paper-fall {
            animation: paperFall 3s linear infinite;
          }
          
          .animate-streamer-fall {
            animation: streamerFall 4s linear infinite;
          }
          
          .animate-sparkle {
            animation: sparkle 2s ease-in-out infinite;
          }
          
          .animate-star-twinkle {
            animation: starTwinkle 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes slideInFromRight {
            0% {
              opacity: 0;
              transform: translateX(50px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out;
          }
          
          .animate-fade-in-scale {
            animation: fadeInScale 0.6s ease-out;
          }
          
          .animate-slide-in-right {
            animation: slideInFromRight 0.8s ease-out;
          }
          
          @keyframes flipIn {
            0% {
              transform: rotateY(-90deg) scale(0.8);
              opacity: 0;
            }
            50% {
              transform: rotateY(-45deg) scale(0.9);
              opacity: 0.5;
            }
            100% {
              transform: rotateY(0deg) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes flipOut {
            0% {
              transform: rotateY(0deg) scale(1);
              opacity: 1;
            }
            50% {
              transform: rotateY(45deg) scale(0.9);
              opacity: 0.5;
            }
            100% {
              transform: rotateY(90deg) scale(0.8);
              opacity: 0;
            }
          }
          
          .animate-flip-in {
            animation: flipIn 0.7s ease-in-out;
          }
          
          .animate-flip-out {
            animation: flipOut 0.7s ease-in-out;
          }
          
          .perspective-1000 {
            perspective: 1000px;
          }
          
          @keyframes fireworkExplosion {
            0% {
              opacity: 0;
              transform: scale(0.5) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.2) rotate(180deg);
            }
            100% {
              opacity: 0;
              transform: scale(0.8) rotate(360deg);
            }
          }
          
          @keyframes sparkleFall {
            0% {
              opacity: 1;
              transform: translateY(-100px) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateY(200px) rotate(360deg);
            }
          }
          
          .animate-firework-explosion {
            animation: fireworkExplosion 2s ease-out infinite;
          }
          
          .animate-sparkle-fall {
            animation: sparkleFall 3s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}