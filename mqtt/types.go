package mqtt

const (
	EventStatus  = "mqtt:status"
	EventBatch   = "mqtt:batch"
	EventMessage = "mqtt:message"
)

type Protocol string

const (
	ProtocolMQTT  Protocol = "mqtt"
	ProtocolMQTTS Protocol = "mqtts"
	ProtocolWS    Protocol = "ws"
	ProtocolWSS   Protocol = "wss"
)

type Subscription struct {
	Topic string `json:"topic"`
	QoS   uint8  `json:"qos"`
}

type TlsConfig struct {
	CACertPath        *string `json:"caCertPath"`
	ClientCertPath    *string `json:"clientCertPath"`
	ClientKeyPath     *string `json:"clientKeyPath"`
	AllowInvalidCerts bool    `json:"allowInvalidCerts"`
}

type ConnectionConfig struct {
	ID               string         `json:"id"`
	Name             string         `json:"name"`
	Protocol         Protocol       `json:"protocol"`
	Host             string         `json:"host"`
	Port             uint16         `json:"port"`
	WsPath           *string        `json:"wsPath"`
	Username         *string        `json:"username"`
	Password         *string        `json:"password"`
	ClientID         *string        `json:"clientId"`
	KeepAliveSecs    uint16         `json:"keepAliveSecs"`
	CleanSession     bool           `json:"cleanSession"`
	Subscriptions    []Subscription `json:"subscriptions"`
	Tls              *TlsConfig     `json:"tls"`
	HistoryLimit     int            `json:"historyLimit"`
	ConnectOnStartup bool           `json:"connectOnStartup"`
}

type MessageRecord struct {
	Seq         uint64  `json:"seq"`
	TsMs        int64   `json:"tsMs"`
	PayloadB64  string  `json:"payloadB64"`
	PayloadUtf8 *string `json:"payloadUtf8"`
	QoS         uint8   `json:"qos"`
	Retain      bool    `json:"retain"`
}

type TopicUpdate struct {
	Topic    string   `json:"topic"`
	Preview  string   `json:"preview"`
	MsgCount uint64   `json:"msgCount"`
	LastTsMs int64    `json:"lastTsMs"`
	Retain   bool     `json:"retain"`
	Numeric  *float64 `json:"numeric"`
}

type TopicDetails struct {
	Topic      string         `json:"topic"`
	Latest     *MessageRecord `json:"latest"`
	MsgCount   uint64         `json:"msgCount"`
	HistoryLen uint32         `json:"historyLen"`
}

type ConnectionStatus string

const (
	StatusConnecting   ConnectionStatus = "connecting"
	StatusConnected    ConnectionStatus = "connected"
	StatusReconnecting ConnectionStatus = "reconnecting"
	StatusDisconnected ConnectionStatus = "disconnected"
	StatusError        ConnectionStatus = "error"
)

type StatusEvent struct {
	ConnectionID string           `json:"connectionId"`
	Status       ConnectionStatus `json:"status"`
	Error        *string          `json:"error,omitempty"`
}

type BatchEvent struct {
	ConnectionID  string        `json:"connectionId"`
	Updates       []TopicUpdate `json:"updates"`
	TotalMessages uint64        `json:"totalMessages"`
	TotalTopics   uint32        `json:"totalTopics"`
}

type MessageEvent struct {
	ConnectionID string         `json:"connectionId"`
	Topic        string         `json:"topic"`
	Message      *MessageRecord `json:"message"`
}
