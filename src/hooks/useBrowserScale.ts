import React from "react";

interface BrowserDimensions {
  width: number;
  height: number;
}

interface ScaleConfig {
  headerHeight?: number;
  mobilePadding?: number;
  desktopPadding?: number;
  browserDimensions?: BrowserDimensions;
}

const DEFAULT_CONFIG: Required<ScaleConfig> = {
  headerHeight: 60,
  mobilePadding: 16, // 8px each side
  desktopPadding: 40, // 20px each side
  browserDimensions: {
    width: 1200,
    height: 800,
  },
};

export function useBrowserScale(config: ScaleConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const updateScale = () => {
      const isMobile = window.innerWidth < 640;
      const padding = isMobile ? mergedConfig.mobilePadding : mergedConfig.desktopPadding;

      // Get available space
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - mergedConfig.headerHeight - padding;

      // Calculate scale based on which dimension is more constrained
      const scaleX = availableWidth / mergedConfig.browserDimensions.width;
      const scaleY = availableHeight / mergedConfig.browserDimensions.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 1

      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [
    mergedConfig.browserDimensions.width,
    mergedConfig.browserDimensions.height,
    mergedConfig.headerHeight,
    mergedConfig.mobilePadding,
    mergedConfig.desktopPadding,
  ]);

  const containerStyle = React.useMemo(
    () => ({
      width: `${Math.min(mergedConfig.browserDimensions.width * scale, mergedConfig.browserDimensions.width)}px`,
      height: `${Math.min(mergedConfig.browserDimensions.height * scale, mergedConfig.browserDimensions.height)}px`,
    }),
    [scale, mergedConfig.browserDimensions],
  );

  const browserStyle = React.useMemo(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      width: `${mergedConfig.browserDimensions.width}px`,
      height: `${mergedConfig.browserDimensions.height}px`,
      left: "50%",
      marginLeft: `${(-mergedConfig.browserDimensions.width * scale) / 2}px`,
    }),
    [scale, mergedConfig.browserDimensions],
  );

  return {
    scale,
    containerStyle,
    browserStyle,
    browserDimensions: mergedConfig.browserDimensions,
  };
}
