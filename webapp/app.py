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

# Function to split the matrix into matrices of one pixel
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
        print(mat_split[ii])
        res[ii,:] = model.predict(np.expand_dims(mat_split[ii], axis=0))
        # Sum up the results to construct the matrices
        Mres = Mres + res[ii,:].reshape(nbpix,nbpix)
    return Mres

def perform_prediction_dbg(model):
    test = [1., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0.]
    res = model.predict(np.expand_dims(test, axis=0))
    return res

# def useModel(mdl_name):
#     model = load_model(mdl_name)

#     return  8  
# model_mangler = None
# graph_mangler = None

# global graph_mangler


# def load_mangler(model_name):
#     global model_mangler
#     global graph_mangler
#     # model = Xception(weights="imagenet")
#     # model_mangler = keras.models.load_model(model_name)
#     graph_mangler = tf.get_default_graph()
#     graph_mangler = K.get_session().graph 
#     return


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

@app.route("/applyModel/<nbpixTransform>")
def applyModel(nbpixTransform):
    # we need to take appart the nb of pixel and the transformation type from the input
    nbpix = int(re.search(r'\d+', nbpixTransform).group())
    transform_type = ''.join([i for i in nbpixTransform if not i.isdigit()])   
    training_type = "full" # for now we only use fully trained models

    
    # mdl = os.path.join("models", f"{transform_type}_{training_type}_mangler_{nbpix}x{nbpix}.h5") 
    # model = load_model("translation_full_corrector_4x4.h5")
    
    # f1 = h5py.File("translation_full_corrector_4x4.h5",'r+')  
    # cut = 0.5   
    # rmd_img = np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut])
    # rmd_lst = arrayToList(rmd_img)


    global graph_mangler
    graph_mangler = tf.get_default_graph()
    with graph_mangler.as_default():
        # model name
        mangler_name = os.path.join("models", f"{transform_type}_{training_type}_mangler_{nbpix}x{nbpix}.h5") 
        md = load_model(mangler_name)
        # res = perform_prediction_dbg(md)
        test = np.asarray([1., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0.])
        Mmang_ml = perform_prediction(nbpix, test, md)
        # 
        # res = md.predict(np.expand_dims(test, axis=0))
        # print(res)

    K.clear_session()

    # load_mangler("translation_full_corrector_4x4.h5")
    
    # with graph_mangler.as_default():
    #     # preds = model_mangler.predict()
    #     test = [1., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0.]
    #     res = model_mangler.predict(np.expand_dims(test, axis=0))
    #     print(res)
    # global graph
    # global model
    # with graph.as_default():
    # mdl_name = f"{transform_type}_{training_type}_mangler_{nbpix}x{nbpix}.h5"
    # bla = useModel(mdl_name)
    # model_mangler = load_model(mdl)
    # model_corrector = load_model(f"{transform_type}_{training_type}_corrector_{nbpix}x{nbpix}.h5")

    return jsonify(arrayToList(Mmang_ml))
    



#-------------------------------------------------------------------




# @app.route("/apply_model/<nbpixtransform>")
# def apply_model(nbpixtransform):

#     # 
#     # 

#     # cut = 0.5
#     # Mreal = np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut])
#     Mreal = [2]
#     # # Predict the mangled image based on the real one
#     # Mmang_ml = perform_prediction(Mreal,model_mangler ) # predict_mangler(Mreal)
#     # # Predict the corrected input based on the real image
#     # Mcor_ml = perform_prediction(Mreal, model_corrector)# predict_corrector(Mreal)
#     # # Prediction of the output from the corrected input
#     # if transform_type is "translation":
#     #     Mout_ml = translate2left(Mcor_ml)
#     # elif transform_type is "rotation":
#     #     Mout_ml = rot90ccw(Mcor_ml)

#     # mats = {"real": arrayToList(Mreal),
#     #         "mangled": arrayToList(Mmang_ml),
#     #         "corrected_input": arrayToList(Mcor_ml),
#     #         "output": arrayToList(Mout_ml)}
#     # print(mats)

#     return jsonify(arrayToList(Mreal))
    # plot the results
    # vis_matrices(Mreal, Mmang_ml,Mcor_ml, Mout_ml)



    


if __name__ == "__main__":
    app.run(debug=True)    