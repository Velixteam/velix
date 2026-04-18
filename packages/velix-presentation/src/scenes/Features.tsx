import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  delay: number;
}> = ({ title, description, icon, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14 },
  });

  const translateY = interpolate(progress, [0, 1], [50, 0]);
  const opacity = interpolate(frame - delay, [0, 10], [0, 1]);

  return (
    <div
      style={{
        transform: `translateY(${translateY}px) scale(${progress})`,
        opacity
      }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
    >
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
      <p className="text-xl text-slate-400">{description}</p>
    </div>
  );
};

export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);
  
  return (
    <AbsoluteFill className="bg-slate-950 flex flex-col items-center justify-center p-16">
      <h1 
        style={{ opacity: titleOpacity }}
        className="text-6xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-widest"
      >
        Core Features
      </h1>
      
      <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
        <FeatureCard 
          delay={15} 
          icon="⚡" 
          title="React 19" 
          description="Server Components & Actions out of the box" 
        />
        <FeatureCard 
          delay={30} 
          icon="🏝️" 
          title="Islands Architecture" 
          description="Partial hydration for minimal JavaScript" 
        />
        <FeatureCard 
          delay={45} 
          icon="📁" 
          title="File-based Routing" 
          description="Intuitive app/ directory convention" 
        />
        <FeatureCard 
          delay={60} 
          icon="🔍" 
          title="SEO First" 
          description="Automatic meta tags, sitemaps, robots.txt" 
        />
      </div>
    </AbsoluteFill>
  );
};
