package main

import (
	"encoding/json"
	"flag"
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

var topicManager TopicManager

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func GetTopicList(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	topicList := topicManager. getTopicList()
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
	topic := topicManager.addTopic(&topicForm)
	w.Header().Add("Content-Type", "application/json")
	w.Write(topic.makeJson())
}

func GetTopic(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topicManager.getTopic(topic_id)
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
	_, ok := topicManager.getTopic(topic_id)
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}
	ok = topicManager.deleteTopic(topic_id)
	if !ok {
		http.Error(w, "Delete Topic failed", http.StatusBadRequest)
		return
	}
}

func PostVote(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	_, ok := topicManager.getTopic(topic_id)
	if err != nil || !ok {
		http.Error(w, "Topic Id is invalid", http.StatusBadRequest)
		return
	}
	vote_index, err := strconv.Atoi(mux.Vars(r)["vote_index"])
	if err != nil {
		http.Error(w, "Vote index is invalid", http.StatusBadRequest)
		return
	}
	votes := topicManager.vote(topic_id, vote_index)
	bytes, _ := json.Marshal(votes)
	w.Header().Add("Content-Type", "application/json")
	w.Write(bytes)
}

func serveWs(w http.ResponseWriter, r *http.Request) {
	_topic_id, err := strconv.Atoi(mux.Vars(r)["topic_id"])
	topic_id := uint64(_topic_id)
	topic, ok := topicManager.getTopic(topic_id)
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
	for range tick.C {
		if topic.Deleted {
			return
		}
		if err := conn.WriteJSON(topic.Votes); err != nil {
			// log.Println("Websocket Connection Closed.")
			return
		}
	}
}

func flushDataPeriodically() {
	tick := time.NewTicker(time.Second * 10)
	defer tick.Stop()

	for range tick.C {
		saveTopics(topicManager.topics)
	}
}

func router(router *mux.Router, port int) {
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
			"http://www.holenet.net:8111",
		},
		AllowCredentials: true,
		AllowedMethods: []string{"OPTIONS", "DELETE", "HEAD", "POST", "GET"},
	}).Handler(router)
	
	addr := fmt.Sprintf("0.0.0.0:%d", port)
	log.Printf("Server start. (%s)", addr)
	err := http.ListenAndServe(addr, handler)
	if err != nil {
		log.Fatalln("ListenAndServe: ", err)
	}
}

var port *int
var jsonpath *string
func init() {
	port = flag.Int("port", 8080, "Server port number")
	jsonpath = flag.String("jsonpath", "db.json", "DB JSON file path")
}

func main() {
	flag.Parse()
	dbFilePath = *jsonpath
	
	topicManager = TopicManager{
		loadTopics(),
	}
	go flushDataPeriodically()

	r := mux.NewRouter()
	router(r, *port)
}
