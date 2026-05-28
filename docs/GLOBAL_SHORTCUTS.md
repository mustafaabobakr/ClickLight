# Global Shortcuts

ClickLight supports global keyboard shortcuts for quickly toggling click-highlighting features without opening the Settings window.

## Defaults

The default shortcuts use `Option` + `Command` plus number keys:

| Shortcut | Action |
| --- | --- |
| `⌥⌘1` | Toggle ClickLight on/off |
| `⌥⌘2` | Toggle Laser Pointer Mode |
| `⌥⌘3` | Toggle Show Press |
| `⌥⌘4` | Toggle Show Release |
| `⌥⌘5` | Toggle Show Right Click |
| `⌥⌘6` | Toggle Show Middle Click |
| `⌥⌘7` | Toggle Show Drag |

Users can change or clear these shortcuts in Settings.

## Key Types

`HotKeyBinding` stores a shortcut as two values:

- `keyCode`: the Carbon virtual key code.
- `carbonModifiers`: the Carbon modifier bitmask.

It also exposes display helpers used by Settings and menu rendering:

- `displayString` builds labels such as `⌥⌘1`.
- `menuKeyEquivalent` maps the binding to an `NSMenuItem` key equivalent when possible.
- `menuModifierFlags` converts Carbon modifiers into AppKit `NSEvent.ModifierFlags`.

`ClickShortcutAction` is the stable action list. Adding a new shortcut action means updating that enum, its default binding, the Settings UI, persistence in `SettingsStore`, menu rendering in `StatusController`, and action handling in `AppDelegate`.

## Normal Shortcut Flow

When the status menu is closed, shortcuts are handled globally through Carbon:

```text
SettingsStore.shortcutBindings
  -> AppDelegate.configureHotKeysIfNeeded
  -> HotKeyManager.registerShortcuts
  -> RegisterEventHotKey
  -> HotKeyManager.handleHotKey
  -> AppDelegate.handleHotKeyAction
  -> SettingsStore.update
  -> SettingsStore.didChangeNotification
```

`HotKeyManager` installs one Carbon keyboard event handler for `kEventHotKeyPressed`. Each registered shortcut gets an `EventHotKeyID` based on `ClickShortcutAction.hotKeyEventID`.

When Carbon fires, `HotKeyManager` resolves the ID back to a `ClickShortcutAction` and invokes the `@MainActor` trigger closure. `AppDelegate.handleHotKeyAction(_:)` then toggles the matching setting.

## Registration Lifecycle

`AppDelegate` owns the global registration lifecycle.

On launch, it calls:

```swift
configureHotKeysIfNeeded(with: settingsStore.settings, force: true)
```

On any settings change, it compares the current `settings.shortcutBindings` with the last registered bindings. If the bindings changed, it unregisters old hotkeys and registers the new set.

Duplicate bindings are ignored and reported through `hotKeyRegistrationIssuesDidChangeNotification`, so the Settings UI can show registration problems to the user.

## Status Menu Behavior

The status menu also displays the shortcuts using native `NSMenuItem` key equivalents. This keeps the visual style consistent with standard menu commands like `⌘,` for Open Settings and `⌘Q` for Quit.

Status menus have an important AppKit limitation: once the menu is open, mutating `NSMenuItem.state` does not repaint the visible checkmark reliably. Instead of trying to live-refresh the open menu, ClickLight rebuilds the menu each time it is about to open.

That happens through `NSMenuDelegate.menuNeedsUpdate(_:)` in `StatusController`:

```text
menuNeedsUpdate
  -> rebuildMenuItems(in: existingMenu)
  -> read latest SettingsStore.settings
  -> replace menu contents with fresh NSMenuItems
  -> keep the same statusItem.menu instance
```

Keeping the same `NSMenu` instance is important. Replacing `statusItem.menu` while AppKit is preparing to open the menu can fire `menuDidClose` for the old menu, which would re-register Carbon hotkeys before the visible menu has actually started tracking.

## Shortcuts While The Menu Is Open

Carbon global hotkeys and native menu key equivalents can compete for the same key chord while the status menu is open. To keep the menu behavior standard, ClickLight temporarily disables the Carbon global hotkeys while the status menu is tracking:

```text
StatusController.menuWillOpen
  -> AppDelegate callback
  -> HotKeyManager.unregisterAll

StatusController.menuDidClose
  -> AppDelegate callback
  -> configureHotKeysIfNeeded(..., force: true)
```

While the menu is open, `⌥⌘1` through `⌥⌘7` are handled by the native `NSMenuItem.keyEquivalent` path. This matches normal macOS menu behavior: the menu command runs and the menu closes. Once AppKit reports the actual `menuDidClose`, Carbon hotkeys are registered again so the same shortcuts work globally.

## Menu Rendering

`StatusController.applyShortcut(_:to:)` applies a binding to a menu item by setting:

```swift
item.keyEquivalent = keyEquivalent
item.keyEquivalentModifierMask = shortcut.menuModifierFlags
```

Using real key equivalents is intentional. It gives the status menu the same right-aligned shortcut style as standard AppKit menus and lets AppKit own shortcut handling while the menu is open.

## Testing Checklist

After changing shortcut behavior, build and run the app:

```bash
./build-app.sh && { pkill -x ClickLight || true; open ClickLight.app; }
```

Then verify:

- `⌥⌘1` through `⌥⌘7` work while the status menu is closed.
- The status menu shows each shortcut right-aligned in the standard menu style.
- Opening the status menu shows current checkmarks.
- Pressing a shortcut while the status menu is open triggers the matching menu action and closes the menu.
- Opening the status menu again shows the updated checkmark.
- Changing a shortcut in Settings unregisters the old binding and registers the new one.
- Duplicate shortcuts show a registration issue instead of registering both actions.