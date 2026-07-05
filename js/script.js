/* ================= REGISTER ================= */
function register() {
    const username = document.getElementById("ruser")?.value.trim();
    const password = document.getElementById("rpass")?.value.trim();

    if (!username || !password) {
        alert("Please fill all fields");
        return;
    }

    if (localStorage.getItem("user_" + username)) {
        alert("User already exists");
        return;
    }

    localStorage.setItem("user_" + username, password);
    alert("Registration successful. Please login.");
    window.location.href = "login.html";
}


/* ================= LOGIN ================= */
function login() {
    const username = document.getElementById("user")?.value.trim();
    const password = document.getElementById("pass")?.value.trim();

    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }

    /* ADMIN */
    if (username === "admin" && password === "admin123") {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("role", "admin");
        localStorage.setItem("currentUser", "admin");
        window.location.href = "admin.html";
        return;
    }

    /* USER */
    const savedPassword = localStorage.getItem("user_" + username);

    if (savedPassword === password) {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("role", "user");
        localStorage.setItem("currentUser", username);

        localStorage.removeItem("language");
        localStorage.removeItem("learnFrom");

        window.location.href = "course.html";
    } else {
        alert("Invalid username or password");
    }
}


/* ================= LOGOUT ================= */
function logout() {
    ['userId', 'currentUser', 'loggedIn', 'name', 'email', 'subscription', 'language', 'languages', 'pendingDeletion', 'deletionRequestTime'].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
}


/* ================= LANGUAGE ================= */
function selectLanguage(lang) {
    localStorage.setItem("language", lang);
    window.location.href = "dashboard.html";
}

function setSource(btn, lang) {
    localStorage.setItem("learnFrom", lang);
    document.querySelectorAll(".source-btn")
        .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}


/* ================= DASHBOARD ================= */
function loadDashboardLanguage() {
    const text = document.getElementById("langText");
    const lang = localStorage.getItem("language");

    if (text && lang) {
        text.innerText = `Let’s start learning ${lang} with us`;
    }
}


/* ================= PROFILE SAVE ================= */
function saveProfile() {
    const user = localStorage.getItem("currentUser");
    if (!user) return;

    const profile = {
        name: document.getElementById("name")?.value || "",
        email: document.getElementById("email")?.value || "",
        language: document.getElementById("language")?.value || "English",
        level: document.getElementById("level")?.value || "Beginner",
        goal: document.getElementById("goal")?.value || "",
        about: document.getElementById("about")?.value || ""
    };

    localStorage.setItem("profile_" + user, JSON.stringify(profile));
    alert("Profile saved successfully");
    loadProfile();
}


/* ================= LOAD PROFILE ================= */
function loadProfile() {
    const user = localStorage.getItem("currentUser");
    if (!user) return;

    const profile = JSON.parse(
        localStorage.getItem("profile_" + user) || "{}"
    );

    if (document.getElementById("name")) document.getElementById("name").value = profile.name || "";
    if (document.getElementById("email")) document.getElementById("email").value = profile.email || "";
    if (document.getElementById("language")) document.getElementById("language").value = profile.language || "English";
    if (document.getElementById("level")) document.getElementById("level").value = profile.level || "Beginner";
    if (document.getElementById("goal")) document.getElementById("goal").value = profile.goal || "";
    if (document.getElementById("about")) document.getElementById("about").value = profile.about || "";
    if (document.getElementById("showName")) document.getElementById("showName").innerText = profile.name || "User";
    if (document.getElementById("showEmail")) document.getElementById("showEmail").innerText = profile.email || "";
    if (document.getElementById("showLang")) document.getElementById("showLang").innerText = profile.language || "";
    if (document.getElementById("showLevel")) document.getElementById("showLevel").innerText = profile.level || "";

    const headerInitial = document.getElementById("headerInitial");
    if (headerInitial) {
        headerInitial.innerText = (profile.name || user)[0].toUpperCase();
    }
}


/* ================= PAGE PROTECTION ================= */
function checkLogin() {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "login.html";
    }
}


/* ================= AUTO LOAD ================= */
document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    loadDashboardLanguage();

    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            login();
        });
    }
});
