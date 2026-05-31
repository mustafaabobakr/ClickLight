import { useState } from "react"
import type { RefObject } from "react"
import type { ClickKind, Pulse } from "../types"

/**
 * Return type of `usePulses`.
 *
 * @example
 * ```ts
 * const { pulses, addPulse } = usePulses({ idRef })
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to render in-flight pulse overlays
 */
export type UsePulsesResult = {
	/** In-flight pulse overlays to render. */
	pulses: Pulse[]
	/**
	 * Schedules a new pulse at the given position, auto-removing it after its animation completes.
	 */
	addPulse: (params: { x: number; y: number; kind: ClickKind }) => void
}

/**
 * Manages in-flight pulse animation state.
 *
 * Keeps a capped list of active pulses and auto-removes each one after its
 * animation duration (900 ms).
 *
 * @param params - Configuration object.
 * @param params.idRef - Shared mutable ref used to generate globally unique pulse IDs.
 *
 * @example
 * ```ts
 * const { pulses, addPulse } = usePulses({ idRef: animationIdRef })
 * addPulse({ x: 100, y: 200, kind: "press" })
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to spawn pulse overlays on pointer events
 */
export function usePulses({ idRef }: { idRef: RefObject<number> }): UsePulsesResult {
	const [pulses, setPulses] = useState<Pulse[]>([])

	function removePulseById(id: number) {
		setPulses((current) => current.filter((item) => item.id !== id))
	}

	function addPulse({ x, y, kind }: { x: number; y: number; kind: ClickKind }) {
		const pulse: Pulse = { id: idRef.current++, kind, x, y }
		setPulses((current) => {
			if (current.some((p) => p.id === pulse.id)) return current
			return [...current.slice(-12), pulse]
		})
		globalThis.setTimeout(() => removePulseById(pulse.id), 900)
	}

	return { pulses, addPulse }
}
