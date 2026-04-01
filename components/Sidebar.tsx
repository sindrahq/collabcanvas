import React from "react";
import clsx from "clsx";

const NAV_ITEMS = [
  {
    key: "my-projects",
    label: "My Projects",
    iconKey: "myProjects",
  },
  {
    key: "shared",
    label: "Shared with me",
    iconKey: "shared",
  },
  {
    key: "trash",
    label: "Trash",
    iconKey: "trash",
  },
];

type SidebarProps = {
  active?: string;
  icons?: Record<string, string>;
  onCreateProject?: () => void;
  creatingProject?: boolean;
  onSectionChange?: (section: "my-projects" | "shared" | "trash") => void;
};

export default function Sidebar({
  active = "my-projects",
  icons = {},
  onCreateProject,
  creatingProject = false,
  onSectionChange,
}: SidebarProps) {
  const showCreateButton = active === "my-projects";

  return (
    <aside className="flex h-full w-48 flex-col bg-[#121212] px-4 py-4 font-inter border-r border-white/10">
      <div className="mb-6">
        <div className="flex items-center gap-1">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md">
            <img
              src={icons.designStudio || "/design_studio.png"}
              alt="Design Studio"
              className="h-5 w-5 object-contain"
            />
          </span>
          <span className="font-sans text-white font-medium text-base whitespace-nowrap leading-none uppercase">
            Design Studio
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          const isCompactPrimary = item.key === "my-projects" || item.key === "shared";
          const isRequestedLargeIcon =
            item.key === "shared" || item.key === "trash";
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSectionChange?.(item.key as "my-projects" | "shared" | "trash")}
              className={clsx(
                "flex items-center px-2 w-full h-11 rounded-xl transition-colors",
                isCompactPrimary ? "gap-1" : "gap-2",
                isActive
                  ? "bg-[#17315c] text-[#9fd0ff]"
                    : "text-white/70 hover:text-white"
              )}
              style={{ fontWeight: isCompactPrimary ? 400 : isActive ? 600 : 500 }}
            >
              <span
                className={clsx(
                  "inline-flex items-center justify-center rounded-md",
                  "h-6 w-6"
                )}
              >
                <img
                  src={icons[item.iconKey] || "/default.png"}
                  alt={item.label}
                  className={clsx(
                    "object-contain",
                    isRequestedLargeIcon ? "w-5 h-5" : "w-4 h-4",
                    isActive ? "filter-none" : "opacity-70"
                  )}
                />
              </span>
              <span className={clsx(isCompactPrimary ? "text-[13px]" : "text-sm")}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showCreateButton ? (
        <div className="mt-auto pt-5">
          <button
            onClick={onCreateProject}
            disabled={creatingProject}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[18px] border border-[#66b2ff]/40 bg-gradient-to-br from-[#1c6dff]/45 via-[#2894ff]/35 to-[#5bb8ff]/35 px-3 py-3 text-[11px] font-medium text-white shadow-[0_10px_24px_rgba(10,55,130,0.45)] backdrop-blur-md transition-all hover:border-[#9fd0ff]/60 hover:from-[#247bff]/50 hover:to-[#6bc1ff]/40"
            type="button"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#66b2ff]/30 text-sm leading-none text-white transition-colors group-hover:bg-[#7fc0ff]/40">
              +
            </span>
            <span className="whitespace-nowrap">{creatingProject ? "Creating..." : "Create New Project"}</span>
            <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.24),transparent_55%)]" />
          </button>
        </div>
      ) : null}
    </aside>
  );
}
