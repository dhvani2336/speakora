/**
 * Speakora Global Navigation System - Fixed Sidebar Opening
 * 
 * Objectives:
 * 1. Fix the issue where sidebar stays hidden even when clicked.
 * 2. Maintain zero-flash performance.
 */

(function () {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const excludedPages = ["index.html", "register.html", "login.html", "course.html", "dashboard.html", "coming-soon.html", "grammar-test.html", "vocab-test.html", "sentence-test.html", "listening-test.html", "writing-test.html", "pronunciation.html", ""];

  const userLang = localStorage.getItem("language") || "English";
  if (userLang !== "English" && !excludedPages.includes(currentPath)) {
    window.location.href = "coming-soon.html";
    return;
  }

  if (excludedPages.includes(currentPath) && currentPath !== "dashboard.html") return;

  // 1.5 Header & Data Isolation System
  (function () {
    // 1.5.1 Inject Common CSS for Header Consistency
    const commonCss = document.createElement("link");
    commonCss.rel = "stylesheet";
    commonCss.href = "css/common.css";
    document.head.appendChild(commonCss);

    // 1.5.2 Proxy LocalStorage for Data Isolation
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;

    const globalKeys = ["userId", "currentUser", "loggedIn", "name", "email", "subscription", "language", "languages", "pendingDeletion", "deletionRequestTime", "speakora-theme"];

    Storage.prototype.getItem = function (key) {
      if (globalKeys.includes(key) || key.includes("_")) return originalGet.apply(this, arguments);
      const userId = originalGet.call(this, "userId") || originalGet.call(this, "currentUser") || "anonymous";
      return originalGet.call(this, userId + "_" + key);
    };

    Storage.prototype.setItem = function (key, value) {
      if (globalKeys.includes(key) || key.includes("_")) return originalSet.apply(this, arguments);
      const userId = originalGet.call(this, "userId") || originalGet.call(this, "currentUser") || "anonymous";
      return originalSet.call(this, userId + "_" + key, value);
    };

    // Also expose SpeakoraSession for manual use
    window.SpeakoraSession = {
      getUserId: () => originalGet.call(localStorage, "userId") || originalGet.call(localStorage, "currentUser") || "anonymous",
      get: (key) => localStorage.getItem(key),
      set: (key, val) => localStorage.setItem(key, val)
    };
  })();

  // 1. Inject Critical CSS - ENSURE transform is reset when visible
  const style = document.createElement("style");
  style.innerHTML = `
    #speakora-sidebar-wrapper { 
      display: none !important; 
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateX(-100%) !important;
    }
    #speakora-sidebar-overlay {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    #speakora-sidebar-wrapper.visible { 
      display: flex !important; 
      opacity: 1 !important;
      visibility: visible !important;
      transform: translateX(0) !important;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease !important;
    }
    #speakora-sidebar-overlay.visible {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      transition: opacity 0.4s ease !important;
    }
    #speakora-sidebar-trigger { 
      visibility: hidden; 
      opacity: 0; 
    }
    #speakora-sidebar-trigger.ready { 
      visibility: visible; 
      opacity: 1; 
      transition: opacity 0.5s ease;
    }
  `;
  document.head.appendChild(style);

  // 2. Load Assets
  const lucideScript = document.createElement("script");
  lucideScript.src = "https://unpkg.com/lucide@latest";
  document.head.appendChild(lucideScript);

  const navCss = document.createElement("link");
  navCss.rel = "stylesheet";
  navCss.href = "css/global-nav.css";
  document.head.appendChild(navCss);

  // 3. Construct Elements
  const trigger = document.createElement("div");
  trigger.id = "speakora-sidebar-trigger";
  trigger.innerHTML = `<i data-lucide="menu" class="trigger-icon"></i>`;
  document.body.appendChild(trigger);

  const overlay = document.createElement("div");
  overlay.id = "speakora-sidebar-overlay";
  document.body.appendChild(overlay);

  const sidebar = document.createElement("div");
  sidebar.id = "speakora-sidebar-wrapper";

  const sidebarItems = [
    { name: "Language Selection", icon: "globe", url: "course.html" },
    { name: "Dashboard", icon: "layout-dashboard", url: "dashboard.html" },
    { name: "Lessons", icon: "book-open", url: "lesson.html" },
    { name: "Materials", icon: "file-text", url: "materials.html" },
    { name: "Practice", icon: "pencil-line", url: "test.html" },
    { name: "My Progress", icon: "bar-chart-3", url: "progress.html" },
    { name: "Subscription", icon: "credit-card", url: "payment.html" },
    { name: "AI Tutor", icon: "bot", url: "ai.html" },
    { name: "Speaking Practice", icon: "mic", url: "speak.html" },
    { name: "Certificate", icon: "award", url: "certificate.html" },
    { name: "Settings", icon: "settings", url: "settings.html" }
  ];

  const userName = localStorage.getItem("name") || "Student User";
  const userEmail = localStorage.getItem("email") || "premium@speakora.com";
  const userInitial = userName.charAt(0).toUpperCase();

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="dashboard.html" class="sidebar-logo">
        <img src="assets/logo.png" alt="Logo">
        <span>Speakora</span>
      </a>
      <div class="sidebar-close" id="speakora-sidebar-close">
        <i data-lucide="x"></i>
      </div>
    </div>
    <div class="sidebar-nav">
      ${sidebarItems.map(item => `
        <a href="${item.url}" class="nav-item-link ${currentPath === item.url ? 'active' : ''}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.name}</span>
        </a>
      `).join('')}
    </div>
    <div class="sidebar-footer">
      <div class="theme-toggle-btn" id="speakora-theme-toggle">
        <div style="display:flex; align-items:center; gap:10px;">
          <i data-lucide="moon"></i>
          <span id="theme-text">Dark Mode</span>
        </div>
        <i data-lucide="toggle-left" id="theme-toggle-switch"></i>
      </div>
      <a href="profile.html" style="text-decoration:none;">
        <div class="profile-bar">
          <div class="profile-avatar">${userInitial}</div>
          <div class="profile-info">
            <span class="profile-name">${userName}</span>
            <span class="profile-email">${userEmail}</span>
          </div>
          <i data-lucide="chevron-right" style="margin-left: auto; width:16px; opacity:0.4;"></i>
        </div>
      </a>
    </div>
  `;
  document.body.appendChild(sidebar);

  // 4. Control Logic (Click Only)
  const openSidebar = (e) => {
    if (e) e.stopPropagation();
    sidebar.classList.add("visible");
    overlay.classList.add("visible");
    trigger.style.opacity = "0"; // Fade out trigger
    trigger.style.pointerEvents = "none";
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("visible");
    overlay.classList.remove("visible");
    trigger.style.opacity = "1"; // Fade in trigger
    trigger.style.pointerEvents = "auto";
    document.body.style.overflow = "";
  };

  trigger.onclick = openSidebar;
  overlay.onclick = closeSidebar;
  document.getElementById("speakora-sidebar-close").onclick = closeSidebar;

  // 5. Theme Support
  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    sidebar.classList.toggle("dark", isDark);
    const themeText = document.getElementById("theme-text");
    if (themeText) themeText.innerText = isDark ? "Light Mode" : "Dark Mode";
    if (window.lucide) window.lucide.createIcons();
  };

  applyTheme(localStorage.getItem("speakora-theme") || "light");

  const themeToggle = document.getElementById("speakora-theme-toggle");
  if (themeToggle) {
    themeToggle.onclick = () => {
      alert("upcoming only light theme as it is");
    };
  }

  // 6. Final Activation
  lucideScript.onload = () => {
    if (window.lucide) {
      window.lucide.createIcons();
      trigger.classList.add("ready"); // Reveal the hamburger menu trigger
    }
  };

})();
