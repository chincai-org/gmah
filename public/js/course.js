document.addEventListener("DOMContentLoaded", () => {
	const tabs = Array.from(document.querySelectorAll(".tab"));
	const panels = Array.from(document.querySelectorAll(".panel"));

	function activate(targetId) {
		tabs.forEach(t =>
			t.classList.toggle(
				"is-active",
				t.dataset.target === targetId
			)
		);
		panels.forEach(p => {
			const show = p.id === targetId;
			p.toggleAttribute("hidden", !show);
			p.classList.toggle("is-active", show);
		});
	}

	tabs.forEach(tab => {
		tab.addEventListener("click", () =>
			activate(tab.dataset.target)
		);
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
				bot.className =
					"chat__bubble chat__bubble--bot";
				bot.textContent =
					"Thanks! (placeholder response)";
				msgBox.appendChild(bot);
				msgBox.scrollTop = msgBox.scrollHeight;
			}, 400);
			msgBox.scrollTop = msgBox.scrollHeight;
		});
	}
});

// Safe to append to the end of /js/course.js
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
			chatMessages.innerHTML =
				'<div class="chat__bubble chat__bubble--bot">Hi! Ask me anything about this course.</div>';
		}

		function appendMessage(text, who) {
			const bubble = document.createElement("div");
			bubble.className =
				"chat__bubble " +
				(who === "user"
					? "chat__bubble--user"
					: "chat__bubble--bot");
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
				chatForm.removeEventListener(
					"submit",
					chatSubmitHandler
				);
			}

			chatSubmitHandler = function (e) {
				e.preventDefault();
				const text = chatInput.value.trim();
				if (!text) return;

				appendMessage(text, "user");
				chatInput.value = "";

				// TODO: Replace with real API call for your app:
				// fetch(`/api/dialogs/${dialogId}/messages`, {
				//   method: 'POST',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify({ message: text })
				// })
				// .then(r => r.json())
				// .then(data => appendMessage(data.reply, 'bot'))
				// .catch(() => appendMessage('Sorry, something went wrong.', 'bot'));

				// Placeholder echo so UI feels responsive
				setTimeout(() => {
					appendMessage(
						`Echo (${dialogId}): ` + text,
						"bot"
					);
				}, 300);
			};

			chatForm.addEventListener("submit", chatSubmitHandler);
		}

		// Open a dialog -> switch to chat view
		document.addEventListener("click", function (e) {
			const btn = e.target.closest(
				'button[data-action="open-dialog"]'
			);
			if (!btn) return;

			const dialogId = btn.getAttribute("data-dialog-id");
			const dialogTitle =
				btn.getAttribute("data-dialog-title") || "Chat";

			showChatPanel();
			initChat(dialogId, dialogTitle);
		});

		// Back button -> return to dialog list
		if (backBtn) {
			backBtn.addEventListener("click", function () {
				if (chatSubmitHandler) {
					chatForm.removeEventListener(
						"submit",
						chatSubmitHandler
					);
					chatSubmitHandler = null;
				}
				currentDialogId = null;
				chatTitleEl.textContent = "";
				showDialoguePanel();
			});
		}
	});
})();
