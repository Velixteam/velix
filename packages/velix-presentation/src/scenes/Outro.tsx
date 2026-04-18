import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const command = "npm install -g @teamvelix/cli";
  const charsToShow = Math.floor(interpolate(frame, [15, 45], [0, command.length], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  }));
  const currentCommand = command.substring(0, charsToShow);

  const containerOpacity = interpolate(frame, [0, 10], [0, 1]);
  const linksOpacity = interpolate(frame, [60, 75], [0, 1]);
  
  const showCursor = frame % 30 < 15;

  return (
    <AbsoluteFill className="bg-slate-950 flex flex-col items-center justify-center" style={{ opacity: containerOpacity }}>
      
      <div className="text-5xl font-bold text-white mb-12">
        Ready to build the future?
      </div>

      <div className="bg-black/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm w-[800px] max-w-full">
        <div className="flex gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="font-mono text-3xl text-emerald-400 flex items-center">
          <span className="text-slate-500 mr-4">$</span>
          {currentCommand}
          {showCursor && <span className="inline-block w-4 h-8 bg-slate-300 ml-1"></span>}
        </div>
      </div>
      
      <div 
        style={{ opacity: linksOpacity }}
        className="mt-16 flex flex-col items-center gap-4 text-2xl text-slate-400"
      >
        <p className="text-glow">velix.dev</p>
        <p>github.com/Velixteam/velix</p>
      </div>

    </AbsoluteFill>
  );
};
