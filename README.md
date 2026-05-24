# ClickLight

ClickLight is a tiny native macOS menu-bar app for live demos. It highlights clicks anywhere on your Mac so viewers can see when you actually pressed, even if the UI responds slowly.

It is personal software: one small presentation annoyance, fixed directly.

## Demo

![ClickLight showing click highlights from the macOS menu bar](docs/assets/ClickLight.gif)

## What It Does

- shows click highlights across macOS apps
- distinguishes press, release, right-click, and drag
- lets you tune size, duration, and intensity from the menu bar
- works as a local Swift/AppKit app, no Xcode project required

## Install

ClickLight does not have a packaged installer yet. Build it locally, copy the app into Applications, then grant Accessibility permission:

[Installation](docs/INSTALLATION.md)

## Modify It

The project is intentionally small so you or an agent can change it without much ceremony:

[Local Development](docs/LOCAL_DEVELOPMENT.md)

The short version:

```bash
./build-app.sh
open ClickLight.app
```

## How It Is Built

ClickLight is a Swift Package Manager executable wrapped into a macOS `.app` bundle by `build-app.sh`.

[Building Without Xcode](docs/BUILDING_WITHOUT_XCODE.md)

## License

MIT. See [LICENSE](LICENSE).
