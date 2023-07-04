# Merges overlay_{train,val}_sceneGraphs.json and {train,val}_sceneGraphs.json into merged_{train,val}_sceneGraphs.json
# Meant for creating a split with fixes and adjustments to the ground truth to then use for retraining the model(s)

import common
import json
import os.path
from server import GQAVisServer, SCENE_GRAPH_CONFIG

def generateMergedSplits():
    server = GQAVisServer()

    for base_split, config in SCENE_GRAPH_CONFIG.items():
        file_name_base, file_name_overlay = config

        if file_name_overlay is not None:
            overlay_split = "overlay_" + base_split

            base_data = server.scene_graph_data[base_split]
            overlay_data = server.scene_graph_data[overlay_split]

            for entry in overlay_data:
                base_data[entry] = overlay_data[entry]

            target_file = os.path.join(common.FOLDER_SCENEGRAPHS, "merged_" + file_name_base)

            f = open(target_file, 'w')
            json.dump(base_data, f)
            f.close()


generateMergedSplits()
