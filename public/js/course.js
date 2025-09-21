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
            // input.value = "";

            // setTimeout(() => {
            //     const bot = document.createElement("div");
            //     bot.className = "chat__bubble chat__bubble--bot";
            //     bot.textContent = "Thanks! (placeholder response)";
            //     msgBox.appendChild(bot);
            //     msgBox.scrollTop = msgBox.scrollHeight;
            // }, 400);
            msgBox.scrollTop = msgBox.scrollHeight;
        });
    }

    const genBtn = document.getElementById("generate-grammar");
    const vocabBtn = document.getElementById("generate-vocab");
    const courseRoot = document.getElementById("course-root");
    const courseId = courseRoot?.dataset.courseId;
    const grammarGrid = document.querySelector("#grammar .grid");
    const vocabGrid = document.querySelector("#vocab .grid");

    async function postJSON(url, data) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data ? JSON.stringify(data) : "{}"
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            const msg = text || `Request failed with status ${res.status}`;
            throw new Error(msg);
        }
        return res.json();
    }

    // Grammar part
    function appendGrammarCard(topic) {
        if (!grammarGrid || !topic) return;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${topic.title ?? "New Lesson"}</h3>
            <p>${topic.description ?? ""}</p>
            <div class="card__actions">
                <a href="../grammar.html">
                    <button class="btn">Open</button>
                </a>
                <button class="btn btn-ghost">Delete</button>
            </div>
        `;
        grammarGrid.prepend(card);
    }

    function appendVocabCard(topic) {
        if (!vocabGrid || !topic) return;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${topic.title ?? "New Lesson"}</h3>
            <p>${topic.description ?? ""}</p>
            <div class="card__actions">
                <a href="../mcq.html">
                    <button class="btn">Open</button>
                </a>
                <button class="btn btn-ghost">Delete</button>
            </div>
        `;
        vocabGrid.prepend(card);
    }

    async function generateGrammar() {
        if (!courseId) {
            alert("Missing course id.");
            return;
        }
        const prevText = genBtn.textContent;
        genBtn.disabled = true;
        genBtn.textContent = "Generating...";

        try {
            // Call your API. Replace the URL if you have a different endpoint.
            const data = await postJSON(
                `/courses/${encodeURIComponent(courseId)}/grammar/generate`,
                {
                    // Include any context you want the API to use:
                    // level: "...", learningLang: "...", context: "..."
                }
            );

            const topics = data?.topics ?? [];
            topics.forEach(appendGrammarCard);
        } catch (err) {
            console.error(err);
            alert("Failed to generate grammar lesson. " + (err?.message || ""));
        } finally {
            genBtn.disabled = false;
            genBtn.textContent = prevText;
        }
    }

    async function generateVocab() {
        if (!courseId) {
            alert("Missing course id.");
            return;
        }
        const prevText = genBtn.textContent;
        genBtn.disabled = true;
        genBtn.textContent = "Generating...";

        try {
            // Call your API. Replace the URL if you have a different endpoint.
            const data = await postJSON(
                `/courses/${encodeURIComponent(courseId)}/vocab/generate`,
                {
                    // Include any context you want the API to use:
                    // level: "...", learningLang: "...", context: "..."
                }
            );

            const topics = data?.topics ?? [];
            topics.forEach(appendVocabCard);
        } catch (err) {
            console.error(err);
            alert("Failed to generate vocab lesson. " + (err?.message || ""));
        } finally {
            genBtn.disabled = false;
            genBtn.textContent = prevText;
        }
    }

    if (genBtn) {
        genBtn.addEventListener("click", generateGrammar);
    }
    if (vocabBtn) {
        vocabBtn.addEventListener("click", generateVocab);
    }

    const genDlgBtn = document.getElementById("generate-dialogue");
    const dialogList = document.getElementById("dialog-list");

    function appendDialogueItem(d) {
        if (!dialogList) return;
        const safeTitle = (d.title ?? "New Dialogue").replace(/"/g, "&quot;");
        const li = document.createElement("li");
        li.className = "dialog-item";
        li.innerHTML = `
            <div class="dialog-meta">
                <strong>${safeTitle}</strong>
                <p class="muted">${d.info ?? ""}</p>
            </div>
            <div class="list__actions">
                <button
                    type="button"
                    class="btn btn-primary open-dialog"
                    data-action="open-dialog"
                    data-dialog-id="${d.topicId ?? Date.now()}"
                    data-dialog-title="${safeTitle}"
                >Open</button>
                <button class="btn btn-ghost">Delete</button>
            </div>
        `;
        dialogList.prepend(li);
    }

    async function generateDialogue() {
        if (!courseId) {
            alert("Missing course id.");
            return;
        }
        if (!genDlgBtn) return;

        const prevText = genDlgBtn.textContent;
        genDlgBtn.disabled = true;
        genDlgBtn.textContent = "Generating...";

        try {
            const data = await postJSON(
                `/courses/${encodeURIComponent(courseId)}/dialog/generate`,
                {}
            );

            const dialog = data?.dialog ?? data;
            appendDialogueItem(dialog);
        } catch (err) {
            console.error(err);
            alert("Failed to generate dialogue. " + (err?.message || ""));
        } finally {
            genDlgBtn.disabled = false;
            genDlgBtn.textContent = prevText;
        }
    }

    if (genDlgBtn) {
        genDlgBtn.addEventListener("click", generateDialogue);
    }
});

