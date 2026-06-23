import React, { useEffect, useRef } from 'react';
    // Image target component
    const PhotoAR = ({ id, imageUrl, soundUrl }) => {
      console.log("soundUrl", soundUrl);
      
      const sceneRef = useRef();

      useEffect(() => {
    const sceneEl = sceneRef?.current;
    const arSystem = sceneEl?.systems?.["mindar-image-system"];
    
    const entity = document.querySelector('a-entity[sound]');

    // Start AR system when scene starts rendering
    sceneEl.addEventListener('loaded', () => {
      arSystem?.start();
    });

    // Handle target detection events
    sceneEl.addEventListener('targetFound', () => {
      

      entity?.components.sound?.playSound();
    });

    sceneEl.addEventListener('targetLost', () => {
      entity?.components.sound?.pause();
    });

    return () => {
      arSystem.stop();
      entity?.components.sound.pause();
    }
  }, []);

      return (
        <a-entity
          ref={sceneRef}
          mindar-image-target={`targetIndex: ${0}`}
        >
          <a-plane
            position="0 0 0"
            height="0.5"
            width="0.5"
            material="color: blue; opacity: 0.5"
          />
          <a-sound
            src={`src: url(${soundUrl})`}
            autoplay="false"
            loop="true"
            position="0 0 0"
          />
        </a-entity>
      );
    };

    export default PhotoAR