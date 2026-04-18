import { Suspense } from "react";
import { EditorShell } from "@/components/editor/editor-shell";

export default function WorkspaceEditorPage() {
  return (
    <Suspense>
      <EditorShell />
    </Suspense>
  );
}
