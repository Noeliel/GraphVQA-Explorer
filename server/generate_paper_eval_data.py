# use this script to replicate publication results
# (swap code blocks between 201-229 depending on mode)

import common
import os.path
import json
import math
import spacy
from server import GQAVisServer
from adapter import ModelAdapter, InitializeModelAdapter

nlp = spacy.load("en_core_web_sm")

eval_model = 'gat'
eval_split = 'val'

# function copied from GraphVQA/eval.py
def loadFile(path):
    # load standard json file
    if os.path.isfile(path):
        with open(path) as file:
            data = json.load(file)
    # load file chunks if too big
    elif os.path.isdir(path.split(".")[0]):
        data = {}
        chunks = glob.glob('{dir}/{dir}_*.{ext}'.format(dir = path.split(".")[0], ext = path.split(".")[1]))
        for chunk in chunks:
            with open(chunk) as file:
                data.update(json.load(file))
    else:
        raise Exception("Can't find {}".format(path))
    return data


def sortByWeight(val):
    return val['weight']

def objOrNone(arr, idx):
    if len(arr) > idx:
        return arr[idx]['name']
    else:
        return '-'

def attOrZero(arr, idx):
    if len(arr) > idx:
        return arr[idx]['weight']
    else:
        return 0


def tokenizeNouns(sentence, include_lemmas=True):
    doc = nlp(sentence)
    nouns = []

    for token in doc:
        if token.pos_ == 'NOUN':
            text_lower = token.text.lower()
            nouns.append(text_lower)

            if include_lemmas:
                lemma_lower = token.lemma_.lower()

                if text_lower != lemma_lower:
                    nouns.append(lemma_lower)

    return nouns


def calculateAmbiguity(question, graph_objects):
    nouns = tokenizeNouns(question)

    if len(nouns) < 1:
        return 0

    objects = []

    for obj_id in graph_objects:
        objects.append(graph_objects[obj_id]['name'].lower())

        for attribute in graph_objects[obj_id]['attributes']:
            objects.append(attribute.lower())

    ambiguity = 0

    for noun in nouns:
        ambig_counter = -1

        for obj in objects:
            if noun == obj:
                ambig_counter = ambig_counter + 1

        if ambig_counter > 0:
            ambiguity = ambiguity + ambig_counter

    return ambiguity


def generateEvaluationMulti():
    server = GQAVisServer()
    adapter = InitializeModelAdapter(server, paper_eval_mode=True)
    adapter.prepare_model(eval_model)

    batch_size = 1000

    print("Loading questions...")
    questions = loadFile(common.FILE_QUESTIONS_FOR_QUESTION_SPLIT(eval_split))
    num_questions = questions.__len__()
    print("Loaded {} questions".format(num_questions))

    q_i = 0
    results = {}

    question_ids = []
    for question_id in questions:
        # imgid = questions[question_id]['imageId']
        # if imgid == "1" or imgid == "2337488" or imgid == "2398682":
        question_ids.append(question_id)

    # num_questions = len(question_ids)

    while q_i < num_questions:
        # create batch

        batch_i = 0
        batch_qids = []
        batch_sids = []
        batch_questions = []
        batch_answers = []

        while q_i < num_questions and batch_i < batch_size:
            batch_qids.append(question_ids[q_i])
            batch_sids.append(questions[question_ids[q_i]]['imageId'])
            batch_questions.append(questions[question_ids[q_i]]['question'])
            batch_answers.append(questions[question_ids[q_i]]['answer'])

            batch_i = batch_i + 1
            q_i = q_i + 1

        current_batch_size = batch_i

        assert current_batch_size == len(batch_qids)
        assert current_batch_size == len(batch_sids)
        assert current_batch_size == len(batch_questions)
        assert current_batch_size == len(batch_answers)

        # batch creation complete, generate results

        redo = True
        while redo:
            redo = False

            print("running model")
            predictions, confidence, graph_gate, edge_attention = adapter.answer_questions(batch_sids, eval_model, batch_questions)
            print("done")

            assert current_batch_size == len(predictions)
            assert current_batch_size == len(confidence)
            assert current_batch_size == len(graph_gate)

            for scene_confidence in confidence:
                if math.isnan(scene_confidence[0]):
                    redo = True
                    break

            if not redo:
                batch_i = 0

                while batch_i < current_batch_size:
                    question_id = batch_qids[batch_i]
                    scene_id = batch_sids[batch_i]
                    question = batch_questions[batch_i]
                    answer = batch_answers[batch_i]
                    i_predictions = predictions[batch_i]
                    i_confidence = confidence[batch_i]
                    i_graph_gate = graph_gate[batch_i]
                    i_edge_attention = edge_attention[batch_i]

                    _, graph_data = server.get_scene_graph_data(scene_id)
                    graph_objects = graph_data['objects']

                    objects = []
                    fk = sorted(graph_objects.keys())
                    for obj in fk:
                        tokens = [graph_objects[obj]['name'], *graph_objects[obj]['attributes']]
                        tokens_lower = []

                        for token in tokens:
                            tokens_lower.append(token.lower())

                        objects.append(tokens_lower)

                    object_weight = []
                    l = 0
                    while l < len(objects):
                        object_weight.append({'name': objects[l], 'weight': i_graph_gate[l]})
                        l = l + 1

                    object_weight.sort(key=sortByWeight, reverse=True)

                    ambig = calculateAmbiguity(question, graph_objects)

                    results[question_id] = {
                        'sid': scene_id,
                        'q': question,
                        'ambig': ambig,
                        'gt': answer,
                        'p': i_predictions[0:10],
                        'c': i_confidence[0:10],
                        # 'short_answer_logits': i_confidence,
                        # 'graph_gate': i_graph_gate,
                        'f': objects, # name of focused node
                        'fk': fk,
                        'w': i_graph_gate, # weight of focused node
                        'ea': i_edge_attention, # edge attention (avg) in convolutions
                    }

                    batch_i = batch_i + 1

        print("{} / {}   ( {} % )".format(q_i, num_questions, (q_i / num_questions) * 100))

    f = open(os.path.join(common.FOLDERNAME_DATASET_ROOT, "paper_eval_{}.json".format(eval_model)), 'w')
    json.dump(results, f)
    f.close()


generateEvaluationMulti()
