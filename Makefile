.PHONY: create update upload build deploy clean dev

VERSION := 1.0.0
MODULE_NAME := inventorymonitor
ORG_PUBLIC_NAMESPACE := pret

# Development
dev:
	npm run dev

# Build production version
build:
	npm run build

# Create Viam module (run once)
create:
	viam module create --name=${MODULE_NAME} --public-namespace=${ORG_PUBLIC_NAMESPACE}

# Update module metadata
update:
	viam module update --module=meta.json

# Deploy to Viam Apps
deploy: build
	tar -czvf pret-inventorymonitor.tar.gz build meta.json
	viam module upload --version=${VERSION} --platform=any --public-namespace=${ORG_PUBLIC_NAMESPACE} --force pret-inventorymonitor.tar.gz
	@echo "Deployed to: https://inventorymonitor_${ORG_PUBLIC_NAMESPACE}.viamapplications.com"

# Clean build artifacts
clean:
	rm -f pret-inventorymonitor.tar.gz
	rm -rf build

# Install dependencies
install:
	npm install

# Full setup for new environment
setup: install create

# Quick redeploy
redeploy: clean deploy
