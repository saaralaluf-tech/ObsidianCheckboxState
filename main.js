const { Plugin, SuggestModal, Notice, MarkdownRenderer } = require("obsidian");

const TASK_STATES = [
  { name: "To-do", stateChar: " " },
  { name: "Incomplete", stateChar: "/" },
  { name: "Done", stateChar: "x" },
  { name: "Canceled", stateChar: "-" },
  { name: "Forwarded", stateChar: ">" },
  { name: "Scheduling", stateChar: "<" },
  { name: "Question", stateChar: "?" },
  { name: "Important", stateChar: "!" },
  { name: "Star", stateChar: "*" },
  { name: "Quote", stateChar: "\"" },
  { name: "Location", stateChar: "l" },
  { name: "Bookmark", stateChar: "b" },
  { name: "Information", stateChar: "i" },
  { name: "Savings", stateChar: "S" },
  { name: "Idea", stateChar: "I" },
  { name: "Pros", stateChar: "p" },
  { name: "Cons", stateChar: "c" },
  { name: "Fire", stateChar: "f" },
  { name: "Key", stateChar: "k" },
  { name: "Win", stateChar: "w" },
  { name: "Up", stateChar: "u" },
  { name: "Down", stateChar: "d" },
  { name: "Add", stateChar: "+" },
  { name: "Brainstorm", stateChar: "B" },
  { name: "Alarm", stateChar: "a" },
  { name: "Note", stateChar: "n" },
  { name: "Review", stateChar: "R" },
  { name: "Time", stateChar: "t" },
  { name: "Phone", stateChar: "P" },
  { name: "Love", stateChar: "L" },
];

class TaskStateSuggestModal extends SuggestModal {
  /**
   * @param {import('obsidian').App} app
   * @param {(option: {label: string, stateChar: string}) => void} onPick
   */
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
    this.setPlaceholder("Set checkbox state...");
    this.containerEl.addClass("checkbox-state-dropdown-modal");
  }

  /** @param {string} query */
  getSuggestions(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return TASK_STATES;
    return TASK_STATES.filter((o) => {
      const haystack = `${o.name} [${o.stateChar}]`.toLowerCase();
      return haystack.includes(q);
    });
  }

  /** @param {{label: string, stateChar: string}} option @param {HTMLElement} el */
  renderSuggestion(option, el) {
    el.addClass("checkbox-state-dropdown-item");
    // Render as Markdown task so your theme's task-state icons apply.
    // Example: "- [S] Savings".
    if (typeof el.empty === "function") el.empty();
    else el.innerHTML = "";

    const stateChar = option.stateChar;
    const task = `- [${stateChar}] ${option.name}`;

    // Fire-and-forget rendering; SuggestModal API is synchronous.
    Promise.resolve(
      MarkdownRenderer.render(this.app, task, el, "", this)
    ).catch(() => {
      // Fallback: plain text if markdown render fails for any reason.
      el.setText(task);
    });
  }

  /** @param {{label: string, stateChar: string}} option */
  onChooseSuggestion(option) {
    this.onPick(option);
  }
}

/**
 * @param {import('obsidian').Editor} editor
 * @param {string} newStateChar
 */
function setTaskStateOnCurrentLine(editor, newStateChar) {
  const cursor = editor.getCursor();
  const lineNumber = cursor.line;
  const lineText = editor.getLine(lineNumber);

  // Match standard task syntax: - [ ]
  const match = lineText.match(/^\s*-\s+\[(.)\]/);
  if (!match) return false;

  const currentChar = match[1];
  if (currentChar === newStateChar) return true;

  const checkboxStart = lineText.indexOf("[");
  const stateCharIndex = checkboxStart >= 0 ? checkboxStart + 1 : -1;
  if (stateCharIndex < 0 || stateCharIndex >= lineText.length) return false;

  const updated =
    lineText.slice(0, stateCharIndex) + newStateChar + lineText.slice(stateCharIndex + 1);

  editor.replaceRange(
    updated,
    { line: lineNumber, ch: 0 },
    { line: lineNumber, ch: lineText.length }
  );

  return true;
}

module.exports = class CheckboxStateDropdownPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: "checkbox-state-dropdown:set-state",
      name: "Set checkbox state (dropdown)",
      editorCallback: (editor) => {
        const modal = new TaskStateSuggestModal(this.app, (option) => {
          const changed = setTaskStateOnCurrentLine(editor, option.stateChar);
          if (!changed) new Notice("No task checkbox found on the current line.");
        });

        modal.open();
      },
    });
  }

  onunload() {}
};
