/**
 * Wizard Component
 * 
 * This file re-exports the refactored wizard from the wizard-steps/ folder.
 * The wizard has been split into smaller, more maintainable components:
 * 
 * - wizard-steps/types.ts - Type definitions
 * - wizard-steps/WizardContext.tsx - State management
 * - wizard-steps/steps/ - Individual step components
 * - wizard-steps/index.tsx - Main orchestrator
 * 
 * This maintains backward compatibility with existing imports.
 */

export { default } from "./wizard-steps";
export type { WizardConfig } from "./wizard-steps";
