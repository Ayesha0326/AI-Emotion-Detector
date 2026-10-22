# EmotiSense AI 🧠

### AI-Powered Facial Expression Analysis

EmotiSense AI is a web application that estimates visible facial expressions from webcam input or uploaded images using a pretrained DeepFace model.

The project combines a responsive web interface with a Python Flask backend to provide facial expression predictions and confidence scores.

## ✨ Features

- 📷 Real-time webcam-based facial expression analysis
- 🖼️ Image upload and preview
- 🤖 Seven expression categories: Happy, Sad, Angry, Surprise, Fear, Disgust, and Neutral
- 📊 Predicted expression and confidence score
- 🕘 Recent expression history
- 🎥 Camera start and stop controls
- 🗑️ Image removal and reselection
- ✅ File type and size validation
- 📱 Responsive user interface
- 🔌 Flask API for image analysis

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Web structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend interactions |
| Python 3.12 | Backend development |
| Flask | API and server |
| Flask-CORS | Cross-origin requests |
| DeepFace | Facial expression analysis |
| OpenCV | Image processing |
| NumPy and TensorFlow | Model dependencies |

## 📁 Project Structure

```text
AI-Emotion-Detector/
├── app.py
├── index.html
├── style.css
├── script.js
├── requirements.txt
├── README.md
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites

- Python 3.12
- Visual Studio Code
- VS Code Live Server extension

### 1. Clone the Repository

```bash
git clone https://github.com/Ayesha0326/AI-Emotion-Detector.git
cd AI-Emotion-Detector
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows Command Prompt:

```bash
venv\Scripts\activate
```

Or in Git Bash:

```bash
source venv/Scripts/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Flask Backend

```bash
python app.py
```

The backend runs locally at:

`http://127.0.0.1:5000`

Check API status at:

`http://127.0.0.1:5000/api/status`

### 5. Launch the Frontend

Open `index.html` in Visual Studio Code and launch it using Live
