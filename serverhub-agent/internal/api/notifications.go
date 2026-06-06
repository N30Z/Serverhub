package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

func (s *Server) notify(a serverAlert, rule alertRule) {
	cfg := &s.cfg.Notifications
	if rule.NotifyEmail && cfg.Email.Enabled && cfg.Email.SMTPHost != "" {
		go s.sendEmail(a)
	}
	if rule.NotifyPush && cfg.Webhook.Enabled && cfg.Webhook.URL != "" {
		go s.sendWebhook(a)
	}
}

func (s *Server) sendEmail(a serverAlert) {
	ec := s.cfg.Notifications.Email
	if len(ec.To) == 0 || ec.From == "" {
		return
	}
	subject := fmt.Sprintf("[ServerHub] %s: %s", strings.ToUpper(a.Severity), a.Title)
	body := fmt.Sprintf("Alert: %s\nServer: %s\nTime: %s\n\n%s",
		a.Title, a.Server, a.Timestamp, a.Message)
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		ec.From, strings.Join(ec.To, ", "), subject, body)

	addr := fmt.Sprintf("%s:%d", ec.SMTPHost, ec.SMTPPort)
	var auth smtp.Auth
	if ec.Username != "" {
		auth = smtp.PlainAuth("", ec.Username, ec.Password, ec.SMTPHost)
	}
	if err := smtp.SendMail(addr, auth, ec.From, ec.To, []byte(msg)); err != nil {
		log.Printf("email notification: %v", err)
	}
}

func (s *Server) sendWebhook(a serverAlert) {
	wc := s.cfg.Notifications.Webhook
	payload := map[string]interface{}{
		"title":    a.Title,
		"message":  a.Message,
		"severity": a.Severity,
		"server":   a.Server,
		"time":     a.Timestamp,
	}
	data, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, wc.URL, bytes.NewReader(data))
	if err != nil {
		log.Printf("webhook build: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if wc.Token != "" {
		req.Header.Set("Authorization", "Bearer "+wc.Token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("webhook send: %v", err)
		return
	}
	resp.Body.Close()
}
