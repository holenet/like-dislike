package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.URL)
}

type Topic struct {
	Id uint64
	Content string
	Choices []string
	Votes []uint64
	Deleted bool
}
type TopicForm struct {
	Content string
	Choices []string
}

func (t Topic) isValidVoteIndex(index uint64) bool {
	return int(index) < len(t.Votes)
}
func (t *Topic) makeVotesJson() []byte {
	bytes, _ := json.Marshal(t.Votes)
	return bytes
}
func (t *Topic) makeJson() []byte {
	bytes, _ := json.Marshal(*t)
	return bytes
}
func (t *Topic) vote(index uint64) {
	t.Votes[index]++
}

var topics map[uint64]*Topic

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func GetTopicList(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	topicList := make([]Topic, 0)
	for topicId := range topics {
		if (!topics[topicId].Deleted) {
			topicList = append(topicList, *topics[topicId])
		}
	}
	bytes, _ := json.Marshal(topicList)
	w.Write(bytes)
}

func PostTopic(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Read body failed", http.StatusBadRequest)
	}
	var topicForm TopicForm
	err = json.Unmarshal(body, &topicForm)
	if err != nil {
		http.Error(w, "Topic Form is invalid", http.StatusBadRequest)
		return
	}
	nextId := uint64(0)
	for id := range topics {
		if nextId <= id {
			nextId = id + 1
		}
	}
	topic := Topic {
		nextId,
		topicForm.Content,
		topicForm.Choices,
		make([]uint64, len(topicForm.Choices)),
		false,
	}
	topics[topic.Id] = &topic
	w.Header().Add("Content-Type", "application/json")
	w.Write(topic.makeJson())
}

func GetTopic(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topics[topic_id]
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}	
	w.Header().Add("Content-Type", "application/json")
	w.Write(topic.makeJson())
}	

func DeleteTopic(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topics[topic_id]
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}	
	topic.Deleted = true
}

func PostVote(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topics[topic_id]
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}
	_vote_index, err := strconv.Atoi(mux.Vars(r)["vote_index"])
	vote_index := uint64(_vote_index)
	if err != nil || !topic.isValidVoteIndex(vote_index) {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}
	topic.vote(vote_index)
	w.Header().Add("Content-Type", "application/json")
	w.Write(topic.makeVotesJson())
}

func serveWs(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topics[topic_id]
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}
	
	conn, err := upgrader.Upgrade(w, r, nil)
	defer func() {
		conn.Close()
	}()
	if err != nil {
		log.Printf("Upgrade Error: %v\n", err)
		return
	}

	tick := time.NewTicker(time.Second)
	defer tick.Stop()
	
	conn.WriteJSON(topic.Votes)
	for {
		select {
		case <- tick.C:
			if topic.Deleted {
				return
			}
			if err := conn.WriteJSON(topic.Votes); err != nil {
				// log.Println("Websocket Connection Closed.")
				return
			}
		}
	}
}

func router(router *mux.Router) {
	router.HandleFunc("/", serveHome)
	router.HandleFunc("/ws/{topic_id}", func(w http.ResponseWriter, r *http.Request) {
		serveWs(w, r)
	})
	router.HandleFunc("/topic", GetTopicList).Methods(http.MethodGet)
	router.HandleFunc("/topic", PostTopic).Methods(http.MethodPost)
	router.HandleFunc("/topic/{topic_id}", GetTopic).Methods(http.MethodGet)
	router.HandleFunc("/topic/{topic_id}", DeleteTopic).Methods(http.MethodDelete)
	router.HandleFunc("/topic/{topic_id}/vote/{vote_index}", PostVote).Methods(http.MethodPost)
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
		},
		AllowCredentials: true,
		AllowedMethods: []string{"OPTIONS", "DELETE", "HEAD", "POST", "GET"},
	}).Handler(router)
	
	addr := "0.0.0.0:8080"
	fmt.Printf("Server start. (%s)", addr)
	err := http.ListenAndServe(addr, handler)
	if err != nil {
		log.Fatalln("ListenAndServe: ", err)
	}
}

func main() {
	topics = make(map[uint64]*Topic)
	topics[1] = &Topic {
		1,
		"A vs B",
		[]string{"A", "B"},
		make([]uint64, 2),
		false,
	}
	topics[2] = &Topic {
		2,
		"C vs D",
		[]string{"C", "D"},
		make([]uint64, 2),
		false,
	}

	r := mux.NewRouter()
	router(r)
}
