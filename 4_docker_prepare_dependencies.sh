#!/usr/bin/env sh

docker build -t gqavis:prepare_dependencies -f Dockerfile_prepare_dependencies . && \
docker container create --name gqavis_extract_dependencies gqavis:prepare_dependencies && \
docker container cp gqavis_extract_dependencies:/wasmbuild/pkg ./client/src/app/services/wasm/module/ && \
docker container rm -f gqavis_extract_dependencies && \
docker rmi gqavis:prepare_dependencies

cp -n server/GraphVQA.patch server/GraphVQA/

cd server/GraphVQA
git apply --reject -p1 GraphVQA.patch
cd ../..

docker run -it --rm -v $(pwd):/gqavis gqavis bash -c "cd /gqavis/client; npm i"
