import {family} from 'docs-family';
import delivery from 'docs-distribution';
export const implementationVersion = '0.2.0';
export const repo = `https://github.com/${family}design/react`;
export const sharedContractRepo = 'https://github.com/k3jph/design-workbench';
const reviewedSource={martlet:'322e549d15812d74257ace37207f62410d6f0911',krigsvold:'5128c6bf26cdba8ddb3c2d88de65b2307d3661b4'};
export const implementationSourceCommit = delivery.packages.React.sourceCommit??reviewedSource[family];
export const groups: Record<string, string[]> = {
  "Actions & feedback": ["Button", "Notice", "Badge", "Dialog", "ErrorSummary"],
  "Forms & choices": [
    "Field",
    "TextInput",
    "Textarea",
    "Select",
    "FileInput",
    "Checkbox",
    "Radio",
    "Switch",
    "Fieldset",
  ],
  "Structure & reading": [
    "AppShell",
    "Article",
    "TableOfContents",
    "Disclosure",
    "Tabs",
  ],
  "Data & navigation": ["DataTable", "DefinitionList", "Pagination"],
};
export const descriptions: Record<string, string> = {
  Button: "A clear next step.",
  Notice: "Feedback that explains what happened.",
  Badge: "A little context, at a glance.",
  Dialog: "A focused moment in a larger task.",
  ErrorSummary: "A useful way back from an error.",
  Field: "A name, a control, and the context between.",
  TextInput: "An open invitation to enter a detail.",
  Textarea: "Room for a longer thought.",
  Select: "A native choice from a known set.",
  FileInput: "Let the browser handle the file chooser.",
  Checkbox: "An independent yes or no.",
  Radio: "One choice among related options.",
  Switch: "A setting with two clear positions.",
  Fieldset: "Related controls, held together.",
  AppShell: "A place for navigation and the work itself.",
  Article: "A reading rhythm with room for context.",
  TableOfContents: "A map through longer material.",
  Disclosure: "Optional detail, available when needed.",
  Tabs: "Related views in one place.",
  DataTable: "Relationships that deserve rows and columns.",
  DefinitionList: "Terms and their meaning, side by side.",
  Pagination: "A measured way through a collection.",
};
