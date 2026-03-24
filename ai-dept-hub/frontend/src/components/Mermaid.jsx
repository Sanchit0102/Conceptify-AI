import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
});

export default function Mermaid({ chart }) {
  const mermaidRef = useRef(null);

  useEffect(() => {
    if (mermaidRef.current && chart) {
      mermaidRef.current.removeAttribute("data-processed");
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div className="mermaid" ref={mermaidRef}>
      {chart}
    </div>
  );
}
