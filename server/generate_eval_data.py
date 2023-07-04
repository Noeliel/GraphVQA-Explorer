# use this script to generate evaluation data for the evalbrowser component

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


def calculateAmbiguity(question, graph_objects):
    doc = nlp(question)
    nouns = []

    # print(question)
    # for token in doc:
        # print(token, token.pos_)
    # print("----------------")

    for token in doc:
        if token.pos_ == 'NOUN':
            nouns.append(token.text.lower())
            if token.text != token.lemma_:
                nouns.append(token.lemma_.lower())

    if len(nouns) < 1:
        return 0

    objects = []

    for obj_id in graph_objects:
        objects.append(graph_objects[obj_id]['name'].lower())

    ambiguity = 0

    for noun in nouns:
        ambig_counter = -1

        for obj in objects:
            if noun == obj:
                ambig_counter = ambig_counter + 1

        if ambig_counter > 0:
            ambiguity = ambiguity + ambig_counter

    return ambiguity


def generateEvaluationSingle():
    server = GQAVisServer()
    adapter = InitializeModelAdapter(server)
    adapter.prepare_model(eval_model)

    print("Loading questions...")
    questions = loadFile(common.FILE_QUESTIONS_FOR_QUESTION_SPLIT(eval_split))
    num_questions = questions.__len__()
    print("Loaded {} questions".format(num_questions))

    i = 1
    results = {}

    for question_id in questions:
        scene_id = questions[question_id]['imageId']
        question = questions[question_id]['question']
        answer = questions[question_id]['answer']

        redo = True
        while redo:
            redo = False

            _, graph_data = server.get_scene_graph_data(scene_id)
            graph_objects = graph_data['objects']

            predictions, confidence, graph_gate, _ = adapter.answer_question(scene_id, eval_model, question)

            objects = []
            for obj in sorted(graph_objects.keys()):
                objects.append(graph_objects[obj]['name'])

            object_weight = []

            l = 0
            while l < len(objects):
                object_weight.append({'name': objects[l], 'weight': graph_gate[l]})
                l = l + 1

            object_weight.sort(key=sortByWeight, reverse=True)

            ambig = calculateAmbiguity(question, graph_objects)

            results[question_id] = {
                'sid': scene_id,
                'q': question,
                'ambig': ambig,
                'gt': answer,
                'p1': predictions[0],
                'c1': confidence[0],
                'p2': predictions[1],
                'c2': confidence[1],
                'p3': predictions[2],
                'c3': confidence[2],
                'p4': predictions[3],
                'c4': confidence[3],
                'p5': predictions[4],
                'c5': confidence[4],
                'f1': objOrNone(object_weight, 0),
                'w1': attOrZero(object_weight, 0),
                'f2': objOrNone(object_weight, 1),
                'w2': attOrZero(object_weight, 1),
                'f3': objOrNone(object_weight, 2),
                'w3': attOrZero(object_weight, 2),
                'f4': objOrNone(object_weight, 3),
                'w4': attOrZero(object_weight, 3),
                'f5': objOrNone(object_weight, 4),
                'w5': attOrZero(object_weight, 4),
            }

            if math.isnan(results[question_id]['c1']):
                redo = True

        if i % 10 == 0:
            print("{} / {}   ( {} % )".format(i, num_questions, (i / num_questions) * 100))
        i = i + 1

    data_folder = common.FOLDER_RESULTS_FOR_MODEL(eval_model)
    if not os.path.isdir(data_folder):
        os.mkdir(data_folder)

    f = open(common.FILE_RESULTS_FOR_MODEL_AND_QUESTION_SPLIT(eval_model, eval_split), 'w')
    json.dump(results, f)
    f.close()


def generateEvaluationMulti():
    server = GQAVisServer()
    adapter = InitializeModelAdapter(server)
    adapter.prepare_model(eval_model)

    batch_size = 750

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
            predictions, confidence, graph_gate, _ = adapter.answer_questions(batch_sids, eval_model, batch_questions)
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

                    _, graph_data = server.get_scene_graph_data(scene_id)
                    graph_objects = graph_data['objects']

                    objects = []
                    for obj in sorted(graph_objects.keys()):
                        objects.append(graph_objects[obj]['name'])

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
                        'p1': i_predictions[0],
                        'c1': i_confidence[0],
                        'p2': i_predictions[1],
                        'c2': i_confidence[1],
                        'p3': i_predictions[2],
                        'c3': i_confidence[2],
                        'p4': i_predictions[3],
                        'c4': i_confidence[3],
                        'p5': i_predictions[4],
                        'c5': i_confidence[4],
                        'f1': objOrNone(object_weight, 0),
                        'w1': attOrZero(object_weight, 0),
                        'f2': objOrNone(object_weight, 1),
                        'w2': attOrZero(object_weight, 1),
                        'f3': objOrNone(object_weight, 2),
                        'w3': attOrZero(object_weight, 2),
                        'f4': objOrNone(object_weight, 3),
                        'w4': attOrZero(object_weight, 3),
                        'f5': objOrNone(object_weight, 4),
                        'w5': attOrZero(object_weight, 4),
                    }

                    batch_i = batch_i + 1

        print("{} / {}   ( {} % )".format(q_i, num_questions, (q_i / num_questions) * 100))

    data_folder = common.FOLDER_RESULTS_FOR_MODEL(eval_model)
    if not os.path.isdir(data_folder):
        os.mkdir(data_folder)

    f = open(common.FILE_RESULTS_FOR_MODEL_AND_QUESTION_SPLIT(eval_model, eval_split), 'w')
    json.dump(results, f)
    f.close()


def merge_fix():
    f = open(os.path.join(common.FOLDER_RESULTS_FOR_MODEL(eval_model), "faulty_results_train_balanced_questions.json"), 'r')
    full_results = json.load(f)
    f.close()

    f = open(os.path.join(common.FOLDER_RESULTS_FOR_MODEL(eval_model), "corrections_results_train_balanced_questions.json"), 'r')
    correction_results = json.load(f)
    f.close()

    for question_id in correction_results:
        if full_results[question_id] != correction_results[question_id]:
            print("Fixing {}".format(question_id))
            print("Old: {}".format(full_results[question_id]))
            print("New: {}".format(correction_results[question_id]))
            print("\n")
            full_results[question_id] = correction_results[question_id]
        else:
            print("No fix needed for {}".format(question_id))

    f = open(common.FILE_RESULTS_FOR_MODEL_AND_QUESTION_SPLIT(eval_model, eval_split), 'w')
    json.dump(full_results, f)
    f.close()


def checkEvaluation():
    f = open(eval_model_data_file, 'r')
    questions = json.load(f)
    f.close()

    for question_id in questions:
        data = questions[question_id]
        if math.isnan(data['c1']):
            print("Error in question {}".format(question_id))


generateEvaluationMulti()
# merge_fix()
