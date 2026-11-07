// Compile consumer-native props and refs against both public package APIs.
import { createRef } from "react";
import * as Martlet from "@martlet/react-runtime";
import * as Krigsvold from "@krigsvold/react-runtime";
export const consumerContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.Field label="Email">
    {(props) => (
      <UI.TextInput
        {...props}
        ref={createRef<HTMLInputElement>()}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
    )}
  </UI.Field>
));
export const summaryContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.ErrorSummary
    ref={createRef<HTMLDivElement>()}
    title="Check the form"
    errors={[{ message: "Enter a name.", targetId: "name" }]}
  >
    <UI.Field id="name" label="Name">
      {(props) => <UI.TextInput {...props} />}
    </UI.Field>
  </UI.ErrorSummary>
));
export const articleContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.Article
    title="Contract"
    titleLevel={2}
    ref={createRef<HTMLElement>()}
    contents={
      <UI.TableOfContents
        ref={createRef<HTMLElement>()}
        items={[{ id: "purpose", label: "Purpose" }]}
      />
    }
  >
    <h3 id="purpose" tabIndex={-1}>
      Purpose
    </h3>
  </UI.Article>
));
export const fileContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.FileInput
    ref={createRef<HTMLInputElement>()}
    name="registry-file"
    accept=".json"
    multiple
    disabled
    aria-invalid="true"
  />
));

const radioRef = createRef<HTMLInputElement>();
const martletRadio = (
  <Martlet.Radio
    label="Outcome"
    name="martlet-outcome"
    value="passed"
    checked
    ref={radioRef}
    onChange={() => {}}
    aria-invalid={true}
  />
);
const krigsvoldRadio = (
  <Krigsvold.Radio
    label="Outcome"
    name="krigsvold-outcome"
    value="passed"
    checked
    ref={radioRef}
    onChange={() => {}}
    disabled
  />
);
void [martletRadio, krigsvoldRadio];

export const paginationContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.Pagination
    ref={createRef<HTMLElement>()}
    id="pages"
    label="Review pages"
    page={1}
    pageCount={3}
    onPageChange={() => {}}
    disabled
    aria-describedby="results"
  />
));

export const definitionContracts = [Martlet, Krigsvold].map((UI) => (
  <UI.DefinitionList
    ref={createRef<HTMLDListElement>()}
    id="context"
    aria-label="Saved context"
    items={[
      {
        id: "version",
        term: "Version",
        description: <strong>Experimental</strong>,
      },
    ]}
  />
));

export const settingsContracts = [Martlet, Krigsvold].map((UI) => (
  <>
    <UI.Switch
      label="Protect drafts"
      defaultChecked
      ref={createRef<HTMLInputElement>()}
      name="protect"
      onChange={(event) => event.currentTarget.checked}
      aria-describedby="help"
    />
    <UI.Tabs
      ref={createRef<HTMLDivElement>()}
      label="Settings"
      value="one"
      onValueChange={(id) => void id}
      orientation="vertical"
      items={[
        { id: "one", label: "General", content: <p>One</p> },
        { id: "two", label: "Recovery", content: <p>Two</p>, disabled: true },
      ]}
    />
  </>
));
