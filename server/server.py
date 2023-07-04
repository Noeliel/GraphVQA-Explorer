import common
import json
import os.path
from PIL import Image

SCENE_GRAPH_CONFIG = {
    'train': (common.FILENAME_SCENEGRAPHS_TRAIN, common.FILENAME_SCENEGRAPHS_OVERLAY_TRAIN),
    'eval': (common.FILENAME_SCENEGRAPHS_EVAL, common.FILENAME_SCENEGRAPHS_OVERLAY_EVAL),
    'new': (common.FILENAME_SCENEGRAPHS_NEW, None)
}

class GQAVisServer:

    def __init__(self):
        self.ensure_dirs_exist()

        self.scene_graph_data = {}

        for base_split, config in SCENE_GRAPH_CONFIG.items():
            file_name_base, file_name_overlay = config
            file_path_base = os.path.join(common.FOLDER_SCENEGRAPHS, file_name_base)

            if os.path.isfile(file_path_base):
                f = open(file_path_base)
                self.scene_graph_data[base_split] = json.load(f)
                f.close()
            else:
                self.scene_graph_data[base_split] = {}

            if file_name_overlay is not None:
                overlay_split = "overlay_" + base_split
                file_path_overlay = os.path.join(common.FOLDER_SCENEGRAPHS, file_name_overlay)

                if os.path.isfile(file_path_overlay):
                    f = open(file_path_overlay)
                    self.scene_graph_data[overlay_split] = json.load(f)
                    f.close()
                else:
                    self.scene_graph_data[overlay_split] = {}

    def ensure_dirs_exist(self):
        dirs = [
            common.FOLDER_SCENEGRAPHS,
            common.FOLDER_IMAGES,
            common.FOLDER_THUMBNAILS,
            common.FOLDER_IMAGES_CUSTOM,
            common.FOLDER_THUMBNAILS_CUSTOM,
            common.FOLDER_UPLOADS
        ]
        
        for dir in dirs:
            os.makedirs(dir, exist_ok=True)

    def get_scene_ids(self):
        ids = []

        for base_split, config in SCENE_GRAPH_CONFIG.items():
            ids = [*ids, *list(self.scene_graph_data[base_split].keys())]

        ids = sorted(ids, key=int)

        return ids

    def get_image_path(self, id):
        filename = os.path.join(common.FOLDER_IMAGES, id + ".jpg")
        if os.path.isfile(filename):
            return filename

        filename_custom = os.path.join(common.FOLDER_IMAGES_CUSTOM, id + ".jpg")
        if os.path.isfile(filename_custom):
            return filename_custom

        return "placeholder.jpg"

    def get_thumbnail_path(self, id):
        filename = os.path.join(common.FOLDER_THUMBNAILS, id + ".jpg")
        if os.path.isfile(filename):
            return filename

        filename_custom = os.path.join(common.FOLDER_THUMBNAILS_CUSTOM, id + ".jpg")
        if os.path.isfile(filename_custom):
            return filename_custom

        return self.get_image_path(id)

    def get_scene_graph_data(self, id):
        id_str = str(id)

        for base_split, config in SCENE_GRAPH_CONFIG.items():
            file_name_base, file_name_overlay = config

            if file_name_overlay is not None:
                overlay_split = "overlay_" + base_split

                if id_str in self.scene_graph_data[overlay_split]:
                    return (file_name_overlay, self.scene_graph_data[overlay_split][id_str])

            if id_str in self.scene_graph_data[base_split]:
                return (file_name_base, self.scene_graph_data[base_split][id_str])

        return ('error: scene #{} not found'.format(id_str), '{}')

    def set_scene_graph_data(self, id, data):
        id_str = str(id)

        target_split = "new"
        target_file_name = common.FILENAME_SCENEGRAPHS_NEW

        for base_split, config in SCENE_GRAPH_CONFIG.items():
            file_name_base, file_name_overlay = config

            if id_str in self.scene_graph_data[base_split]:
                target_split = base_split
                target_file_name = file_name_base

                if file_name_overlay is not None:
                    target_split = "overlay_" + target_split
                    target_file_name = file_name_overlay

                break

        self.scene_graph_data[target_split][id_str] = data

        target_file = os.path.join(common.FOLDER_SCENEGRAPHS, target_file_name)

        f = open(target_file, 'w')
        json.dump(self.scene_graph_data[target_split], f)
        f.close()

    def get_evaluation_data(self, model, split = "val"):
        eval_data = {}
        path = common.FILE_RESULTS_FOR_MODEL_AND_QUESTION_SPLIT(model, split)

        if os.path.isfile(path):
            f = open(path)
            eval_data = json.load(f)
            f.close()

        return eval_data

    def create_scene(self, image_path):
        scene_img = Image.open(image_path)
        width, height = scene_img.size

        existing_ids = self.get_scene_ids()
        highest_existing_id = int(max(existing_ids, key=int))
        new_scene_id = highest_existing_id + 1

        new_scene_data = {}
        new_scene_data["height"] = height
        new_scene_data["width"] = width
        new_scene_data["objects"] = {}

        self.set_scene_graph_data(new_scene_id, new_scene_data)
        os.rename(image_path, os.path.join(common.FOLDER_IMAGES_CUSTOM, str(new_scene_id) + ".jpg"))

        return new_scene_id
