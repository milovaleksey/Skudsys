import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LoadingCatWidgetProps {
  isVisible: boolean;
  onClose?: () => void;
  message?: string;
}

export function LoadingCatWidget({ 
  isVisible, 
  onClose,
  message = 'Загрузка данных, пожалуйста подождите...'
}: LoadingCatWidgetProps) {
  const [pawPosition, setPawPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsAnimating(false);
      return;
    }

    // Start animation after mount
    const showTimeout = setTimeout(() => setIsAnimating(true), 50);

    const interval = setInterval(() => {
      setPawPosition(prev => (prev + 1) % 3);
    }, 400);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
        isAnimating 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-[450px] opacity-0'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 w-96 relative overflow-hidden">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Минуточку! 🐾
          </h3>
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>

        {/* Cat Animation */}
        <div className="relative w-full h-48 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div 
              className="absolute top-8 right-8 w-2 h-2 bg-pink-400 rounded-full animate-pulse" 
              style={{ animationDelay: '0.5s' }}
            ></div>
            <div 
              className="absolute bottom-12 left-12 w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse" 
              style={{ animationDelay: '1s' }}
            ></div>
          </div>

          <svg
            viewBox="0 0 400 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Animations */}
              <style>
                {`
                  @keyframes tailWag {
                    0%, 100% { d: path("M 140 100 Q 120 80 115 60"); }
                    50% { d: path("M 140 100 Q 125 75 120 55"); }
                  }
                  
                  @keyframes blink {
                    0%, 95%, 100% { transform: scaleY(1); }
                    97.5% { transform: scaleY(0.1); }
                  }
                  
                  @keyframes diggingMarks {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                  }
                  
                  @keyframes sandFly {
                    0% { opacity: 0; transform: translateY(0); }
                    50% { opacity: 1; transform: translateY(-10px); }
                    100% { opacity: 0; transform: translateY(-20px); }
                  }
                  
                  .tail { animation: tailWag 1.5s ease-in-out infinite; }
                  .eyes { animation: blink 5s ease-in-out infinite; }
                  .digging-marks { animation: ${pawPosition === 1 ? 'diggingMarks 0.4s ease-in-out' : 'none'}; }
                  .sand-particles { animation: ${pawPosition === 1 ? 'sandFly 0.4s ease-out' : 'none'}; }
                `}
              </style>
            </defs>

            {/* Litter box */}
            <g id="litterbox">
              {/* Box base */}
              <rect
                x="100"
                y="140"
                width="200"
                height="40"
                rx="5"
                fill="#8B7355"
                stroke="#654321"
                strokeWidth="2"
              />
              
              {/* Sand texture */}
              <rect
                x="105"
                y="145"
                width="190"
                height="25"
                rx="3"
                fill="#DEB887"
              />
              
              {/* Sand particles */}
              {[...Array(30)].map((_, i) => (
                <circle
                  key={i}
                  cx={110 + (i * 6) % 180}
                  cy={150 + (i * 3) % 20}
                  r={1 + (i % 2)}
                  fill="#C19A6B"
                  opacity={0.6}
                />
              ))}
              
              {/* Digging marks */}
              <g className="digging-marks" opacity={pawPosition === 1 ? 0.8 : 0.3}>
                <path
                  d="M 180 155 Q 185 150 190 155"
                  stroke="#A0826D"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M 200 160 Q 205 155 210 160"
                  stroke="#A0826D"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            </g>

            {/* Cat body */}
            <g id="cat">
              {/* Tail */}
              <path
                className="tail"
                d="M 140 100 Q 120 80 115 60"
                stroke="#FF9966"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Body */}
              <ellipse
                cx="180"
                cy="110"
                rx="50"
                ry="40"
                fill="#FF9966"
              />

              {/* Head */}
              <circle
                cx="220"
                cy="85"
                r="30"
                fill="#FF9966"
              />

              {/* Ears */}
              <polygon
                points="205,60 210,75 200,72"
                fill="#FF9966"
              />
              <polygon
                points="235,60 230,75 240,72"
                fill="#FF9966"
              />
              <polygon
                points="207,64 210,73 203,71"
                fill="#FFB399"
              />
              <polygon
                points="233,64 230,73 237,71"
                fill="#FFB399"
              />

              {/* Eyes */}
              <g 
                className="eyes"
                style={{ transformOrigin: '220px 82px' }}
              >
                <ellipse
                  cx="213"
                  cy="82"
                  rx="4"
                  ry="5"
                  fill="#2D3748"
                />
                <ellipse
                  cx="227"
                  cy="82"
                  rx="4"
                  ry="5"
                  fill="#2D3748"
                />
              </g>

              {/* Nose */}
              <circle
                cx="220"
                cy="90"
                r="2.5"
                fill="#FF6B9D"
              />

              {/* Mouth */}
              <path
                d="M 220 90 L 220 93 M 216 93 Q 220 95 224 93"
                stroke="#2D3748"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Whiskers */}
              <g stroke="#2D3748" strokeWidth="1" opacity="0.6">
                <line x1="200" y1="85" x2="185" y2="83" />
                <line x1="200" y1="88" x2="185" y2="88" />
                <line x1="200" y1="91" x2="185" y2="93" />
                
                <line x1="240" y1="85" x2="255" y2="83" />
                <line x1="240" y1="88" x2="255" y2="88" />
                <line x1="240" y1="91" x2="255" y2="93" />
              </g>

              {/* Front legs */}
              <ellipse
                cx="165"
                cy="135"
                rx="8"
                ry="15"
                fill="#FF9966"
              />

              {/* Animated digging paw */}
              <g
                style={{
                  transform: `translate(${
                    pawPosition === 0 ? 0 : pawPosition === 1 ? -15 : 15
                  }px, ${pawPosition === 1 ? 5 : 0}px) rotate(${
                    pawPosition === 1 ? -10 : 0
                  }deg)`,
                  transformOrigin: '195px 130px',
                  transition: 'all 0.3s ease-out'
                }}
              >
                <ellipse
                  cx="195"
                  cy="130"
                  rx="8"
                  ry="18"
                  fill="#FF9966"
                />
                {/* Paw pad */}
                <ellipse
                  cx="195"
                  cy="142"
                  rx="6"
                  ry="4"
                  fill="#FFB399"
                />
              </g>

              {/* Back legs */}
              <ellipse
                cx="150"
                cy="120"
                rx="10"
                ry="12"
                fill="#FF9966"
              />
              <ellipse
                cx="175"
                cy="125"
                rx="10"
                ry="12"
                fill="#FF9966"
              />
            </g>

            {/* Sand particles flying */}
            <g 
              className="sand-particles"
              opacity={pawPosition === 1 ? 1 : 0}
            >
              <circle cx="200" cy="135" r="2" fill="#DEB887" />
              <circle cx="210" cy="138" r="1.5" fill="#DEB887" />
              <circle cx="205" cy="140" r="1" fill="#DEB887" />
            </g>
          </svg>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ 
                backgroundColor: '#00aeef',
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-500 mt-2">
          Котик копает данные из базы...
        </p>
      </div>
    </div>
  );
}
