package main

import (
	"sync"

	mqttpkg "mqtt-access/mqtt"
)

type AppState struct {
	mu          sync.Mutex
	connections map[string]*mqttpkg.ConnectionHandle
}

func NewAppState() *AppState {
	return &AppState{
		connections: make(map[string]*mqttpkg.ConnectionHandle),
	}
}
