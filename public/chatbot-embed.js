// The Askio chat widget for any website. One line, anywhere in the page:
//
//   <script src="https://www.getaskio.xyz/chatbot-embed.js" data-chatbot="CHATBOT_ID" async></script>
//
// Optional: data-launcher="orb" or "classic", data-greeting="on" or "off".
//
// Open the chat from the site's own button, no code needed:
//   <a href="#" data-askio-open>Chat with us</a>
// or from script: Askio.open(), Askio.close(), Askio.toggle().
// The older three-part snippet (a #chatbot-container div and
// ChatbotEmbed.init(id, origin)) keeps working.
//
// The widget loads after the page has, so it never slows the site's own
// content down.
(function (window, document) {
  // Each chatbot starts once, even if the code is on the page twice (each
  // copy of this script runs separately, so the list lives on window).
  var started = (window.__askioStarted = window.__askioStarted || {});

  // Askio.open() and friends. Calls made before the widget is ready wait
  // for it. Defined once, even if this script is on the page twice.
  var control = window.__askioControl || (window.__askioControl = { send: null, queue: [] });
  function command(action) {
    if (control.send) control.send(action);
    else control.queue.push(action);
  }
  if (!window.Askio) {
    window.Askio = {
      open: function () { command("open"); },
      close: function () { command("close"); },
      toggle: function () { command("toggle"); },
    };
    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("[data-askio-open]") : null;
      if (!target) return;
      event.preventDefault();
      command("open");
    });
  }

  function whenPageIsReady(fn) {
    function idle() {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 3000 });
      else window.setTimeout(fn, 200);
    }
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }

  // options.launcherStyle: "classic" or "orb" overrides the saved launcher style.
  // options.greetingBubble: true or false overrides the saved greeting bubble.
  // Askio's older addresses redirect to www.getaskio.xyz. Messages to the
  // widget must name the address it actually loads from, or the browser
  // drops them, so they're all treated as that one.
  var HOME = "https://www.getaskio.xyz";
  function canonicalOrigin(origin) {
    try {
      var host = new URL(origin || HOME).host;
      return host === "getaskio.xyz" || host === "askio.vercel.app" ? HOME : new URL(origin).origin;
    } catch (e) {
      return HOME;
    }
  }

  function init(chatbotId, origin, options) {
    if (!chatbotId || started[chatbotId]) return;
    started[chatbotId] = true;
    var from = canonicalOrigin(origin);
    whenPageIsReady(function () {
      mount(chatbotId, from, options || {});
    });
  }

  function mount(chatbotId, origin, options) {
      var container = document.getElementById("chatbot-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "chatbot-container";
        document.body.appendChild(container);
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
      // Lets "Continue on Telegram" (and others) copy the visitor's question.
      iframe.allow = "clipboard-write";
      iframe.style.position = "fixed";
      iframe.style.border = "none";
      iframe.style.zIndex = "10000";
      // Opening fades and lifts the panel in; sizes change at once.
      iframe.style.transition = "opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
      iframe.style.overflow = "visible";
      iframe.style.background = "transparent";
      iframe.scrolling = "no";

      // Start with a fixed size for the closed state
      iframe.style.width = "62px";
      iframe.style.height = "62px";
      iframe.style.borderRadius = "31px";

      container.appendChild(iframe);

      // The open panel is exactly the widget's size, and the page draws its
      // rounded corners and soft shadow, so nothing gets cut off. On phones
      // it fills the screen. The widget is told the size, so it keeps its
      // shape from the first frame.
      function panel() {
        if (window.innerWidth < 480) {
          return { width: window.innerWidth, height: window.innerHeight, fullscreen: true };
        }
        return { width: Math.min(360, window.innerWidth - 32), height: Math.min(600, window.innerHeight - 32), fullscreen: false };
      }
      function sendSpace() {
        if (!iframe.contentWindow) return;
        var p = panel();
        iframe.contentWindow.postMessage({ type: "askioSpace", width: p.width, height: p.height, fullscreen: p.fullscreen }, frameOrigin);
      }
      var frameOpen = false;
      window.addEventListener("resize", function () {
        sendSpace();
        if (isOpen) updatePosition(currentPosition, true);
      });

      function updatePosition(position, isOpen) {
        var edge = "10px";
        if (isOpen) {
          var p = panel();
          iframe.style.width = p.width + "px";
          iframe.style.height = p.height + "px";
          iframe.style.borderRadius = p.fullscreen ? "0" : "22px";
          iframe.style.boxShadow = p.fullscreen
            ? "none"
            : "0 20px 56px -16px rgba(16, 23, 35, 0.32), 0 4px 16px rgba(16, 23, 35, 0.08)";
          edge = p.fullscreen ? "0px" : "16px";
        } else if (greetingSize) {
          // Just enough room for the greeting bubble beside the launcher.
          iframe.style.width = greetingSize.width + "px";
          iframe.style.height = greetingSize.height + "px";
          iframe.style.borderRadius = "0";
          iframe.style.boxShadow = "none";
        } else {
          iframe.style.width = "62px";
          iframe.style.height = "62px";
          iframe.style.borderRadius = "31px";
          iframe.style.boxShadow = "none";
        }

        if (position.includes("bottom")) {
          iframe.style.bottom = edge;
          iframe.style.top = "auto";
        } else {
          iframe.style.top = edge;
          iframe.style.bottom = "auto";
        }

        if (position.includes("right")) {
          iframe.style.right = edge;
          iframe.style.left = "auto";
        } else {
          iframe.style.left = edge;
          iframe.style.right = "auto";
        }

        // Opening: the panel fades in and lifts from the launcher's corner.
        if (isOpen && !frameOpen) {
          iframe.style.transformOrigin = (position.includes("bottom") ? "bottom " : "top ") + (position.includes("right") ? "right" : "left");
          iframe.style.transition = "none";
          iframe.style.opacity = "0";
          iframe.style.transform = "translateY(" + (position.includes("bottom") ? "12px" : "-12px") + ") scale(0.97)";
          void iframe.offsetWidth;
          iframe.style.transition = "opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
          iframe.style.opacity = "1";
          iframe.style.transform = "none";
        }
        frameOpen = isOpen;
      }

      var isOpen = false;
      var currentPosition = "bottom-right";
      var greetingSize = null;

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

      // Touch screens have no hovering pointer: taps count as a look, and
      // scrolling points the eyes down (or up) the page.
      var touchOnly = window.matchMedia && window.matchMedia("(hover: none)").matches;
      var lastScrollY = window.scrollY;

      function onScroll() {
        var delta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        if (Math.abs(delta) < 2) return;
        var rect = iframe.getBoundingClientRect();
        lastPointer = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 + (delta > 0 ? 320 : -320),
        };
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(sendPointer);
      }

      function startPointerForwarding() {
        if (forwardingPointer) return;
        forwardingPointer = true;
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerdown", onPointerMove, { passive: true });
        if (touchOnly) window.addEventListener("scroll", onScroll, { passive: true });
      }

      // Opening and closing is reported by the widget ("chatbotState" below).
      // Reaching into the frame instead only works on our own domain and
      // throws a SecurityError on every other site.

      // The page the visitor is on, so the owner can see it in Conversations.
      var lastPage = "";
      var reportingPage = false;
      function reportPage() {
        var page = window.location.origin + window.location.pathname;
        if (page === lastPage || !iframe.contentWindow) return;
        lastPage = page;
        iframe.contentWindow.postMessage({ type: "askioPage", url: page }, frameOrigin);
      }
      function startPageReporting() {
        if (reportingPage) return;
        reportingPage = true;
        reportPage();
        // Single-page sites change the address without reloading.
        window.setInterval(reportPage, 2000);
      }

      window.addEventListener("message", function (event) {
        // Only this widget's own frame may hide, move or resize it; other
        // frames on the page (ads, a second chatbot) are ignored.
        if (event.source !== iframe.contentWindow || !event.data || typeof event.data !== "object") return;
        if (event.data.type === "chatbotReady") {
          if (!event.data.config || typeof event.data.config !== "object") return;
          if (event.data.config.isActive === false || event.data.config.suspended === true) {
             iframe.style.display = "none";
             return;
          }
          iframe.style.display = "block"; // Ensure visible if active
          currentPosition = event.data.config.position;
          updatePosition(currentPosition, isOpen);
          if (event.source === iframe.contentWindow && event.data.config.launcherStyle === "orb") {
            startPointerForwarding();
          }
          if (event.source === iframe.contentWindow) {
            startPageReporting();
            sendSpace();
            control.send = function (action) {
              var open = action === "open" ? true : action === "close" ? false : !isOpen;
              iframe.contentWindow.postMessage({ type: "toggleChatbot", isOpen: open }, frameOrigin);
            };
            while (control.queue.length) control.send(control.queue.shift());
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
        container.removeChild(iframe);
      };
  }

  window.ChatbotEmbed = { init: init };

  // The one-line install: start from the script tag's own data-* attributes.
  var tag = document.currentScript || document.querySelector('script[data-chatbot][src*="chatbot-embed.js"]');
  var chatbotId = tag && tag.getAttribute("data-chatbot");
  if (chatbotId) {
    var options = {};
    var launcher = tag.getAttribute("data-launcher");
    if (launcher === "orb" || launcher === "classic") options.launcherStyle = launcher;
    var greeting = tag.getAttribute("data-greeting");
    if (greeting === "on" || greeting === "off") options.greetingBubble = greeting === "on";
    init(chatbotId, new URL(tag.src, window.location.href).origin, options);
  }
})(window, document);
