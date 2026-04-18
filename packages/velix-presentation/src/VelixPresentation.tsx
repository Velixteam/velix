import { AbsoluteFill, Sequence } from "remotion";
import { Intro } from "./scenes/Intro";
import { Features } from "./scenes/Features";
import { Outro } from "./scenes/Outro";

export const VelixPresentation: React.FC = () => {
  return (
    <AbsoluteFill className="bg-slate-950 text-white overflow-hidden" style={{fontFamily: 'Inter, sans-serif'}}>
      <Sequence from={0} durationInFrames={90}>
        <Intro />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <Features />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
