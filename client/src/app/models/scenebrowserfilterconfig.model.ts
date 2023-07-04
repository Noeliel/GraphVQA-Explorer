export interface SceneBrowserFilterConfig {
    enable_train_split: boolean;
    enable_eval_split: boolean;
    scene_id: string;
    similarity_id: string;
    object_names: string[];
    object_attributes: string[];
    relation_names: string[];
}
