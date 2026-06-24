import React, { useEffect, useRef, useState } from "react";
import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

// ─── iOS detection (stable, runs once) ────────────────────────────────────────
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const MindARViewer = ({ children_AR_list, imageTargetTemplate }) => {
  const sceneRef  = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Main AR effect — runs on mount ─────────────────────────────────────────
  useEffect(() => {
    const sceneEl = sceneRef.current;

    // ── Register chromakey shader (once) ────────────────────────────────────
    if (window.AFRAME && !window.AFRAME.shaders.chromakey) {
      window.AFRAME.registerShader("chromakey", {
        schema: {
          src:       { type: "map",   is: "uniform" },
          color:     { default: { x: 0, y: 1, z: 0 }, type: "vec3", is: "uniform" },
          threshold: { default: 0.4,  type: "float",  is: "uniform" },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D src;
          uniform vec3 color;
          uniform float threshold;
          varying vec2 vUv;

          void main() {
            vec4 texColor = texture2D(src, vUv);
            float r = texColor.r;
            float g = texColor.g;
            float b = texColor.b;

            float luminance    = 0.299 * r + 0.587 * g + 0.114 * b;
            float maxC         = max(r, max(g, b));
            float minC         = min(r, min(g, b));
            float saturation   = (maxC < 0.001) ? 0.0 : (maxC - minC) / maxC;
            float purpleStrength = (r + b) * 0.5 - g * 2.0;

            bool isBackground = (luminance < 0.18) && (saturation < 0.55) && (purpleStrength < 0.15);
            if (isBackground) discard;

            float edgeFade = smoothstep(0.10, 0.25, luminance) * smoothstep(0.40, 0.60, saturation);
            float alpha    = max(edgeFade, smoothstep(0.10, 0.20, purpleStrength));
            if (alpha < 0.08) discard;

            gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
          }
        `,
      });
    }

    // ── MindAR config ────────────────────────────────────────────────────────
    sceneEl.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${imageTargetTemplate}; autoStart: false; maxTrack: ${children_AR_list.length}`
    );

    // ── Assets ───────────────────────────────────────────────────────────────
    const assetsEl = document.createElement("a-assets");
    assetsEl.setAttribute("timeout", "30000");

    children_AR_list.forEach((item) => {
      if (item.type === "video") {
        const video = document.createElement("video");
        video.setAttribute("id",          `vid-${item.itemName}`);
        video.setAttribute("src",         item.video);
        video.setAttribute("preload",     "auto");
        video.setAttribute("crossorigin", "anonymous");
        video.setAttribute("loop",        "true");
        video.setAttribute("playsinline", "true"); // required on iOS
        video.setAttribute("autoplay",    "true");
        video.muted = true;
        assetsEl.appendChild(video);
      } else {
        const audio = document.createElement("audio");
        audio.setAttribute("id",          item.itemName);
        audio.setAttribute("src",         item.audio);
        audio.setAttribute("preload",     "auto");
        audio.setAttribute("crossorigin", "anonymous");
        assetsEl.appendChild(audio);
      }
    });

    sceneEl.appendChild(assetsEl);

    // ── Camera — deferred on iOS to avoid "h.fov = a" crash ─────────────────
    const cameraEl = document.createElement("a-camera");
    cameraEl.setAttribute("position",      "0 0 0");
    cameraEl.setAttribute("look-controls", "enabled: false");

    if (isIOS) {
      sceneEl.addEventListener(
        "renderstart",
        () => sceneEl.appendChild(cameraEl),
        { once: true }
      );
    } else {
      sceneEl.appendChild(cameraEl);
    }

    // ── Entities ─────────────────────────────────────────────────────────────
    children_AR_list.forEach((item) => {
      const anchor = document.createElement("a-entity");
      anchor.setAttribute("mindar-image-target", `targetIndex: ${item.targetIndex}`);

      if (item.type === "video") {
        const videoEl = document.createElement("a-video");
        videoEl.setAttribute("src",      `#vid-${item.itemName}`);
        videoEl.setAttribute("position", "0 0 0");
        videoEl.setAttribute("width",    "1.0");
        videoEl.setAttribute("height",   "1.8");
        videoEl.setAttribute("rotation", "0 0 0");

        if (item.greenScreen) {
          videoEl.setAttribute(
            "material",
            `shader: chromakey; src: #vid-${item.itemName}; color: 0 0 0; threshold: 0.3`
          );
        }

        anchor.appendChild(videoEl);

        anchor.addEventListener("targetFound", () => {
          const vid = document.querySelector(`#vid-${item.itemName}`);
          if (vid) vid.play().catch((err) => console.warn("Video play failed:", err));
        });

        anchor.addEventListener("targetLost", () => {
          const vid = document.querySelector(`#vid-${item.itemName}`);
          if (vid) { vid.pause(); vid.currentTime = 0; }
        });

      } else {
        const modelEntity = document.createElement("a-entity");
        modelEntity.setAttribute("gltf-model",      item.model);
        modelEntity.setAttribute("position",        "0 -1 0");
        modelEntity.setAttribute("scale",           "1.5 1.5 1.5");
        modelEntity.setAttribute("rotation",        "0 0 0");
        modelEntity.setAttribute("animation-mixer", "");
        anchor.appendChild(modelEntity);

        let audio = null;
        anchor.addEventListener("targetFound", () => {
          if (!audio) { audio = new Audio(item.audio); audio.crossOrigin = "anonymous"; }
          audio.currentTime = 0;
          audio.play().catch((err) => console.warn("Audio play failed:", err));
        });
        anchor.addEventListener("targetLost", () => {
          if (audio) { audio.pause(); audio.currentTime = 0; }
        });

        modelEntity.addEventListener("model-loaded", () =>
          console.log("✅ model-loaded:", item.itemName)
        );
        modelEntity.addEventListener("model-error", (e) =>
          console.error("❌ model-error:", item.itemName, e)
        );
      }

      sceneEl.appendChild(anchor);
    });

    // ── Scene loaded handler ──────────────────────────────────────────────────
    const handleLoaded = () => {
      // ✅ iOS Safari: retry until renderer is actually ready
      const init = () => {
        const renderer = sceneEl.renderer;
        if (!renderer) {
          setTimeout(init, 100);
          return;
        }

        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);

        const canvas = sceneEl.querySelector("canvas");
        if (canvas) {
          canvas.style.background      = "transparent";
          canvas.style.backgroundColor = "transparent";
        }

        const fixCameraVideo = () => {
          document.querySelectorAll("video[autoplay]").forEach((vid) => {
            if (vid.srcObject) {
              vid.style.position  = "fixed";
              vid.style.top       = "0";
              vid.style.left      = "0";
              vid.style.width     = "100vw";
              vid.style.height    = "100vh";
              vid.style.objectFit = "cover";
              vid.style.zIndex    = "-1";
            }
          });
        };

        const fixOverlays = () => {
          document.querySelectorAll(".mindar-ui-overlay").forEach((el) => {
            el.style.position = "fixed";
            el.style.top      = "0";
            el.style.left     = "0";
            el.style.width    = "100vw";
            el.style.height   = "100vh";
            el.style.zIndex   = "10000";
          });
        };

        fixOverlays();
        fixCameraVideo();

        setTimeout(() => {
          const arSystem = sceneEl.systems?.["mindar-image-system"];
          if (arSystem) {
            try {
              arSystem.start();
            } catch (err) {
              console.warn("MindAR start error:", err);
            }
          }

          fixOverlays();
          fixCameraVideo();

          // Wait for real camera feed before revealing scene
          const safetyTimeout = setTimeout(() => setIsLoaded(true), 5000);

          const waitForCamera = () => {
            const camVid = [...document.querySelectorAll("video")].find(
              (v) => v.srcObject && v.readyState >= 2
            );
            if (camVid) {
              clearTimeout(safetyTimeout);
              fixCameraVideo();
              setIsLoaded(true);
            } else {
              setTimeout(waitForCamera, 150);
            }
          };
          waitForCamera();
        }, isIOS ? 500 : 200); // ✅ iOS needs more time

        setTimeout(fixCameraVideo, 1500);
      };

      init();
    };

    if (sceneEl.hasLoaded) {
      handleLoaded();
    } else {
      sceneEl.addEventListener("loaded", handleLoaded);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      sceneEl.removeEventListener("loaded", handleLoaded);

      const arSystem = sceneEl.systems?.["mindar-image-system"];
      if (arSystem) {
        try { arSystem.stop(); } catch (_) {}
      }

      document.querySelectorAll(".mindar-ui-overlay").forEach((el) => el.remove());

      document.querySelectorAll("video").forEach((video) => {
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach((track) => track.stop());
      });
    };
  }, []); // ✅ runs once on mount

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Preloader — shown until camera is live ──────────────────────────── */}
      {!isLoaded && (
        <div style={{
          position:       "fixed",
          top:            0,
          left:           0,
          width:          "100vw",
          height:         "100vh",
          zIndex:         99999,
          background:     "#0a0a1a",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "20px",
        }}>
          <div style={{
            width:        "60px",
            height:       "60px",
            border:       "3px solid rgba(160, 100, 255, 0.2)",
            borderTop:    "3px solid #a064ff",
            borderRadius: "50%",
            animation:    "spin 1s linear infinite",
          }} />
          <p style={{
            color:         "#a064ff",
            fontSize:      "14px",
            fontFamily:    "sans-serif",
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin:        0,
          }}>
            Завантаження...
          </p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* ── AR scene — hidden until camera is ready ─────────────────────────── */}
      <div style={{
          position:      "fixed",
          top:           0,
          left:          0,
          width:         "100vw",
          height:        "100vh",
          zIndex:        9999,
          background:    "transparent",
          opacity:       isLoaded ? 1 : 0,
          pointerEvents: isLoaded ? "auto" : "none",
          transition:    "opacity 0.5s ease",
        }}>
          <a-scene
            ref={sceneRef}
            color-space="sRGB"
            embedded
            renderer="colorManagement: true, physicallyCorrectLights; alpha: true"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            style={{
              width:      "100%",
              height:     "100%",
              background: "transparent",
            }}
          />
        </div>
    </>
  );
};

export default MindARViewer;
