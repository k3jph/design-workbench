import {AstroShell} from '../shell/AstroShell';
import chrome from '../shell/martlet/chrome.json';
import '../shell/martlet/martlet-shell.css';
import { useEffect, useRef, useState } from "react";
import {
  AppShell,
  Article,
  Badge,
  Button,
  Disclosure,
  TableOfContents,
} from "docs-family";
import mark from "../../brand/martlet-mark.svg";
import { groups, descriptions, repo, implementationVersion } from "../data";
export const familyMark = mark;
import type { LayoutProps, PageProps } from "../layout-types";
import "./martlet.css";
export function FamilyLayout(props: LayoutProps) { return <AstroShell {...props} family="martlet" chrome={chrome} />; }
export function ComponentPage({
  name,
  description,
  category,
  playground,
  api,
  accessibility,
}: PageProps) {
  return (
    <Article
      className="martlet-reference-article"
      titleLevel={2}
      title={name}
      eyebrow={category}
      summary={description}
      metadata={<Badge>Experimental · {implementationVersion}</Badge>}
      contents={
        <TableOfContents
          items={[
            { id: "playground", label: "Try the component" },
            { id: "example", label: "Use it in React", depth: 3 },
            { id: "api", label: "API & composition" },
            { id: "accessibility", label: "States & accessibility" },
          ]}
        />
      }

    >
      <div className="martlet-reference-example">{playground}</div>
      <section className="martlet-reference-contract">
        {api}
        {accessibility}
      </section>
    </Article>
  );
}
export function FamilyHome() {
  return (
    <>

      <Article
        title="A collection of things worth keeping."
        titleLevel={2}
        eyebrow="Commonplace / A working pattern"
        summary="Find an idea. Give it your attention. Shape what comes next."
        aside={
          <>
            <Badge>22 components</Badge>
            <p>React 19 · ES modules · MIT</p>
            <a href="?component=Article">Explore Article →</a>
          </>
        }
      >
        <p>
          Browse a collection, read a note, and edit it without losing your
          place. Then try a failed save: your work stays with you. A language
          has to account for the whole task.
        </p>
        <div className="martlet-reference-actions">
          <Button
            onClick={() => {
              location.href = "?page=collection";
            }}
          >
            Open Commonplace
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              location.href = "?page=agents";
            }}
          >
            Build with Martlet
          </Button>
        </div>
      </Article>
      <section id="components" className="martlet-reference-collection">
        <p className="reference-kicker">The collection</p>
        <h2>Find the piece you need.</h2>
        {Object.entries(groups).map(([group, names]) => (
          <section key={group}>
            <h3>{group}</h3>
            <div>
              {names.map((name) => (
                <a href={`?component=${name}`} key={name}>
                  <strong>{name}</strong>
                  <span>{descriptions[name]}</span>
                  <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
