let currentCategory = "";
let sentences = [];
let currentIndex = 0;
let recognition;
let listening = false;
let score = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    setupSpeechRecognition();
});

async function loadCategories() {
    try {
        const res = await fetch("/api/speaking/categories");
        const categories = await res.json();

        const container = document.getElementById("categoryContainer");
        if (!container) return;

        container.innerHTML = categories.map(cat => `
            <div class="category-chip ${cat === currentCategory ? 'active' : ''}" 
                    onclick="setCategory('${cat}')">
                🎯 ${cat}
            </div>
        `).join("");

        // Auto-select first category if none selected
        if (!currentCategory && categories.length > 0) {
            setCategory(categories[0]);
        }
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

async function setCategory(category) {
    currentCategory = category;
    currentIndex = 0;

    // Update UI active state
    document.querySelectorAll(".category-chip").forEach(btn => {
        btn.classList.toggle("active", btn.innerText.includes(category));
    });

    try {
        const res = await fetch(`/api/speaking/category/${category}`);
        sentences = await res.json();
        loadSentence();
    } catch (err) {
        console.error("Error loading sentences:", err);
    }
}

function loadSentence() {
    resetFeedback();
    const targetElement = document.getElementById("targetSentence");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");

    if (sentences.length > 0) {
        const current = sentences[currentIndex];
        targetElement.innerText = current.sentence;

        // Progress Logic
        progressText.innerText = `Sentence ${currentIndex + 1} of ${sentences.length}`;
        const percent = ((currentIndex + 1) / sentences.length) * 100;
        progressBar.style.width = `${percent}%`;
    }
}

function listenSentence() {
    const text = document.getElementById("targetSentence").innerText;
    const speed = document.getElementById("speedSelect").value;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = parseFloat(speed);
        window.speechSynthesis.speak(utterance);
    }
}

function toggleMic() {
    if (!recognition) return;
    if (listening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function tryAgain() {
    resetFeedback();
}

function nextSentence() {
    if (currentIndex < sentences.length - 1) {
        currentIndex++;
        loadSentence();
    } else {
        alert("Well done! Category complete.");
    }
}

function resetFeedback() {
    const resultBox = document.getElementById("result");
    const textElem = document.getElementById("text");
    const scoreElem = document.getElementById("score");
    const statusText = document.getElementById("status");
    const badge = document.getElementById("approvalBadge");

    if (resultBox) resultBox.style.display = "none";
    if (textElem) textElem.innerText = "...";
    if (scoreElem) scoreElem.innerText = "0%";
    if (statusText) {
        statusText.innerText = "Tap the microphone to start speaking";
        statusText.style.color = "var(--text-light)";
    }

    if (badge) {
        badge.innerText = "Checking...";
        badge.style.background = "#e2e8f0";
        badge.style.color = "#475569";
    }

    const wrapper = document.getElementById("mic-wrapper");
    if (wrapper) wrapper.classList.remove("active-recording");

    const mic = document.getElementById("mic");
    if (mic) mic.classList.remove("active");

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.5";
        nextBtn.style.cursor = "not-allowed";
    }

    if (listening && recognition) recognition.stop();
}

function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            listening = true;
            document.getElementById("mic").classList.add("active");
            document.getElementById("mic-wrapper").classList.add("active-recording");
            document.getElementById("status").innerText = "Listening... Speak now!";
            document.getElementById("status").style.color = "#ef4444";
        };

        recognition.onend = () => {
            listening = false;
            document.getElementById("mic").classList.remove("active");
            document.getElementById("mic-wrapper").classList.remove("active-recording");
            document.getElementById("status").innerText = "Analyzing...";
            document.getElementById("status").style.color = "var(--text-light)";
        };

        recognition.onresult = (e) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript;
                } else {
                    interimTranscript += e.results[i][0].transcript;
                }
            }

            const currentTranscript = finalTranscript || interimTranscript;

            // Show live feedback in the result box
            const resultBox = document.getElementById("result");
            const textElem = document.getElementById("text");

            if (resultBox && textElem) {
                resultBox.style.display = "block";
                // Only use innerText for interim to avoid HTML issues
                if (!e.results[e.results.length - 1].isFinal) {
                    textElem.innerText = `"${currentTranscript}"`;
                }
            }

            if (finalTranscript) {
                const targetText = document.getElementById("targetSentence").innerText;
                calculateScore(finalTranscript, targetText);
            }
        };

        recognition.onerror = (event) => {
            document.getElementById("status").innerText = "Error: " + event.error;
        };
    } else {
        document.getElementById("status").innerText = "Speech Recognition not supported.";
    }
}

