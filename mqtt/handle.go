package mqtt

import (
	"context"
	"sync"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
)

type ConnectionHandle struct {
	Client pahomqtt.Client
	Store  *TopicStore
	dirty  *DirtySet
	ctx    context.Context
	cancel context.CancelFunc

	watchedMu    sync.Mutex
	watchedTopic string
	// trendWatched holds topics pinned to a trend chart, which need live
	// mqtt:message events regardless of which topic is selected in the tree.
	trendWatched map[string]struct{}
}

func (h *ConnectionHandle) IsActive() bool {
	select {
	case <-h.ctx.Done():
		return false
	default:
		return true
	}
}

func (h *ConnectionHandle) SetWatched(topic string) {
	h.watchedMu.Lock()
	h.watchedTopic = topic
	h.watchedMu.Unlock()
}

func (h *ConnectionHandle) GetWatched() string {
	h.watchedMu.Lock()
	defer h.watchedMu.Unlock()
	return h.watchedTopic
}

func (h *ConnectionHandle) AddTrendWatch(topic string) {
	h.watchedMu.Lock()
	if h.trendWatched == nil {
		h.trendWatched = make(map[string]struct{})
	}
	h.trendWatched[topic] = struct{}{}
	h.watchedMu.Unlock()
}

func (h *ConnectionHandle) RemoveTrendWatch(topic string) {
	h.watchedMu.Lock()
	delete(h.trendWatched, topic)
	h.watchedMu.Unlock()
}

func (h *ConnectionHandle) IsTrendWatched(topic string) bool {
	h.watchedMu.Lock()
	defer h.watchedMu.Unlock()
	_, ok := h.trendWatched[topic]
	return ok
}

func (h *ConnectionHandle) Stop() {
	h.cancel()
	if h.Client != nil {
		h.Client.Disconnect(500)
	}
}
