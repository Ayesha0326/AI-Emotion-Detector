# EmotiSense AI

### AI-Powered Facial Expression Analysis

EmotiSense AI is a web application that uses a webcam or an uploaded image to estimate visible facial expressions using DeepFace.

## Features

- Real-time webcam facial-expression analysis
- Upload an image for expression analysis
- Seven expression categories: Happy, Sad, Angry, Surprise, Fear, Disgust, and Neutral
- Predicted expression and confidence score
- Recent expression history
- Start and stop camera controls
- Image preview and removal
- File-type and file-size validation
- Responsive web interface
- Flask API for image analysis

## Technologies Used

- HTML5, CSS3, JavaScript
- Python 3.12
- Flask and Flask-CORS
- DeepFace
- OpenCV
- NumPy
- TensorFlow

## Project Structure

```text
AI-Emotion-Detector/
├── app.py
├── index.html
├── style.css
├── script.js
├── README.md
├── requirements.txt
└── venv/
```

## Getting Started

### 1. Install Python

Install Python 3.12 and verify the installation:

```bash
python --version
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows Command Prompt:

```bash
venv\Scripts\activate
```

Or, in Git Bash:

```bash
source venv/Scripts/activate
```

### 3. Install Dependencies

With the virtual environment activated, run:

```bash
pip install -r requirements.txt
```

### 4. Start the Backend

```bash
python app.py
```

The Flask backend runs at:

`http://127.0.0.1:5000`

API status endpoint:

`http://127.0.0.1:5000/api/status`

### 5. Open the Frontend

Open `index.html` using VS Code Live Server.

Keep the Flask backend running while using the application. Allow webcam access when prompted by the browser.

## Important Notes

- The application uses a pretrained DeepFace model; it is not a custom-trained model.
- The first analysis may take longer while the model initializes.
- Facial-expression predictions are estimates of visible expressions and do not establish a person's actual internal emotional state.
- The backend is configured for local development and requires additional changes before online deployment.

## Future Improvements

- Improve testing and error handling
- Add detailed analysis reports
- Improve reliability and performance
- Configure secure production deployment

## Author

**Ayesha Yaseen**

Software Developer | Web Developer | WordPress Developer

BS Computer Science Student