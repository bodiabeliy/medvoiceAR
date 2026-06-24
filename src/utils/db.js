export const categoryTopicsList = [
  {
    isActive: true,
    image: ``,
    imageTemplate: `https://medvoicear-server.onrender.com/banner/targetImage.mind`,
    userExample: ``,
    topicName: "MedVoice",
    topicItems: [
      {
        parentTopic: "MedVoice",
        itemName: "MedVoice Video",
        targetIndex: 0,
        type: "video",                                        // ← new video item
        video: `https://medvoicear-server.onrender.com/banner/bannerVideo.mp4`,
        greenScreen: true,                                    // ← removes green bg
      },
    ]
  }
];