import {AstroShell} from '../shell/AstroShell';
import chrome from '../shell/krigsvold/chrome.json';
import '../shell/krigsvold/krigsvold-shell.css';
import { useEffect, useRef, useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  DataTable,
  DefinitionList,
  Disclosure,
} from "docs-family";
import mark from "../../brand/krigsvold-mark.svg";
import { groups, descriptions, repo, implementationVersion } from "../data";
export const familyMark = mark;
import type { LayoutProps, PageProps } from "../layout-types";
import "./krigsvold.css";
function ReferenceRegister({page}:{page:LayoutProps['page']}) {
  return (<div className="krigsvold-reference-register">
            <div>
              <a href="?" aria-current={page === "home" ? "page" : undefined}>
                Overview
              </a>
              <a
                href="?page=start"
                aria-current={page === "start" ? "page" : undefined}
              >
                Getting Started
              </a>
              <a
                href="?page=language"
                aria-current={page === "language" ? "page" : undefined}
              >
                Design Language
              </a>
              <a
                href="?page=collection"
                aria-current={page === "collection" ? "page" : undefined}
              >
                Working Patterns
              </a>
              <a href="?page=patterns" aria-current={page === 'patterns' ? 'page' : undefined}>Reference Patterns</a>
              <a href="?page=research" aria-current={page === "research" ? "page" : undefined}>Research Project</a>
              <a
                href="?page=agents"
                aria-current={page === "agents" ? "page" : undefined}
              >
                Agent Tools
              </a>
              <a href="https://krigsvolddesign.dev/">Design Language ↗</a>
              <a href={repo}>Source ↗</a>
            </div>
            <span>0.3 PREVIEW · REACT {implementationVersion}</span>
          </div>);
}
export function FamilyLayout(props: LayoutProps) { return <AstroShell {...props} family="krigsvold" chrome={chrome} />; }
export function ComponentPage({
  name,
  description,
  category,
  playground,
  api,
  accessibility,
}: PageProps) {
  return (
    <article className="krigsvold-reference-component">
      <header className="krigsvold-reference-heading">
        <p className="reference-kicker">{category}</p>
        <h2>{name}</h2>
        <p>{description}</p>
        <DefinitionList
          items={[
            { id: "status", term: "Status", description: "Experimental" },
            { id: "version", term: "Version", description: implementationVersion },
            { id: "platform", term: "Platform", description: "React 19" },
          ]}
        />
      </header>
      <nav
        className="krigsvold-reference-sections"
        aria-label="Component sections"
      >
        <a href="#playground">Specimen</a>
        <a href="#api">API</a>
        <a href="#accessibility">Behavior</a>
      </nav>
      <div className="krigsvold-reference-workspace">
        <section aria-label="Interactive specimen">{playground}</section>
        <aside
          className="krigsvold-reference-contract"
          aria-label="Component contract"
        >
          {api}
          {accessibility}
        </aside>
      </div>
    </article>
  );
}
export function FamilyHome() {
  return (
    <>

      <ReferenceRegister page="home" />
      <div className="krigsvold-reference-status">
        <DefinitionList
          items={[
            { id: "exports", term: "Components", description: "22" },
            { id: "support", term: "Platform", description: "React 19" },
            { id: "license", term: "License", description: "MIT" },
          ]}
        />
        <Badge>Experimental · {implementationVersion}</Badge>
      </div>
      <section id="components" className="krigsvold-reference-catalog">
        <header>
          <p className="reference-kicker">Component register</p>
          <h2>A place for each part.</h2>
          <p>
            Choose a component to inspect its states, API and interaction
            contract.
          </p>
        </header>
        {Object.entries(groups).map(([group, names]) => (
          <DataTable key={group} caption={group}>
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr key={name}>
                  <th scope="row">
                    <a href={`?component=${name}`}>{name} ↗</a>
                  </th>
                  <td>{descriptions[name]}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ))}
      </section>
    </>
  );
}
