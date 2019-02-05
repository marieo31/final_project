from flask import Flask, jsonify, render_template

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

# @app.route("/random_image/<nbpix>")
# def random_image(nbpix):
    


if __name__ == "__main__":
    app.run(debug=True)    