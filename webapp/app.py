from flask import Flask, jsonify, render_template
import numpy as np
import codecs, json
# import random

import pandas as pd
import re
import keras
from keras.models import Sequential
from keras.utils import to_categorical
from keras.layers import Dense
from keras.models import load_model
import os
import h5py
from keras import backend as K
import tensorflow as tf


app = Flask(__name__)


#### Useful Functions #####
#-------------------------------------------------------------------
def arrayToList(arr):
    """ Transform a np.array of any size into a flat list """
    return [ii.item() for ii in arr.reshape((arr.size,1))]

def create_PPstar_translation(nbpix):
    """ Create the transformation matrices for the translation transformation """
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

def rot90ccw(mat):
    """ Rotate an n by n matrix 90 deg counter clock wise"""
    
    # rotation matrix
    rot = np.array([[0, 1],
               [-1,0]])
    # matrix coordinates
    coord = [i for i in np.ndindex(mat.shape)]
    nbp = mat.shape[0]    
    # initialisations
    coord_rot = []
    mat_rot = np.zeros((mat.shape))    
    # Apply the transformation on each pixel's coordinates
    for ii in range(0,len(coord)):
        # apply the rotation to the coordinate vector
        coord_rot.append(coord[ii]@rot)
        # reverse the row axis
        coord_rot[ii][0] += nbp-1
        # transform back into a tuple
        coord_rot[ii] = tuple(coord_rot[ii])   
        # fill up the rotated matrix
        mat_rot[coord_rot[ii]] = mat[coord[ii]]        
    
    return mat_rot

def split_matrix(nbpix, mat):
    """ Split a matrix into matrices of one pixel"""
    # find the indexes of the ones values in the matrix
    idx_arr = np.where(mat.reshape(1,nbpix**2)[0]>0)[0]
    # transform from an array to a list
    idx_lst = [idx_arr.item(ii) for ii in range(0,len(idx_arr))] 
    mat_split = np.zeros((len(idx_lst), nbpix**2))
    for ii in range(0,len(idx_lst)):
        mat_split[ii,idx_lst[ii]] = 1    
    return mat_split

def perform_prediction(nbpix, mat, model):
    """ Predict the output with a trained model"""
    # split the input matrix into matrices of one pixel
    mat_split = split_matrix(nbpix, mat)
    nb_dark_pxl = mat_split.shape[0]
    
    # initializations
    res = np.zeros((nb_dark_pxl, nbpix**2))
    Mres = np.zeros((nbpix,nbpix))
    # Loop on all the one pixels array
    for ii in range(0,nb_dark_pxl):
        # Apply the models to the one pixel matrices
        # print(mat_split[ii])
        res[ii,:] = model.predict(np.expand_dims(mat_split[ii], axis=0))
        # Sum up the results to construct the matrices
        Mres = Mres + res[ii,:].reshape(nbpix,nbpix)
    return Mres


#-------------------------------------------------------------------


#### ROUTES #####
#-------------------------------------------------------------------
@app.route("/")
def index():
    return render_template('index.html')

@app.route("/transform_types")
def transform_types():
    """ Return the list of transformation types to fill the selection list """
    return jsonify(["rotation","translation"])

@app.route("/nbpixels")
def nbpixels():
    """ Return the list of nb of pixels to fill the selection list"""
    return jsonify(arrayToList(np.arange(4,10,2)))

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


@app.route("/applyModel/<nbpixTransformMat>")
def applyModel(nbpixTransformMat):
    # we need to take appart the nb of pixel and the transformation type from the input
    # the nb of pixel will be the first integer
    nbpix = int(re.search(r'\d+', nbpixTransformMat).group())
    transform_type = ''.join([i for i in nbpixTransformMat if not i.isdigit()])   
    training_type = "full" # for now we only use fully trained models

    mang_matrices = {}
    
    # The mangled image
    global graph_mangler
    graph_mangler = tf.get_default_graph()
    with graph_mangler.as_default():
                
        # model name
        mangler_name = os.path.join("models", f"{transform_type}_{training_type}_mangler_{nbpix}x{nbpix}.h5") 
        # Loading the model
        md = load_model(mangler_name)
        # Build the array of random value from the route url
        input_values = np.asarray([int(mm) for mm in nbpixTransformMat[-nbpix**2:]])
        # Predict the mangled values        
        Mmang_ml = perform_prediction(nbpix, input_values, md)
        # save the matrix in the output dict
        mang_matrices["Mmang"] = arrayToList(Mmang_ml)
    K.clear_session()

    # The corrected input
    global graph_cor
    graph_cor = tf.get_default_graph()
    with graph_cor.as_default():
        # model name
        cor_name = os.path.join("models", f"{transform_type}_{training_type}_corrector_{nbpix}x{nbpix}.h5") 
        # Loading the model
        md_cor = load_model(cor_name)
        # Build the array of random value from the route url
        input_values = np.asarray([int(mm) for mm in nbpixTransformMat[-nbpix**2:]])
        # Predict the corrected values
        Mcor_ml = perform_prediction(nbpix,input_values,md_cor)
        # save the matrix in the output dict
        mang_matrices["Mcor"] = arrayToList(Mcor_ml)
    K.clear_session()

    # Get the output from the corrected input
    if transform_type == "translation":
        mang_matrices["Mout"] = arrayToList(translate2left(np.asarray(mang_matrices["Mcor"]).reshape(nbpix,nbpix)))
    elif transform_type == "rotation":
        mang_matrices["Mout"] = arrayToList(rot90ccw(np.asarray(mang_matrices["Mcor"]).reshape(nbpix,nbpix)))

    # @TODO: debug the corrected output!!
    # # The output from the corrected input
    # if transform_type == "translation":
    #     mang_matrices["Mout"] = translate2right(mang_matrices["Mcor"],nbpix)
    # elif transform_type == "rotation":
    #     mang_matrices["Mout"] = rot90cw(mang_matrices["Mcor"], nbpix)
    # mang_matrices = {"Mmang": arrayToList(Mmang_ml)}
    # return jsonify(arrayToList(Mmang_ml))   


    return jsonify(mang_matrices)    
    



#-------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)    