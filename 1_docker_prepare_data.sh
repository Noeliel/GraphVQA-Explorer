#!/usr/bin/env sh

mkdir -p server/dataset/evaluation
mkdir -p server/dataset/images
mkdir -p server/dataset/parameters
mkdir -p server/dataset/scenegraphs

docker build -t gqavis:prepare_data -f Dockerfile_prepare_data . && \
docker container create --name gqavis_extract_data gqavis:prepare_data && \
docker container cp gqavis_extract_data:/train_sceneGraphs.json ./server/dataset/scenegraphs/ && \
docker container cp gqavis_extract_data:/val_sceneGraphs.json ./server/dataset/scenegraphs/ && \
docker container rm -f gqavis_extract_data && \
docker rmi gqavis:prepare_data
