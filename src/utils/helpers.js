import { Children } from "react";

const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue
      );
      return result;
    }, {})
  };

  const getChildrenByGroup = (list) => {
    return Object.entries(groupBy(list, "itemName"));
  };

  const playAudioSound = (sceneElement) => {
    let audioDataSet = null;
    const soundEntities = sceneElement.querySelectorAll('[mindar-image-target][sound]');
      soundEntities.forEach((entity) => {
        entity.addEventListener('targetFound', () => {
          // console.log('🎯 Target found:', entity.components.sound.data.src);
          audioDataSet = new Audio(entity.components.sound.data.src);
          audioDataSet.play();

          // entity.components.sound?.playSound();
        });

        entity.addEventListener('targetLost', () => {
          // console.log('🔇 Target lost');
          audioDataSet.pause();
          audioDataSet = null;
          
        });
      });

  }

const displayScanningModel = (sceneElement) => {
  const modelEntities = sceneElement.querySelectorAll('[mindar-image-target]');
  console.log('Total entities found:', modelEntities.length);

  modelEntities.forEach((entity) => {

    entity.addEventListener('model-loaded', () => {
      const targetIndex = entity.components['mindar-image-target']?.data?.targetIndex;
      console.log('✅ model-loaded, targetIndex:', targetIndex);
      
      // ✅ Check the full visibility chain
      console.log('entity.object3D.visible:',            entity.object3D?.visible);
      console.log('gltf-model Group.visible:',           entity.components['gltf-model']?.model?.visible);
      console.log('gltf-model Group parent visible:',    entity.components['gltf-model']?.model?.parent?.visible);
    });

    entity.addEventListener('targetFound', () => {
      const targetIndex = entity.components['mindar-image-target']?.data?.targetIndex;
      console.log('🎯 targetFound — index:', targetIndex);

      // ✅ MindAR already sets entity.object3D.visible = true
      // ✅ We only need to force it on the model Group itself
      const modelGroup = entity.components['gltf-model']?.model;
      if (modelGroup) {
        modelGroup.visible = true;
        // Also force all children visible
        modelGroup.traverse((child) => { child.visible = true; });
      }

      // Play sound
      entity.components?.sound?.playSound();

      // ✅ Debug the full chain after MindAR sets visibility
      setTimeout(() => {
        console.log('After targetFound:');
        console.log('  entity.object3D.visible:',  entity.object3D?.visible);
        console.log('  modelGroup.visible:',        entity.components['gltf-model']?.model?.visible);
      }, 100);
    });

    entity.addEventListener('targetLost', () => {
      const targetIndex = entity.components['mindar-image-target']?.data?.targetIndex;
      console.log('🔇 targetLost — index:', targetIndex);

      // ✅ MindAR already sets entity.object3D.visible = false
      const modelGroup = entity.components['gltf-model']?.model;
      if (modelGroup) {
        modelGroup.visible = false;
        modelGroup.traverse((child) => { child.visible = false; });
      }

      entity.components?.sound?.stopSound();
    });
  });
};
  
export { getChildrenByGroup, playAudioSound, displayScanningModel };