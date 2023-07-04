import common
import argparse
import os
import random
import shutil
import time
import warnings
import numpy as np
import logging
from tqdm import tqdm
import torch
import torch_geometric
import torchtext
import torch.backends.cudnn as cudnn
import pathlib
import GraphVQA.util.misc as utils
import pickle
import GraphVQA.Constants as Constants

from GraphVQA.gqa_dataset_entry import GQATorchDataset, GQATorchDataset_collate_fn
import json

from server import SCENE_GRAPH_CONFIG
from util import enablePrint, disablePrint

# models
from GraphVQA.pipeline_model_gat import PipelineModel as PipelineModelGAT
from GraphVQA.baseline_and_test_models.pipeline_model_gine import PipelineModel as PipelineModelGINE
from GraphVQA.baseline_and_test_models.pipeline_model_gcn import PipelineModel as PipelineModelGCN
from GraphVQA.baseline_and_test_models.pipeline_model_lcgn import PipelineModel as PipelineModelLCGN

AVAILABLE_MODELS = {
    "gat": PipelineModelGAT,
    "gine": PipelineModelGINE,
    "gcn": PipelineModelGCN,
    "lcgn": PipelineModelLCGN
}

def get_args_parser():
    parser = argparse.ArgumentParser('Explainable GQA Parser', add_help=False)
    parser.add_argument('-j', '--workers', default=32, type=int, metavar='N',
                        help='number of data loading workers (default: 4)')
    parser.add_argument('-b', '--batch-size', default=1, type=int,
                        metavar='N',
                        help='mini-batch size (default: 256), this is the total '
                             'batch size of all GPUs on the current node when '
                             'using Data Parallel or Distributed Data Parallel')
    parser.add_argument('-e', '--evaluate', dest='evaluate', default=True, action='store_true',
                        help='evaluate model on validation set')
    parser.add_argument('--evaluate_sets', default=['train_unbiased'], nargs='+',
                        help='Data sets/splits to perform evaluation, e.g. '
                             'val_unbiased, testdev etc. Multiple sets/splits '
                             'are supported and need to be separated by space')
    parser.add_argument('--output_dir', default='./outputdir',
                        help='path where to save, empty for no saving')

    return parser


