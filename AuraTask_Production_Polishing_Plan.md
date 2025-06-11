# AuraTask: The Definitive Production & Polishing Plan

This document outlines the final, comprehensive steps to transform your AuraTask application into a production-grade product. Each phase is designed to be completed in sequence, ensuring a stable and secure foundation before moving on to architectural and feature enhancements.

## Phase 2: Critical Security & Build Fixes (Completed)

**Objective:** Eliminate all show-stopping bugs and security holes. This phase is mandatory before deployment.

*   **Task 2.1: Resolve Project Configuration Errors**
    *   **Sub-Task 2.1.1: Correct next.config.mjs and postcss.config.mjs:** Verified. Current configurations appear standard and functional.
    *   **Sub-Task 2.1.2: Correct and Unify Package Management:** Verified. `package.json` is present, `pnpm-lock.yaml` exists, and `pnpm install` is running.
    *   **Sub-Task 2.1.3: Fix File Naming and Location:** Verified. `components.json` is not present, and `components/api-key-setup.tsx` exists.

*   **Task 2.2: Patch Critical Security Vulnerabilities**
    *   **Sub-Task 2.2.1: Secure the User Deletion Endpoint:** Verified. `app/api/user/delete/route.ts` implements server-side user deletion using `SUPABASE_SERVICE_ROLE_KEY`.
    *   **Sub-Task 2.2.2: Secure the Gemini API Key Usage:** Verified. `app/api/assign-group-emoji/route.ts` and `app/api/process-task/route.ts` fetch `gemini_api_key` from `user_settings` on the server after authentication, not from the client.

---

## Phase 3: Architectural & State Management Overhaul

**Objective:** Refactor the application's core structure for scalability, performance, and maintainability, confirming choices for free-tier hosting.

*   **Task 3.1: Implement a Centralized State Manager**
    *   **Action:** Create the `lib/store/appStore.ts` file (if not already created) and define a single, unified Zustand store to manage tasks, groups, tags, settings, and user data, along with their asynchronous actions (fetch, add, update, delete). The provided code snippet will be used as a guide.
    *   **Sub-Task 3.1.1: Refactor TaskDashboard to use the store.**
        *   **Action:** Modify `components/task-dashboard.tsx` to replace its local state management with hooks from `useAppStore`. This will involve identifying relevant state variables and their update logic within `TaskDashboard` and migrating them to the Zustand store.

---

## Phase 4: UI/UX Polish & Feature Refinement

**Objective:** Address specific UI/UX issues to create a polished, professional user experience.

*   **Task 4.1: Fix the Theme Selector Workflow**
    *   **Action:**
        1.  In `components/settings/theme-selector.tsx`, introduce a local state `selectedTheme` to hold the temporarily selected theme. Update this local state on theme click, while still using `setTheme` from `next-themes` for instant visual feedback.
        2.  In `components/settings/settings-panel.tsx`, add a "Save Settings" button. The `onClick` handler for this button will trigger the actual Supabase upsert operation to save the `selectedTheme` value to the user's settings.
*   **Task 4.2: Enhance the Group Bubbles UI**
    *   **Action:**
        1.  Create an SVG filter definition for the "gooey" or "metaball" effect in `app/layout.tsx` or a shared component like `components/theme/neda-bubble-effects.tsx`.
        2.  Apply this SVG filter via CSS to the container holding the group bubbles (likely in `components/task-groups-bubbles.tsx` or a related CSS file).
        3.  Ensure `framer-motion` is used for fluid layout animations when bubbles are added or removed. (This might already be in place, but will be verified).

---

## Phase 5: SEO, Performance & Final Hygiene

**Objective:** Optimize the application for search engines and clean up all remaining code clutter.

*   **Task 5.1: Implement Dynamic SEO Metadata**
    *   **Action:** Implement the `generateMetadata` function in `app/page.tsx` to provide dynamic, page-specific SEO metadata, including `title` and `description`.
*   **Task 5.2: Final Code & File Cleanup**
    *   **Sub-Task 5.2.1: Remove Redundant Component Files:** Delete `components/add-task-modal.tsx` and `components/edit-task-modal.tsx`. Consolidate their logic into `components/tasks/task-form-modal.tsx` and `components/tasks/task-form.tsx`.
    *   **Sub-Task 5.2.2: Populate or Delete README.md:** Add setup instructions, environment variable requirements, and a brief project description to `README.md`.
    *   **Sub-Task 5.2.3: Clean Up supabase/schema.sql:** Remove the line `ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';` from `supabase/schema.sql`.
    *   **Sub-Task 5.2.4: Verify Public Assets:** Confirm the existence of `favicon.ico` and `apple-touch-icon.png` in the `/public` directory. If they are missing, create placeholder files or inform the user.

---

## Final Vercel Deployment Checklist

This checklist will be reviewed and confirmed before the final deployment. No direct actions are required from me at this stage, but I will ensure all prerequisites are met during the implementation phase.

*   **Environment Variables:** Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel.
*   **Build Configuration:** Confirm Vercel is using `pnpm` for install and build commands.
*   **Git Integration:** Ensure Vercel project is linked to the main Git branch.
*   **Local Verification:** Run `pnpm install` and `pnpm build` locally one last time.
*   **Push & Deploy:** Push finalized code to the main branch and monitor deployment.