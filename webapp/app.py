from flask import Flask, jsonify, render_template
import numpy as np
import codecs, json
# import random

import pandas as pd


app = Flask(__name__)

#### Useful Functions #####
def arrayToList(arr):
    """ Transform a np.array of any size into a flat list """
    return [ii.item() for ii in arr.reshape((arr.size,1))]

# Transformation matrices
def create_PPstar_translation(nbpix):
    # nb of pixels translated
    nbt = int(np.round(0.25*nbpix))

    # bottom left square block
    bl = np.eye(nbpix-nbt,nbpix-nbt)
    # upper right square block
    ur = np.eye(nbt,nbt)
    # upper left rect block
    ul = np.zeros((nbt,nbpix-nbt))
    # bottom right rect block
    br = np.zeros((nbpix-nbt,nbt))

    # concatenate the blocks to build the transformation matrix
    P = np.concatenate((np.concatenate((ul,ur), axis=1), np.concatenate((bl,br), axis=1)), axis=0)
    Pstar = np.linalg.inv(P)        
    return (P,Pstar)

def translate2left(mat):
    P,Pstar = create_PPstar_translation(mat.shape[0])
    return mat@P    


#### ROUTES #####
#---------------

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/transform_types")
def transform_types():
    """ Return the list of transformation types """
    return jsonify(["rotation","translation"])

@app.route("/nbpixels")
def nbpixels():
    """ Return the list of nb of pixels"""
    return jsonify(arrayToList(np.arange(4,16,2)))

@app.route("/random_image/<nbpix>")
def random_image(nbpix):
    """ Return a random matrix based on the number of pixels """
    # ratio of black pxls over white pixels
    cut = 0.5    
    nbpix = int(nbpix)
    # generating the random grid with numpy
    rmd_img = np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut])
    # transform the np array to a flat list
    rmd_lst = arrayToList(rmd_img)
    return jsonify(rmd_lst)

@app.route("/apply_model/<nbpix>/<transform>")
def apply_model(nbpix,transform):

    model_mangler = load_model(f"{transform_type}_{training_type}_mangler_{nbpix}x{nbpix}.h5")
    model_corrector = load_model(f"{transform_type}_{training_type}_corrector_{nbpix}x{nbpix}.h5")

    cut = 0.5
    Mreal = np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut])

    # Predict the mangled image based on the real one
    Mmang_ml = perform_prediction(Mreal,model_mangler ) # predict_mangler(Mreal)
    # Predict the corrected input based on the real image
    Mcor_ml = perform_prediction(Mreal, model_corrector)# predict_corrector(Mreal)
    # Prediction of the output from the corrected input
    if transform_type is "translation":
        Mout_ml = translate2left(Mcor_ml)
    elif transform_type is "rotation":
        Mout_ml = rot90ccw(Mcor_ml)

    mats = {"real": arrayToList(Mreal),
            "mangled": arrayToList(Mmang_ml),
            "corrected_input": arrayToList(Mcor_ml),
            "output": arrayToList(Mout_ml)}
    print(mats)

    return jsonify(mats)
    # plot the results
    # vis_matrices(Mreal, Mmang_ml,Mcor_ml, Mout_ml)



    


if __name__ == "__main__":
    app.run(debug=True)    