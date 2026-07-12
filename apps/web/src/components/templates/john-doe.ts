export const CLASSIC_TEMPLATE = {
  id: "classic",
  name: "Classic",
  description: "Clean single-column layout. ATS-friendly, highlight achievements and skills.",
  defaultData: {
    name: "John Doe",
    title: "Fullstack Engineer",
    email: "john.doe@email.com",
    phone: "+62 895 4015 8888",
    linkedin: "linkedin.com/in/johndoe",
    github: "github.com/johndoe",
    website: "johndoe.dev",
    address: "",
    summary: "Senior Software Engineer with 6+ years of experience building scalable web applications and leading engineering teams. Proven track record of delivering high-impact projects in fintech and e-commerce, with deep expertise in React, TypeScript, and cloud architecture.",
    experiences: [
      {
        company: "TechCorp Indonesia",
        role: "Senior Software Engineer",
        periodStart: "Jan 2022",
        periodEnd: "Present",
        achievements: [
          "Led migration of monolith to microservices architecture, reducing deployment time by 70% and improving system reliability to 99.9% uptime",
          "Designed and implemented real-time analytics dashboard processing 2M+ events/day using Apache Kafka and ClickHouse",
          "Mentored 5 junior engineers through structured code review process, reducing production bugs by 40%",
        ],
      },
      {
        company: "StartupXYZ",
        role: "Software Engineer",
        periodStart: "Mar 2019",
        periodEnd: "Dec 2021",
        achievements: [
          "Built RESTful API serving 500K+ daily active users with TypeScript, Node.js, and PostgreSQL",
          "Reduced API response time from 800ms to 120ms through query optimization and Redis caching layer",
          "Implemented CI/CD pipeline with GitHub Actions, achieving 95% test coverage and zero-downtime deployments",
        ],
      },
    ],
    skills: [
      { name: "React" },
      { name: "TypeScript" },
      { name: "Node.js" },
      { name: "PostgreSQL" },
      { name: "Docker" },
      { name: "AWS" },
      { name: "Kubernetes" },
      { name: "GraphQL" },
    ],
    educations: [
      {
        institution: "University of Technology",
        degree: "B.Sc",
        field: "Computer Science",
        yearStart: 2015,
        yearEnd: 2019,
      },
    ],
    certificates: [
      { name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", year: 2023 },
      { name: "Kubernetes Administrator (CKA)", issuer: "CNCF", year: 2022 },
    ],
    languages: [
      { name: "English", proficiency: "Professional Working" },
      { name: "Indonesian", proficiency: "Native" },
    ],
    achievements: [
      { title: "Best Innovation Award 2024", description: "TechCorp annual award for the microservices migration project", year: 2024 },
      { title: "Dean's List", description: "University of Technology, 4 consecutive semesters", year: 2018 },
    ],
    projects: [
      { name: "OpenAPI Toolkit", description: "Open-source CLI tool for generating TypeScript types from OpenAPI specs. 500+ GitHub stars.", url: "github.com/johndoe/openapi-toolkit", techStack: ["TypeScript", "Node.js", "OpenAPI"], year: 2023 },
      { name: "DevDash", description: "Developer dashboard for monitoring CI/CD pipelines across multiple repos. Used by 3 teams internally.", url: "github.com/johndoe/devdash", techStack: ["React", "Go", "PostgreSQL", "Docker"], year: 2022 },
    ],
  },
};

export const TEMPLATES = [CLASSIC_TEMPLATE];
