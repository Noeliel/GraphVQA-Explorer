import os.path
import common
import json
import ulid
from server import GQAVisServer
from adapter import ModelAdapter, InitializeModelAdapter
from filter import SceneSearchFilterPipeline
from flask import request, jsonify, Flask, send_file
from flask_cors import CORS

if __name__ != 'app':
    print("Please launch the server using the 'flask run' command!")
    print("You can specify an IP address to bind to using the -h switch, e.g. flask run -h 0.0.0.0")
    exit()

print("")
print("Loading dataset. This might take a few seconds...")

server = GQAVisServer()
adapter = InitializeModelAdapter(server)

print("Preparing models...")

for model in ["gat", "gine", "gcn", "lcgn"]:
    adapter.prepare_model(model)

print("Finished preparing models")

graph_filter = SceneSearchFilterPipeline(server)

print("All done! Starting to serve...")
print("")

app = Flask("GQAVis")
#cors = CORS(app, resources={r"*": {"origins": "localhost:4200"}})
CORS(app)

# getters

@app.route("/get/ids")
def get_ids():
    return json.dumps(server.get_scene_ids())

@app.route("/get/filtered_ids", methods=['POST'])
def get_filtered_ids():
    config = request.get_json(silent=True, force=True) # force=True to ignore Content-Type
    results = graph_filter.run(config)
    return jsonify(results)

@app.route("/get/scenegraph/<id>")
def get_graphdata(id):
    split, data = server.get_scene_graph_data(id)
    return jsonify({"split": split, "data": data})

@app.route("/get/vocab")
def get_vocab():
    return jsonify(adapter.get_vocab())

@app.route("/get/image/<id>")
def get_imagedata(id):
    return send_file(server.get_image_path(id), mimetype='image/jpeg')

@app.route("/get/thumbnail/<id>")
def get_thumbnaildata(id):
    return send_file(server.get_thumbnail_path(id), mimetype='image/jpeg')

@app.route("/get/predictions/<id>", methods=['POST'])
def get_predictions(id):
    content = request.get_json(silent=True, force=True) # force=True to ignore Content-Type

    # multi index 0
    # predictions, prediction_scores, node_weights, edge_weights = adapter.answer_questions([id, 1, 12], content['model'], [content['question'], "what color is the cheese?", "is this real?"])
    # return jsonify({"predictions": predictions[0], "prediction_scores": prediction_scores[0], "object_weights": node_weights[0], "relation_weights": edge_weights[0]})

    # multi index 1
    # predictions, prediction_scores, node_weights, edge_weights = adapter.answer_questions([1, id, 12], content['model'], ["what color is the cheese?", content['question'], "is this real?"])
    # return jsonify({"predictions": predictions[1], "prediction_scores": prediction_scores[1], "object_weights": node_weights[1], "relation_weights": edge_weights[1]})

    # multi index 2
    # predictions, prediction_scores, node_weights, edge_weights = adapter.answer_questions([1, 12, id], content['model'], ["what color is the cheese?", "is this real?", content['question']])
    # return jsonify({"predictions": predictions[2], "prediction_scores": prediction_scores[2], "object_weights": node_weights[2], "relation_weights": edge_weights[2]})

    # exclusive multi idx 0
    # predictions, prediction_scores, node_weights, edge_weights = adapter.answer_questions([id], content['model'], [content['question']])
    # return jsonify({"predictions": predictions[0], "prediction_scores": prediction_scores[0], "object_weights": node_weights[0], "relation_weights": edge_weights[0]})

    # single
    predictions, prediction_scores, node_weights, edge_weights = adapter.answer_question(id, content['model'], content['question'])
    return jsonify({"predictions": predictions, "prediction_scores": prediction_scores, "object_weights": node_weights, "relation_weights": edge_weights})

@app.route("/get/evaluation", methods=["POST"])
def get_evaluationdata():
    config = request.get_json(silent=True, force=True) # force=True to ignore Content-Type
    data = server.get_evaluation_data(config['model'], config['split'])
    return jsonify(data)

# setters

@app.route("/update/scenegraph/<id>", methods=['POST'])
def set_graphdata(id):
    new_graph = request.get_json(silent=True, force=True) # force=True to ignore Content-Type
    server.set_scene_graph_data(id, new_graph)
    return 'true'

def filename_extension(filename):
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    else:
        return ''

def filename_allowed(filename):
    return filename_extension(filename) in common.UPLOAD_ALLOWED_EXTENSIONS

@app.route('/create/scene', methods=['POST'])
def create_scene():
    # check if the post request has the file part
    if 'file' not in request.files:
        # error: no file part
        return ''
    file = request.files['file']
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        flash('No selected file')
        return ''
    
    if file:
        name_extension = filename_extension(file.filename)
        if name_extension in common.UPLOAD_ALLOWED_EXTENSIONS:
            tmp_filename = ulid.new().str + "." + name_extension
            tmp_path = os.path.join(common.FOLDER_UPLOADS, tmp_filename)
            file.save(tmp_path)
            return(str(server.create_scene(tmp_path)))
