
document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const placeholder = document.getElementById("cameraPlaceholder");
    const cameraOverlay = document.getElementById("cameraOverlay");
    const liveBadge = document.getElementById("liveBadge");

    const startButton = document.getElementById("startCamera");
    const stopButton = document.getElementById("stopCamera");
    const clearHistoryButton = document.getElementById("clearHistory");

    const cameraMessage = document.getElementById("cameraMessage");
    const emotionEmoji = document.getElementById("emotionEmoji");
    const emotionName = document.getElementById("emotionName");
    const emotionDescription = document.getElementById("emotionDescription");
    const analysisStatus = document.getElementById("analysisStatus");

    const confidenceValue = document.getElementById("confidenceValue");
    const confidenceBar = document.getElementById("confidenceBar");
    const confidenceTrack = document.getElementById("confidenceTrack");

    const emotionHistory = document.getElementById("emotionHistory");
    const historyCount = document.getElementById("historyCount");

    // Image upload elements
    const uploadForm = document.getElementById("uploadForm");
    const imageUpload = document.getElementById("imageUpload");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const selectedImageName = document.getElementById("selectedImageName");
    const removeImageButton = document.getElementById("removeImage");
    const analyzeImageButton = document.getElementById("analyzeImageButton");
    const uploadMessage = document.getElementById("uploadMessage");

    let cameraStream = null;
    let analysisTimer = null;
    let isAnalyzing = false;
    let isUploadAnalyzing = false;
    let sessionId = 0;
    let history = [];
    let lastHistoryEmotion = null;
    let selectedFile = null;
    let previewUrl = null;

    const MAX_HISTORY = 10;
    const ANALYSIS_INTERVAL = 3000;
    const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    const emotionIcons = {
        happy: "😊",
        sad: "😢",
        angry: "😠",
        surprise: "😮",
        fear: "😨",
        disgust: "🤢",
        neutral: "😐"
    };

    function showMessage(message) {
        cameraMessage.textContent = message;
    }

    function setUploadMessage(message, type = "") {
        uploadMessage.textContent = message;
        uploadMessage.className = "message";

        if (type) {
            uploadMessage.classList.add(type);
        }
    }

    function setAnalysisStatus(message, type = "") {
        analysisStatus.textContent = message;
        analysisStatus.className = "analysis-status";
        analysisStatus.setAttribute("aria-live", "polite");

        if (type) {
            analysisStatus.classList.add(type);
        }
    }

    function resetResults() {
        emotionEmoji.textContent = "☺";
        emotionName.textContent = "Waiting for analysis";
        emotionDescription.textContent =
            "Start your camera or upload an image.";

        confidenceValue.textContent = "—";
        confidenceBar.style.width = "0%";
        confidenceTrack.setAttribute("aria-valuenow", "0");

        setAnalysisStatus("Ready to start");
    }

    function renderHistory() {
        historyCount.textContent =
            `${history.length} ${history.length === 1 ? "result" : "results"}`;

        clearHistoryButton.disabled = history.length === 0;

        if (history.length === 0) {
            emotionHistory.innerHTML = `
                <div class="history-empty">
                    <span>◷</span>
                    <p>No expressions detected yet.</p>
                    <small>Start your camera or upload an image to build your history.</small>
                </div>
            `;
            return;
        }

        emotionHistory.replaceChildren();

        history.forEach(item => {
            const row = document.createElement("div");
            row.className = "history-item";

            const emoji = document.createElement("div");
            emoji.className = "history-emoji";
            emoji.textContent = item.emoji;

            const details = document.createElement("div");
            details.className = "history-details";

            const name = document.createElement("h3");
            name.textContent = item.emotion;

            const time = document.createElement("p");
            time.textContent = `${item.source} · ${item.time}`;

            const confidence = document.createElement("span");
            confidence.className = "history-confidence";
            confidence.textContent = `${item.confidence.toFixed(2)}%`;

            details.append(name, time);
            row.append(emoji, details, confidence);
            emotionHistory.appendChild(row);
        });
    }

    function addHistory(emotion, confidence, source = "Camera") {
        history.unshift({
            emotion,
            confidence,
            emoji: emotionIcons[emotion] || "🤖",
            source,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })
        });

        history = history.slice(0, MAX_HISTORY);
        lastHistoryEmotion = emotion;
        renderHistory();
    }

    function updateExpression(emotion, confidence, source = "camera") {
        emotionEmoji.textContent = emotionIcons[emotion] || "🤖";

        emotionName.textContent =
            emotion.charAt(0).toUpperCase() + emotion.slice(1);

        emotionDescription.textContent =
            "AI estimate of your visible facial expression.";

        const safeConfidence = Math.min(100, Math.max(0, confidence));

        confidenceValue.textContent = `${safeConfidence.toFixed(2)}%`;
        confidenceBar.style.width = `${safeConfidence}%`;

        confidenceTrack.setAttribute(
            "aria-valuenow",
            String(safeConfidence)
        );

        setAnalysisStatus("Expression detected", "success");

        // Prevent the live camera from adding the same emotion repeatedly.
        if (source === "camera") {
            if (lastHistoryEmotion !== emotion) {
                addHistory(emotion, safeConfidence, "Camera");
            }
        } else {
            addHistory(emotion, safeConfidence, "Uploaded image");
        }
    }

    async function analyzeFrame(currentSession) {
        if (
            !cameraStream ||
            isAnalyzing ||
            isUploadAnalyzing ||
            video.readyState < 2 ||
            currentSession !== sessionId
        ) {
            return;
        }

        isAnalyzing = true;
        setAnalysisStatus("Analyzing expression...", "analyzing");

        try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (!canvas.width || !canvas.height) {
                throw new Error("Camera frame is not ready yet.");
            }

            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const image = canvas.toDataURL("image/jpeg", 0.75);

            const response = await fetch(
                "http://127.0.0.1:5000/api/analyze",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ image })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "AI analysis failed.");
            }

            if (!cameraStream || currentSession !== sessionId) {
                return;
            }

            const emotion = String(data.emotion || "unknown").toLowerCase();
            const confidence = Number(data.confidence);

            if (!Number.isFinite(confidence)) {
                throw new Error("Invalid confidence value from server.");
            }

            showMessage("Camera active · Results updated");
            updateExpression(emotion, confidence, "camera");

        } catch (error) {
            console.error("Emotion analysis error:", error);

            if (currentSession === sessionId && cameraStream) {
                setAnalysisStatus("Analysis failed", "error");
                showMessage(`Analysis error: ${error.message}`);
            }
        } finally {
            isAnalyzing = false;
        }
    }

    async function startCamera() {
        if (cameraStream) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            showMessage(
                "Camera access is unavailable. Open this page using localhost or HTTPS."
            );
            return;
        }

        startButton.disabled = true;
        showMessage("Requesting camera permission...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            cameraStream = stream;
            sessionId++;

            video.srcObject = stream;
            video.style.display = "block";
            placeholder.style.display = "none";
            cameraOverlay.hidden = false;

            liveBadge.textContent = "LIVE";
            liveBadge.classList.add("active");
            stopButton.disabled = false;

            await video.play();

            showMessage("Camera started. Preparing AI analysis...");
            setAnalysisStatus("Connecting to AI...", "analyzing");

            const currentSession = sessionId;

            analyzeFrame(currentSession);

            analysisTimer = setInterval(() => {
                analyzeFrame(currentSession);
            }, ANALYSIS_INTERVAL);

        } catch (error) {
            console.error("Camera startup error:", error);

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }

            video.srcObject = null;
            video.style.display = "none";
            placeholder.style.display = "flex";
            cameraOverlay.hidden = true;

            liveBadge.textContent = "OFFLINE";
            liveBadge.classList.remove("active");
            stopButton.disabled = true;

            if (error.name === "NotAllowedError") {
                showMessage("Camera permission denied. Allow camera access in your browser.");
            } else if (error.name === "NotFoundError") {
                showMessage("No camera found. Connect a webcam and try again.");
            } else {
                showMessage(`Could not start camera: ${error.message}`);
            }
        } finally {
            startButton.disabled = Boolean(cameraStream);
        }
    }

    function stopCamera() {
        sessionId++;

        if (analysisTimer) {
            clearInterval(analysisTimer);
            analysisTimer = null;
        }

        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }

        video.srcObject = null;
        video.style.display = "none";
        placeholder.style.display = "flex";
        cameraOverlay.hidden = true;

        liveBadge.textContent = "OFFLINE";
        liveBadge.classList.remove("active");

        startButton.disabled = false;
        stopButton.disabled = true;

        resetResults();
        showMessage("Camera stopped.");
    }

    function clearSelectedImage() {
        selectedFile = null;
        imageUpload.value = "";
        imagePreview.removeAttribute("src");
        imagePreviewContainer.hidden = true;
        analyzeImageButton.disabled = true;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        setUploadMessage("Select an image to get started.");
    }

    function handleImageSelection() {
        const file = imageUpload.files[0];

        if (!file) return;

        if (!allowedTypes.includes(file.type)) {
            clearSelectedImage();
            setUploadMessage(
                "Unsupported file. Please select a JPG, PNG, or WEBP image.",
                "error"
            );
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            clearSelectedImage();
            setUploadMessage(
                "Image is too large. Please select an image under 8 MB.",
                "error"
            );
            return;
        }

        selectedFile = file;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        previewUrl = URL.createObjectURL(file);
        imagePreview.src = previewUrl;
        selectedImageName.textContent = file.name;
        imagePreviewContainer.hidden = false;
        analyzeImageButton.disabled = false;

        setUploadMessage("Image selected. Ready to analyze.", "success");
    }

    async function analyzeUploadedImage(event) {
        event.preventDefault();

        if (!selectedFile || isUploadAnalyzing) {
            return;
        }

        isUploadAnalyzing = true;
        analyzeImageButton.disabled = true;
        imageUpload.disabled = true;
        removeImageButton.disabled = true;

        setUploadMessage("Analyzing image. Please wait...", "analyzing");
        setAnalysisStatus("Analyzing uploaded image...", "analyzing");

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);

            const response = await fetch(
                "http://127.0.0.1:5000/api/analyze-upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Image analysis failed.");
            }

            const emotion = String(data.emotion || "unknown").toLowerCase();
            const confidence = Number(data.confidence);

            if (!Number.isFinite(confidence)) {
                throw new Error("Invalid confidence value from server.");
            }

            updateExpression(emotion, confidence, "upload");
            setUploadMessage(
                `Analysis complete. Estimated expression: ${emotion}.`,
                "success"
            );

        } catch (error) {
            console.error("Image upload analysis error:", error);
            setUploadMessage(error.message || "Could not analyze this image.", "error");
            setAnalysisStatus("Analysis failed", "error");
        } finally {
            isUploadAnalyzing = false;
            imageUpload.disabled = false;
            removeImageButton.disabled = false;
            analyzeImageButton.disabled = !selectedFile;
        }
    }

    startButton.addEventListener("click", startCamera);
    stopButton.addEventListener("click", stopCamera);

    clearHistoryButton.addEventListener("click", () => {
        history = [];
        lastHistoryEmotion = null;
        renderHistory();
    });

    imageUpload.addEventListener("change", handleImageSelection);
    uploadForm.addEventListener("submit", analyzeUploadedImage);
    removeImageButton.addEventListener("click", clearSelectedImage);

    renderHistory();
    resetResults();
});
