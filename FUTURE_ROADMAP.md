# 🚀 QATonic Future Roadmap

This document outlines the strategic vision for the next evolution of QATonic. It focuses on elevating the platform from a "Generator" to a "Lifecycle Management" tool.

## 1. 🎨 Frontend Experience (UX/UI)
*   **Interactive File Explorer**: Replace the static list in "Preview" with a VS Code-like tree view, allowing users to *read* the generated code before downloading.
*   **"My Configuration" Presets**: Allow users to save their favorite stack (e.g., "My Enterprise Java Stack") to skip the wizard steps next time.
*   **Dark/Light Mode Sync**: Ensure system preference matching is flawless (already largely there, but can be polished).
*   **Diff View**: If a user regenerates a project, show them what changed (requires versioning).

## 2. 🔐 Backend & Architecture
*   **User Accounts & Auth**: Implement GitHub/Google Login.
    *   *Why?* To save project history ("What did I download last week?") and custom configurations.
*   **Private Template Registry**: Allow companies to host their *own* private repository of templates (e.g., `git clone` from internal Bitbucket).
*   **CLI Tool (`qatonic-cli`)**:
    *   `qatonic init`: Scaffolds project in current directory without downloading a zip.
    *   `qatonic update`: Updates the template files in an *existing* project to the latest version.

## 3. 💎 Template Content & Features
*   **New Testing Types**:
    *   **Performance Testing**: K6, JMeter, Gatling templates.
    *   **Security Testing**: ZAP, Burp Suite automation templates.
*   **Advanced Patterns**:
    *   **Screenplay Pattern**: Add SerenityBDD support for Java/JS.
    *   **Contract Testing**: Add Pact templates for API testing.
*   **Live Documentation**: Generate a centralized `docs/` site (using Docusaurus/MkDocs) inside every project that documents the *tests themselves*.

## 4. 🧠 AI & Intelligent Features
*   **"Describe to Config"**: A chat interface where users type "I need a Python web test for an e-commerce site" and the Wizard auto-fills step 1-12.
*   **Test Case Generation**: During generation, ask user for a URL (e.g., `google.com`) and actually use LLMs to generate *real* first test cases for that specific site in the downloaded code.
*   **Self-Healing Setup**: A script that runs `npm install` / `mvn install` and fixes common environment issues automatically.

## 5. 🏗️ 12-Factor Wizard Improvements
*   **Step 6 (Build Tool)**: Add "Version Manager" support (e.g., `.nvmrc` or `sdkman` files).
*   **Step 8 (CI/CD)**: Add "Matrix Strategy" support to generated workflows (run tests on Chrome/Firefox/Safari in parallel).
*   **Step 10 (Utilities)**: Add "Mock Server" utility (WireMock/Mountebank) integration.

## 6. 📊 Analytics & Insights
*   **Global Trends Dashboard**: A public page showing "Most Popular Stack of 2026" based on aggregated anonymous data.
*   **Success Telemetry**: Optional CLI telemetry to track if generated projects actually *ran* successfully (closing the feedback loop).

---
*Created by Antigravity - Jan 2026*
