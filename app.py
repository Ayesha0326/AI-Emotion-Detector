
from flask import Flask, jsonify, request
from flask_cors import CORS
from deepface import DeepFace
from collections import deque
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import base64
import threading
import os

app = Flask(__name__)
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

recent_predictions = deque(maxlen=2)
prediction_lock = threading.Lock()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


@app.route("/")
def home():
    return "EmotiSense AI is Running!"


@app.route("/api/status")
def status():
    return jsonify({
        "status": "success",
        "message": "AI Emotion Detector is ready"
    })


def analyze_image(frame, smooth=False):
    if frame is None:
        raise ValueError("Invalid image.")

    height, width = frame.shape[:2]
    max_dimension = 480

    if max(height, width) > max_dimension:
        scale = max_dimension / max(height, width)
        frame = cv2.resize(
            frame,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA
        )

    results = DeepFace.analyze(
        img_path=frame,
        actions=["emotion"],
        enforce_detection=False,
        detector_backend="opencv"
    )

    result = results[0] if isinstance(results, list) else results
    emotions = result["emotion"]

    scores = {
        emotion: float(score)
        for emotion, score in emotions.items()
    }

    if smooth:
        with prediction_lock:
            recent_predictions.append(scores)
            predictions = list(recent_predictions)

        totals = {}
        for prediction in predictions:
            for emotion, score in prediction.items():
                totals[emotion] = totals.get(emotion, 0.0) + score

        averages = {
            emotion: score / len(predictions)
            for emotion, score in totals.items()
        }
        scores = averages

    dominant = max(scores, key=scores.get)

    return {
        "emotion": dominant,
        "confidence": round(scores[dominant], 2),
        "emotions": {
            emotion: round(score, 2)
            for emotion, score in scores.items()
        }
    }


@app.route("/api/analyze", methods=["POST"])
def analyze_emotion():
    try:
        data = request.get_json(silent=True)

        if not data or not data.get("image"):
            return jsonify({"error": "No image provided"}), 400

        image_data = data["image"].split(",")[-1]
        image_bytes = base64.b64decode(image_data, validate=True)

        image_array = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        result = analyze_image(frame, smooth=True)
        return jsonify(result)

    except Exception:
        app.logger.exception("Camera emotion analysis failed")
        return jsonify({
            "error": "Could not analyze this image. Please try again."
        }), 400


@app.route("/api/analyze-upload", methods=["POST"])
def analyze_uploaded_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "Please select an image."}), 400

        uploaded_file = request.files["image"]

        if not uploaded_file.filename:
            return jsonify({"error": "Please select an image."}), 400

        filename = secure_filename(uploaded_file.filename)
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if extension not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": "Please upload a JPG, JPEG, PNG, or WEBP image."
            }), 400

        image_bytes = uploaded_file.read()

        if not image_bytes:
            return jsonify({"error": "The selected image is empty."}), 400

        image_array = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "The uploaded file is not a valid image."}), 400

        result = analyze_image(frame, smooth=False)
        return jsonify(result)

    except Exception:
        app.logger.exception("Uploaded image analysis failed")
        return jsonify({
            "error": "Could not analyze this image. Please try another image."
        }), 400


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "Image is too large. Maximum allowed size is 8 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)
