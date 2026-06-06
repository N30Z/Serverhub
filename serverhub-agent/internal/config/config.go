package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
		TLS  struct {
			Enabled  bool   `yaml:"enabled"`
			CertFile string `yaml:"cert_file"`
			KeyFile  string `yaml:"key_file"`
		} `yaml:"tls"`
	} `yaml:"server"`
	Auth struct {
		Username       string `yaml:"username"`
		Password       string `yaml:"password"`
		SessionTimeout int    `yaml:"session_timeout"` // seconds
	} `yaml:"auth"`
	Monitoring struct {
		Interval int `yaml:"interval"` // seconds between collections
		History  int `yaml:"history"`  // max history data points kept
	} `yaml:"monitoring"`
	Notifications struct {
		Email struct {
			Enabled  bool     `yaml:"enabled"`
			SMTPHost string   `yaml:"smtp_host"`
			SMTPPort int      `yaml:"smtp_port"`
			Username string   `yaml:"username"`
			Password string   `yaml:"password"`
			From     string   `yaml:"from"`
			To       []string `yaml:"to"`
		} `yaml:"email"`
		Webhook struct {
			Enabled bool   `yaml:"enabled"`
			URL     string `yaml:"url"`
			Token   string `yaml:"token"`
		} `yaml:"webhook"`
	} `yaml:"notifications"`
}

func Load(path string) (*Config, error) {
	cfg := defaults()
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}
	if cfg.Server.Port == 0 {
		cfg.Server.Port = 8080
	}
	if cfg.Monitoring.Interval == 0 {
		cfg.Monitoring.Interval = 3
	}
	if cfg.Monitoring.History == 0 {
		cfg.Monitoring.History = 60
	}
	if cfg.Notifications.Email.SMTPPort == 0 {
		cfg.Notifications.Email.SMTPPort = 587
	}
	return cfg, nil
}

func defaults() *Config {
	cfg := &Config{}
	cfg.Server.Host = "0.0.0.0"
	cfg.Server.Port = 8080
	cfg.Auth.Username = "admin"
	cfg.Auth.Password = "admin"
	cfg.Auth.SessionTimeout = 86400
	cfg.Monitoring.Interval = 3
	cfg.Monitoring.History = 60
	cfg.Notifications.Email.SMTPPort = 587
	return cfg
}
