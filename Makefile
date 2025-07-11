.PHONY: create update upload build deploy

VERSION := 1.0.0
MODULE_NAME := pret-monitor
ORG_PUBLIC_NAMESPACE := yournamespace

create:
	viam module create --name=${MODULE_NAME} --public-namespace=${ORG_PUBLIC_NAMESPACE}

update:
	viam module update --module=meta.json

build:
	npm run build

deploy: build
	tar -czvf module.tar.gz build meta.json
	viam module upload --version=${VERSION} --platform=any --public-namespace=${ORG_PUBLIC_NAMESPACE} --force module

clean:
	rm -f module.tar.gz
	rm -rf build
