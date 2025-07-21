import React, { useState } from "react";
import { Laptop, Minus, X, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    electronAPI: {
      closeWindow: () => void;
      toggleFullscreen: () => void;
      showWindow: () => void;
      minimizeToTray: () => void;
    };
  }
}

const iconClass = "w-6 h-6 cursor-pointer hover:text-pink-500 transition-colors";

const WindowControls: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const handleToggleFullscreen = () => {
    window.electronAPI.toggleFullscreen();
  };

  const handleMinimizeToTray = () => {
    window.electronAPI.minimizeToTray();
  };

  const handleCloseWindow = () => {
    window.electronAPI.closeWindow();
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Optional: if you want a "show window" button later:
  // const handleShowWindow = () => {
  //   window.electronAPI.showWindow();
  // };

  // The hover area is a transparent div at the top right
  // When hovered, it shows the controls with a slide-in animation
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1000 }}>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 48, cursor: 'pointer' }}
      />
      <div
        className={`flex space-x-4 bg-background/70 p-2 rounded-md shadow-lg transition-transform duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <button onClick={handleMinimizeToTray} aria-label="Minimize to Tray">
          <Minus className={iconClass} />
        </button>
        <button onClick={handleToggleFullscreen} aria-label="Toggle Fullscreen">
          <Laptop className={iconClass} />
        </button>
        <button onClick={handleReload} aria-label="Reload Page">
          <RefreshCw className={iconClass} />
        </button>
        <button onClick={handleCloseWindow} aria-label="Close Window">
          <X className={iconClass} />
        </button>
        {/* Uncomment if you want a show window icon */}
        {/* <Maximize
          className={iconClass}
          title="Show Window"
          onClick={handleShowWindow}
        /> */}
      </div>
    </div>
  );
};

export default WindowControls;
