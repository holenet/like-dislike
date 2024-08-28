package main

import (
	"encoding/json"
	"io"
	"log"
	"os"
)

var dbFilePath string = "db.json"

func loadTopics() map[uint64]*Topic {
	file, err := os.Open(dbFilePath)
	if err != nil {
		log.Fatalf("Invalid DB File Path: %s\n", dbFilePath)
	}
	defer file.Close()

	bytes, _ := io.ReadAll(file)
	var topics []Topic
	err = json.Unmarshal(bytes, &topics)
	if err != nil {
		log.Fatalf("DB Decoding Failed.")
	}

	topicMap := make(map[uint64]*Topic, 0)
	for _, topic := range topics {
		topicMap[topic.Id] = &topic
	}
	log.Println("Topics Loaded.")

	return topicMap
}

func saveTopics(topics map[uint64]*Topic) {
	file, err := os.Create(dbFilePath)
	if err != nil {
		log.Printf("Invalid DB File Path: %s\n", dbFilePath)
		return
	}
	defer file.Close()

	topicList := make([]Topic, 0)
	for _, topic := range topics {
		topicList = append(topicList, *topic)
	}

	bytes, err := json.Marshal(topicList)
	if err != nil {
		log.Printf("DB Encoding Failed. %v", err)
		return
	}

	_, err = file.Write(bytes)
	if err != nil {
		log.Printf("DB Write Failed. %v\n", err)
		return
	}

	log.Println("Topics Saved.")
}
