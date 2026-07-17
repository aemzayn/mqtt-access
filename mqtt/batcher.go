package mqtt

import (
	"context"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	batchTick          = 100 * time.Millisecond
	maxUpdatesPerBatch = 5000
)

type DirtySet struct {
	mu    sync.Mutex
	dirty map[string]struct{}
}

func NewDirtySet() *DirtySet {
	return &DirtySet{dirty: make(map[string]struct{})}
}

func (d *DirtySet) Mark(topic string) {
	d.mu.Lock()
	d.dirty[topic] = struct{}{}
	d.mu.Unlock()
}

func (d *DirtySet) Take(max int) []string {
	d.mu.Lock()
	defer d.mu.Unlock()
	if len(d.dirty) == 0 {
		return nil
	}
	if len(d.dirty) <= max {
		out := make([]string, 0, len(d.dirty))
		for topic := range d.dirty {
			out = append(out, topic)
		}
		d.dirty = make(map[string]struct{})
		return out
	}
	out := make([]string, 0, max)
	for topic := range d.dirty {
		if len(out) >= max {
			break
		}
		out = append(out, topic)
		delete(d.dirty, topic)
	}
	return out
}

func SpawnBatcher(ctx context.Context, wailsCtx context.Context, connID string, store *TopicStore, dirty *DirtySet) {
	ticker := time.NewTicker(batchTick)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				topics := dirty.Take(maxUpdatesPerBatch)
				if len(topics) == 0 {
					continue
				}
				updates := make([]TopicUpdate, 0, len(topics))
				for _, topic := range topics {
					u := store.MakeUpdate(topic)
					if u != nil {
						updates = append(updates, *u)
					}
				}
				totalMsgs, totalTopics := store.Totals()
				runtime.EventsEmit(wailsCtx, EventBatch, BatchEvent{
					ConnectionID:  connID,
					Updates:       updates,
					TotalMessages: totalMsgs,
					TotalTopics:   totalTopics,
				})
			}
		}
	}()
}
