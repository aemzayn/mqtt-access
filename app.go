package main

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	mqttpkg "mqtt-access/mqtt"
	"mqtt-access/storage"
)

// StoredLayout mirrors the frontend's PersistedLayout type.
type StoredLayout struct {
	Dockview   interface{} `json:"dockview"`
	Minimized  []string    `json:"minimized"`
	OpenPanels []string    `json:"openPanels"`
}

// AppSettings mirrors the frontend's AppSettings type.
type AppSettings struct {
	Theme    string `json:"theme"`
	FontSize string `json:"fontSize"`
	Blink    bool   `json:"blink"`
	Language string `json:"language"`
}

type App struct {
	ctx   context.Context
	state *AppState
}

func NewApp() *App {
	return &App{state: NewAppState()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ── MQTT commands ─────────────────────────────────────────────────────────────

func (a *App) Connect(config mqttpkg.ConnectionConfig) error {
	if config.ID == "" {
		return fmt.Errorf("connection id must not be empty")
	}
	if config.Host == "" {
		return fmt.Errorf("host must not be empty")
	}

	// Reuse the previous store (if any) so reconnecting keeps the topic tree;
	// ClearConnectionData is the explicit way to wipe it.
	a.state.mu.Lock()
	var prevStore *mqttpkg.TopicStore
	if prev, ok := a.state.connections[config.ID]; ok {
		prev.Stop()
		prevStore = prev.Store
		delete(a.state.connections, config.ID)
	}
	a.state.mu.Unlock()

	handle, err := mqttpkg.NewConnection(a.ctx, config, prevStore)
	if err != nil {
		return err
	}

	a.state.mu.Lock()
	a.state.connections[config.ID] = handle
	a.state.mu.Unlock()
	return nil
}

// TestConnection dials the broker with the given config and reports success
// or failure. It never registers a live handle, so it can't collide with an
// existing connection (even one being edited) and never touches saved data.
func (a *App) TestConnection(config mqttpkg.ConnectionConfig) error {
	if config.Host == "" {
		return fmt.Errorf("host must not be empty")
	}
	return mqttpkg.TestConnection(config)
}

func (a *App) Disconnect(connectionID string) error {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return err
	}
	handle.Stop()
	// Paho fires no callback on a clean disconnect, so report it ourselves —
	// otherwise the frontend keeps showing the connection as active.
	runtime.EventsEmit(a.ctx, mqttpkg.EventStatus, mqttpkg.StatusEvent{
		ConnectionID: connectionID,
		Status:       mqttpkg.StatusDisconnected,
	})
	return nil
}

func (a *App) Publish(connectionID, topic, payloadB64 string, qos uint8, retain bool) error {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return err
	}
	if !handle.IsActive() {
		return fmt.Errorf("not connected: %s", connectionID)
	}
	payload, err := base64.StdEncoding.DecodeString(payloadB64)
	if err != nil {
		return fmt.Errorf("invalid base64 payload: %w", err)
	}
	token := handle.Client.Publish(topic, qos, retain, payload)
	token.Wait()
	return token.Error()
}

func (a *App) GetTreeSnapshot(connectionID string) ([]mqttpkg.TopicUpdate, error) {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return nil, err
	}
	return handle.Store.Snapshot(), nil
}

func (a *App) GetTopicDetails(connectionID, topic string) (*mqttpkg.TopicDetails, error) {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return nil, err
	}
	d := handle.Store.Details(topic)
	if d == nil {
		return nil, fmt.Errorf("topic not found: %s", topic)
	}
	return d, nil
}

func (a *App) GetTopicHistory(connectionID, topic string, limit int, beforeSeq *uint64) ([]*mqttpkg.MessageRecord, error) {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return nil, err
	}
	if limit < 1 {
		limit = 1
	}
	if limit > 5000 {
		limit = 5000
	}
	return handle.Store.History(topic, limit, beforeSeq), nil
}

func (a *App) WatchTopic(connectionID, topic string) error {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return err
	}
	handle.SetWatched(topic)
	return nil
}

func (a *App) UnwatchTopic(connectionID string) error {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return err
	}
	handle.SetWatched("")
	return nil
}

func (a *App) ClearConnectionData(connectionID string) error {
	handle, err := a.getHandle(connectionID)
	if err != nil {
		return err
	}
	handle.Store.Clear()
	return nil
}

// ── Persistence ───────────────────────────────────────────────────────────────

func (a *App) LoadConnections() ([]mqttpkg.ConnectionConfig, error) {
	var configs []mqttpkg.ConnectionConfig
	if err := storage.Load("connections.json", &configs); err != nil {
		return nil, err
	}
	if configs == nil {
		configs = []mqttpkg.ConnectionConfig{}
	}
	return configs, nil
}

func (a *App) SaveConnections(configs []mqttpkg.ConnectionConfig) error {
	return storage.Save("connections.json", configs)
}

func (a *App) LoadLayout() (*StoredLayout, error) {
	var layout StoredLayout
	if err := storage.Load("layout.json", &layout); err != nil {
		return nil, err
	}
	return &layout, nil
}

func (a *App) SaveLayout(data StoredLayout) error {
	return storage.Save("layout.json", data)
}

func (a *App) LoadSettings() (*AppSettings, error) {
	settings := AppSettings{Theme: "dark", FontSize: "normal", Blink: true, Language: "en"}
	if err := storage.Load("settings.json", &settings); err != nil {
		return nil, err
	}
	return &settings, nil
}

func (a *App) SaveSettings(settings AppSettings) error {
	return storage.Save("settings.json", settings)
}

// ── System dialogs ────────────────────────────────────────────────────────────

func (a *App) OpenFilePicker() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select file",
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

func (a *App) getHandle(connectionID string) (*mqttpkg.ConnectionHandle, error) {
	a.state.mu.Lock()
	handle, ok := a.state.connections[connectionID]
	a.state.mu.Unlock()
	if !ok {
		return nil, fmt.Errorf("connection not found: %s", connectionID)
	}
	return handle, nil
}
