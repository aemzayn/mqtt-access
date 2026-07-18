package mqtt

import (
	"encoding/base64"
	"fmt"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

const (
	previewMaxChars  = 160
	maxStoredPayload = 512 * 1024
)

type topicNode struct {
	children map[string]*topicNode
	latest   *MessageRecord
	msgCount uint64
	history  []*MessageRecord
}

type TopicStore struct {
	mu          sync.RWMutex
	root        topicNode
	seq         uint64
	totalMsgs   uint64
	totalTopics uint32
	histLimit   int
}

func NewTopicStore(histLimit int) *TopicStore {
	if histLimit < 1 {
		histLimit = 1
	}
	return &TopicStore{
		root:      topicNode{children: make(map[string]*topicNode)},
		histLimit: histLimit,
	}
}

// SetHistoryLimit applies a (possibly changed) per-topic history limit when a
// store is reused across reconnects.
func (s *TopicStore) SetHistoryLimit(histLimit int) {
	if histLimit < 1 {
		histLimit = 1
	}
	s.mu.Lock()
	s.histLimit = histLimit
	s.mu.Unlock()
}

func (s *TopicStore) Totals() (uint64, uint32) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.totalMsgs, s.totalTopics
}

func (s *TopicStore) Ingest(topic string, payload []byte, qos uint8, retain bool) *MessageRecord {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.seq++
	s.totalMsgs++

	if len(payload) > maxStoredPayload {
		payload = payload[:maxStoredPayload]
	}

	b64 := base64.StdEncoding.EncodeToString(payload)
	var payloadUtf8 *string
	if utf8.Valid(payload) {
		str := string(payload)
		payloadUtf8 = &str
	}

	record := &MessageRecord{
		Seq:         s.seq,
		TsMs:        time.Now().UnixMilli(),
		PayloadB64:  b64,
		PayloadUtf8: payloadUtf8,
		QoS:         qos,
		Retain:      retain,
	}

	node := s.nodeOrCreate(topic)
	isNew := node.latest == nil
	node.latest = record
	node.msgCount++
	node.history = append(node.history, record)
	if len(node.history) > s.histLimit {
		node.history = node.history[1:]
	}
	if isNew {
		s.totalTopics++
	}

	return record
}

func (s *TopicStore) MakeUpdate(topic string) *TopicUpdate {
	s.mu.RLock()
	defer s.mu.RUnlock()
	node := s.node(topic)
	if node == nil || node.latest == nil {
		return nil
	}
	return makeUpdate(topic, node)
}

func (s *TopicStore) Snapshot() []TopicUpdate {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]TopicUpdate, 0, s.totalTopics)
	type entry struct {
		node *topicNode
		path string
	}
	stack := []entry{{&s.root, ""}}
	for len(stack) > 0 {
		e := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if e.node.latest != nil {
			out = append(out, *makeUpdate(e.path, e.node))
		}
		for seg, child := range e.node.children {
			var childPath string
			if e.path == "" {
				childPath = seg
			} else {
				childPath = e.path + "/" + seg
			}
			stack = append(stack, entry{child, childPath})
		}
	}
	return out
}

func (s *TopicStore) Details(topic string) *TopicDetails {
	s.mu.RLock()
	defer s.mu.RUnlock()
	node := s.node(topic)
	if node == nil {
		return nil
	}
	return &TopicDetails{
		Topic:      topic,
		Latest:     node.latest,
		MsgCount:   node.msgCount,
		HistoryLen: uint32(len(node.history)),
	}
}

// History returns messages newest-first, optionally paged by beforeSeq.
func (s *TopicStore) History(topic string, limit int, beforeSeq *uint64) []*MessageRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	node := s.node(topic)
	if node == nil {
		return nil
	}

	out := make([]*MessageRecord, 0, limit)
	for i := len(node.history) - 1; i >= 0 && len(out) < limit; i-- {
		r := node.history[i]
		if beforeSeq != nil && r.Seq >= *beforeSeq {
			continue
		}
		out = append(out, r)
	}
	return out
}

func (s *TopicStore) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.root = topicNode{children: make(map[string]*topicNode)}
	s.seq = 0
	s.totalMsgs = 0
	s.totalTopics = 0
}

func (s *TopicStore) node(topic string) *topicNode {
	n := &s.root
	for _, seg := range strings.Split(topic, "/") {
		child, ok := n.children[seg]
		if !ok {
			return nil
		}
		n = child
	}
	return n
}

func (s *TopicStore) nodeOrCreate(topic string) *topicNode {
	n := &s.root
	for _, seg := range strings.Split(topic, "/") {
		child, ok := n.children[seg]
		if !ok {
			if n.children == nil {
				n.children = make(map[string]*topicNode)
			}
			child = &topicNode{children: make(map[string]*topicNode)}
			n.children[seg] = child
		}
		n = child
	}
	return n
}

func makeUpdate(topic string, node *topicNode) *TopicUpdate {
	latest := node.latest
	return &TopicUpdate{
		Topic:    topic,
		Preview:  previewOf(latest),
		MsgCount: node.msgCount,
		LastTsMs: latest.TsMs,
		Retain:   latest.Retain,
		Numeric:  numericOf(latest),
	}
}

func previewOf(r *MessageRecord) string {
	if r.PayloadUtf8 == nil {
		return fmt.Sprintf("(binary, %d bytes)", len(r.PayloadB64)*3/4)
	}
	text := *r.PayloadUtf8
	runes := []rune(text)
	if len(runes) <= previewMaxChars {
		return text
	}
	return string(runes[:previewMaxChars]) + "…"
}

func numericOf(r *MessageRecord) *float64 {
	if r.PayloadUtf8 == nil {
		return nil
	}
	v, err := strconv.ParseFloat(strings.TrimSpace(*r.PayloadUtf8), 64)
	if err != nil || math.IsInf(v, 0) || math.IsNaN(v) {
		return nil
	}
	return &v
}
