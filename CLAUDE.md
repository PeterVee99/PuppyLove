# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npx expo start          # start dev server (scan QR with Expo Go)
npx expo start --ios    # open iOS simulator
npx expo start --android # open Android emulator
npx expo start --web    # open in browser (limited – app targets mobile)

npx expo install <pkg>  # always use expo install (not npm/yarn) to get SDK-compatible versions
```

There are no lint, test, or build scripts configured.

## Architecture

**Runtime**: Expo SDK 56, React Native 0.85, React 19. Targets iOS and Android natively via Expo Go or a custom dev build. Web works but is not a target.

**State**: All app state lives in `src/context/AppContext.js` — a single React Context with `useState`. There is no backend, no persistence, and no network calls. The context is seeded from `src/data/mockData.js` on first render. The logged-in user is always hardcoded as `'user-1'`.

**Navigation** (`src/navigation/AppNavigator.js`): A bottom tab navigator with 5 tabs. Two tabs contain nested native stacks:
- `Explore` tab → `ExploreNavigator` stack: `ExploreMain` → `WalkDetail`
- `Messages` tab → `MessagesNavigator` stack: `MessagesMain` → `Conversation`
- `My Walks`, `Create`, and `Profile` are direct `Tab.Screen` children with no stack.

This distinction matters for cross-tab navigation. Screens inside a stack use `navigation.getParent()?.navigate('TabName')` to jump to another tab. Screens that are direct Tab children (like `CreateWalkScreen`) use `navigation.navigate('TabName')` directly.

**Walk data model** (important quirks):
- `date` is stored as a `DD/MM/YYYY` string in walk objects, but mock data uses `YYYY-MM-DD`. `ExploreScreen` handles both formats in `parseWalkDate()`.
- `dogFriendlyFor` is an array of strings (e.g. `['all_sizes']`, `['small_only', 'large_only']`).
- The Create form stores dog size as a single string (`dogSize`) and wraps it in an array on submit: `dogFriendlyFor: [form.dogSize]`.
- `maxAttendees: null` means unlimited.

**Pickers** (`src/components/Pickers.js`): Three exported modals — `DatePickerModal`, `TimePickerModal`, `DropdownModal`. The date/time pickers use `@react-native-community/datetimepicker`:
- iOS: native spinner wheel inside a `Sheet` (bottom-sheet modal with Cancel / Done).
- Android: native dialog rendered directly (no wrapper Modal needed).
- Web: HTML input inside the Sheet.
- `DatePickerModal` passes a `Date` object to `onConfirm`. `TimePickerModal` passes a `"H:MM AM"` string.

**Image picking**: `expo-image-picker` is used in both `ProfileScreen` (avatar + dog photo) and `CreateWalkScreen` (cover photo). Both call `ImagePicker.launchImageLibraryAsync` and store the local URI in component state / context.

**Theming**: All colours are imported from `src/theme/colors.js`. Never hardcode hex values in screen/component files — reference `colors.*` instead.
