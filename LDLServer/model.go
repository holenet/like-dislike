package main

import "encoding/json"

type Topic struct {
	Id      uint64
	Content string
	Choices []string
	Votes   []uint64
	Deleted bool
}

func (t Topic) isValidVoteIndex(index int) bool {
	return index < len(t.Votes)
}
func (t *Topic) makeJson() []byte {
	bytes, _ := json.Marshal(*t)
	return bytes
}
func (t *Topic) vote(index int) {
	t.Votes[index]++
}

type TopicForm struct {
	Content string
	Choices []string
}

type TopicManager struct {
	topics map[uint64]*Topic
}
func (m *TopicManager) getTopicList() []Topic {
	topicList := make([]Topic, 0)
	for topicId := range m.topics {
		if (!m.topics[topicId].Deleted) {
			topicList = append(topicList, *m.topics[topicId])
		}
	}
	return topicList
}
func (m *TopicManager) getTopic(topicId uint64) (*Topic, bool) {
	topic, ok := m.topics[topicId]
	return topic, ok
}
func (m *TopicManager) addTopic(topicForm *TopicForm) Topic {
	nextId := uint64(0)
	for id := range m.topics {
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
	m.topics[topic.Id] = &topic
	return topic
}
func (m *TopicManager) deleteTopic(topicId uint64) bool {
	topic, ok := m.topics[topicId]
	if !ok {
		return false
	}
	topic.Deleted = true
	return true
}
func (m *TopicManager) vote(topicId uint64, voteIndex int) []uint64 {
	topic, ok := m.topics[topicId]
	if !ok {
		return make([]uint64, 0)
	}
	if !topic.isValidVoteIndex(voteIndex) {
		return make([]uint64, 0)
	}
	topic.vote(voteIndex)
	return topic.Votes
}
