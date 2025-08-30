import ModelViewer from "./components/ModelViewer";

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <ModelViewer />

      {/* Semi-transparent liquid glass input */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Type your message here..."
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl 
                     text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 
                     focus:border-white/40 transition-all duration-300 ease-out
                     hover:bg-white/15 hover:border-white/30"
          />

          {/* Liquid glass effect overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 
                        rounded-2xl pointer-events-none"
          ></div>

          {/* Subtle glow effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 
                        rounded-2xl blur-sm pointer-events-none"
          ></div>
        </div>
      </div>
    </div>
  );
}
