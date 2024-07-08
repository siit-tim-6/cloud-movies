import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./hls-player.css";

export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady, className } = props;

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log("player is ready");
        onReady && onReady(player);

        console.log("Start");

        player.one("loadedmetadata", () => {
          let qualities = player.tech({ IWillNotUseThisInPlugins: true })?.vhs?.representations();
          console.log("qualities", qualities);
          createButtonsQualities({
            class: "item",
            qualities: qualities,
            father: player.controlBar.el_,
          });

          player.play();

          // ---------------------------------------------- //

          function createAutoQualityButton(params) {
            let button = document.createElement("div");

            button.id = "auto";
            button.innerText = `Auto`;

            button.classList.add("selected");

            if (params && params.class) button.classList.add(params.class);

            button.addEventListener("click", () => {
              removeSelected(params);
              button.classList.add("selected");
              qualities.map((quality) => quality.enabled(true));
            });

            return button;
          }

          function createButtonsQualities(params) {
            let contentMenu = document.createElement("div");
            let menu = document.createElement("div");
            let icon = document.createElement("div");

            let fullscreen = params.father.querySelector(".vjs-fullscreen-control");
            contentMenu.appendChild(icon);
            contentMenu.appendChild(menu);
            fullscreen.before(contentMenu);

            menu.classList.add("menu");
            icon.classList.add("icon", "vjs-icon-cog");
            contentMenu.classList.add("contentMenu");

            let autoButton = createAutoQualityButton(params);

            menu.appendChild(autoButton);

            qualities.sort((a, b) => {
              return a.height > b.height ? 1 : 0;
            });

            qualities.map((quality) => {
              let button = document.createElement("div");

              if (params && params.class) button.classList.add(params.class);

              button.id = `${quality.height}`;
              button.innerText = quality.height + "p";

              button.addEventListener("click", () => {
                resetQuality(params);
                button.classList.add("selected");
                quality.enabled(true);
              });

              menu.appendChild(button);
            });

            setInterval(() => {
              let auto = document.querySelector("#auto");
              let current = player.tech({ IWillNotUseThisInPlugins: true })?.vhs?.playlists.media_.uri.split(".")[0];
              console.log(current);

              if (auto && current !== undefined)
                document.querySelector("#auto").innerHTML = auto.classList.contains("selected") ? `Auto <span class='current'>${current}</span>` : "Auto";
            }, 1000);
          }

          function removeSelected(params) {
            document.querySelector("#auto").classList.remove("selected");
            [...document.querySelectorAll(`.${params.class}`)].map((quality) => {
              quality.classList.remove("selected");
            });
          }

          function resetQuality(params) {
            removeSelected(params);

            for (let quality of params.qualities) {
              quality.enabled(false);
            }
          }
        });
      }));

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current;

      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
