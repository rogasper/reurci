import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { PDFViewerProps } from "@react-pdf/renderer";
import { PDFViewer } from "@react-pdf/renderer";
import React, { Suspense } from "react";
import { Skeleton } from "@reurci/ui/components/skeleton";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/...", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/...", fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: "36pt 36pt 36pt 48pt", fontSize: "10pt", fontFamily: "Helvetica", lineHeight: 1.4, color: "#111" },
  header: { paddingBottom: "8pt", textAlign: "center" },
  name: { fontSize: "18pt", fontWeight: 700, marginBottom: "14pt" },
  contact: { fontSize: "9pt", color: "#444", marginBottom: "1pt" },
  sectionTitle: { fontSize: "11pt", fontWeight: 700, borderBottom: "0.5pt solid #999", marginTop: "14pt", marginBottom: "6pt", paddingBottom: "2pt", textTransform: "uppercase", letterSpacing: "0.5pt" },
  summary: { fontSize: "9.5pt", marginBottom: "4pt", color: "#222", lineHeight: 1.5 },
  expItem: { marginBottom: "8pt" },
  expHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: "2pt" },
  expRole: { fontSize: "10pt", fontWeight: 700 },
  expDates: { fontSize: "9pt", color: "#555" },
  expCompany: { fontSize: "9pt", color: "#444", fontStyle: "italic", marginBottom: "2pt" },
  bullet: { fontSize: "9pt", marginBottom: "1pt", paddingLeft: "10pt" },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: "4pt", marginTop: "2pt" },
  skillChip: { fontSize: "8.5pt", paddingRight: "6pt", color: "#333" },
  eduItem: { marginBottom: "3pt", fontSize: "9pt" },
});

interface CVData {
  name: string;
  title?: string;
  email: string;
  phone: string;
  linkedin: string;
  github?: string;
  website?: string;
  summary: string;
  sectionOrder?: string[];
  experiences: {
    company: string;
    role: string;
    periodStart: string;
    periodEnd: string | null;
    achievements: string[];
  }[];
  skills: { name: string; category?: string }[];
  educations: {
    institution: string;
    degree: string | null;
    field: string | null;
    yearStart: number | null;
    yearEnd: number | null;
  }[];
  certificates?: {
    name: string;
    issuer?: string;
    year?: number;
    url?: string;
  }[];
  languages?: {
    name: string;
    proficiency?: string;
  }[];
  achievements?: {
    title: string;
    description?: string;
    year?: number;
  }[];
  projects?: {
    name: string;
    description?: string;
    url?: string;
    techStack?: string[];
    year?: number;
  }[];
}

export function CvDocument({ data }: { data: CVData }) {
  const order = data.sectionOrder ?? ["summary", "experiences", "skills", "education", "certifications", "languages", "achievements", "projects"];

  const renderSection = (key: string) => {
    switch (key) {
      case "summary":
        return data.summary ? (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </>
        ) : null;
      case "experiences":
        return (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experiences.map((exp, i) => (
              <View key={i} style={styles.expItem}>
                <View style={styles.expHeader}>
                  <Text style={styles.expRole}>{exp.role}</Text>
                  <Text style={styles.expDates}>{exp.periodStart} — {exp.periodEnd ?? "Present"}</Text>
                </View>
                <Text style={styles.expCompany}>{exp.company}</Text>
                {exp.achievements.map((a, j) => (<Text key={j} style={styles.bullet}>• {a}</Text>))}
              </View>
            ))}
          </>
        );
      case "skills":
        return (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            {(() => {
              const map = new Map<string, string[]>();
              for (const s of data.skills) { const cat = s.category || "Skills"; if (!map.has(cat)) map.set(cat, []); map.get(cat)!.push(s.name); }
              const sorted = [...map.entries()].sort(([a], [b]) => a === "Skills" ? 1 : b === "Skills" ? -1 : a.localeCompare(b));
              return sorted.map(([cat, names], i) => (
                <View key={i} style={styles.eduItem}>
                  <Text style={{ fontSize: "9pt", color: "#333" }}><Text style={{ fontWeight: 700 }}>{cat}: </Text>{names.join(", ")}</Text>
                </View>
              ));
            })()}
          </>
        );
      case "education":
        return data.educations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.educations.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: 700 }}>{edu.institution}</Text>
                <Text style={{ color: "#444" }}>{[edu.degree, edu.field].filter(Boolean).join(", ")}{(edu.yearStart || edu.yearEnd) && ` (${edu.yearStart ?? ""}${edu.yearEnd ? ` — ${edu.yearEnd}` : ""})`}</Text>
              </View>
            ))}
          </>
        ) : null;
      case "certifications":
        return data.certificates && data.certificates.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certificates.map((cert, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: 700 }}>{cert.name}</Text>
                <Text style={{ color: "#444" }}>{cert.issuer}{cert.year ? ` · ${cert.year}` : ""}</Text>
              </View>
            ))}
          </>
        ) : null;
      case "languages":
        return data.languages && data.languages.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsRow}>
              {data.languages!.map((lang, i) => (
                <Text key={i} style={styles.skillChip}>{lang.name}{lang.proficiency ? ` (${lang.proficiency})` : ""}{i < data.languages!.length - 1 ? "," : ""}</Text>
              ))}
            </View>
          </>
        ) : null;
      case "achievements":
        return data.achievements && data.achievements.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Achievements & Awards</Text>
            {data.achievements.map((ach, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: 700 }}>{ach.title}</Text>
                {ach.description && <Text style={{ color: "#444" }}>{ach.description}{ach.year ? ` (${ach.year})` : ""}</Text>}
              </View>
            ))}
          </>
        ) : null;
      case "projects":
        return data.projects && data.projects.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: 700 }}>{proj.name}</Text>
                {proj.url && <Text style={{ color: "#084e72", fontSize: "8pt" }}>{proj.url}</Text>}
                {proj.description && <Text style={{ color: "#444" }}>{proj.description}{proj.year ? ` (${proj.year})` : ""}</Text>}
                {proj.techStack && proj.techStack.length > 0 && <Text style={{ color: "#555", fontSize: "8.5pt" }}>{proj.techStack.join(", ")}</Text>}
              </View>
            ))}
          </>
        ) : null;
      default: return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name || "Your Name"}</Text>
          <Text style={styles.contact}>
            {(() => {
              const parts: string[] = [];
              const topSkills = data.skills?.slice(0, 6).map(s => s.name);
              const titleStr = data.title || data.experiences?.[0]?.role || "";
              if (titleStr) { parts.push(topSkills?.length ? `${titleStr} (${topSkills.join(" · ")})` : titleStr); }
              else if (topSkills?.length) { parts.push(topSkills.join(" · ")); }
              return parts.join(" · ");
            })()}
          </Text>
          <Text style={styles.contact}>
            {[data.email, data.phone, data.website, data.github, data.linkedin].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {order.map((key) => (
          <React.Fragment key={key}>{renderSection(key)}</React.Fragment>
        ))}
      </Page>
    </Document>
  );
}

export function CvPreview({ data }: { data: CVData }) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-[24px]" />}>
      <PDFViewer
        style={{ width: "100%", height: "100%", minHeight: "600px", border: "none", borderRadius: "24px" }}
        showToolbar={true}
      >
        <CvDocument data={data} />
      </PDFViewer>
    </Suspense>
  );
}
