"use client";

import { useEffect } from "react";

const REACT_GRAB_SCRIPT_ID = "dashboard-react-grab-script";
const REACT_GRAB_SCRIPT_SRC = "https://unpkg.com/react-grab/dist/index.global.js";

export function DevReactGrabLoader() {
  useEffect(() => {
    if (document.getElementById(REACT_GRAB_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = REACT_GRAB_SCRIPT_ID;
    script.src = REACT_GRAB_SCRIPT_SRC;
    script.crossOrigin = "anonymous";

    document.head.appendChild(script);
  }, []);

  return null;
}
