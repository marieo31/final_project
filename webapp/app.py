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
    return jsonify(list(range(4,16,2)))

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
    


if __name__ == "__main__":
    app.run(debug=True)    