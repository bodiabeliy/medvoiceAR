import React, { useEffect, useState } from "react";
import MindARViewer from "../../widgets/mindar-viewer";
import { categoryTopicsList } from "../../utils/db";

const Main = () => {
  const [started, setStarted] = useState(null);
  const [childrenItems, setChildrenItems] = useState([]);
  const [imageTemplate, setImageTemplate] = useState("");

  useEffect(() => {
    if (categoryTopicsList.length > 0) {
      const AR_children = [];
      let foundTemplate = "";

      categoryTopicsList.forEach((item) => {
        item.topicItems?.forEach((topicItem) => {
          if (topicItem.parentTopic === item.topicName) {
            AR_children.push(topicItem);
            foundTemplate = item.imageTemplate; // ✅ collect locally, set once
          }
        });
      });

      if (AR_children.length > 0) {
        setChildrenItems(AR_children);
        setImageTemplate(foundTemplate); // ✅ single set after loop
      }
    }
  }, []); // ✅ categoryTopicsList is a constant, no need in deps

  useEffect(() => {
    setStarted("aframe");
    return () => setStarted(null);
  }, []);

  // ✅ Guard: don't render MindAR until data AND template are ready
  const isReady = started === "aframe" && childrenItems.length > 0 && imageTemplate !== "";

  return (
    <>
      <div style={{ padding: "10px" }}>
        <b>Medvoice</b>
      </div>

      {!isReady && (
        <div style={{ padding: "10px", color: "gray" }}>
          Завантаження...
        </div>
      )}

      {isReady && (
        <MindARViewer
          children_AR_list={childrenItems}
          imageTargetTemplate={imageTemplate}
        />
      )}
    </>
  );
};

export default Main;