package mqtt

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"math/rand"
	"os"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const connectTimeout = 10 * time.Second

// buildClientOptions builds the paho options shared by real connections and
// connection tests: broker URL, auth, TLS, keepalive. No retry loop on the
// initial connect — callers get a fast success/failure instead of a hang.
func buildClientOptions(config ConnectionConfig) (*pahomqtt.ClientOptions, error) {
	tlsCfg, err := buildTLSConfig(config)
	if err != nil {
		return nil, fmt.Errorf("TLS config: %w", err)
	}

	opts := pahomqtt.NewClientOptions()
	opts.AddBroker(buildBrokerURL(config))
	opts.SetClientID(resolveClientID(config.ClientID))
	opts.SetCleanSession(config.CleanSession)
	keepAlive := time.Duration(config.KeepAliveSecs) * time.Second
	if keepAlive < 5*time.Second {
		keepAlive = 5 * time.Second
	}
	opts.SetKeepAlive(keepAlive)
	opts.SetAutoReconnect(true)
	opts.SetMaxReconnectInterval(30 * time.Second)
	opts.SetConnectRetry(false)
	opts.SetConnectTimeout(connectTimeout)
	opts.SetResumeSubs(false)

	if tlsCfg != nil {
		opts.SetTLSConfig(tlsCfg)
	}

	if config.Username != nil && *config.Username != "" {
		password := ""
		if config.Password != nil {
			password = *config.Password
		}
		opts.SetUsername(*config.Username)
		opts.SetPassword(password)
	}

	return opts, nil
}

// TestConnection dials the broker with the given config and reports whether
// the connection succeeds, without touching any connection state. It always
// disconnects again before returning, so it never leaves a handle running.
func TestConnection(config ConnectionConfig) error {
	opts, err := buildClientOptions(config)
	if err != nil {
		return err
	}
	opts.SetAutoReconnect(false)

	client := pahomqtt.NewClient(opts)
	token := client.Connect()
	if !token.WaitTimeout(connectTimeout + 2*time.Second) {
		client.Disconnect(0)
		return fmt.Errorf("connect timed out")
	}
	if err := token.Error(); err != nil {
		return err
	}
	client.Disconnect(200)
	return nil
}

// NewConnection spawns a client task. A non-nil store (from a previous handle
// for the same connection) is reused so reconnecting keeps the topic tree.
func NewConnection(wailsCtx context.Context, config ConnectionConfig, store *TopicStore) (*ConnectionHandle, error) {
	opts, err := buildClientOptions(config)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithCancel(context.Background())
	if store == nil {
		store = NewTopicStore(config.HistoryLimit)
	} else {
		store.SetHistoryLimit(config.HistoryLimit)
	}
	dirty := NewDirtySet()

	handle := &ConnectionHandle{
		Store:  store,
		dirty:  dirty,
		ctx:    ctx,
		cancel: cancel,
	}

	opts.SetOnConnectHandler(func(c pahomqtt.Client) {
		if !handle.IsActive() {
			return
		}
		runtime.EventsEmit(wailsCtx, EventStatus, StatusEvent{
			ConnectionID: config.ID,
			Status:       StatusConnected,
		})
		go func() {
			msgHandler := func(_ pahomqtt.Client, msg pahomqtt.Message) {
				record := store.Ingest(msg.Topic(), msg.Payload(), msg.Qos(), msg.Retained())
				dirty.Mark(msg.Topic())
				if handle.GetWatched() == msg.Topic() || handle.IsTrendWatched(msg.Topic()) {
					runtime.EventsEmit(wailsCtx, EventMessage, MessageEvent{
						ConnectionID: config.ID,
						Topic:        msg.Topic(),
						Message:      record,
					})
				}
			}
			for _, sub := range config.Subscriptions {
				c.Subscribe(sub.Topic, sub.QoS, msgHandler) //nolint:errcheck
			}
		}()
	})

	opts.SetConnectionLostHandler(func(_ pahomqtt.Client, err error) {
		if !handle.IsActive() {
			return
		}
		errStr := err.Error()
		runtime.EventsEmit(wailsCtx, EventStatus, StatusEvent{
			ConnectionID: config.ID,
			Status:       StatusReconnecting,
			Error:        &errStr,
		})
	})

	runtime.EventsEmit(wailsCtx, EventStatus, StatusEvent{
		ConnectionID: config.ID,
		Status:       StatusConnecting,
	})

	client := pahomqtt.NewClient(opts)
	token := client.Connect()
	handle.Client = client

	// Report an initial-connect failure as "disconnected + error" so the
	// frontend can toast it instead of hanging in "connecting" forever.
	go func() {
		token.Wait()
		if err := token.Error(); err != nil && handle.IsActive() {
			errStr := err.Error()
			runtime.EventsEmit(wailsCtx, EventStatus, StatusEvent{
				ConnectionID: config.ID,
				Status:       StatusDisconnected,
				Error:        &errStr,
			})
		}
	}()

	SpawnBatcher(ctx, wailsCtx, config.ID, store, dirty)

	return handle, nil
}

func buildBrokerURL(config ConnectionConfig) string {
	switch config.Protocol {
	case ProtocolMQTTS:
		return fmt.Sprintf("ssl://%s:%d", config.Host, config.Port)
	case ProtocolWS:
		path := "/mqtt"
		if config.WsPath != nil && *config.WsPath != "" {
			path = *config.WsPath
		}
		return fmt.Sprintf("ws://%s:%d%s", config.Host, config.Port, path)
	case ProtocolWSS:
		path := "/mqtt"
		if config.WsPath != nil && *config.WsPath != "" {
			path = *config.WsPath
		}
		return fmt.Sprintf("wss://%s:%d%s", config.Host, config.Port, path)
	default:
		return fmt.Sprintf("tcp://%s:%d", config.Host, config.Port)
	}
}

func buildTLSConfig(config ConnectionConfig) (*tls.Config, error) {
	needsTLS := config.Protocol == ProtocolMQTTS || config.Protocol == ProtocolWSS
	if config.Tls == nil {
		if needsTLS {
			return &tls.Config{MinVersion: tls.VersionTLS12}, nil
		}
		return nil, nil
	}

	cfg := &tls.Config{
		MinVersion:         tls.VersionTLS12,
		InsecureSkipVerify: config.Tls.AllowInvalidCerts, //nolint:gosec
	}

	if config.Tls.CACertPath != nil && *config.Tls.CACertPath != "" {
		pem, err := os.ReadFile(*config.Tls.CACertPath)
		if err != nil {
			return nil, fmt.Errorf("reading CA cert: %w", err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(pem) {
			return nil, fmt.Errorf("invalid CA cert PEM")
		}
		cfg.RootCAs = pool
	}

	if config.Tls.ClientCertPath != nil && config.Tls.ClientKeyPath != nil &&
		*config.Tls.ClientCertPath != "" && *config.Tls.ClientKeyPath != "" {
		cert, err := tls.LoadX509KeyPair(*config.Tls.ClientCertPath, *config.Tls.ClientKeyPath)
		if err != nil {
			return nil, fmt.Errorf("loading client cert/key: %w", err)
		}
		cfg.Certificates = []tls.Certificate{cert}
	}

	return cfg, nil
}

func resolveClientID(clientID *string) string {
	if clientID != nil && *clientID != "" {
		return *clientID
	}
	return fmt.Sprintf("mqtt-access-%08x", rand.Uint32()) //nolint:gosec
}
