
export const categoryTopicsList =[
     {
        isActive: true,
        image:`https://soundgame-server.onrender.com/birds/topicImage.png`,
        imageTemplate:`http://localhost:5000/test/targetImage.mind`,
        userExample:`https://soundgame-server.onrender.com/birds/birds_template.png`,
        topicName:"MedVoice",
        topicItems:[
            {
                parentTopic: "MedVoice",
                itemName: "MedVoice AR",
                targetIndex: 0,
                audio: `http://localhost:5000/birds/sparrow/sparrow.mp3`,
                model:""
            },
           
        ]
    }
]