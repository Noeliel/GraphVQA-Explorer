import os.path

# FILE & FOLDER NAMES
FOLDERNAME_DATASET_ROOT = "dataset/"

FOLDERNAME_SCENEGRAPHS = "scenegraphs/"
FOLDERNAME_MODELDATA = "parameters/"
FOLDERNAME_EVALUATION = "evaluation/"
FOLDERNAME_IMAGES = "images/"
FOLDERNAME_THUMBNAILS = "thumbnails/"
FOLDERNAME_IMAGES_CUSTOM = "images_custom/"
FOLDERNAME_THUMBNAILS_CUSTOM = "thumbnails_custom/"
FOLDERNAME_UPLOADS = "tmp/"

FOLDERNAME_GVQA_QUESTIONS = "GraphVQA/questions/"
FOLDERNAME_GVQA_METAINFO = "GraphVQA/meta_info/"

FILENAME_SCENEGRAPHS_TRAIN = "train_sceneGraphs.json"
FILENAME_SCENEGRAPHS_EVAL = "val_sceneGraphs.json"
FILENAME_SCENEGRAPHS_OVERLAY_TRAIN = "overlay_train_sceneGraphs.json"
FILENAME_SCENEGRAPHS_OVERLAY_EVAL = "overlay_val_sceneGraphs.json"
FILENAME_SCENEGRAPHS_NEW = "new_sceneGraphs.json"

FILENAME_MODEL_CHECKPOINT = "checkpoint.pth"

FILENAME_GQA_VOCAB_PICKLED = "GQA_TEXT_obj.pkl"
FILENAME_GQA_VOCAB_OBJECTS = "name_gqa.txt"
FILENAME_GQA_VOCAB_ATTRIBUTES = "attr_gqa.txt"
FILENAME_GQA_VOCAB_RELATIONS = "rel_gqa.txt"

# FULL FILE PATHS

# requires the specific pickled vocab it was created with
def FILE_CHECKPOINT_FOR_MODEL(model):
    return os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_MODELDATA, model + "/", FILENAME_MODEL_CHECKPOINT)

# valid values for question_split: val | test | train
def FILE_QUESTIONS_FOR_QUESTION_SPLIT(question_split = "val"):
    return os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_EVALUATION, question_split + "_balanced_questions.json")

# valid values for model: gat | gine | gcn | lcgn
def FOLDER_RESULTS_FOR_MODEL(model):
    return os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_EVALUATION, model + "/")

# valid values for model: gat | gine | gcn | lcgn
# valid values for question_split: val | test | train
def FILE_RESULTS_FOR_MODEL_AND_QUESTION_SPLIT(model, question_split = "val"):
    return os.path.join(FOLDER_RESULTS_FOR_MODEL(model), "results_" + question_split + "_balanced_questions.json")

# contains objects, attributess und relations all in one
FILE_GQA_VOCAB_PICKLED = os.path.join(FOLDERNAME_GVQA_QUESTIONS, FILENAME_GQA_VOCAB_PICKLED)

FILE_GQA_VOCAB_OBJECTS = os.path.join(FOLDERNAME_GVQA_METAINFO, FILENAME_GQA_VOCAB_OBJECTS)
FILE_GQA_VOCAB_ATTRIBUTES = os.path.join(FOLDERNAME_GVQA_METAINFO, FILENAME_GQA_VOCAB_ATTRIBUTES)
FILE_GQA_VOCAB_RELATIONS = os.path.join(FOLDERNAME_GVQA_METAINFO, FILENAME_GQA_VOCAB_RELATIONS)

# FULL FOLDER PATHS
FOLDER_SCENEGRAPHS = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_SCENEGRAPHS)
FOLDER_IMAGES = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_IMAGES)
FOLDER_THUMBNAILS = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_THUMBNAILS)
FOLDER_IMAGES_CUSTOM = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_IMAGES_CUSTOM)
FOLDER_THUMBNAILS_CUSTOM = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_THUMBNAILS_CUSTOM)
FOLDER_UPLOADS = os.path.join(FOLDERNAME_DATASET_ROOT, FOLDERNAME_UPLOADS)

# FILE UPLOAD
UPLOAD_ALLOWED_EXTENSIONS = {'jpg', 'jpeg'}
