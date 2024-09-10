(function (window, document) {
  window.Chatbot = {
    init: function (config) {
      this.render(config);
    },
    render: function (config) {
      const chatbotContainer = document.getElementById("chatbot-container");
      if (chatbotContainer) {
        const chatbot = document.createElement("div");
        chatbot.id = "chatbot";
        chatbot.innerHTML = `
          <div style="background-color: ${config.primaryColor}; color: white; padding: 10px;">
            <h2>${config.title}</h2>
          </div>
          <div style="height: 300px; overflow-y: auto; padding: 10px;" id="chatbot-messages"></div>
          <div style="padding: 10px;">
            <input type="text" id="chatbot-input" placeholder="${config.placeholder}" style="width: 80%; padding: 5px;">
            <button id="chatbot-send" style="background-color: ${config.secondaryColor}; color: white; border: none; padding: 5px 10px;">Send</button>
          </div>
        `;
        chatbotContainer.appendChild(chatbot);

        this.setupEventListeners(config);
      }
    },
    setupEventListeners: function (config) {
      const input = document.getElementById("chatbot-input");
      const sendButton = document.getElementById("chatbot-send");
      const messagesContainer = document.getElementById("chatbot-messages");

      const sendMessage = () => {
        const message = input.value.trim();
        if (message) {
          this.addMessage(message, "user", config);
          input.value = "";
          // Here you would typically send the message to your backend for processing
          // For now, we'll just echo the message back
          setTimeout(() => {
            this.addMessage(`You said: ${message}`, "bot", config);
          }, 1000);
        }
      };

      sendButton.addEventListener("click", sendMessage);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
    },
    addMessage: function (text, sender, config) {
      const messagesContainer = document.getElementById("chatbot-messages");
      const messageElement = document.createElement("div");
      messageElement.style.marginBottom = "10px";
      messageElement.style.padding = "5px";
      messageElement.style.borderRadius = "5px";
      messageElement.style.maxWidth = "80%";
      messageElement.style.alignSelf =
        sender === "user" ? "flex-end" : "flex-start";
      messageElement.style.backgroundColor =
        sender === "user" ? config.secondaryColor : "#f0f0f0";
      messageElement.style.color = sender === "user" ? "white" : "black";
      messageElement.textContent = text;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
  };
})(window, document);
