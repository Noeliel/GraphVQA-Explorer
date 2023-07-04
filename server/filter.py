from server import GQAVisServer, SCENE_GRAPH_CONFIG
import torch
import torch.nn as nn

class SceneSearchFilterPipeline:

    def __init__(self, server: GQAVisServer):
        self.server = server

    #      #
    # LOAD #
    #      #

    def load(self, config):
        data = {}

        if config['enable_train_split']:
            data = {**data, **self.server.scene_graph_data['train']}
            data = {**data, **self.server.scene_graph_data['overlay_train']}

        if config['enable_eval_split']:
            data = {**data, **self.server.scene_graph_data['eval']}
            data = {**data, **self.server.scene_graph_data['overlay_eval']}

        if self.server.scene_graph_data['new'] is not None:
            data = {**data, **self.server.scene_graph_data['new']}

        return data

    #        #
    # FILTER #
    #        #

    def scenesWithObjects(self, data, object_names):
        filtered_ids = {}

        for sid in data:
            scene_objects = data[sid]['objects']
            include_scene = True

            for name in object_names:
                name = name.lower()
                contains_object = False

                for obj_id in scene_objects:
                    if name == scene_objects[obj_id]['name'].lower():
                        contains_object = True
                        break

                if not contains_object:
                    include_scene = False
                    break

            if include_scene:
                filtered_ids[sid] = data[sid]

        return filtered_ids
    
    def scenesWithRelations(self, data, relation_names):
        filtered_ids = {}

        for sid in data:
            scene_objects = data[sid]['objects']
            include_scene = True

            for relation_name in relation_names:
                relation_name = relation_name.lower()
                contains_relation = False

                for obj_id in scene_objects:
                    for obj_rel in scene_objects[obj_id]['relations']:
                        if relation_name == obj_rel['name'].lower():
                            contains_relation = True
                            break

                    if contains_relation:
                        break

                if not contains_relation:
                    include_scene = False
                    break

            if include_scene:
                filtered_ids[sid] = data[sid]

        return filtered_ids
        

    def filter(self, config, data):

        # scene id contains
        scene_id = config['scene_id']
        if not scene_id == '':
            filtered_ids = {}

            for sid in data:
                if scene_id in sid:
                    filtered_ids[sid] = data[sid]

            data = filtered_ids

        # scene contains object(s) based on name(s)
        object_names = config['object_names']
        if len(object_names) > 0:
            data = self.scenesWithObjects(data, object_names)
        

        # scene contains attribute(s) based on name(s)
        object_attributes = config['object_attributes']
        if len(object_attributes) > 0:
            filtered_ids = {}

            for sid in data:
                scene_objects = data[sid]['objects']
                include_scene = True

                for attribute in object_attributes:
                    attribute = attribute.lower()
                    contains_attribute = False

                    for obj_id in scene_objects:
                        for obj_attr in scene_objects[obj_id]['attributes']:
                            if attribute == obj_attr.lower():
                                contains_attribute = True
                                break

                        if contains_attribute:
                            break

                    if not contains_attribute:
                        include_scene = False
                        break

                if include_scene:
                    filtered_ids[sid] = data[sid]

            data = filtered_ids

        # scene contains relation(s) based on name(s)
        relation_names = config['relation_names']
        if len(relation_names) > 0:
            data = self.scenesWithRelations(data, relation_names)

        return data

    #         #
    # PROCESS #
    #         #

    def generateMetadata(self, config, data):
        # package into different map/data format
        metadata = {}

        for scene_id in data:
            metadata[scene_id] = { 'object_count': 0,
                                   'relation_count': 0,
                                   'similarity': 0 }

        return (data, metadata)

    def computeGraphSize(self, config, data, metadata):

        for sid in data:
            scene_objects = data[sid]['objects']
            relation_count = 0

            for object_id in scene_objects:
                relation_count = relation_count + len(scene_objects[object_id]['relations'])
            
            metadata[sid]['object_count'] = len(scene_objects)
            metadata[sid]['relation_count'] = relation_count

        return (data, metadata)

    # if you modify the following function, make sure that the use case in
    # prefilterPotentiallySimilarScenes is still supported
    def extractObjectAndRelationCategories(self, data):
        object_names = set([])
        relation_names = set([])

        for sid in data:
            scene_objects = data[sid]['objects']

            for obj_id in scene_objects:
                object_names.add(scene_objects[obj_id]['name'].lower())

                for obj_rel in scene_objects[obj_id]['relations']:
                    relation_names.add(obj_rel['name'].lower())

        return (list(object_names), list(relation_names))

    # filter out those scenes that don't share at least one object or relation with the similarity_id scene
    def prefilterPotentiallySimilarScenes(self, data, similarity_id):
        similarity_scene_data = { similarity_id: data[similarity_id] }
        object_names, relation_names = self.extractObjectAndRelationCategories(similarity_scene_data)

        filtered_data = {}

        for object_name in object_names:
            filtered_data = {**filtered_data, **self.scenesWithObjects(data, [object_name])}
        
        for relation_name in relation_names:
            filtered_data = {**filtered_data, **self.scenesWithRelations(data, [relation_name])}
        
        return filtered_data

    def computeAdjacencyTensorForScene(self, data, scene_id, object_categories, relation_categories):
        object_dims = len(object_categories)
        relation_dims = len(relation_categories)

        # tensor = torch.zeros([object_dims, object_dims, relation_dims])
        ## tensor = tensor.refine_names('source_obj', 'target_obj', 'relation')
        tensor = torch.zeros([object_dims, object_dims])

        scene_objects = data[scene_id]['objects']
        for obj_id in scene_objects:
            source_object_name = scene_objects[obj_id]['name'].lower()
            source_object_index = object_categories.index(source_object_name)
            
            for obj_rel in scene_objects[obj_id]['relations']:
                target_object_id = obj_rel['object']
                target_object_name = scene_objects[target_object_id]['name'].lower()
                target_object_index = object_categories.index(target_object_name)

                # relation_name = obj_rel['name'].lower()
                # relation_index = relation_categories.index(relation_name)

                # count = tensor[source_object_index][target_object_index][relation_index]
                # count = count + 1
                # tensor[source_object_index][target_object_index][relation_index] = count

                count = tensor[source_object_index][target_object_index]
                count = count + 1
                tensor[source_object_index][target_object_index] = count
        
        return tensor

    def computeCosineSimilarity(self, tensor_1, tensor_2):
        cos0 = nn.CosineSimilarity(dim=0)
        cos1 = nn.CosineSimilarity(dim=1)
        # cos2 = nn.CosineSimilarity(dim=2)

        # return (cos0(tensor_1, tensor_2), cos1(tensor_1, tensor_2), cos2(tensor_1, tensor_2))
        return (cos0(tensor_1, tensor_2), cos1(tensor_1, tensor_2))

    def computeSimilarity(self, config, data, metadata):
        similarity_id = config['similarity_id']
        if len(similarity_id) > 0:
            print(len(data))
            filtered_data = self.prefilterPotentiallySimilarScenes(data, similarity_id)
            print(len(filtered_data))
            object_categories, relation_categories = self.extractObjectAndRelationCategories(filtered_data)
            tensor_1 = self.computeAdjacencyTensorForScene(data, similarity_id, object_categories, relation_categories)
            # print(tensor_1.flatten().tolist())

            i = 1

            for scene_id in filtered_data:
                print(i)
                tensor_2 = self.computeAdjacencyTensorForScene(data, scene_id, object_categories, relation_categories)
                similarity = self.computeCosineSimilarity(tensor_1, tensor_2)
                metadata[scene_id]['similarity'] = 1
                i = i + 1

        return (data, metadata)

    def process(self, config, data):
        data, metadata = self.generateMetadata(config, data)
        data, metadata = self.computeGraphSize(config, data, metadata)
        # data, metadata = self.computeSimilarity(config, data, metadata)

        return metadata

    #                  #
    # EXECUTE PIPELINE #
    #                  #

    def run(self, config):
        data = self.load(config)
        data = self.filter(config, data)
        data = self.process(config, data)

        return data
