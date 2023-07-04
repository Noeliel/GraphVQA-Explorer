import common
import os.path
import json
import math
import pickle
import spacy
from spacy.vocab import Vocab
from spacy.tokenizer import Tokenizer
from spacy.matcher import PhraseMatcher

import matplotlib.pyplot as plt
import numpy as np

import scipy.stats

nlp = spacy.load("en_core_web_sm")

eval_model = 'gat'

def load_sg_encoding_vocab():
    tokens = []

    with open(common.FILE_GQA_VOCAB_OBJECTS, 'r') as f:
        tokens += f.read().splitlines()

    with open(common.FILE_GQA_VOCAB_ATTRIBUTES, 'r') as f:
        tokens += f.read().splitlines()

    with open(common.FILE_GQA_VOCAB_RELATIONS, 'r') as f:
        tokens += f.read().splitlines()

    return tokens


def load_question_vocab():
    tokens = []

    with open(common.FILE_GQA_VOCAB_PICKLED, 'rb') as f:
        tokens += pickle.load(f).vocab.itos

    return tokens


def get_qa_nlp():
    # load object + attrib + relation vocab strings
    # load question vocab strings
    # merge
    # return spacy tokenizer

    sg_tokens = load_sg_encoding_vocab()
    question_tokens = load_question_vocab()

    tokens = [*sg_tokens, *question_tokens]
    vocab = Vocab(strings=question_tokens)

    tokenizer = Tokenizer(vocab)
    matcher = PhraseMatcher(vocab)

    for token in sg_tokens:
        matcher.add(token, [tokenizer(token)])

    return tokenizer, matcher


# RQ: Are nodes more likely to have large gate weight if their names or attributes are contained within the question?
def load_data():
    f = open(os.path.join(common.FOLDERNAME_DATASET_ROOT, "paper_eval_{}.json".format(eval_model)), 'r')
    data = json.load(f)
    f.close()

    # sort nodes by gate weight
    for question_id in data:
        question = data[question_id]

        if len(question['f']) > 1:
            question['w'], question['f'] = zip(*sorted(zip(question['w'], question['f']), reverse=True))
            data[question_id] = question

    return data


def determine_top_node_rank_has_most_question_coocs(data):
    tokenizer, matcher = get_qa_nlp()

    no_coocs = 0
    coocs = 0

    no_ties = 0
    ties = 0

    results = []
    for question_id in data:
        question = data[question_id]

        # if len(question['f']) < 6 or len(question['f']) > 32:
            # continue

        question_text_tokens = tokenizer(question['q'])
        matches = matcher(question_text_tokens)

        rich_question_phrases = []
        for match_id, start, end in matches:
            span = question_text_tokens[start:end]
            rich_question_phrases.append(span.text)

        occurrences = []
        for node_idx, node_tokens in enumerate(question['f']):
            count = 0

            for token in node_tokens:
                if token in rich_question_phrases:
                    count += 1

            occurrences.append(count)

        if len(occurrences) > 0 and max(occurrences) > 0:
            coocs += 1
            if occurrences[0] == max(occurrences):
                results.append(1)
            else:
                results.append(0)

            # determine ties
            occs = 0
            for occ in occurrences:
                if occ == max(occurrences):
                    occs += 1

            if occs > 1:
                ties += 1
            else:
                no_ties += 1
            # eof count ties

        else:
            no_coocs += 1

    print("questions: no_coocs: {}; coocs: {}".format(no_coocs / (no_coocs + coocs), coocs / (no_coocs + coocs)))
    print("question: no_ties: {}; ties: {}".format(no_ties / (no_ties + ties), ties / (no_ties + ties)))

    return results


def determine_top_node_rank_has_most_prediction_coocs(data):
    results = []

    no_coocs = 0
    coocs = 0

    no_ties = 0
    ties = 0

    for question_id in data:
        question = data[question_id]

        # if len(question['f']) < 6 or len(question['f']) > 32:
            # continue

        # if question['p'][0] == "no" or question['p'][0] == "yes":
            # continue

        # if question['p'][0] == "left" or question['p'][0] == "right":
            # continue

        occurrences = []
        for node_idx, node_tokens in enumerate(question['f']):
            count = 0

            for token in node_tokens:
                if token == question['p'][0]:
                    count += 1

            occurrences.append(count)

        if len(occurrences) > 0 and max(occurrences) > 0:
            coocs += 1
            if occurrences[0] == max(occurrences):
                results.append(1)
            else:
                results.append(0)

            # determine ties
            occs = 0
            for occ in occurrences:
                if occ == max(occurrences):
                    occs += 1

            if occs > 1:
                ties += 1
            else:
                no_ties += 1
            # eof count ties

        else:
            no_coocs += 1

    print("prediction: no_coocs: {}; coocs: {}".format(no_coocs / (no_coocs + coocs), coocs / (no_coocs + coocs)))
    print("prediction: no_ties: {}; ties: {}".format(no_ties / (no_ties + ties), ties / (no_ties + ties)))

    return results


