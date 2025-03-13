from flask import Flask, jsonify
from flask_cors import CORS
import tensorflow as tf
import cv2
import numpy as np
from collections import Counter
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

model = tf.keras.models.load_model('model_main.h5')
class_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
detected_emotions = []
running = False

def preprocess_face(face_img):
    face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    face_img = cv2.resize(face_img, (48, 48))
    face_img = face_img / 255.0
    face_img = np.reshape(face_img, (1, 48, 48, 1))
    return face_img

def detect_emotions():
    global running
    cap = cv2.VideoCapture(0)
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    while running:
        ret, frame = cap.read()
        if not ret:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            face = frame[y:y + h, x:x + w]
            preprocessed_face = preprocess_face(face)
            prediction = model.predict(preprocessed_face, verbose=0)
            emotion_label = class_labels[np.argmax(prediction)]
            detected_emotions.append(emotion_label)

        time.sleep(1)

    cap.release()

@app.route('/debut_detection', methods=['POST'])
def start_detection():
    global running
    if not running:
        running = True
        threading.Thread(target=detect_emotions).start()
        return jsonify({'message': 'Détection en temps réel démarrée.'})
    return jsonify({'message': 'Détection déjà en cours.'})

@app.route('/stop_detection', methods=['POST'])
def stop_detection():
    global running
    running = False
    return jsonify({'message': 'Détection arrêtée.'})

@app.route('/emotion_detecte', methods=['GET'])
def most_common_emotion():
    print("Flask : Requête reçue sur /emotion_detecte")
    if not detected_emotions:
        return jsonify({'error': 'Aucune émotion détectée pour l\'instant.'}), 400

    emotion_count = Counter(detected_emotions)
    most_common = emotion_count.most_common(1)[0]
    print(f"Émotion détectée : {most_common[0]} avec {most_common[1]} occurrences")
    return jsonify({'most_common_emotion': most_common[0], 'count': most_common[1]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

