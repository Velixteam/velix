import { Composition } from "remotion";
import { VelixPresentation } from "./VelixPresentation";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VelixPresentation"
        component={VelixPresentation}
        durationInFrames={450} // 15 seconds at 30 fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
