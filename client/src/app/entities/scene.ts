import { ModelVocab } from '../models/modelvocab.model';
import { SceneGraphRaw } from '../models/scenegraph.model';
import { BackendService } from '../services/backend/backend.service';
import { SceneGraphImageProcessorService } from '../services/image-processor/scene-graph-image-processor.service';
import { SceneGraph, SceneGraphObject, SceneGraphRelation } from './scenegraph';

export class Scene {
    private _scene_graph?: SceneGraph;
    private _image?: Blob;
    private _vocab?: ModelVocab;

    private backend: BackendService;
    private processor: SceneGraphImageProcessorService;

    private graphChangedSubscriptions: {
        [subscription_key: string]: {
            callback: (sender: Scene) => void;
        };
    } = {};

    private imageChangedSubscriptions: {
        [subscription_key: string]: {
            callback: (sender: Scene) => void;
        };
    } = {};

    constructor(
        graph: SceneGraph | undefined = undefined,
        vocab: ModelVocab | undefined = undefined,
        image: Blob | undefined = undefined,
        backend: BackendService,
        processor: SceneGraphImageProcessorService
    ) {
        this._scene_graph = graph;
        this._vocab = vocab;
        this._image = image;
        this.backend = backend;
        this.processor = processor;

        this.tryRecomputeAllGraphColors().catch(() => {
            // do nothing...
            return;
        });
    }

    get graph(): SceneGraph | undefined {
        return this._scene_graph;
    }

    set graph(graph: SceneGraph | undefined) {
        this._scene_graph = graph;

        this.tryRecomputeAllGraphColors().finally(() => {
            this.notifySubscribersOfGraphChanges();
        });
    }

    get vocab(): ModelVocab | undefined {
        return this._vocab;
    }

    set vocab(vocab: ModelVocab | undefined) {
        this._vocab = vocab;
    }

    get image(): Blob | undefined {
        return this._image;
    }

    set image(image: Blob | undefined) {
        this._image = image;

        this.notifySubscribersOfImageChanges();

        this.tryRecomputeAllGraphColors().then(() => {
            this.notifySubscribersOfGraphChanges();
        }, null);
    }

    private commitGraphChangesToBackend() {
        if (!this._scene_graph) return;

        this.backend.updateSceneGraphData(
            this._scene_graph!.id,
            SceneGraphRaw.from(this._scene_graph!),
            (response) => {
                // do nothing...
            }
        );
    }

    private tryRecomputeAllGraphColors(): Promise<void> {
        if (!this._scene_graph || !this._image) return Promise.reject();
        // todo: reset colors to default?

        return this.processor
            .adjustGraphNodeColorsForImage(this._scene_graph, this._image)
            .then((modified_graph) => {
                this._scene_graph = modified_graph;
            });
    }

    private tryRecomputeGraphColor(
        object: SceneGraphObject
    ): Promise<void | SceneGraphObject> {
        if (!this._image) return Promise.reject();
        return this.processor.adjustObjectNodeColorsForImage(
            object,
            this._image
        );
    }

    private notifySubscribersOfGraphChanges() {
        Object.keys(this.graphChangedSubscriptions).forEach((sub_key) => {
            this.graphChangedSubscriptions[sub_key].callback(this);
        });
    }

    private notifySubscribersOfImageChanges() {
        Object.keys(this.imageChangedSubscriptions).forEach((sub_key) => {
            this.imageChangedSubscriptions[sub_key].callback(this);
        });
    }

    public registerGraphChangedCallback(
        subscription_key: string,
        callback: (sender: Scene) => void
    ) {
        this.graphChangedSubscriptions[subscription_key] = {
            callback: callback,
        };
    }

    public unregisterGraphChangedCallback(subscription_key: string) {
        delete this.graphChangedSubscriptions[subscription_key];
    }

    public registerImageChangedCallback(
        subscription_key: string,
        callback: (sender: Scene) => void
    ) {
        this.imageChangedSubscriptions[subscription_key] = {
            callback: callback,
        };
    }

    public unregisterImageChangedCallback(subscription_key: string) {
        delete this.imageChangedSubscriptions[subscription_key];
    }

    public graphObject_Create(): SceneGraphObject | undefined {
        if (!this._scene_graph) return undefined;

        // no need to compute colors because the bounding box is 0x0 pixels
        const new_obj = this._scene_graph.createNewObject();

        this.commitGraphChangesToBackend();
        this.notifySubscribersOfGraphChanges();

        return new_obj;
    }

    public graphObject_Overwrite(object: SceneGraphObject) {
        if (!this._scene_graph) return;

        this._scene_graph!.addOrOverwriteObject(object);
        this.commitGraphChangesToBackend();

        this.tryRecomputeGraphColor(object).finally(() => {
            this.notifySubscribersOfGraphChanges();
        });
    }

    public graphObject_Delete(object_id: string) {
        if (!this._scene_graph) return;

        this._scene_graph.deleteObjectAndRelations(object_id);

        this.commitGraphChangesToBackend();
        this.notifySubscribersOfGraphChanges();
    }

    public graphRelation_Create(
        from_obj: SceneGraphObject,
        to_obj: SceneGraphObject
    ): SceneGraphRelation | undefined {
        if (!this._scene_graph) return undefined;

        const new_relation = this._scene_graph.createNewRelation(
            from_obj,
            to_obj
        );

        this.commitGraphChangesToBackend();
        this.notifySubscribersOfGraphChanges();

        return new_relation;
    }

    public graphRelation_Overwrite(relation: SceneGraphRelation) {
        if (!this._scene_graph) return;

        this._scene_graph.editRelation(relation);

        this.commitGraphChangesToBackend();
        this.notifySubscribersOfGraphChanges();
    }

    public graphRelation_Delete(relation_id: string) {
        if (!this._scene_graph) return;

        this._scene_graph.deleteRelation(relation_id);

        this.commitGraphChangesToBackend();
        this.notifySubscribersOfGraphChanges();
    }
}
