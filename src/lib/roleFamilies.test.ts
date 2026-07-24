import { describe, it, expect } from "vitest";
import { familyFor } from "@/lib/roleFamilies";

describe("familyFor — title is authoritative", () => {
  const cases: Array<[string, string[], string]> = [
    // Regression: a Java role with React in the stack must NOT become Frontend.
    ["Java Lead Developer", ["Java", "React", "AWS"], "Backend · Java / JVM"],
    ["Frontend Developer", ["React", "TypeScript"], "Frontend / React"],
    ["Full Stack Engineer", ["Java", "React"], "Full Stack"],
    // Generic title -> the stack decides. FE + BE signals => Full Stack.
    ["Software Engineer", ["Java", "React", "AWS"], "Full Stack"],
    ["Software Engineer", ["React"], "Frontend / React"],
    [".NET Developer", ["C#", "Azure"], "Backend · .NET"],
    ["DevOps Engineer", ["AWS", "Kubernetes"], "DevOps & Cloud"],
    ["Data Engineer", ["Spark", "Airflow"], "Data & Analytics"],
    ["Office Manager", [], "Other roles"],
  ];

  for (const [title, stack, label] of cases) {
    it(`${title} [${stack.join(", ")}] -> ${label}`, () => {
      expect(familyFor(title, stack).label).toBe(label);
    });
  }
});
