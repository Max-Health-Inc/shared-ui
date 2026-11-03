import { useState, useEffect, useCallback } from "react";

export type Scene = "room-edges" | "perspective-grid" | "none";

export const SCENES: { id: Scene; name: string; description: string }[] = [
  { id: "room-edges", name: "Room Edges", description: "Subtle converging edge lines with horizon glow" },
  { id: "perspective-grid", name: "Perspective Grid", description: "3D floor plane with grid lines" },
  { id: "none", name: "Flat", description: "Plain solid background, no effects" },
];

const DEFAULT_SCENE: Scene = "perspective-grid";

export function isScene(value: string): value is Scene {
  return SCENES.some((entry) => entry.id === value);
}

export function readStoredScene(storageKey: string, fallback: Scene): Scene {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored !== null && isScene(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function applyScene(scene: Scene) {
  document.body.setAttribute("data-scene", scene);
}

export interface UseSceneOptions {
  /** localStorage key used to persist the active scene. @default "scene" */
  storageKey?: string;
  /** Scene to use when nothing is stored yet. @default "perspective-grid" */
  defaultScene?: Scene;
}

/**
 * Manages the active background scene by toggling a `data-scene` attribute on
 * `<body>`. The chosen scene is persisted to localStorage.
 *
 * Pair with `@max-health-inc/shared-ui/scenes.css` for the actual CSS effects.
 */
export function useScene({
  storageKey = "scene",
  defaultScene = DEFAULT_SCENE,
}: UseSceneOptions = {}) {
  const [scene, setSceneState] = useState<Scene>(() => readStoredScene(storageKey, defaultScene));

  const setScene = useCallback(
    (next: Scene) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // storage blocked; the choice lasts for this page only
      }
      setSceneState(next);
      applyScene(next);
    },
    [storageKey],
  );

  useEffect(() => {
    applyScene(scene);
  }, [scene]);

  return { scene, setScene } as const;
}
