"use client"

import { useRef, useState } from "react"
import {
	ClickSurface,
	profiles,
	type ClickSurfaceRef,
	type DemoSettings,
	type ProfileName,
	type ToggleKey,
} from "clicklight-web"

const installCommand = "brew install --cask aurorascharff/clicklight/clicklight"

export default function Home() {
	const [settings, setSettings] = useState<DemoSettings>(profiles.Default)
	const [profile, setProfile] = useState<ProfileName>("Default")
	const [copiedInstall, setCopiedInstall] = useState(false)
	const surfaceRef = useRef<ClickSurfaceRef>(null)

	function toggle(key: ToggleKey) {
		setSettings((current) => {
			const next = { ...current, [key]: !current[key] }
			surfaceRef.current?.applySettings({ [key]: next[key] })
			return next
		})
	}

	function updateProfile(name: ProfileName) {
		setProfile(name)
		setSettings(profiles[name])
		surfaceRef.current?.applySettings(profiles[name])
	}

	function stopDemoEvent(event: React.PointerEvent<HTMLElement>) {
		event.stopPropagation()
	}

	async function copyInstallCommand() {
		await navigator.clipboard.writeText(installCommand)
		setCopiedInstall(true)
		window.setTimeout(() => setCopiedInstall(false), 1200)
	}

	return (
		<ClickSurface className='surface' id='demo' defaultSettings={profiles.Default} ref={surfaceRef}>
			<div className='background' aria-hidden='true' />

			<nav className='topbar' aria-label='ClickLight navigation' onPointerDown={stopDemoEvent}>
				<a
					className='github-link'
					href='https://github.com/aurorascharff/ClickLight'
					aria-label='ClickLight source on GitHub'>
					<svg aria-hidden='true' viewBox='0 0 24 24'>
						<path d='M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.35 9.35 0 0 1 12 6.92c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.04 2.74-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.73 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.08 10.08 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z' />
					</svg>
				</a>
			</nav>

			<div className='showcase'>
				<section className='statement' aria-label='ClickLight demo intro'>
					<div className='hero-title'>
						<span className='hero-mark' aria-hidden='true' />
						<h1>ClickLight</h1>
					</div>
					<p>
						A tiny macOS menu bar app that highlights your clicks during demos, screen sharing, UX reviews, and anywhere
						people need to follow what you are doing.
					</p>
					<div className='install' onPointerDown={stopDemoEvent}>
						<code>{installCommand}</code>
						<button
							className={copiedInstall ? "copied" : ""}
							type='button'
							onClick={copyInstallCommand}
							aria-label={copiedInstall ? "Copied install command" : "Copy install command"}>
							{copiedInstall ? (
								<svg aria-hidden='true' viewBox='0 0 24 24'>
									<path d='m9.4 16.2-3.2-3.2-1.4 1.4 4.6 4.6 9.8-9.8-1.4-1.4-8.4 8.4Z' />
								</svg>
							) : (
								<svg aria-hidden='true' viewBox='0 0 24 24'>
									<path d='M8 7.5A2.5 2.5 0 0 1 10.5 5h6A2.5 2.5 0 0 1 19 7.5v6a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 8 13.5v-6Zm2.5-.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5h-6ZM5 10.5A2.5 2.5 0 0 1 7.5 8v2A.5.5 0 0 0 7 10.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5h2a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 5 16.5v-6Z' />
								</svg>
							)}
						</button>
					</div>
				</section>

				<aside className='menu' aria-label='ClickLight controls' onPointerDown={stopDemoEvent}>
					<div className='menu-brand' aria-hidden='true'>
						<span className='menu-brand-icon' />
						<span className='menu-brand-title'>ClickLight</span>
					</div>
					<div className='menu-separator' />

					<MenuItem label='Laser Pointer Mode' checked={settings.laser} onClick={() => toggle("laser")} />
					<MenuItem label='Show Live Keyboard Shortcuts' checked={settings.keys} onClick={() => toggle("keys")} />

					<div className='menu-separator' />
					<MenuItem label='Show Press' checked={settings.press} onClick={() => toggle("press")} />
					<MenuItem label='Show Release' checked={settings.release} onClick={() => toggle("release")} />
					<MenuItem label='Show Right Click' checked={settings.right} onClick={() => toggle("right")} />
					<MenuItem label='Show Middle Click' checked={settings.middle} onClick={() => toggle("middle")} />
					<MenuItem label='Show Drag' checked={settings.drag} onClick={() => toggle("drag")} />

					<div className='menu-separator' />
					<MenuItem disabled label='Size' chevron />
					<MenuItem disabled label='Intensity' chevron />
					<MenuItem disabled label='Duration' chevron />
					<MenuItem disabled label='Colors' chevron />

					<div className='menu-separator' />
					<MenuItem disabled label='Profiles' chevron />
					{(Object.keys(profiles) as ProfileName[]).map((name) => (
						<MenuItem checked={profile === name} inset key={name} label={name} onClick={() => updateProfile(name)} />
					))}

					<div className='menu-separator' />
					<MenuItem disabled label='Open Settings...' shortcut='⌘,' />
					<MenuItem disabled label='About ClickLight' />
				</aside>
			</div>
		</ClickSurface>
	)
}

function MenuItem({
	checked = false,
	chevron = false,
	disabled = false,
	inset = false,
	label,
	onClick,
	shortcut,
}: {
	checked?: boolean
	chevron?: boolean
	disabled?: boolean
	inset?: boolean
	label: string
	onClick?: () => void
	shortcut?: string
}) {
	return (
		<button className={`menu-row ${inset ? "inset" : ""}`} disabled={disabled} onClick={onClick} type='button'>
			<span className='menu-check' aria-hidden='true'>
				{checked ? "✓" : ""}
			</span>
			<span className='menu-label'>{label}</span>
			{shortcut && <span className='menu-shortcut'>{shortcut}</span>}
			{chevron && <span className='menu-chevron'>›</span>}
		</button>
	)
}
