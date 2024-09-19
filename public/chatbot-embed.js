(function (window, document) {
  window.ChatbotEmbed = {
    init: function (chatbotId, origin) {
      console.log("Initializing chatbot with ID:", chatbotId);
      var container = document.getElementById("chatbot-container");
      if (!container) {
        console.error("Chatbot container not found");
        return;
      }

      // Remove any existing iframes
      var existingIframes = container.getElementsByTagName("iframe");
      for (var i = existingIframes.length - 1; i >= 0; i--) {
        container.removeChild(existingIframes[i]);
      }

      var iframe = document.createElement("iframe");
      iframe.src = origin + "/chatbot/" + chatbotId;
      iframe.style.position = "fixed";
      iframe.style.border = "none";
      iframe.style.zIndex = "10000";
      iframe.style.transition = "all 0.3s ease-in-out";
      iframe.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
      iframe.style.overflow = "hidden";
      iframe.scrolling = "no";

      // Start with a fixed size for the closed state
      iframe.style.width = "62px";
      iframe.style.height = "62px";
      iframe.style.borderRadius = "31px";

      container.appendChild(iframe);

      function updatePosition(position, isOpen) {
        if (isOpen) {
          iframe.style.width = "350px";
          iframe.style.height = "500px";
          iframe.style.borderRadius = "10px";
        } else {
          iframe.style.width = "56px";
          iframe.style.height = "56px";
          iframe.style.borderRadius = "28px";
        }

        if (position.includes("bottom")) {
          iframe.style.bottom = "20px";
          iframe.style.top = "auto";
        } else {
          iframe.style.top = "20px";
          iframe.style.bottom = "auto";
        }

        if (position.includes("right")) {
          iframe.style.right = "20px";
          iframe.style.left = "auto";
        } else {
          iframe.style.left = "20px";
          iframe.style.right = "auto";
        }
      }

      var isOpen = false;
      var currentPosition = "bottom-right";

      function toggleChatbot() {
        isOpen = !isOpen;
        updatePosition(currentPosition, isOpen);
        iframe.contentWindow.postMessage(
          { type: "toggleChatbot", isOpen },
          "*"
        );
      }

      iframe.addEventListener("load", function () {
        iframe.contentWindow.addEventListener("click", function (e) {
          if (e.target.closest("button")) {
            toggleChatbot();
          }
        });
      });

      window.addEventListener("message", function (event) {
        if (event.data.type === "chatbotReady") {
          currentPosition = event.data.config.position;
          updatePosition(currentPosition, isOpen);
        } else if (event.data.type === "chatbotState") {
          isOpen = event.data.isOpen;
          updatePosition(currentPosition, isOpen);
        } else if (event.data.type === "chatbotPosition") {
          currentPosition = event.data.position;
          updatePosition(currentPosition, isOpen);
        }
      });

      iframe.onerror = function () {
        console.error("Failed to load chatbot iframe");
        container.removeChild(iframe);
      };

      iframe.onload = function () {
        console.log("Chatbot iframe loaded successfully");
      };
    },
  };
})(window, document);
