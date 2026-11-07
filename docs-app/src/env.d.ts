declare module "docs-family" {
  export * from "@martlet/react-runtime";
  export const family: "martlet" | "krigsvold";
  export const familyName: string;
}

declare module "docs-layout" {
  export const familyMark: string;
  export const FamilyLayout: import("react").ComponentType<
    import("./layout-types").LayoutProps
  >;
  export const ComponentPage: import("react").ComponentType<
    import("./layout-types").PageProps
  >;
  export const FamilyHome: import("react").ComponentType;
}
declare module "*.svg" {
  const url: string;
  export default url;
}
declare module "docs-pattern" {
  export const CollectionPattern: import("react").ComponentType;
}
declare module "docs-reference-pattern" {
  export const PatternLayout: import('react').ComponentType<{navigation:import('react').ReactNode;context:import('react').ReactNode;children:import('react').ReactNode}>;
}
declare module "*?raw" {
  const value: string;
  export default value;
}
declare module "docs-grammar" {
  const value: string;
  export default value;
}
declare module "docs-decisions" {
  const decisions: string;
  export default decisions;
}

declare module 'docs-distribution' {
 const value: {home:string;preview:{version:string;stage:string};mcp:{url:string;published:boolean};packages:{React:{version:string;published:boolean;install:string;sourceCommit:string}}};
 export default value;
}
