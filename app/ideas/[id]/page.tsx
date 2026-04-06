"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  User,
  BarChart2,
  Swords,
  Wrench,
  Lightbulb,
  Trash2,
  Loader2,
  ArrowLeft,
  Download,
} from "lucide-react";

interface Competitor {
  name: string;
  differentiation: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  problem: string;
  customer: string;
  market: string;
  competitor: Competitor[];
  tech_stack: string[];
  risk_level: string;
  profitability_score: number;
  justification: string;
  created_at: string;
}

export default function IdeaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/ideas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setIdea(data);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    setDeleting(true);
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    router.push("/ideas");
  };

  const handleDownloadPDF = async () => {
    if (!idea) return;
    setDownloading(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      const addLine = () => {
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;
      };

      const addText = (
        text: string,
        fontSize: number,
        bold = false,
        indent = 0,
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        const lines = pdf.splitTextToSize(text, maxWidth - indent);
        lines.forEach((line: string) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin + indent, y);
          y += fontSize * 0.38;
        });
        y += 0;
      };

      const addSectionHeading = (title: string) => {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        y += 3;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        const lines = pdf.splitTextToSize(title, maxWidth);
        lines.forEach((line: string) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin, y);
          y += 3; // ← tighter spacing before underline
        });
        addLine();
      };

      // ── Main Title ──
      addText("AI Startup Validator Report", 20, true);
      addLine();

      // ── Startup Name ──
      addText(idea.title, 16, true);
      y += 0;

      // ── Description ──
      addText(idea.description, 10);
      addText(
        `Submitted on ${new Date(idea.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        9,
      );

      y += 4;

      // ── Score + Risk ──
      addSectionHeading("Overview");
      addText(`Profitability Score: ${idea.profitability_score}/100`, 11, true);
      addText(`Risk Level: ${idea.risk_level}`, 11, true);

      // ── Sections ──
      addSectionHeading("Problem Summary");
      addText(idea.problem, 10);

      addSectionHeading("Customer Persona");
      addText(idea.customer, 10);

      addSectionHeading("Market Overview");
      addText(idea.market, 10);

      addSectionHeading("Competitors");
      (idea.competitor ?? []).forEach((c, i) => {
        addText(`${i + 1}. ${c.name}`, 10, true, 2);
        addText(`${c.differentiation}`, 10, false, 6);
      });

      addSectionHeading("Suggested Tech Stack");
      addText((idea.tech_stack ?? []).join(", "), 10);

      addSectionHeading("Justification");
      addText(idea.justification, 10);

      pdf.save(`${idea.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setDownloading(false);
  };

  const riskColor = (risk: string) => {
    if (risk === "Low")
      return "text-green-400 bg-green-400/10 border-green-400/20";
    if (risk === "Medium")
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading report...</span>
      </div>
    );

  if (!idea)
    return (
      <div className="text-center py-20 text-gray-400">Idea not found.</div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/ideas"
          className="text-gray-400 hover:text-white text-sm transition flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50 flex items-center gap-1"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report — this div gets captured for PDF */}
      <div ref={reportRef}>
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{idea.title}</h1>
          <p className="text-gray-400">{idea.description}</p>
          <p className="text-gray-600 text-xs mt-2">
            Submitted on{" "}
            {new Date(idea.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Score + Risk */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Profitability Score</p>
            <p
              className={`text-5xl font-bold ${scoreColor(idea.profitability_score)}`}
            >
              {idea.profitability_score}
              <span className="text-xl text-gray-500">/100</span>
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Risk Level</p>
            <span
              className={`text-2xl font-bold px-4 py-1 rounded-full border ${riskColor(idea.risk_level)}`}
            >
              {idea.risk_level}
            </span>
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-4">
          {/* Problem */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Problem Summary
            </h2>
            <p className="text-gray-300 leading-relaxed">{idea.problem}</p>
          </div>

          {/* Customer */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Persona
            </h2>
            <p className="text-gray-300 leading-relaxed">{idea.customer}</p>
          </div>

          {/* Market */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Market Overview
            </h2>
            <p className="text-gray-300 leading-relaxed">{idea.market}</p>
          </div>

          {/* Competitors */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4" /> Competitors
            </h2>
            <div className="space-y-3">
              {(idea.competitor ?? []).map((c, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-orange-400 font-bold shrink-0">
                    {i + 1}.
                  </span>
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-gray-400">
                      {" "}
                      — {c.differentiation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Suggested Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {(idea.tech_stack ?? []).map((tech, i) => (
                <span
                  key={i}
                  className="bg-green-400/10 text-green-400 border border-green-400/20 px-3 py-1 rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-yellow-400 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Justification
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {idea.justification}
            </p>
          </div>
        </div>
      </div>
      {/* end reportRef */}
    </div>
  );
}
