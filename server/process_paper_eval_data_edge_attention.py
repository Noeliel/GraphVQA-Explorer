# NOTE: You can't just execute this file to reproduce the results. See bottom of the file for more information!

import os.path
import csv
import json
import pickle
import spacy
from spacy.vocab import Vocab
from spacy.tokenizer import Tokenizer
from spacy.matcher import PhraseMatcher
import matplotlib.pyplot as plt
import numpy as np

import common
from server import GQAVisServer
from adapter import ModelAdapter, InitializeModelAdapter

eval_model = 'gat'

def load_token_dicts():
    token_itos = {}
    token_stoi = {}

    with open('tokens_fixed.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            token_itos[row['id']] = row['text']
            token_stoi[row['text']] = row['id']

    return (token_itos, token_stoi)


def load_data():
    f = open(os.path.join(common.FOLDERNAME_DATASET_ROOT, "paper_eval_{}.json".format(eval_model)), 'r')
    data = json.load(f)
    f.close()
    return data


def load_question_vocab():
    tokens = []

    with open(common.FILE_GQA_VOCAB_PICKLED, 'rb') as f:
        tokens += pickle.load(f).vocab.itos

    return tokens


def get_qa_nlp():
    _, sg_stoi = load_token_dicts()
    sg_tokens = sg_stoi.keys()
    question_tokens = load_question_vocab()

    tokens = [*sg_tokens, *question_tokens]
    vocab = Vocab(strings=question_tokens)

    tokenizer = Tokenizer(vocab)
    matcher = PhraseMatcher(vocab)

    for token in sg_tokens:
        matcher.add(token, [tokenizer(token)])

    return tokenizer, matcher


def regenerate_unique_token_dict():
    with open('tokens_new.csv', 'w', newline='') as csvfile:
        tokens = list(set(adapter.vocab['objects']))

        fieldnames = ['id', 'text']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, token in enumerate(tokens):
            writer.writerow({'id': idx, 'text': token})


def load_token_dicts():
    token_itos = {}
    token_stoi = {}

    with open('tokens_fixed.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            token_itos[row['id']] = row['text']
            token_stoi[row['text']] = row['id']

    return (token_itos, token_stoi)


def generate_objects():
    scene_graphs = server.scene_graph_data["eval"]
    outputs = []

    for scene_id in scene_graphs:
        scene_id_int = int(scene_id)
        scene = scene_graphs[scene_id]

        for obj_id in scene['objects']:
            obj_id_int = int(obj_id)
            obj = scene['objects'][obj_id]

            outputs.append({'scene_id': scene_id_int, 'id': obj_id_int})

    with open('objects.csv', 'w', newline='') as csvfile:
        fieldnames = ['scene_id', 'id']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_relations():
    scene_graphs = server.scene_graph_data["eval"]
    token_itos, token_stoi = load_token_dicts()
    outputs = []

    for scene_id in scene_graphs:
        scene = scene_graphs[scene_id]

        for obj_id in scene['objects']:
            obj = scene['objects'][obj_id]

            targets = {}
            for relation in obj['relations']:
                target_id = relation['object']
                token = relation['name']
                token_id = None

                if token in token_stoi:
                    token_id = token_stoi[token]
                else:
                    print("NOT FOUND: {}".format(token))

                rank = 0
                if target_id in targets:
                    rank = targets[target_id]
                rank += 1
                targets[target_id] = rank

                outputs.append({
                    'rank': rank,
                    'scene_id': int(scene_id),
                    'source_id': int(obj_id),
                    'target_id': int(relation['object']),
                    'token': token_id
                })

    with open('relations.csv', 'w', newline='') as csvfile:
        fieldnames = ['rank', 'scene_id', 'source_id', 'target_id', 'token']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_instances():
    data = load_data()
    outputs = []

    for instance_id in data:
        instance = data[instance_id]

        outputs.append({
            'id': instance_id,
            'scene_id': int(instance['sid']),
            'question': instance['q'],
            'ambiguity': instance['ambig'],
            'ground_truth': instance['gt'],
            'correct': True if instance['p'][0] == instance['gt'] else False
        })

    with open('instances.csv', 'w', newline='') as csvfile:
        fieldnames = ['id', 'scene_id', 'question', 'ambiguity', 'ground_truth', 'correct']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_token_occurrences_objects():
    scene_graphs = server.scene_graph_data["eval"]
    token_itos, token_stoi = load_token_dicts()

    outputs = []

    for scene_id in scene_graphs:
        scene_id_int = int(scene_id)
        scene = scene_graphs[scene_id]

        for obj_id in scene['objects']:
            obj_id_int = int(obj_id)
            obj = scene['objects'][obj_id]

            for token in [obj['name'], *obj['attributes']]:
                if token in token_stoi:
                    result = token_stoi[token]
                    outputs.append({'token_id': result, 'object_id': obj_id_int, 'scene_id': scene_id_int})
                else:
                    print("NOT FOUND: {}".format(token))

    with open('token_occurrences_objects.csv', 'w', newline='') as csvfile:
        fieldnames = ['token_id', 'object_id', 'scene_id']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_instance_gate():
    data = load_data()
    outputs = []

    for instance_id in data:
        instance = data[instance_id]

        for node_idx, node_id in enumerate(instance['fk']):
            outputs.append({
                'instance_id': instance_id,
                'object_id': int(node_id),
                'value': instance['w'][node_idx]
            })

    with open('instance_gate.csv', 'w', newline='') as csvfile:
        fieldnames = ['instance_id', 'object_id', 'value']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_token_occurrences_instances():
    data = load_data()
    tokenizer, matcher = get_qa_nlp()
    token_itos, token_stoi = load_token_dicts()
    outputs = []

    for instance_id in data:
        instance = data[instance_id]
        question_text_tokens = tokenizer(instance['q'])
        matches = matcher(question_text_tokens)

        for match_id, start, end in matches:
            span = question_text_tokens[start:end]
            token = span.text

            if token in token_stoi:
                result = token_stoi[token]
                outputs.append({'token_id': result, 'instance_id': instance_id})
            else:
                print("NOT FOUND: {}".format(token))

    with open('token_occurrences_instances.csv', 'w', newline='') as csvfile:
        fieldnames = ['token_id', 'instance_id']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def generate_instance_attention():
    data = load_data()
    outputs = []

    for instance_id in data:
        instance = data[instance_id]

        for i_step, step in enumerate(instance['ea']):

            ranks = {}
            for edge in step:
                source_id = edge['from']
                target_id = edge['to']
                value = edge['weight']
                e_type = edge['type']

                rank = 0
                if source_id in ranks:
                    targets = ranks[source_id]
                    if target_id in targets:
                        rank = targets[target_id]
                else:
                    ranks[source_id] = {}

                rank += 1
                ranks[source_id][target_id] = rank

                outputs.append({
                    'instance_id': instance_id,
                    'source_id': int(source_id),
                    'target_id': int(target_id),
                    'rank': rank,
                    'value': value,
                    'step': i_step + 1,
                    'type': e_type
                })


    with open('instance_attention.csv', 'w', newline='') as csvfile:
        fieldnames = ['instance_id', 'source_id', 'target_id', 'rank', 'value', 'step', 'type']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for idx, entry in enumerate(outputs):
            writer.writerow(entry)


def plot_data(results, x_label="", y_label=""):
    dim = np.arange(0, len(results[0]))
    plt.figure(figsize=(6, 4))

    for idx, result in enumerate(results):
        plt.plot(dim, result, label="convolution {}".format(idx + 1))

    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.xticks(dim)
    plt.legend()
    plt.subplots_adjust(0.089, 0.11, 1, 1)
    plt.show()


def plot():
    _data = [
        [ # step 1
            [], [], [], [], [], []
        ],
        [ # step 2
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ]
    ]

    _data2 = [
        [ # step 1
            [], [], [], [], [], []
        ],
        [ # step 2
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ],
        [
            [], [], [], [], [], []
        ]
    ]

    with open('edge_attention_source_node_coocs.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            step = int(row['step']) - 1
            coocs = int(row['nq_coocs'])
            value = float(row['avg_edge_attention'])
            _data[step][coocs] = value

    with open('edge_attention_target_node_coocs.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            step = int(row['step']) - 1
            coocs = int(row['nq_coocs'])
            value = float(row['avg_edge_attention'])
            _data2[step][coocs] = value


    data = []
    for i_step, step in enumerate(_data):
        data.append([])
        for i_value, value in enumerate(step):
            if i_value < 4:
                data[i_step].append(value)

    data2 = []
    for i_step, step in enumerate(_data2):
        data2.append([])
        for i_value, value in enumerate(step):
            if i_value < 4:
                data2[i_step].append(value)

    plot_data(data, x_label="token co-occurrences between question and edge source node", y_label="avg edge attention ratio")
    plot_data(data2, x_label="token co-occurrences between question and edge target node", y_label="avg edge attention ratio")

# - edge attention results were generated with the help of postgres due to the sheer bulk of data
# - for this purpose, data generated with generate_paper_eval_data.py was transformed into various .csv files and then loaded into tables in postgres
# - through sql queries, output data was produced and exported (into edge_attention_source_node_coocs.csv and edge_attention_target_node_coocs.csv)
# - you can plot the results using this script as well

# practical steps for reproducing edge attention results:

### first, generate data to load into RDBMS
# generate_objects() # -> objects.csv
# generate_relations() # -> relations.csv
# generate_instances() # -> instances.csv
# generate_token_occurrences_objects() # -> token_occurrences_objects.csv
# generate_instance_gate() # -> instance_gate.csv()
# generate_token_occurrences_instances() # -> token_occurrences_instances.csv
# generate_instance_attention() # -> instance_attention.csv

### second, load these into postgres
### third, run queries (see edge_attention_database.7z)

### fourth, export query results

### fifth, plot results:
plot()
