package main

import (
	"context"
	"embed"
	"flag"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/n30z/serverhub-agent/internal/api"
	"github.com/n30z/serverhub-agent/internal/collector"
	"github.com/n30z/serverhub-agent/internal/config"
)

//go:embed web
var webFiles embed.FS

// version is injected at build time via -ldflags "-X main.version=x.y.z"
var version = "dev"

func main() {
	cfgPath := flag.String("config", "/etc/serverhub/config.yaml", "path to config file")
	flag.Parse()

	log.SetFlags(log.Ltime | log.Lshortfile)

	cfg, err := config.Load(*cfgPath)
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// Strip the "web/" prefix so the FS root is the frontend's index.html
	webFS, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatalf("embed: %v", err)
	}

	coll := collector.New(cfg)
	srv := api.New(cfg, coll, webFS)

	ctx, cancel := context.WithCancel(context.Background())

	// First collection synchronously so metrics are ready before the server starts
	coll.Init()

	// Periodic collection
	go coll.Run(ctx)

	// Graceful shutdown on SIGTERM / SIGINT
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		<-sig
		log.Println("received shutdown signal")
		cancel()
	}()

	log.Printf("ServerHub Agent v%s — listening on %s:%d", version, cfg.Server.Host, cfg.Server.Port)
	if err := srv.ListenAndServe(ctx); err != nil {
		// A cancelled context produces a "use of closed network connection" error — that's expected.
		if ctx.Err() == nil {
			log.Fatalf("server: %v", err)
		}
	}
}
