(function (window, document) {
  window.ChatbotEmbed = {
    // options.launcherStyle: "classic" or "orb" overrides the saved launcher style.
    // options.greetingBubble: true or false overrides the saved greeting bubble.
    init: function (chatbotId, origin, options) {
      options = options || {};
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
      var params = [];
      if (options.launcherStyle === "orb" || options.launcherStyle === "classic") {
        params.push("launcher=" + options.launcherStyle);
      }
      if (options.greetingBubble === true || options.greetingBubble === false) {
        params.push("greeting=" + (options.greetingBubble ? "1" : "0"));
      }
      if (params.length) iframe.src += "?" + params.join("&");
      var frameOrigin = new URL(iframe.src, window.location.href).origin;
      iframe.style.position = "fixed";
      iframe.style.border = "none";
      iframe.style.zIndex = "10000";
      iframe.style.transition = "all 0.3s ease-in-out";
      iframe.style.overflow = "visible";
      iframe.style.background = "transparent";
      iframe.scrolling = "no";

      // Start with a fixed size for the closed state
      iframe.style.width = "62px";
      iframe.style.height = "62px";
      iframe.style.borderRadius = "31px";

      container.appendChild(iframe);

      function updatePosition(position, isOpen) {
        if (isOpen) {
          iframe.style.width = "370px";
          iframe.style.height = "540px";
          iframe.style.borderRadius = "0";
        } else if (greetingSize) {
          // Just enough room for the greeting bubble beside the launcher.
          iframe.style.width = greetingSize.width + "px";
          iframe.style.height = greetingSize.height + "px";
          iframe.style.borderRadius = "0";
        } else {
          iframe.style.width = "62px";
          iframe.style.height = "62px";
          iframe.style.borderRadius = "31px";
        }

        if (position.includes("bottom")) {
          iframe.style.bottom = "10px";
          iframe.style.top = "auto";
        } else {
          iframe.style.top = "10px";
          iframe.style.bottom = "auto";
        }

        if (position.includes("right")) {
          iframe.style.right = "10px";
          iframe.style.left = "auto";
        } else {
          iframe.style.left = "10px";
          iframe.style.right = "auto";
        }
      }

      var isOpen = false;
      var currentPosition = "bottom-right";
      var greetingSize = null;

      function toggleChatbot() {
        isOpen = !isOpen;
        updatePosition(currentPosition, isOpen);
        iframe.contentWindow.postMessage(
          { type: "toggleChatbot", isOpen },
          "*"
        );
      }

      // The orb launcher's eyes follow the visitor's pointer across the page.
      // Positions are sent relative to the iframe, at most once per frame, and
      // only while the chat is closed.
      var pointerFrame = 0;
      var lastPointer = null;
      var forwardingPointer = false;

      function sendPointer() {
        pointerFrame = 0;
        if (!lastPointer || isOpen || !iframe.contentWindow) return;
        var rect = iframe.getBoundingClientRect();
        iframe.contentWindow.postMessage(
          { type: "askioPointer", x: lastPointer.x - rect.left, y: lastPointer.y - rect.top },
          frameOrigin
        );
      }

      function onPointerMove(e) {
        lastPointer = { x: e.clientX, y: e.clientY };
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(sendPointer);
      }

      function startPointerForwarding() {
        if (forwardingPointer) return;
        forwardingPointer = true;
        window.addEventListener("pointermove", onPointerMove, { passive: true });
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
          if (event.data.config.isActive === false) {
             iframe.style.display = "none";
             return;
          }
          iframe.style.display = "block"; // Ensure visible if active
          currentPosition = event.data.config.position;
          updatePosition(currentPosition, isOpen);
          if (event.source === iframe.contentWindow && event.data.config.launcherStyle === "orb") {
            startPointerForwarding();
          }
        } else if (event.data.type === "chatbotState") {
          isOpen = event.data.isOpen;
          updatePosition(currentPosition, isOpen);
        } else if (event.data.type === "chatbotGreeting" && event.source === iframe.contentWindow) {
          var w = Number(event.data.width);
          var h = Number(event.data.height);
          greetingSize =
            event.data.visible && w > 0 && h > 0
              ? { width: Math.min(w, 360), height: Math.min(h, 240) }
              : null;
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
