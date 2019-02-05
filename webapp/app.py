from flask import Flask, jsonify, render_template
import numpy as np

app = Flask(__name__)

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
    cut = 0.5
    print(nbpix)
    print(np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut]).tolist())
    # print(jsonify(np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut]).tolist()))
    # return np.random.choice([0, 1], size=(nbpix,nbpix), p=[ 1-cut, cut]).tolist()
    return jsonify(nbpix)
    # return jsonify(nbpix)
    


if __name__ == "__main__":
    app.run(debug=True)    