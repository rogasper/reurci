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
import { Suspense } from "react";
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
  header: { marginBottom: "14pt", borderBottom: "1pt solid #333", paddingBottom: "8pt" },
  name: { fontSize: "18pt", fontWeight: 700, marginBottom: "2pt" },
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
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  experiences: {
    company: string;
    role: string;
    periodStart: string;
    periodEnd: string | null;
    achievements: string[];
  }[];
  skills: { name: string }[];
  educations: {
    institution: string;
    degree: string | null;
    field: string | null;
    yearStart: number | null;
    yearEnd: number | null;
  }[];
}

export function CvDocument({ data }: { data: CVData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name || "Your Name"}</Text>
          <Text style={styles.contact}>{data.email}</Text>
          <Text style={styles.contact}>{data.phone}  |  {data.linkedin}</Text>
        </View>

        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{data.summary}</Text>

        <Text style={styles.sectionTitle}>Experience</Text>
        {data.experiences.map((exp, i) => (
          <View key={i} style={styles.expItem}>
            <View style={styles.expHeader}>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expDates}>
                {exp.periodStart} — {exp.periodEnd ?? "Present"}
              </Text>
            </View>
            <Text style={styles.expCompany}>{exp.company}</Text>
            {exp.achievements.map((a, j) => (
              <Text key={j} style={styles.bullet}>• {a}</Text>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsRow}>
          {data.skills.map((s, i) => (
            <Text key={i} style={styles.skillChip}>{s.name}{i < data.skills.length - 1 ? "," : ""}</Text>
          ))}
        </View>

        {data.educations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.educations.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: 700 }}>{edu.institution}</Text>
                <Text style={{ color: "#444" }}>
                  {[edu.degree, edu.field].filter(Boolean).join(", ")}
                  {(edu.yearStart || edu.yearEnd) && ` (${edu.yearStart ?? ""}${edu.yearEnd ? ` — ${edu.yearEnd}` : ""})`}
                </Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

export function CvPreview({ data }: { data: CVData }) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-[24px]" />}>
      <PDFViewer
        style={{ width: "100%", height: "100%", minHeight: "600px", border: "none", borderRadius: "24px" }}
        showToolbar={false}
      >
        <CvDocument data={data} />
      </PDFViewer>
    </Suspense>
  );
}