(function () {
    document.addEventListener("DOMContentLoaded", function () {
        const dialoguePanel = document.getElementById("dialogue");
        const chatPanel = document.getElementById("chatbot");
        const chatTitleEl = document.getElementById("chat-title");
        const backBtn = document.getElementById("back-to-list");

        const chatMessages = document.getElementById("chatMessages");
        const chatForm = document.getElementById("chatForm");
        const chatInput = document.getElementById("chatInput");

        if (!dialoguePanel || !chatPanel) return;

        let currentDialogId = null;
        let chatSubmitHandler = null;

        function showChatPanel() {
            // Hide the dialog list panel
            dialoguePanel.setAttribute("hidden", "");
            // Show the chat panel
            chatPanel.removeAttribute("hidden");
            chatPanel.style.display = ""; // removes inline "display:none"
        }

        function showDialoguePanel() {
            // Hide the chat panel
            chatPanel.style.display = "none";
            chatPanel.setAttribute("hidden", "");
            // Show the dialog list panel
            dialoguePanel.removeAttribute("hidden");
        }

        function resetChatUI() {
            // chatMessages.innerHTML =
            //     '<div class="chat__bubble chat__bubble--bot">Hi! Ask me anything about this course.</div>';

            console.log(currentDialogId);

            fetch(`/getDialogues/${currentDialogId}`)
                .then(res => res.json())
                .then(data => {
                    const messages = data.dialogue || [];
                    chatMessages.innerHTML = "";
                    messages.forEach(msg => {
                        appendMessage(msg.text, msg.who);
                    });
                })
                .catch(err => {
                    console.error("Failed to load dialogue messages:", err);
                    chatMessages.innerHTML =
                        '<div class="chat__bubble chat__bubble--bot">Hi! Ask me anything about this course.</div>';
                });

            chatInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function appendMessage(text, who) {
            const bubble = document.createElement("div");
            bubble.className =
                "chat__bubble " +
                (who === "user" ? "chat__bubble--user" : "chat__bubble--bot");
            bubble.textContent = text;
            chatMessages.appendChild(bubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function initChat(dialogId, dialogTitle) {
            currentDialogId = dialogId;
            chatTitleEl.textContent = dialogTitle || "Chat";
            resetChatUI();

            // Avoid multiple submit handlers
            if (chatSubmitHandler) {
                chatForm.removeEventListener("submit", chatSubmitHandler);
            }

            chatSubmitHandler = function (e) {
                console.log("bruh");

                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;

                appendMessage(text, "user");
                chatInput.value = "";

                fetch(`/getResponse/${currentDialogId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text })
                })
                    .then(r => r.json())
                    .then(data => {
                        appendMessage(data.reply, "bot");
                        console.log("getResponse data:", data);
                    })
                    .catch(() =>
                        appendMessage("Sorry, something went wrong.", "bot")
                    );

                // Placeholder echo so UI feels responsive
                // setTimeout(() => {
                //     appendMessage(`Echo (${dialogId}): ` + text, "bot");
                // }, 300);

                console.log("bruh");
            };

            chatForm.addEventListener("submit", chatSubmitHandler);
        }

        // Open a dialog -> switch to chat view
        document.addEventListener("click", function (e) {
            const btn = e.target.closest('button[data-action="open-dialog"]');
            if (!btn) return;

            const dialogId = btn.getAttribute("data-dialog-id");
            const dialogTitle = btn.getAttribute("data-dialog-title") || "Chat";

            showChatPanel();
            initChat(dialogId, dialogTitle);
        });

        // Back button -> return to dialog list
        if (backBtn) {
            backBtn.addEventListener("click", function () {
                if (chatSubmitHandler) {
                    chatForm.removeEventListener("submit", chatSubmitHandler);
                    chatSubmitHandler = null;
                }
                currentDialogId = null;
                chatTitleEl.textContent = "";
                showDialoguePanel();
            });
        }
    });
})();
