# Note

This README is outdated but might still work.
Docker deployment is the preferred method, see `../README.md` for instructions.
If you don't want to use Docker, either try following these instructions or manually replicate the steps in `../Dockerfile_base` and `../Dockerfile_image`.

---

# Instructions

Clone with `git clone --recursive` to make sure that the GraphVQA submodule is cloned as well.
Then, copy GraphVQA.patch into the `GraphVQA/` subdirectory.
Navigate into `GraphVQA/` and run `git apply --reject -p1 GraphVQA.patch`.

---

Install nvcc (commands specifically target Ubuntu 20.04):

```
sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/7fa2af80.pub
sudo bash -c 'echo "deb http://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64 /" > /etc/apt/sources.list.d/cuda.list'
sudo bash -c 'echo "deb http://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64 /" > /etc/apt/sources.list.d/cuda.list'
sudo apt install cuda-10-2
echo 'export PATH=/usr/local/cuda/bin${PATH:+:${PATH}}' >> ~/.bashrc
```

`nvcc --version` should be 10.2  
**Note**: The version of `cudatoolkit` installed in the next step _must_ be smaller than or equal to the version of `nvcc`.

---

(Todo: maybe remove cudatoolkit from `conda.yaml`)

Install anaconda, then set up a new conda environment by running `conda env create -n gqavis --file conda.yaml`.  
Run `conda activate gqavis`.  
(Then, run `conda install cudatoolkit=10.2`.)  
Finally, run `python -m spacy download en_core_web_sm`.
