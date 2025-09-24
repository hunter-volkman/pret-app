.PHONY: create update upload build deploy clean dev

VERSION := 0.0.1
MODULE_NAME := pret-app
ORG_PUBLIC_NAMESPACE := pret

# Development
dev:
	npm run dev

build:
	npm run build

create:
	viam module create --name=${MODULE_NAME} --public-namespace=${ORG_PUBLIC_NAMESPACE}

deploy: build
	tar -czvf pret-app.tar.gz build meta.json
	viam module upload --version=${VERSION} --platform=any --module=${ORG_PUBLIC_NAMESPACE}:${MODULE_NAME} pret-app.tar.gz

clean:
	rm -f pret-app.tar.gz
	rm -rf build