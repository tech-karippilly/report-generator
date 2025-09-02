import type { PropsWithChildren } from "react";

type Tone = "info" | "success" | "warning" | "error";

export interface AlertProps {
  tone?: Tone;
  title?: string;
}

function toneClasses(tone: Tone): { container: string; title: string } {
  switch (tone) {
    case "success":
      return { container: "border-green-300 bg-green-50 text-green-800", title: "text-green-900" };
    case "warning":
      return { container: "border-yellow-300 bg-yellow-50 text-yellow-800", title: "text-yellow-900" };
    case "error":
      return { container: "border-red-300 bg-red-50 text-red-800", title: "text-red-900" };
    case "info":
    default:
      return { container: "border-blue-300 bg-blue-50 text-blue-800", title: "text-blue-900" };
  }
}

export default function Alert({ tone = "info", title, children }: PropsWithChildren<AlertProps>) {
  const t = toneClasses(tone);
  return (
    <div className={`rounded-md border px-3 py-2 ${t.container}`}>
      {title && <div className={`font-medium ${t.title}`}>{title}</div>}
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}