class ModelAdapter():

    def __init__(self, args, server, paper_eval_mode=False):
        disablePrint()

        self.paper_eval_mode = paper_eval_mode

        self.args = args
        self.server = server
        self.splits = {}
        self.models = {}
        self.models_without_ddp = {}
        self.vocab = {}

        self.cuda = torch.device("cuda" if torch.cuda.is_available() else "cpu")    # Default CUDA device
        # self.cuda = torch.device("cpu")

        self.load_dataset()

        enablePrint()

        # print(self.answer_question("2390225", "Are there aliens in the picture?"))
        # print(self.answer_question("2390225", "Are there motorcycles in the picture?"))
        # print(self.answer_question("2390225", "What color is the right motorcycle?"))

    def print(self, text):
        enablePrint()
        print(text)
        disablePrint()

    def load_qa_vocab(self):
        with open(common.FILE_GQA_VOCAB_PICKLED, 'rb') as f:
            self.TEXT = pickle.load(f)

        sg_encoding_vocab = []

        with open(common.FILE_GQA_VOCAB_OBJECTS, 'r') as f:
            sg_encoding_vocab += f.read().splitlines()

        with open(common.FILE_GQA_VOCAB_ATTRIBUTES, 'r') as f:
            sg_encoding_vocab += f.read().splitlines()

        with open(common.FILE_GQA_VOCAB_RELATIONS, 'r') as f:
            sg_encoding_vocab += f.read().splitlines()

        self.vocab['objects'] = sg_encoding_vocab
        self.vocab['attributes'] = sg_encoding_vocab
        self.vocab['relations'] = sg_encoding_vocab
        self.vocab['questions'] = self.TEXT.vocab.itos

    def load_gt_split(self, split, data):
        # 'testdev' split is a hacky way to make the dataset not load any scenegraph ground truth
        # ...json, because we want to be more flexible regarding where the data comes from
        # ...to be able to share memory between this adapter and the server (and create the overlay)
        self.splits[split] = GQATorchDataset(
                split='testdev',
                build_vocab_flag=False,
                load_vocab_flag=self.args.evaluate
            )

        self.splits[split].sg_feature_lookup.sg_json_data = data

    def load_dataset(self):
        self.load_qa_vocab()
        utils.init_distributed_mode(self.args)

        for base_split, config in SCENE_GRAPH_CONFIG.items():
            file_name_base, file_name_overlay = config

            self.load_gt_split(base_split, self.server.scene_graph_data[base_split])

            if file_name_overlay is not None:
                overlay_split = "overlay_" + base_split
                self.load_gt_split(overlay_split, self.server.scene_graph_data[overlay_split])

    def prepare_model(self, name):
        assert(name in AVAILABLE_MODELS)

        disablePrint()

        self.print("Preparing {} model...".format(name))

        model_class = AVAILABLE_MODELS[name]
        parameters_path = common.FILE_CHECKPOINT_FOR_MODEL(name)

        ##################################
        # Initialize model
        # - note: must init dataset first. Since we will use the vocab from the dataset
        ##################################
        self.models[name] = model_class()

        ##################################
        # Deploy model on GPU
        ##################################
        self.models[name] = self.models[name].to(device=self.cuda)

        self.models_without_ddp[name] = self.models[name]
        if self.args.distributed:
            self.models[name] = torch.nn.parallel.DistributedDataParallel(
                self.models[name], device_ids=[args.gpu], find_unused_parameters=True
            )
            self.models_without_ddp[name] = self.models[name].module

        # n_parameters = sum(p.numel() for p in self.models[name].parameters() if p.requires_grad)
        # print('number of params:', n_parameters) # nn weights?

        # optionally resume from a checkpoint
        if os.path.isfile(parameters_path):
            self.print("Loading {} model parameters from '{}'...".format(name, parameters_path))
            # checkpoint = torch.load(parameters_path) # gpu
            checkpoint = torch.load(parameters_path, map_location=torch.device('cpu')) # cpu
            self.models_without_ddp[name].load_state_dict(checkpoint['model'])
        else:
            self.print("No {} model parameters found at '{}'".format(name, parameters_path))

        ##################################
        # Finalize model setup
        ##################################
        self.models[name].eval()

        self.print("Finished preparing {} model".format(name))

        enablePrint()

    def answer_question(self, image_id, model, question):
        # custom_question = "Are there aliens in the picture?"
        # custom_question = 'What color is the motorcycle in the center?'

        custom_question_tokenized = self.TEXT.preprocess(question)

        # print(custom_question_tokenized)

        custom_question_tokenized_list = (custom_question_tokenized,)

        # print(custom_question_tokenized_list)

        custom_question_processed_list = self.TEXT.process(custom_question_tokenized_list) # embeddings?

        # print(custom_question_processed_list)

        # self.val_dataset.datasets[0].data[0][0] = image_id
        # self.val_dataset.datasets[0].data[0][0] = "0"
        # self.val_dataset.datasets[0].data[0][1] = image_id
        # self.val_dataset.datasets[0].data[0][2] = question

        # quesid2ans = {}

        synthetic_edges = []

        with torch.no_grad():
            # for i, (data_batch) in enumerate(self.val_loader):

                # questionID, questions, gt_scene_graphs = data_batch # gt_scene_graphs == sg_datum

                # _, _, gt_scene_graphs, _, _, _, _ = data_batch

                # print("proper")
                # print(gt_scene_graphs)

                questions = custom_question_processed_list
                # gt_scene_graphs = torch_geometric.data.Batch.from_data_list([
                #     self.val_dataset.datasets[0].sg_feature_lookup.query_and_translate(str(image_id),
                #     [[0], [0]])
                # ])

                img_id_str = str(image_id)

                sg_data = []

                for base_split, config in SCENE_GRAPH_CONFIG.items():
                    file_name_base, file_name_overlay = config

                    if file_name_overlay is not None:
                        overlay_split = "overlay_" + base_split

                        if img_id_str in self.splits[overlay_split].sg_feature_lookup.sg_json_data:
                            sg_data = self.splits[overlay_split].sg_feature_lookup.query_and_translate(img_id_str, [[0], [0]])
                            break

                    if img_id_str in self.splits[base_split].sg_feature_lookup.sg_json_data:
                        sg_data = self.splits[base_split].sg_feature_lookup.query_and_translate(img_id_str, [[0], [0]])
                        break

                synthetic_edges = sg_data.added_sym_edge.tolist()

                gt_scene_graphs = torch_geometric.data.Batch.from_data_list([
                    sg_data
                ])

                # print("custom")
                # print(gt_scene_graphs_custom)

                questions, gt_scene_graphs = [
                    datum.to(device=self.cuda, non_blocking=True) for datum in [
                        questions, gt_scene_graphs
                    ]
                ]

                this_batch_size = questions.size(1)

                ##################################
                # Generate model output
                ##################################
                output = self.models[model](
                    questions,
                    gt_scene_graphs,
                    None,
                    None,
                    SAMPLE_FLAG=True
                )
                programs_output_pred, short_answer_logits, node_weights, edge_map, edge_attention_list = output

                short_answer_pred_score, short_answer_pred_label = short_answer_logits.cpu().sort(1, descending=True)

        # print(short_answer_pred_score)
        short_answer_pred_score = short_answer_pred_score.softmax(dim=1)
        # print(short_answer_pred_score)
        # pred_score_sum = short_answer_pred_score[0].sum()
        # print("sum: {}".format(pred_score_sum))

        # question = questions[0].cpu()
        # question_sent, _ = GQATorchDataset.indices_to_string(question, True)

        # prediction1 = GQATorchDataset.label2ans[short_answer_pred_label[0][0].item()]
            # short_answer_pred_label[0].size(dim=0) - 1 # last element

        # score1 = short_answer_pred_score[0][0].item()
            # short_answer_pred_score[0].size(dim=0) - 1 # index of last element

        predictions = []

        for pred_label in short_answer_pred_label[0]:
            predictions.append(GQATorchDataset.label2ans[pred_label.item()])

        scores = []

        for score in short_answer_pred_score[0]:
            scores.append(score.item())

        # predictions = [prediction1, prediction2, prediction3, prediction4, prediction5]
        # scores = [score1, score2, score3, score4, score5]

        if not isinstance(node_weights, list):
            node_weights = [node_weights]

        # print(predictions)
        # print(scores)

        if not isinstance(edge_map, list):
            edge_map = edge_map.tolist()

        node_weights_finalized = self.finalize_node_weights(image_id, node_weights)

        edge_weights_finalized = []
        if model == "gat":
            for edge_attention in edge_attention_list:

                if not isinstance(edge_attention, list):
                    edge_attention = edge_attention.tolist()

                edge_weights_finalized.append(self.finalize_edge_weights(image_id, edge_map, synthetic_edges, edge_attention))

        return (predictions, scores, node_weights_finalized, edge_weights_finalized)

    def answer_questions(self, image_ids, model, questions):

        # for some reason the first question in a batch always yields
        # different results...
        # so we add a filler question @idx 0
        # edit: seems like questions in a batch all have to be of the same length and consequently get padded
        # so we make the first question 50 tokens long...
        # note: if you remove the following two lines, also remove the cleanup code further down below
        _image_ids = [1, *image_ids]
        questions = ["a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a", *questions]

        tokenized_questions = []

        for question in questions:
            custom_question_tokenized = self.TEXT.preprocess(question)
            tokenized_questions.append(custom_question_tokenized)

        questions = self.TEXT.process(tokenized_questions) # embeddings?

        synthetic_edges = []

        with torch.no_grad():
            gt_scene_graphs = []

            for image_id in _image_ids:
                img_id_str = str(image_id)

                sg_data = []

                for base_split, config in SCENE_GRAPH_CONFIG.items():
                    file_name_base, file_name_overlay = config

                    if file_name_overlay is not None:
                        overlay_split = "overlay_" + base_split

                        if img_id_str in self.splits[overlay_split].sg_feature_lookup.sg_json_data:
                            sg_data = self.splits[overlay_split].sg_feature_lookup.query_and_translate(img_id_str, [[0], [0]])
                            break

                    if img_id_str in self.splits[base_split].sg_feature_lookup.sg_json_data:
                        sg_data = self.splits[base_split].sg_feature_lookup.query_and_translate(img_id_str, [[0], [0]])
                        break

                gt_scene_graphs.append(sg_data)
                synthetic_edges.append(sg_data.added_sym_edge.tolist())

            gt_scene_graphs = torch_geometric.data.Batch.from_data_list(gt_scene_graphs)

            questions, gt_scene_graphs = [
                datum.to(device=self.cuda, non_blocking=True) for datum in [
                    questions, gt_scene_graphs
                ]
            ]

            # this_batch_size = questions.size(1)

            ##################################
            # Generate model output
            ##################################
            output = self.models[model](
                questions,
                gt_scene_graphs,
                None,
                None,
                SAMPLE_FLAG=True
            )
            programs_output_pred, short_answer_logits, node_weights, edge_map, edge_attention_steps = output

            short_answer_pred_score, short_answer_pred_label = short_answer_logits.cpu().sort(1, descending=True)

        short_answer_pred_score = short_answer_pred_score[1:] # note: remove this if you remove the filler question at idx 0
        short_answer_pred_label = short_answer_pred_label[1:] # note: remove this if you remove the filler question at idx 0

        # print(short_answer_pred_score)
        short_answer_pred_score = short_answer_pred_score.softmax(dim=1)
        # print(short_answer_pred_score)

        # question = questions[0].cpu()
        # question_sent, _ = GQATorchDataset.indices_to_string(question, True)

        predictions = []

        pred_idx = 0
        while pred_idx < len(short_answer_pred_label):
            for pred_label in short_answer_pred_label[pred_idx]:

                if len(predictions) == pred_idx:
                    predictions.append([])

                predictions[pred_idx].append(GQATorchDataset.label2ans[pred_label.item()])

            pred_idx += 1

        scores = []

        score_idx = 0
        while score_idx < len(short_answer_pred_score):
            for score in short_answer_pred_score[score_idx]:

                if len(scores) == score_idx:
                    scores.append([])

                scores[score_idx].append(score.item())

            score_idx += 1

        if not isinstance(node_weights, list):
            node_weights = [node_weights]

        batched_gates = []
        batch_targets = gt_scene_graphs.batch.tolist() # array mapping batch data index to input index (in order to be able to unpack)

        assert len(node_weights) == len(batch_targets)

        # unpack node weights
        gate_idx = 0
        while gate_idx < len(batch_targets):
            target_idx = batch_targets[gate_idx]

            if len(batched_gates) == target_idx:
                batched_gates.append([])

            batched_gates[target_idx].append(node_weights[gate_idx])

            gate_idx += 1

        # drop node weights for injected question
        batched_gates = batched_gates[1:] # note: remove this if you remove the filler question at idx 0

        # assign node weights to node ids below
        node_weights_finalized = []
        batch_idx = 0

        # (code duplication for performance reasons)
        if self.paper_eval_mode:
            while batch_idx < len(batched_gates):
                node_weights_finalized.append(self.finalize_node_weights_paper_eval(image_ids[batch_idx], batched_gates[batch_idx]))
                batch_idx += 1
        else:
            while batch_idx < len(batched_gates):
                node_weights_finalized.append(self.finalize_node_weights(image_ids[batch_idx], batched_gates[batch_idx]))
                batch_idx += 1

        # print(predictions[2])
        # print(scores[2])

        if not isinstance(edge_map, list):
            edge_map = edge_map.tolist()

        edge_weights_finalized = []
        if model == "gat":
            # unbatch edge_map and edge_index...
            batched_edge_map = []
            batched_edge_attention_steps = []
            gate_idx = 0
            start_idx_of_current_graph = 0
            current_batch = 0
            current_graph = batch_targets[0] # technically the same as current_batch, but this allows us to handle non-continuous indices
            end = False
            while not end:
                if gate_idx == len(batch_targets):
                    end = True # we need to finalize the last graph
                else:
                    target_idx = batch_targets[gate_idx]

                # check if we're at the end of the data or at the next graph
                if target_idx != current_graph or end: # next graph or no more data
                    # finalize previous graph...

                    new_step_edge_list = []
                    for step in edge_attention_steps:
                        new_step_edge_list.append([])

                    batched_edge_attention_steps.append(new_step_edge_list)
                    batched_edge_map.append([[], []])

                    # go through all edges
                    edge_idx = 0
                    while edge_idx < len(edge_map[0]):
                        from_node = edge_map[0][edge_idx]

                        # if the edge is part of the previous graph
                        if from_node >= start_idx_of_current_graph and from_node < gate_idx:
                            # ... add it to its list
                            to_node = edge_map[1][edge_idx]
                            batched_edge_map[current_batch][0].append(from_node - start_idx_of_current_graph)
                            batched_edge_map[current_batch][1].append(to_node - start_idx_of_current_graph)

                            current_step = 0
                            for edge_attention_step in edge_attention_steps:
                                batched_edge_attention_steps[current_batch][current_step].append(edge_attention_step[edge_idx])
                                current_step += 1

                        edge_idx += 1

                    # prepare for next graph
                    current_batch += 1
                    start_idx_of_current_graph = gate_idx
                    current_graph = target_idx

                gate_idx += 1

            # remove injected question
            synthetic_edges = synthetic_edges[1:] # note: remove this if you remove the filler question at idx 0
            batched_edge_map = batched_edge_map[1:] # note: remove this if you remove the filler question at idx 0
            batched_edge_attention_steps = batched_edge_attention_steps[1:] # note: remove this if you remove the filler question at idx 0

            img_idx = 0
            while img_idx < len(image_ids):
                img_id = image_ids[img_idx]
                edge_attention_steps = batched_edge_attention_steps[img_idx]
                edge_weights_finalized.append([]) # for current batch entry (question)

                for edge_attention in edge_attention_steps:
                    if not isinstance(edge_attention, list):
                        edge_attention = edge_attention.tolist()

                    edge_weights_finalized[img_idx].append(self.finalize_edge_weights(img_id, batched_edge_map[img_idx], synthetic_edges[img_idx], edge_attention))

                img_idx += 1
        else:
            # if model is not gat, create empty edge weights list for each question
            for scene in image_ids:
                edge_weights_finalized.append([])

        return (predictions, scores, node_weights_finalized, edge_weights_finalized)

    def get_vocab(self):
        return self.vocab

    def finalize_node_weights(self, image_id, node_weights):
        # This turns the weight structure from an array containing the values
        # into a map, mapping an object's id to its value.

        split, sg_json = self.server.get_scene_graph_data(image_id)
        ordered_ids = self.order_object_ids(sg_json['objects'].keys())

        finalized_node_weights = {}

        obj_idx = 0
        while obj_idx < len(ordered_ids):
            obj_id = ordered_ids[obj_idx]
            finalized_node_weights[obj_id] = node_weights[obj_idx]
            obj_idx += 1

        return finalized_node_weights

    def finalize_edge_weights(self, image_id, edge_map, synthetic_edges, edge_attention):
        # This function assumes that if there are multiple relations bewteen two nodes
        # (pointing the same direction), their order is preserved all throughout the application.
        # Unfortunately relations don't have their own ids. The frontend generates UUIDs for them.

        split, sg_json = self.server.get_scene_graph_data(image_id)
        ordered_ids = self.order_object_ids(sg_json['objects'].keys())

        finalized_edge_weights = []

        if len(ordered_ids) > 0:
            edge_idx = 0
            while edge_idx < len(edge_map[0]):
                edge_type = 1
                from_obj_idx = edge_map[0][edge_idx]
                to_obj_idx = edge_map[1][edge_idx]

                # if edge_idx in synthetic_edges or from_obj_idx == to_obj_idx: # drop self-connections as well
                #    edge_idx += 1
                #    continue

                if edge_idx in synthetic_edges:
                    edge_type = 4
                elif from_obj_idx == to_obj_idx:
                    edge_type = 2

                weight = edge_attention[edge_idx]
                # weight = weight[3]

                if not isinstance(weight, list):
                    weight = weight.tolist()

                if self.paper_eval_mode:
                    # client receives all four attention heads
                    # for evaluation data generation we instead immediately determine an avg
                    weight = sum(weight) / len(weight)

                finalized_edge_weights.append({
                    "from": ordered_ids[from_obj_idx],
                    "to": ordered_ids[to_obj_idx],
                    "weight": weight,
                    "type": edge_type # 1: regular, 2: loopback, 4: synthetic
                })

                edge_idx += 1

        return finalized_edge_weights

    def finalize_node_weights_paper_eval(self, image_id, node_weights):
        return node_weights

    def finalize_edge_weights_paper_eval(self, image_id, edge_map, synthetic_edges, edge_attention):
        """
        Currently unused function.
        """

        edge_attention_avg = []

        i = 0
        while i < len(edge_attention):
            ea = edge_attention[i].tolist()
            head_avg = ea[0]
            head_avg += ea[1]
            head_avg += ea[2]
            head_avg += ea[3]
            head_avg = head_avg / 4
            edge_attention_avg.append(head_avg)
            i += 1

        return edge_attention_avg

    def order_object_ids(self, ids):
        ordered_ids = sorted(ids) # to match gqa_dataset_entry.py:231
        return ordered_ids

def InitializeModelAdapter(server, paper_eval_mode=False):
    parser = argparse.ArgumentParser('Explainable GQA training and evaluation script',
                                     parents=[get_args_parser()])
    args = parser.parse_args([])

    return ModelAdapter(args, server, paper_eval_mode)
