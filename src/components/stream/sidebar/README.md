# Stream Sidebar Components

This directory contains the new modern, compact, and responsive sidebar components for the stream room.

## Components

### CreatorCard

- Displays creator avatar, name, username, and status
- Shows live status indicator (red dot for live, gray for offline)
- Action buttons: Follow, Share, Report, Tip
- Responsive design with proper spacing

### LiveStats

- Real-time viewer count display
- Stream status badge (Live/Idle/Ended)
- Duration timer for live streams
- Started time information

### SidebarTabs

- Three tabs: About, Reactions, Chat
- About: Stream description, timestamps, visibility
- Reactions: Like/Dislike buttons, Tip button
- Chat: Placeholder for future chat functionality
- URL state persistence for active tab

### ActionsRow

- Convenient action buttons below tabs
- Share, Follow, Tip buttons
- Toast notifications for user feedback

### SidebarSkeleton

- Loading skeleton while data is being fetched
- Matches the layout of actual sidebar components
- Smooth shimmer animations

### StreamSidebarV2

- Main container component that integrates all sidebar components
- Handles real-time data from useStreamRealtime hook
- Shows skeleton while loading creator profile
- Manages toast notifications

## Usage

```tsx
import { StreamSidebarV2 } from '@/components/stream/sidebar'

;<StreamSidebarV2 stream={streamData} creatorProfile={creatorProfile} session={sessionData} />
```

## Features

- **Real-time Updates**: Uses existing useStreamRealtime hook for live status and viewer count
- **Responsive Design**: Adapts to mobile and desktop layouts
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Toast Notifications**: User feedback for actions
- **URL State**: Tab selection persists in URL parameters
- **Dark Theme**: Compatible with existing dark theme
- **TypeScript**: Fully typed components

## Dependencies

- shadcn/ui components (Button, Tabs, Badge, Skeleton)
- Lucide React icons
- Existing hooks: useStreamRealtime, useViewerManagement
- Tailwind CSS for styling

## Notes

- All components are tree-shakable and additive
- No breaking changes to existing APIs
- Follows existing design patterns and conventions
- Ready for future API integrations (follow, tip, etc.)
