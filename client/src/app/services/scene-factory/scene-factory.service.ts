import { Injectable } from '@angular/core';
import { Scene } from 'src/app/entities/scene';
import { SceneGraph } from 'src/app/entities/scenegraph';
import { BackendService } from '../backend/backend.service';
import { SceneGraphImageProcessorService } from '../image-processor/scene-graph-image-processor.service';

@Injectable({
    providedIn: 'root',
})
export class SceneFactoryService {
    constructor(
        private backend: BackendService,
        private processor: SceneGraphImageProcessorService
    ) {}

    public newSceneFromID(id: string): Promise<Scene> {
        return new Promise<Scene>((onfulfilled, onreject) => {
            this.backend.requestVocab((response) => {
                const vocab = response;

                this.backend.requestSceneGraphData(id, (response) => {
                    const scene = new Scene(
                        SceneGraph.from(id, response),
                        vocab,
                        undefined,
                        this.backend,
                        this.processor
                    );

                    this.backend.requestImageData(id, (response) => {
                        const image = response.body;
                        if (!image) return;
                        scene.image = image;

                        onfulfilled(scene);
                    });
                });
            });
        });
    }
}
