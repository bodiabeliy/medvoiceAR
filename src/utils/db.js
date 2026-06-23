export const categoryTopicsList = [
  {
    isActive: true,
    image: `https://soundgame-server.onrender.com/birds/topicImage.png`,
    imageTemplate: `http://localhost:5000/test/targetImage.mind`,
    userExample: `https://soundgame-server.onrender.com/birds/birds_template.png`,
    topicName: "MedVoice",
    topicItems: [
      {
        parentTopic: "MedVoice",
        itemName: "MedVoice Video",
        targetIndex: 0,
        type: "video",                                        // ← new video item
        video: `http://localhost:5000/test/overlay.mp4`,
        greenScreen: true,                                    // ← removes green bg
      },
    ]
  }
];