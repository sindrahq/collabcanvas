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
  theme?: "default" | "projects";
};

export default function Sidebar({
  active = "my-projects",
  icons = {},
  onCreateProject,
  creatingProject = false,
  onSectionChange,
  theme = "default",
}: SidebarProps) {
  const showCreateButton = active === "my-projects";
  const isProjectsTheme = theme === "projects";

  return (
    <aside
      className={clsx(
        "group/sidebar hidden md:flex h-full w-20 flex-col overflow-hidden border-r px-2 py-4 transition-[width] duration-300 ease-out hover:w-56",
        isProjectsTheme
          ? "border-[rgba(26,26,26,0.14)] bg-white/40 backdrop-blur-md"
          : "border-white/10 bg-[#121212]"
      )}
    >
      <div className="mb-6 flex items-center justify-center pl-0.5 group-hover/sidebar:justify-start">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md">
            <img
              src={icons.designStudio || "/design_studio.png"}
              alt="Design Studio"
              className="h-5 w-5 object-contain"
            />
          </span>
          <span
            className={clsx(
              "max-w-0 overflow-hidden whitespace-nowrap text-base leading-none uppercase opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100",
              isProjectsTheme ? "text-[var(--projects-text)]" : "text-white"
            )}
          >
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
                "flex h-11 w-full items-center justify-center rounded-xl px-2 transition-colors group-hover/sidebar:justify-start",
                isCompactPrimary ? "gap-1.5" : "gap-2",
                isActive
                  ? isProjectsTheme
                    ? "bg-white/50 text-[var(--projects-accent)] shadow-sm"
                    : "bg-[#17315c] text-[#9fd0ff]"
                  : isProjectsTheme
                    ? "text-[var(--projects-muted)] hover:bg-white/30 hover:text-[var(--projects-text)]"
                    : "text-white/70 hover:text-white"
              )}
              style={{ fontWeight: isCompactPrimary ? 400 : isActive ? 600 : 500 }}
            >
              <span
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
                )}
              >
                <img
                  src={icons[item.iconKey] || "/default.png"}
                  alt={item.label}
                  className={clsx(
                    "object-contain",
                    isRequestedLargeIcon ? "w-5 h-5" : "w-4 h-4",
                    isProjectsTheme ? "opacity-85" : isActive ? "filter-none" : "opacity-70"
                  )}
                />
              </span>
              <span
                className={clsx(
                  "max-w-0 overflow-hidden whitespace-nowrap text-left opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100",
                  isCompactPrimary ? "text-[13px]" : "text-sm"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
