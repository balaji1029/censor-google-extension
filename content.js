console.log("👀 content.js loaded");

const wordsToCensor = ["job", "employment", "hiring", "recruitment", "career" , "intern", "vacancy", "position", "opportunity", "work" , "resume" ];
const censorChar = "*";
let totalReplacements = 0;

function censorText(text) {
  if (!text || typeof text !== 'string') {
    return { text: text || '', changed: false };
  }

  let changed = false;
  wordsToCensor.forEach(word => {
    const regex = new RegExp(`\\b\\w*${word}\\w*\\b`, "gi"); // Match word boundaries
    text = text.replace(regex, match => {
      changed = true;
      totalReplacements++;
      console.log(`🔴 Censored: "${match}"`);

      // Remove all vowels (a, e, i, o, u) from the matched word
      const vowels = /[aeiouAEIOU]/g;
      const censoredWord = match.replace(vowels, '*');
      
      return censoredWord;
    });
  });

  return { text, changed };
}

function walkAndCensorSimple(node) {
  if (!node || !node.nodeType) return;

  try {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue) {
        const { text, changed } = censorText(node.nodeValue);
        if (changed && node.nodeValue !== text) {
          node.nodeValue = text;
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName;
      if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT') return;
    }

    if (node.childNodes) {
      const childNodes = Array.from(node.childNodes);
      childNodes.forEach(child => walkAndCensorSimple(child));
    }
  } catch (error) {
    console.warn("⚠️ Error in walkAndCensorSimple:", error);
  }
}

function observeMutations() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        try {
          if (node && node.nodeType) {
            walkAndCensorSimple(node);
          }
        } catch (error) {
          console.warn("⚠️ Error in mutation observer:", error);
        }
      });
    });
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    console.log("👁️ MutationObserver is running.");
  } else {
    console.warn("⚠️ Cannot observe mutations: document.body is not available");
  }
}

function startPollingCensor(interval = 3000) {
  setInterval(() => {
    console.log("🔁 Polling for uncensored content...");
    walkAndCensorSimple(document.body);
  }, interval);
}

function waitForContentAndRun(attempt = 0) {
  console.log("🔍 document.readyState:", document.readyState);
  console.log("📄 document.body available:", !!document.body);

  if (!document.body) {
    if (attempt < 50) {
      console.log(`⏳ Waiting for document.body... attempt ${attempt}`);
      setTimeout(() => waitForContentAndRun(attempt + 1), 200);
    } else {
      console.warn("⚠️ Timed out waiting for document.body");
    }
    return;
  }

  try {
    const bodyText = document.body.innerText || "";
    console.log("📃 document.body.innerText length:", bodyText.length);

    if (bodyText.length > 100) {
      console.log("✅ Page content detected. Running censor.");
      walkAndCensorSimple(document.body);
      observeMutations();
      startPollingCensor();
      console.log(`🔒 Initial replacements: ${totalReplacements}`);
    } else if (attempt < 50) {
      console.log(`⏳ Waiting for content... attempt ${attempt}`);
      setTimeout(() => waitForContentAndRun(attempt + 1), 200);
    } else {
      console.warn("⚠️ Timed out waiting for visible content.");
    }
  } catch (error) {
    console.warn("⚠️ Error in waitForContentAndRun:", error);
  }
}

// Start censoring logic
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForContentAndRun());
  } else {
    waitForContentAndRun();
  }
} catch (error) {
  console.warn("⚠️ Error starting censor script:", error);
}