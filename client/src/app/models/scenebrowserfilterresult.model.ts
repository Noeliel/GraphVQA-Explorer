export interface SceneBrowserSceneMetadata {
    object_count: number;
    relation_count: number;
    similarity: number;
}

export type SceneBrowserFilterResult = {
    [scene_id: string]: SceneBrowserSceneMetadata;
};
