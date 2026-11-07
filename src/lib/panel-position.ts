export interface PanelPosition {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

export interface PanelState {
  position: PanelPosition
  minimized: boolean
}
const STEP_PX = 16
const BIG_STEP_PX = 64
const MOVES: Record<string, PanelPosition> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }

/** Keeps a panel of `size` inside `bounds`; one larger than the bounds is pinned top left so its header stays reachable. */
export function clampToBounds(position: PanelPosition, size: Size, bounds: Size): PanelPosition {
  const clamp = (value: number, room: number) => Math.min(Math.max(0, value), Math.max(0, room))
  return { x: clamp(position.x, bounds.width - size.width), y: clamp(position.y, bounds.height - size.height) }
}

/** Where an arrow key moves a panel, or null for any other key. */
export function nudge(position: PanelPosition, key: string, big: boolean): PanelPosition | null {
  const move = MOVES[key]
  if (!move) return null
  const step = big ? BIG_STEP_PX : STEP_PX
  return { x: position.x + move.x * step, y: position.y + move.y * step }
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

/** The stored state under `key`, or `fallback` when storage is missing, blocked, broken or holds something else. */
export function readPanelState(storage: Pick<Storage, "getItem"> | null, key: string, fallback: PanelState): PanelState {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null || !("position" in parsed) || !("minimized" in parsed)) return fallback
    const { position, minimized } = parsed
    if (typeof minimized !== "boolean" || typeof position !== "object" || position === null || !("x" in position) || !("y" in position)) return fallback
    const { x, y } = position
    return isNumber(x) && isNumber(y) ? { position: { x, y }, minimized } : fallback
  } catch {
    return fallback
  }
}

/** Stores the state; false when storage is missing or blocked, in which case the panel simply forgets. */
export function writePanelState(storage: Pick<Storage, "setItem"> | null, key: string, state: PanelState): boolean {
  try {
    storage?.setItem(key, JSON.stringify(state))
    return storage !== null
  } catch {
    return false
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}
