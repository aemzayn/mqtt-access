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

func (h *ConnectionHandle) Stop() {
	h.cancel()
	if h.Client != nil {
		h.Client.Disconnect(500)
	}
}
