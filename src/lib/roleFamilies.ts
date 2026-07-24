// Role family classification with EN + PT keywords.
// Used to group both jobs and candidates into the same buckets on the live board.

export type RoleFamily = { key: string; label: string; match: (s: string) => boolean };

// All regexes are case-insensitive. Patterns include common English AND Portuguese
// terms recruiters actually type (e.g. "programador", "desenvolvedor", "engenheiro",
// "líder técnico", "analista funcional", "segurança", "dados", "nuvem"...).
export const ROLE_FAMILIES: RoleFamily[] = [
  {
    key: "frontend",
    label: "Frontend / React",
    // EN: frontend, react, angular, vue, next  ·  PT: front-end, frontend
    match: (s) => /(front[- ]?end|react|angular|vue|next\.?js|svelte)/i.test(s),
  },
  {
    key: "backend-java",
    label: "Backend · Java / JVM",
    match: (s) => /(java|spring(\s?boot)?|kotlin|scala|jvm|quarkus|micronaut)/i.test(s),
  },
  {
    key: "backend-dotnet",
    label: "Backend · .NET",
    match: (s) => /(\.net|c#|dotnet|asp\.net|blazor)/i.test(s),
  },
  {
    key: "backend-node",
    label: "Backend · Node / Python",
    match: (s) => /(node\.?js|python|django|fastapi|nest\.?js|flask|express)/i.test(s),
  },
  {
    key: "fullstack",
    label: "Full Stack",
    match: (s) => /(full[- ]?stack)/i.test(s),
  },
  {
    key: "data",
    label: "Data & Analytics",
    // EN + PT: dados, engenheiro de dados, analista de dados, ciência de dados
    match: (s) => /(data engineer|data scien|analytics|engenheiro de dados|cientista de dados|analista de dados|dados|airflow|dbt|snowflake|bigquery|spark|databricks|power\s?bi|tableau)/i.test(s),
  },
  {
    key: "devops",
    label: "DevOps & Cloud",
    // EN + PT: nuvem, infraestrutura
    match: (s) => /(devops|sre|kubernetes|k8s|terraform|aws|azure|gcp|google cloud|platform engineer|nuvem|infraestrutura|cloud|ci\/?cd|docker|ansible|jenkins)/i.test(s),
  },
  {
    key: "qa",
    label: "QA & Test Automation",
    // EN + PT: testador, qualidade, testes
    match: (s) => /(qa|q\.a\.|test automation|testador|testadora|testes|test engineer|cypress|playwright|selenium|qualidade de software)/i.test(s),
  },
  {
    key: "mobile",
    label: "Mobile · iOS / Android",
    match: (s) => /(android|ios|swift|kotlin android|react native|flutter|móvel|mobile)/i.test(s),
  },
  {
    key: "embedded",
    label: "Embedded & Systems",
    // EN + PT: embarcado, firmware, sistemas embarcados
    match: (s) => /(embedded|embarcado|sistemas embarcados|c\+\+|firmware|yocto|rtos|microcontrolador|stm32|esp32)/i.test(s),
  },
  {
    key: "security",
    label: "Cybersecurity",
    // EN + PT: segurança, cibersegurança
    match: (s) => /(cyber\s?security|cybersecurity|cibersegurança|seguran[çc]a (da informa[çc]ão|inform[áa]tica)?|siem|iso\s?27001|pentest|soc analyst|gdpr|rgpd)/i.test(s),
  },
  {
    key: "ba",
    label: "Business / Functional",
    // EN + PT: analista funcional, analista de negócio, gestor de produto, dono de produto, scrum
    match: (s) => /(business analyst|functional analyst|analista funcional|analista de neg[óo]cio|product owner|dono de produto|gestor de produto|scrum|agile|product manager|gestor de projeto|project manager|pmo)/i.test(s),
  },
  {
    key: "leadership",
    label: "Tech Leadership",
    // EN + PT: líder técnico, arquiteto, gestor de engenharia
    match: (s) => /(tech lead|engineering manager|architect|arquite[ct]to|principal engineer|staff engineer|l[íi]der t[ée]cnico|head of engineering|cto|chapter lead)/i.test(s),
  },
];

const FULLSTACK = { key: "fullstack", label: "Full Stack" };
const OTHER = { key: "other", label: "Other roles" };

// Backend families that, combined with a frontend signal, make a role "full stack".
const BACKEND_KEYS = new Set(["backend-java", "backend-dotnet", "backend-node"]);

function matches(text: string): RoleFamily[] {
  return ROLE_FAMILIES.filter((rf) => rf.match(text));
}

function hasFrontend(fams: RoleFamily[]) {
  return fams.some((f) => f.key === "frontend");
}
function hasBackend(fams: RoleFamily[]) {
  return fams.some((f) => BACKEND_KEYS.has(f.key));
}

function pick(fams: RoleFamily[]) {
  // ROLE_FAMILIES is authored in priority order; the first match wins the tie.
  const f = fams[0];
  return { key: f.key, label: f.label };
}

// Classify a role into a family. The **title is authoritative** — the tech stack
// only decides when the title is generic, or promotes a role to Full Stack.
//
// This fixes the case where a "Java Lead Developer" carrying React in its stack
// was bucketed as Frontend/React just because "react" appeared anywhere in the
// blob. The title says Java, so it is Backend · Java.
export function familyFor(
  title: string,
  stack: string[] = [],
): { key: string; label: string } {
  // Explicit full-stack in the title always wins.
  if (/full[- ]?stack/i.test(title)) return FULLSTACK;

  const titleHits = matches(title);
  if (titleHits.length > 0) {
    // A title that names both a frontend and a backend discipline is full stack.
    if (hasFrontend(titleHits) && hasBackend(titleHits)) return FULLSTACK;
    return pick(titleHits);
  }

  // Generic title (e.g. "Software Engineer", "Consultant") — fall back to stack.
  const stackHits = matches(stack.join(" "));
  if (stackHits.length > 0) {
    if (hasFrontend(stackHits) && hasBackend(stackHits)) return FULLSTACK;
    return pick(stackHits);
  }

  return OTHER;
}