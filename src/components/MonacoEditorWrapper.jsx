import { useMemo } from "react";
import Editor from "@monaco-editor/react";

export default function MonacoEditorWrapper({
  language,
  value,
  onChange,
  height = "260px",
  readOnly = false,
}) {
  const monacoLang = useMemo(() => {
    if (language === "python") return "python";
    if (language === "cpp") return "cpp";
    if (language === "java") return "java";
    return "plaintext";
  }, [language]);

  return (
    <div className="rounded-xl border border-emerald-500/70 overflow-hidden bg-slate-950">
      <Editor
        height={height}
        defaultLanguage={monacoLang}
        language={monacoLang}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        theme="vs-dark"
      />
    </div>
  );
}
