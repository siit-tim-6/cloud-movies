import React, { useRef, useEffect } from "react";
import Hls from "hls.js";

export const VideoPlayer = ({ src, className = "", ...props }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const hls = new Hls({
      debug: true,
    });

    if (Hls.isSupported()) {
      hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        console.log("video and hls.js are now bound together !");
      });
      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        console.log("manifest loaded, found " + data.levels.length + " quality level");
      });
      hls.loadSource(src);
      // bind them together
      hls.attachMedia(videoRef.current);
    } else {
      console.log("HLS NOT SUPPORTED!");
    }
  }, []);

  return <video ref={videoRef} controls {...props} className={className} />;
};

export default VideoPlayer;
