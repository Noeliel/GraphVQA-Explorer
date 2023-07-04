|                                                                                           ![App](application.png?raw=true)                                                                                            | 
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:| 
| *User interface of our visual analysis system to explore scene-graph-based visual question answering. Background image: [GQA dataset](https://cs.stanford.edu/people/dorarad/gqa/) under Creative Commons CC BY 4.0.* |

# GraphVQA Explorer

GraphVQA Explorer is a visual analysis system to explore scene-graph-based visual question answering.
It is built on top of the state-of-the-art [GraphVQA framework](https://github.com/codexxxl/GraphVQA)
which was trained on the [GQA dataset](https://cs.stanford.edu/people/dorarad/gqa/).


## Setup instructions (Docker)

### Requirements

-   About 30 to 40 gigabytes of free disk space (\*)

-   Operating system:

    -   Any recent Linux distribution
    -   Windows with a WSL2 setup (untested)
    -   macOS (untested)

-   Applications:

    -   Docker (if on Windows, _inside_ WSL)
    -   git

-   Up to 1 hour of spare time
    -   This does not account for the time it takes to download extra files in step 0
    -   Most of the setup is unattended and just takes some time to execute

(\*) data volume breakdown (estimated, base 10 units):

-   Required files
    -   Clone of code repository: **40-60MB**
    -   GQA dataset scenegraphs: **363MB**
    -   Auto-generated cache & working data: **4GB**
    -   Resulting Docker image: **5GB**
    -   Space for temporary build files: **?**
-   Optional, _highly_ recommended files
    -   GQA dataset questions (decompressed): **938MB**
        -   Note: without these, you won't be able to generate evaluation results with [server/generate_eval_data.py](server/generate_eval_data.py).
    -   Pregenerated evaluation data (decompressed): **780MB**
        -   Note: without this, the evaluation browser component is not of any use. You can omit this if you plan on generating and supplying your own using [server/generate_eval_data.py](server/generate_eval_data.py).
    -   Pretrained GAT, GCN, GINE & LCGN model parameters (decompressed): **2.6GB**
        -   Note: without these, generated VQA predictions will not be any useful. You can omit them if you plan on training and supplying your own instead.
    -   GQA dataset images (decompressed): **22GB**
        -   Note: without these, you will see a placeholder background image for any scene you inspect. It is recommended to at least source the images of the specific scenes that you wish to work with.

---

### Preliminary

Make sure that you have cloned the repository recursively in order to fetch the required GraphVQA code.  
This can be achieved using `git`'s --recursive flag when cloning, i.e. `git clone --recursive [...]`.

To verify that everything is in order, check the contents of `server/GraphVQA/` and make sure that the directory is populated.  
If this is the case, feel free to proceed.

**Please note that steps 0, 1 and 2 can be executed in parallel and in any order. Steps 3 and onwards require the previous step to have been completed.**

---

### Step 0: Download recommended files [? hours]

While the project can run without these files, they're highly recommended for a complete user experience.

Download, extract and place the following files accordingly:

| Description                  | Download Size | Link                                                                                                                               | Target Location                                                                           |
| ---------------------------- | ------------- |------------------------------------------------------------------------------------------------------------------------------------| ----------------------------------------------------------------------------------------- |
| Pretrained model parameters  | 2.6GB         | graphvqa_parameters.7z from [https://doi.org/10.18419/darus-3597](https://doi.org/10.18419/darus-3597) (\*)                        | server/dataset/parameters/{model name}/checkpoint.pth                                     |
| Pregenerated evaluation data | 165MB         | evaluation_data.7z from [https://doi.org/10.18419/darus-3597](https://doi.org/10.18419/darus-3597) (\*\*)                          | server/dataset/evaluation/{model name}/results\_{val,test,train}\_balanced_questions.json |
| GQA dataset questions        | 1.4GB         | [https://downloads.cs.stanford.edu/nlp/data/gqa/questions1.2.zip](https://downloads.cs.stanford.edu/nlp/data/gqa/questions1.2.zip) | server/dataset/evaluation/{val,test,train}\_balanced_questions.json                       |
| GQA dataset images           | 20.3GB        | [https://downloads.cs.stanford.edu/nlp/data/gqa/images.zip](https://downloads.cs.stanford.edu/nlp/data/gqa/images.zip)             | server/dataset/images/{id}.jpg                                                            |

(\*): graphvqa_parameters.7z, sha256: cdc2be5c98e701608f7be20cd89cab3b3f42bf82f807c73b2d3c004aff0d2591  
(\*\*): evaluation_data.7z, sha256: 1f70217036a60c2c08a930e68dd275be48f7148dd4c4393ab38b06d86455c031

**Note:** Some of these files may not download quickly in spite of your internet connection.  
To get around this, you could use a download accelerator like [axel](https://github.com/axel-download-accelerator/axel) or similar. These work by opening multiple simultaneous connections to the server, each of which download different chunks of the file at the same time.  
Keep in mind however that the download speed limitations are likely in place for a reason, and that tools like _axel_ can strain the server.

---

### Step 1: Download and prepare required files [2-3 minutes]

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Then, execute `./1_docker_prepare_data.sh` and wait for the command to complete.

This step downloads the necessary GQA dataset scene graphs inside of a fresh Docker container and then copies them out to your host system, moving them into `server/dataset/scenegraphs/` in this repository's directory structure.

---

### Step 2: Build base Docker image [30-60 minutes]

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Then, execute `./2_build_docker_gqavis_base.sh` and wait for the command to complete.

This step will setup the Python environment with all fundamental dependencies required for running the VQA models, as well as Node.js.

**Note:** At times this may appear appear stuck for prolonged periods of time, especially during the conda environment setup.  
This is normal and nothing to worry about–just remain patient!

---

### Step 3: Finalize Docker image [2-3 minutes]

**Please only proceed with this step after completing step 2.**

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Then, execute `./3_build_docker_gqavis_image.sh` and wait for the command to complete.

This step will install additional Python dependencies required by the server on top of the base Docker image.

---

### Step 4: Build dependencies [5-10 minutes]

**Please only proceed with this step after completing step 3.**

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Then, execute `./4_docker_prepare_dependencies.sh` and wait for the command to complete.

This step will install a Rust toolchain inside of a fresh Docker container and build the WebAssembly module supplied with the Client.  
The results are copied out into their respective destinations in this repository's directory structure.  
Then, the necessary git patches are applied on the GraphVQA submodule (see [server/GraphVQA.patch](server/GraphVQA.patch)).
Lastly, the final Docker image built in steps 1 and 2 is used to install the node modules required by the client.

---

### Step 5: Launch Application

**Please only proceed with this step after completing steps 0-4.**

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Then, execute `./docker_launch.sh`.

When the application has finished loading, you can access the GUI via your browser at [http://localhost:4200/](http://localhost:4200/).

To quit, issue 2x `SIGINT` (**CTRL+C**) in your shell.  
The Docker image should then proceed to exit on its own.

**Note:** The first run will take a little longer because the application has to download and cache some additional working data.

---

### Updating the project

Open a new shell and navigate into this repository's base directory (where this README is located) using `cd`.

Pull updates via `git pull`.

Once this is complete, repeat the setup instructions from step 3 onwards.

---

### Custom hosting configurations

If you wish to use the client on a different machine than the server is running on, the backend host can be customized in `client/src/environments/environment[.prod].ts`.  
You can then specify an IP for the server to bind to using the `-b` parameter of the flask command, e.g. `flask run -b 10.20.30.4`.  
For the Docker setup, this command can be customized in `.split_launch.sh`.


## License

Our project is licensed under the [MIT License](LICENSE.md).


## Citation

When referencing our work, please cite the paper *Visual Analysis of Scene-Graph-Based Visual Question Answering*.

N. Schäfer, S. Künzel, T. Munz, P. Tilli, N. T. Vu, and D. Weiskopf. Visual Analysis of Scene-Graph-Based Visual Question Answering. Proceedings of the 16th International Symposium on Visual Information Communication and Interaction (VINCI 2023). 2023. 

```
@article{vinci2023vqa,
  author    = {Schäfer, Noel and Künzel, Sebastian and Munz, Tanja and Tilli, Pascal and Vu, Ngoc Thang and Weiskopf, Daniel},
  title     = {Visual Analysis of Scene-Graph-Based Visual Question Answering},
  journal   = {The 16th International Symposium on Visual Information Communication and Interaction (VINCI 2023)},
  year      = {2023}
}
