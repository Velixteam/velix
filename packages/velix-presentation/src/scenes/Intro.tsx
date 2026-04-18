import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
    },
    durationInFrames: 30,
  });

  const logoOpacity = interpolate(frame, [0, 15], [0, 1]);
  
  const textOpacity = interpolate(frame, [30, 45], [0, 1]);
  const textY = interpolate(frame, [30, 45], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill className="bg-slate-950 flex items-center justify-center flex-col">
      <div 
        style={{ 
          transform: `scale(${logoScale})`,
          opacity: logoOpacity
        }}
        className="flex items-center gap-6"
      >
        <Img src={staticFile("velix logo.webp")} className="w-32 h-32" />
        <h1 className="text-8xl font-bold tracking-tight text-glow text-white">Velix</h1>
        <div className="bg-blue-600/30 text-blue-400 px-4 py-2 rounded-xl text-3xl font-bold ml-2 border border-blue-500/50">
          v5
        </div>
      </div>
      
      <p 
        style={{ 
          opacity: textOpacity,
          transform: `translateY(${textY}px)`
        }}
        className="text-3xl text-slate-400 mt-8 font-medium tracking-wide"
      >
        A modern full-stack React framework
      </p>
    </AbsoluteFill>
  );
};