def count_data_tokencounts(data):
    tokenizer, matcher = get_qa_nlp()

    results = []
    for question_id in data:
        question = data[question_id]

        token_counts = []
        for node_idx, node_tokens in enumerate(question['f']):
            token_counts.append(len(node_tokens))

        results.append(token_counts)

    return results


# step 1:
    # go through all questions
        # go through all nodes
            # for each node, match all tokens to all question tokens (w/ or w/o lemmatizing?)
            # track all matching indices in a list, store this list with the question
def count_data_question(data):
    tokenizer, matcher = get_qa_nlp()

    results = []
    for question_id in data:
        question = data[question_id]

        question_text_tokens = tokenizer(question['q'])
        matches = matcher(question_text_tokens)

        rich_question_phrases = []
        for match_id, start, end in matches:
            span = question_text_tokens[start:end]
            rich_question_phrases.append(span.text)

        occurrences = []
        for node_idx, node_tokens in enumerate(question['f']):
            count = 0

            for token in node_tokens:
                if token in rich_question_phrases:
                    count += 1

            occurrences.append(count)

        results.append(occurrences)

    return results


# step 1:
    # go through all questions
        # go through all nodes
            # for each node, match all tokens to the top 10 prediction tokens (w/ or w/o lemmatizing?)
            # track all matching indices in a list, store this list with the question
def count_data_predictions(data):
    results = []

    for question_id in data:
        question = data[question_id]

        occurrences = []
        for node_idx, node_tokens in enumerate(question['f']):
            count = 0

            for token in node_tokens:
                if token == question['p'][0]:
                    count += 1

            occurrences.append(count)

        results.append(occurrences)

    return results


# step 2:
        # generate average X count per node rank
def aggregate_data(data):
    categories = {}

    for c in data:
        cat = len(c) # graph size of the current category

        # if entry for graphs with length X doesn't exist yet
        if not cat in categories:
            new_occ = [0] * cat
            categories[cat] = (0, new_occ)

        # get values
        cat_count, aggregate = categories[cat]

        for idx, val in enumerate(c):
            aggregate[idx] += val

        # store values (and update count)
        categories[cat] = (cat_count + 1, aggregate)

    return categories


def avg_data_horizontal_cut(data, threshold=0.01):
    longest_category_length = max([len(data[category][1]) for category in data])

    agg_count = [0] * longest_category_length
    agg = [0] * longest_category_length

    total_instances = 0

    for category in data:
        count, _ = data[category]
        total_instances += count

    for category in data:
        count, cat = data[category]

        # only include a category if it's big enough (>=1% of total instances)
        if count / total_instances >= threshold:
            for idx, entry in enumerate(cat):
                agg[idx] += entry
                agg_count[idx] += count

    agg_final = []

    for idx, entry in enumerate(agg):
        if agg_count[idx] > 0:
            agg_final.append(entry / agg_count[idx])

    return agg_final


def avg_data_vertical_cut(data, threshold=0.1):
    longest_category_length = max([len(data[category][1]) for category in data])

    samples_for_rank = [0] * longest_category_length # tracks sample count per node rank
    total_instances = 0 # tracks total instances

    # count for each rank, how many samples we have across all graphs
    # also count how many instances we have in total
    for category in data:
        count, cat = data[category]
        total_instances += count

        i = 0
        while i < len(cat):
            samples_for_rank[i] += count
            i += 1

    # starting from the back, try to find the highest rank that is supported
    # with a big enough sample size (1% or 5% of total instance count)
    highest_supported_rank_idx = len(samples_for_rank) - 1
    trailing_sample_size = 0
    while highest_supported_rank_idx >= 0:
        trailing_sample_size += samples_for_rank[highest_supported_rank_idx]

        if (trailing_sample_size / total_instances) >= threshold:
            break

        highest_supported_rank_idx -= 1

    # this case should really never occur
    if highest_supported_rank_idx == -1:
        return []

    agg_count = [0] * longest_category_length
    agg = [0] * longest_category_length

    # aggregate the categories of different lengths
    # ...but stop at the last length that is supported by sufficient sample size
    # ...by including but cutting off graphs that are too big (ignoring their higher ranks)
    for category in data:
        count, cat = data[category]

        # only include a category if it's big enough (>=1% of total instances)
        for idx, entry in enumerate(cat):
            if idx <= highest_supported_rank_idx:
                agg[idx] += entry
                agg_count[idx] += count

    agg_final = []

    # drop empty entries
    # (there's probably a better way to do this)
    for idx, entry in enumerate(agg):
        if agg_count[idx] > 0:
            agg_final.append(entry / agg_count[idx])

    return agg_final


