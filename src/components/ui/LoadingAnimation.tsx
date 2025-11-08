export default function LoadingAnimation() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#101010] to-[#181818] z-50">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-yellow-700/30 border-t-yellow-500 rounded-full animate-spin" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 border-4 border-yellow-600/40 border-b-yellow-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-yellow-500 text-xl font-semibold mb-2">loading mystery chamber...</h3>
        <div className="flex items-center gap-1 justify-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      <div className="mt-6 max-w-md text-center">
        <p className="text-gray-400 text-sm italic">
          "patience, detective... every great investigation begins with careful preparation."
        </p>
      </div>
    </div>
  );
}
