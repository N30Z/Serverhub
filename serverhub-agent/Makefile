VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BINARY  := serverhub-agent
PKG     := serverhub-agent_$(VERSION)_amd64

.PHONY: build dist deb clean

## build: compile the agent binary (placeholder web/ only)
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
	  go build -ldflags="-s -w -X main.version=$(VERSION)" \
	  -o $(BINARY) .

## dist: build frontend + agent binary with embedded UI
dist:
	@echo "Building frontend..."
	cd ../serverhub-ui && npm ci && npm run build
	@echo "Copying dist into web/..."
	rm -rf web/*
	cp -r ../serverhub-ui/dist/. web/
	$(MAKE) build

## deb: create the .deb package (requires dist first)
deb: dist
	@echo "Packaging $(PKG).deb..."
	rm -rf $(PKG)
	mkdir -p $(PKG)/DEBIAN \
	          $(PKG)/usr/bin \
	          $(PKG)/lib/systemd/system \
	          $(PKG)/etc/serverhub
	cp $(BINARY)                                $(PKG)/usr/bin/$(BINARY)
	cp packaging/systemd/serverhub-agent.service $(PKG)/lib/systemd/system/
	cp packaging/config.yaml.example            $(PKG)/etc/serverhub/config.yaml
	sed "s/VERSION_PLACEHOLDER/$(VERSION)/"     packaging/debian/control > $(PKG)/DEBIAN/control
	cp packaging/debian/conffiles               $(PKG)/DEBIAN/conffiles
	cp packaging/debian/postinst               $(PKG)/DEBIAN/postinst
	cp packaging/debian/prerm                  $(PKG)/DEBIAN/prerm
	chmod 755 $(PKG)/DEBIAN/postinst $(PKG)/DEBIAN/prerm
	dpkg-deb --build --root-owner-group $(PKG)
	@echo "Created: $(PKG).deb"

## clean: remove build artefacts
clean:
	rm -rf $(BINARY) serverhub-agent_*.deb serverhub-agent_*_amd64/
