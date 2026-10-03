# Inkwell

A quiet, keyboard-first text editor for writing and reshaping text. Change case, sort and clean lines, encode and decode, find and replace with regular expressions, and keep an eye on word count and reading time, all in the browser with nothing to sign up for.

Built with React. Your document is saved in your browser's local storage, so nothing leaves your machine.

## Features

**Transforms**: apply to the current selection, or to the whole document when nothing is selected. Every transform can be undone.

| Group   | Tools |
| ------- | ----- |
| Case    | UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE |
| Lines   | Sort A → Z / Z → A, reverse lines, remove duplicate lines, remove empty lines, number lines, make bullet list, reverse text |
| Cleanup | Trim line edges, remove extra spaces, collapse blank lines, strip punctuation, smart quotes |
| Encode  | Base64 encode/decode, URL encode/decode |

**Editor**

- Command palette (`Ctrl+K`) that searches every tool and setting
- Find and replace with case-sensitive and regular-expression modes
- Full undo/redo history
- Focus mode for distraction-free writing
- Indent and outdent selected lines with `Tab` / `Shift+Tab`
- Import a text file (including drag and drop) and export as `.txt` or `.md`
- Autosave to local storage

**Insights**

- Live word, character, line, sentence and paragraph counts, plus reading and speaking time
- Word goal with progress ring
- Top keywords: click one to find it in the document

**Appearance**

- Three themes: Obsidian (dark), Paper (light) and Aurora
- Serif, sans and monospace typefaces
- Adjustable font size, line height and page width
- Optional line numbers and spell check
- Responsive layout with a slide-over panel on small screens

## Keyboard shortcuts

| Shortcut                        | Action                  |
| ------------------------------- | ----------------------- |
| `Ctrl+K` / `⌘K`                 | Command palette         |
| `Ctrl+F`                        | Find                    |
| `Ctrl+H`                        | Find and replace        |
| `Ctrl+Z` / `Ctrl+Shift+Z`       | Undo / redo             |
| `Ctrl+S`                        | Export as `.txt`        |
| `Ctrl+.`                        | Toggle focus mode       |
| `Tab` / `Shift+Tab`             | Indent / outdent        |
| `Esc`                           | Close palette, find bar or focus mode |

## Getting started

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/kssrk34/textutils.git
cd textutils
npm install
npm start
```

The app opens at <http://localhost:3000>.

### Scripts

| Command         | What it does                          |
| --------------- | ------------------------------------- |
| `npm start`     | Run the development server            |
| `npm test`      | Run the test suite in watch mode      |
| `npm run build` | Create an optimised build in `build/` |

## Project structure

```
src/
├── App.js                 # State, shortcuts and layout
├── components/
│   ├── Editor.js          # Textarea with match highlighting and line numbers
│   ├── FindBar.js         # Find and replace
│   ├── CommandPalette.js  # Ctrl+K palette
│   ├── Sidebar.js         # Tools, Insights and Style panels
│   └── Icon.js            # Inline SVG icons
├── hooks/
│   ├── useHistory.js      # Undo/redo stack
│   └── useLocalStorage.js # Persisted state
└── utils/
    ├── transforms.js      # Pure text transforms
    └── text.js            # Stats, find and helpers
```

Transforms are plain functions in [src/utils/transforms.js](src/utils/transforms.js), so adding a new one is a single entry in the `TRANSFORMS` list. It then appears in the Tools panel and the command palette automatically.

## Tech stack

- [React](https://react.dev/) 18
- [Create React App](https://create-react-app.dev/)
- Jest and React Testing Library

## License

[MIT](LICENSE)
