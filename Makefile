SHELL := /bin/bash

APP_NAME := mqtt-access
VERSION := $(shell cat VERSION)
DIST_DIR := dist
STAGE_DIR := $(DIST_DIR)/stage

.PHONY: help installer installer-mac installer-linux installer-windows clean

help:
	@echo "Installer build targets"
	@echo "  make installer-mac       Build macOS app and package DMG"
	@echo "  make installer-linux     Build Linux binary and package tar.gz"
	@echo "  make installer-windows   Build Windows binary and package ZIP (and NSIS .exe if makensis exists)"
	@echo "  make installer           Build all installer packages"
	@echo "  make clean               Remove generated installer artifacts"

installer: installer-mac installer-linux installer-windows

installer-mac:
	@mkdir -p "$(DIST_DIR)" "$(STAGE_DIR)"
	wails build -clean -platform darwin/universal
	@rm -rf "$(STAGE_DIR)/macos" "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-macos-universal.dmg"
	@mkdir -p "$(STAGE_DIR)/macos"
	@cp -R "build/bin/MQTT Access.app" "$(STAGE_DIR)/macos/"
	@ln -sfn /Applications "$(STAGE_DIR)/macos/Applications"
	hdiutil create -volname "MQTT Access" -srcfolder "$(STAGE_DIR)/macos" -ov -format UDZO "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-macos-universal.dmg"
	@echo "Created $(DIST_DIR)/$(APP_NAME)-$(VERSION)-macos-universal.dmg"

installer-linux:
	@mkdir -p "$(DIST_DIR)" "$(STAGE_DIR)"
	wails build -clean -platform linux/amd64
	@rm -rf "$(STAGE_DIR)/linux"
	@mkdir -p "$(STAGE_DIR)/linux"
	@cp "build/bin/$(APP_NAME)" "$(STAGE_DIR)/linux/"
	@chmod +x "$(STAGE_DIR)/linux/$(APP_NAME)"
	tar -C "$(STAGE_DIR)/linux" -czf "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-linux-amd64.tar.gz" "$(APP_NAME)"
	@echo "Created $(DIST_DIR)/$(APP_NAME)-$(VERSION)-linux-amd64.tar.gz"

installer-windows:
	@mkdir -p "$(DIST_DIR)" "$(STAGE_DIR)"
	wails build -clean -platform windows/amd64
	@rm -rf "$(STAGE_DIR)/windows"
	@mkdir -p "$(STAGE_DIR)/windows"
	@cp "build/bin/$(APP_NAME).exe" "$(STAGE_DIR)/windows/"
	@cd "$(STAGE_DIR)/windows" && zip -q -9 -r "../../$(APP_NAME)-$(VERSION)-windows-amd64.zip" "$(APP_NAME).exe"
	@echo "Created $(DIST_DIR)/$(APP_NAME)-$(VERSION)-windows-amd64.zip"
	@if command -v makensis >/dev/null 2>&1; then \
		echo "makensis detected: building NSIS installer..."; \
		makensis -DARG_WAILS_AMD64_BINARY=../../bin/$(APP_NAME).exe build/windows/installer/project.nsi; \
		cp "build/bin/MQTT Access-$(VERSION)-amd64-installer.exe" "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-windows-amd64-installer.exe"; \
		echo "Created $(DIST_DIR)/$(APP_NAME)-$(VERSION)-windows-amd64-installer.exe"; \
	else \
		echo "makensis not found; skipped NSIS installer (.exe)."; \
		echo "Install NSIS to also produce a Windows .exe installer."; \
	fi

clean:
	@rm -rf "$(STAGE_DIR)"
	@rm -f "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-macos-universal.dmg"
	@rm -f "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-linux-amd64.tar.gz"
	@rm -f "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-windows-amd64.zip"
	@rm -f "$(DIST_DIR)/$(APP_NAME)-$(VERSION)-windows-amd64-installer.exe"
	@echo "Cleaned installer artifacts"
