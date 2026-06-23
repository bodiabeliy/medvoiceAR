import React, { useEffect, useRef } from 'react';
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';

const MindARViewer = ({ children_AR_list, imageTargetTemplate }) => {
  const sceneRef = useRef(null);

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    sceneEl.setAttribute('mindar-image',
      `imageTargetSrc: ${imageTargetTemplate}; autoStart: false; maxTrack: ${children_AR_list.length}`
    );

    // Assets
    const assetsEl = document.createElement('a-assets');
    assetsEl.setAttribute('timeout', '30000');
    children_AR_list.forEach((item) => {
      const audio = document.createElement('audio');
      audio.setAttribute('id',          item.itemName);
      audio.setAttribute('src',         item.audio);
      audio.setAttribute('preload',     'auto');
      audio.setAttribute('crossorigin', 'anonymous');
      assetsEl.appendChild(audio);
    });
    sceneEl.appendChild(assetsEl);

    // Camera
    const cameraEl = document.createElement('a-camera');
    cameraEl.setAttribute('position',      '0 0 0');
    cameraEl.setAttribute('look-controls', 'enabled: false');
    sceneEl.appendChild(cameraEl);

    // Entities
    children_AR_list.forEach((item) => {
      // ✅ Parent entity — MindAR controls this transform, don't set position here
      const anchor = document.createElement('a-entity');
      anchor.setAttribute('mindar-image-target', `targetIndex: ${item.targetIndex}`);

      // ✅ Child entity — position THIS relative to the tracked target
      const modelEntity = document.createElement('a-entity');
      modelEntity.setAttribute('gltf-model',      item.model);
      modelEntity.setAttribute('position',        '0 -1 0');   // adjust this
      modelEntity.setAttribute('scale',           '1.5 1.5 1.5');
      modelEntity.setAttribute('rotation',        '0 0 0');
      modelEntity.setAttribute('animation-mixer', '');

      // ✅ Append model as child of anchor
      anchor.appendChild(modelEntity);

      let audio = null;

      anchor.addEventListener('targetFound', () => {
        if (!audio) {
          audio = new Audio(item.audio);
          audio.crossOrigin = 'anonymous';
        }
        audio.currentTime = 0;
        audio.play().catch(err => console.warn('Audio play failed:', err));
      });

      anchor.addEventListener('targetLost', () => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      modelEntity.addEventListener('model-loaded', () => {
        console.log('✅ model-loaded:', item.itemName);
      });

      modelEntity.addEventListener('model-error', (e) => {
        console.error('❌ model-error:', item.itemName, e);
      });

      sceneEl.appendChild(anchor);
    });

    const handleLoaded = () => {
      const renderer = sceneEl.renderer;
      if (renderer) {
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
      }

      const canvas = sceneEl.querySelector('canvas');
      if (canvas) canvas.style.background = 'transparent';

      // ✅ Fix MindAR overlays to fill screen
      const fixOverlays = () => {
        document.querySelectorAll('.mindar-ui-overlay').forEach(el => {
          el.style.position = 'fixed';
          el.style.top      = '0';
          el.style.left     = '0';
          el.style.width    = '100vw';
          el.style.height   = '100vh';
          el.style.zIndex   = '10000';
        });
      };
      fixOverlays();
      setTimeout(fixOverlays, 500);

      const arSystem = sceneEl.systems?.['mindar-image-system'];
      if (arSystem) arSystem.start();
    };

    if (sceneEl.hasLoaded) {
      handleLoaded();
    } else {
      sceneEl.addEventListener('loaded', handleLoaded);
    }

    return () => {
      sceneEl.removeEventListener('loaded', handleLoaded);

      const arSystem = sceneEl.systems?.['mindar-image-system'];
      if (arSystem) arSystem.stop();

      // ✅ Remove MindAR DOM injections
      document.querySelectorAll('.mindar-ui-overlay').forEach(el => el.remove());
      document.querySelectorAll('video[autoplay]').forEach(el => el.remove());

      // ✅ Release camera
      document.querySelectorAll('video').forEach(video => {
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach(track => track.stop());
      });
    };
  }, []);

  return (
    <div style={{
      position:   'fixed',
      top:        0,
      left:       0,
      width:      '100vw',
      height:     '33vh',
      zIndex:     9999,
      // overflow:   'hidden',
      background: 'transparent',
    }}>
      <a-scene
        ref={sceneRef}
        color-space="sRGB"
        embedded
        renderer="colorManagement: true, physicallyCorrectLights; alpha: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        style={{
          width:      '100%',
          height:     '100%',
          paddingTop:"200px",
          background: 'transparent',
        }}
      />
    </div>
  );
};

export default MindARViewer;