function calculateScore(spoken, target) {
    const spokenWords = spoken.toLowerCase().replace(/[.,?]/g, "").trim().split(/\s+/);
    const targetWords = target.toLowerCase().replace(/[.,?]/g, "").trim().split(/\s+/);
    const originalTargetWords = target.trim().split(/\s+/);

    let feedbackHtml = "";
    let matchedCount = 0;

    // Simple alignment: Check each target word
    // We'll keep track of the spoken index to handle missing/incorrect words
    let sj = 0;
    for (let i = 0; i < targetWords.length; i++) {
        const targetWord = targetWords[i];
        const displayWord = originalTargetWords[i];

        // Look ahead in spoken words to find a match (rough heuristic for skipping/extra)
        let found = false;
        let lookAhead = Math.min(sj + 2, spokenWords.length);

        for (let k = sj; k < lookAhead; k++) {
            if (spokenWords[k] === targetWord) {
                matchedCount++;
                feedbackHtml += `<span class="word-correct">${displayWord}</span> `;
                sj = k + 1; // Advance spoken index beyond match
                found = true;
                break;
            }
        }

        if (!found) {
            // If the current spoken word doesn't match the target word, it's incorrect or missing
            if (sj < spokenWords.length) {
                // If there's still spoken content, treat it as "incorrect" for the current target word
                feedbackHtml += `<span class="word-incorrect">${displayWord}</span> `;
                sj++; // Consume one spoken word as an "incorrect" attempt
            } else {
                // No more spoken words, the rest are missing
                feedbackHtml += `<span class="word-missing">${displayWord}</span> `;
            }
        }
    }

    const accuracy = Math.min(100, Math.round((matchedCount / targetWords.length) * 100));

    // Update UI
    const textElem = document.getElementById("text");
    if (textElem) {
        textElem.innerHTML = feedbackHtml.trim();
    }

    const scoreElem = document.getElementById("score");
    if (scoreElem) scoreElem.innerText = `${accuracy}%`;

    const badge = document.getElementById("approvalBadge");
    const statusText = document.getElementById("status");

    // Approval Logic
    const nextBtn = document.getElementById("nextBtn");
    if (accuracy >= 70) {
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
            nextBtn.style.cursor = "pointer";
        }
    } else {
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = "0.5";
            nextBtn.style.cursor = "not-allowed";
        }
    }

    if (accuracy >= 85) {
        badge.innerText = "Approved ✅";
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
        statusText.innerText = "Great job! Your pronunciation is spot on.";
    } else if (accuracy >= 60) {
        badge.innerText = "Needs Practice 🔄";
        badge.style.background = "#fef9c3";
        badge.style.color = "#854d0e";
        statusText.innerText = "Good effort! Try to be a bit clearer.";
    } else {
        badge.innerText = "Try Again ❌";
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
        statusText.innerText = "Keep practicing, you'll get it!";
    }

    document.getElementById("result").style.display = "block";

    // Save result to database
    saveResult(spoken, accuracy);
}

async function saveResult(spoken, accuracy) {
    const user = localStorage.getItem("currentUser") || "anonymous";
    try {
        await fetch("/api/speaking/result", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user: user,
                sentence: document.getElementById("targetSentence").innerText,
                score: accuracy,
                category: currentCategory
            })
        });
        console.log("Result saved to database");
    } catch (err) {
        console.error("Error saving result:", err);
    }
}
