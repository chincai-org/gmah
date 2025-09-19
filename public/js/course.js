document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const panels = Array.from(document.querySelectorAll(".panel"));

    function activate(targetId) {
        tabs.forEach(t =>
            t.classList.toggle("is-active", t.dataset.target === targetId)
        );
        panels.forEach(p => {
            const show = p.id === targetId;
            p.toggleAttribute("hidden", !show);
            p.classList.toggle("is-active", show);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => activate(tab.dataset.target));
    });

    // Deep link support: /courses/:id#chatbot etc.
    if (location.hash) {
        const id = location.hash.replace("#", "");
        if (document.getElementById(id)) activate(id);
    }

    // Minimal demo chat behavior (front-end only)
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const msgBox = document.getElementById("chatMessages");

    if (form && input && msgBox) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            const mine = document.createElement("div");
            mine.className = "chat__bubble chat__bubble--me";
            mine.textContent = text;
            msgBox.appendChild(mine);
            input.value = "";

            setTimeout(() => {
                const bot = document.createElement("div");
                bot.className = "chat__bubble chat__bubble--bot";
                bot.textContent = "Thanks! (placeholder response)";
                msgBox.appendChild(bot);
                msgBox.scrollTop = msgBox.scrollHeight;
            }, 400);
            msgBox.scrollTop = msgBox.scrollHeight;
        });
    }
});
