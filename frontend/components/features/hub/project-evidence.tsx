"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
export function ProjectEvidence({
  selected,
  onChange,
  preview = false,
  disabled = false,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  preview?: boolean;
  disabled?: boolean;
}) {
  const query = useQuery<{ id: string; project_name: string }[]>({
    queryKey: ["hub-projects"],
    queryFn: async () => {
      const response = await fetch("/api/hub/projects", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.projects;
    },
    retry: false,
    enabled: !preview,
  });
  return (
    <div className="my-5 border-t border-white/10 pt-4">
      <p className="text-sm text-white/65">
        Approved project evidence (optional, up to 5)
      </p>
      <p className="text-xs text-white/40 mt-1">
        Only selected projects will be shared with Gemini. Review synced
        evidence in your profile first.
      </p>
      {query.data?.length ? (
        <div className="flex flex-wrap gap-3 mt-3">
          {query.data.map((project) => (
            <label
              key={project.id}
              className="flex items-center gap-2 text-xs text-white/60"
            >
              <input
                type="checkbox"
                checked={selected.includes(project.id)}
                disabled={
                  disabled ||
                  (!selected.includes(project.id) && selected.length >= 5)
                }
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, project.id]
                      : selected.filter((id) => id !== project.id),
                  )
                }
              />
              {project.project_name}
            </label>
          ))}
        </div>
      ) : (
        <Link href="/profile" className="text-xs text-primary block mt-3">
          {query.error
            ? "Project evidence unavailable. Check profile setup."
            : "Add or sync your GitHub projects in Profile →"}
        </Link>
      )}
    </div>
  );
}
