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

      categoryTopicsList?.map((item) => {
        item.topicItems?.map((topicItem) => {
          if (topicItem.parentTopic === item.topicName) {
            AR_children.push(topicItem);
            setImageTemplate(item?.imageTemplate);

            return topicItem;
          }
          return AR_children;
        });
      });

      if (AR_children.length > 0) {
        setChildrenItems(AR_children);
      }
    }
  }, [categoryTopicsList]);

  useEffect(() => {
    setStarted("aframe");
    return () => {
      setStarted(null);
    };
  }, []);

  return (
    <>
      <div style={{ padding: "10px" }}>
        <b>Medvoice</b>
      </div>
      {started === "aframe" && (
        <MindARViewer
          children_AR_list={childrenItems}
          imageTargetTemplate={imageTemplate}
        />
      )}
    </>
  );
};
export default Main;
