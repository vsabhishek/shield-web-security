
import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-cyber-dark">
      <Loader2 className="h-12 w-12 text-cyber-blue animate-spin mb-4" />
      <div className="text-cyber-blue font-mono">Loading system...</div>
    </div>
  );
};

export default LoadingScreen;