# this method attempts to readjust results to account for the fact that
# ...a node's tokens are more likely to occur in a question (or list of predictions)
# ...if the node has more tokens
# we do this because the model seems to rank nodes with more tokens higher
def readjust_data_frequency_factors(data, factors):
    data_fixed = []

    l_factors = len(factors)
    if l_factors > 0:
        avg_factor = sum(factors) / l_factors

        for idx, category in enumerate(data):
            data_fixed.append((category / factors[idx]) * avg_factor)

    return data_fixed


def plot_data(results, x_label="", y_label=""):
    dim = np.arange(1, len(results) + 1)
    plt.figure(figsize=(9, 4))
    plt.plot(dim, results)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.xticks(dim)
    # plt.subplots_adjust(0.089, 0.102, 1, 1)
    plt.subplots_adjust(0.059, 0.102, 1, 1)
    plt.show()
    # plt.savefig('test.pdf', bbox_inches='tight', pad_inches = 0, dpi = 200)


def plot_data_multiple(results, x_label="", y_label="", legend=None):
    dim = np.arange(1, len(results[0]) + 1)
    plt.figure(figsize=(9, 4))

    for idx, result in enumerate(results):
        label = None
        if len(legend) > idx:
            label = legend[idx]
        plt.plot(dim, result, label=label)

    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.xticks(dim)
    plt.legend()
    # plt.subplots_adjust(0.089, 0.102, 1, 1)
    plt.subplots_adjust(0.059, 0.102, 1, 1)
    plt.show()


def avg_cut(data):
    return avg_data_horizontal_cut(data)


def evaluate():
    data = load_data()

    # determine which part of highest-ranked nodes (based on gate score) have the highest
    # ...amount of co-occurrences with question tokens
    top_node_rank_vs_qco = determine_top_node_rank_has_most_question_coocs(data)
    top_node_rank_vs_qco_percentage = sum(top_node_rank_vs_qco) / len(top_node_rank_vs_qco)
    print("top_node_rank_vs_qco_percentage: {}".format(top_node_rank_vs_qco_percentage))

    # determine which part of highest-ranked nodes (based on gate score) have the highest
    # ...amount of co-occurrences with the top prediction (0 or 1 in most cases)
    top_node_rank_vs_pco = determine_top_node_rank_has_most_prediction_coocs(data)
    top_node_rank_vs_pco_percentage = sum(top_node_rank_vs_pco) / len(top_node_rank_vs_pco)
    print("top_node_rank_vs_pco_percentage: {}".format(top_node_rank_vs_pco_percentage))

    tokencount_counts = count_data_tokencounts(data)
    count_cats = aggregate_data(tokencount_counts)
    count_results = avg_cut(count_cats)

    question_counts = count_data_question(data)
    question_cats = aggregate_data(question_counts)
    question_results = avg_cut(question_cats)
    question_results_balanced = readjust_data_frequency_factors(question_results, count_results)

    # individual graph sizes
    # for cat_key in question_cats:
    #     count, cat = question_cats[cat_key]
    #     adjusted = readjust_data_frequency_factors(cat, count_cats[cat_key][1])
    #     plot_data(adjusted, x_label="node rank", y_label="node token occurrence factor (question) (" + str(count) + " samples)")

    prediction_counts = count_data_predictions(data)
    prediction_cats = aggregate_data(prediction_counts)
    prediction_results = avg_cut(prediction_cats)
    prediction_results_balanced = readjust_data_frequency_factors(prediction_results, count_results)

    # for category in sorted(occ_cats.keys()):
    #     count, cat = occ_cats[category]
    #     print(category, "(", count, "instances ):", cat)

    # print(occ_results)

    # for category in sorted(count_cats.keys()):
    #     count, cat = count_cats[category]
    #     print(category, "(", count, "instances ):", cat)

    # print(count_results)

    # for occurrences, token_counts in counts:
    #     print(occurrences)

    print("count_results: {}".format(count_results))
    print("question_results: {}".format(question_results))
    print("prediction_results: {}".format(prediction_results))
    print("question_results_balanced: {}".format(question_results_balanced))
    print("prediction_results_balanced: {}".format(prediction_results_balanced))

    # plot_data(count_results, x_label="node rank", y_label="avg node token count")
    # plot_data_multiple([question_results, question_results_balanced], x_label="node rank", y_label="avg node token occurrence (question)", legend=["not adjusted for token count", "adjusted for token count"])
    # plot_data(question_results_balanced, x_label="node rank", y_label="avg node token occurrence (question) [balanced]")
    # plot_data_multiple([prediction_results, prediction_results_balanced], x_label="node rank", y_label="avg node token occurrence (top prediction)", legend=["not adjusted for token count", "adjusted for token count"])
    # plot_data(prediction_results_balanced, x_label="node rank", y_label="avg node token occurrence (top prediction) [balanced]")


evaluate()
# hint: run the analyze_paper_eval_data_node_gate.py-script with the data printed by this present script in order to calculate correlation coefficients!
