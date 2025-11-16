from flask import Flask, jsonify
from config import settings

# Create main Flask app
app = Flask(__name__)

app.config["ENV"] = settings.env
app.config["DEBUG"] = settings.debug

# Health checker
@app.route("/health", methods=["GET"])
def health():
    """
    Basic health check enpoint,
    The extension/iOS app / AWS Load Balancer will use this
    to see if the backend is alive
    """
    return jsonify({"status" : "ok"}), 200


# Allow running with command: python app.py
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=settings.debug)