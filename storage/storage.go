package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func configDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "mqtt-access")
	return dir, os.MkdirAll(dir, 0o700)
}

// Load reads filename from the config directory and JSON-decodes into v.
// Returns nil without modifying v if the file does not exist.
func Load(filename string, v interface{}) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	data, err := os.ReadFile(filepath.Join(dir, filename))
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return json.Unmarshal(data, v)
}

// Save JSON-encodes v and writes it to filename in the config directory.
func Save(filename string, v interface{}) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, filename), data, 0o600)
}
