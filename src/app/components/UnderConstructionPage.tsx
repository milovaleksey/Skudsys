import { Construction } from 'lucide-react';

export function UnderConstructionPage() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-2xl px-6">
        {/* Animated Construction Scene */}
        <div className="relative mb-8 h-64">
          {/* Crane */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0">
            {/* Crane Tower */}
            <div 
              className="w-4 h-40 mx-auto"
              style={{ backgroundColor: '#00aeef' }}
            />
            
            {/* Crane Arm */}
            <div 
              className="relative"
              style={{
                animation: 'swingCrane 4s ease-in-out infinite'
              }}
            >
              <div 
                className="w-32 h-3 -ml-16"
                style={{ backgroundColor: '#00aeef' }}
              />
              
              {/* Cable */}
              <div className="absolute left-20 top-3">
                <div 
                  className="w-0.5 bg-gray-700"
                  style={{
                    height: '60px',
                    animation: 'extendCable 4s ease-in-out infinite'
                  }}
                />
                
                {/* Brick being lifted */}
                <div 
                  className="w-8 h-6 -ml-4 rounded-sm shadow-lg"
                  style={{
                    backgroundColor: '#d97706',
                    animation: 'liftBrick 4s ease-in-out infinite'
                  }}
                >
                  {/* Brick texture */}
                  <div className="grid grid-cols-2 gap-0.5 h-full p-0.5">
                    <div className="bg-orange-700/20 rounded-sm" />
                    <div className="bg-orange-700/20 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Building Foundation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
            {/* Bricks stack */}
            <div className="flex flex-col gap-1">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex gap-1">
                  {[1, 2, 3, 4].map((brick) => (
                    <div
                      key={brick}
                      className="w-8 h-6 rounded-sm shadow-md"
                      style={{
                        backgroundColor: '#d97706',
                        animation: `fadeInBrick 0.5s ease-in ${(row - 1) * 1.5}s backwards`
                      }}
                    >
                      <div className="grid grid-cols-2 gap-0.5 h-full p-0.5">
                        <div className="bg-orange-700/20 rounded-sm" />
                        <div className="bg-orange-700/20 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#00aeef' }}
          >
            <Construction size={40} className="text-white" />
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Страница в разработке
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          Я усердно работаю над этим разделом :)
        </p>
        <p className="text-gray-500">
          Функционал будет доступен в ближайшее время
        </p>

        {/* Progress indicator */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                backgroundColor: '#00aeef',
                width: '65%',
                animation: 'progress 3s ease-in-out infinite'
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Прогресс разработки</p>
        </div>

        {/* Inline styles for animations */}
        <style>{`
          @keyframes swingCrane {
            0%, 100% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(-8deg);
            }
            75% {
              transform: rotate(8deg);
            }
          }

          @keyframes extendCable {
            0%, 100% {
              height: 60px;
            }
            50% {
              height: 40px;
            }
          }

          @keyframes liftBrick {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes fadeInBrick {
            0% {
              opacity: 0;
              transform: translateY(-20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes progress {
            0%, 100% {
              width: 65%;
            }
            50% {
              width: 75%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}