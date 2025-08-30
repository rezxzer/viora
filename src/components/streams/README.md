# Streams Components

## Overview

This directory contains all components related to streaming functionality in Viora.

## Components

### Core Components

- **StreamPlayer**: HLS video player with hls.js integration
- **StreamPageClientV2**: Main stream viewer with three states (live/idle/ended)
- **StreamCardV2**: Stream card for grid display with real DB data
- **StreamControls**: Start/Stop stream controls for creators
- **StreamSidebar**: Stream information and interaction sidebar

### UI Components

- **StreamSkeleton**: Loading skeletons for different contexts
- **StreamStatusBadge**: Visual status indicators
- **LiveBadge**: Live stream indicator with pulse animation
- **ViewersCount**: Formatted viewer numbers
- **CopyButton**: Clipboard functionality

### Creator Components

- **StartControls**: Stream creation form
- **RtmpFields**: RTMP details display with OBS instructions
- **DevToggle**: Development-only status cycling
- **StreamInfo**: Stream metadata display

## Future Improvements

### Phase 1: Core Functionality

- [ ] Real viewer count from analytics
- [ ] Creator profile data integration
- [ ] Auth context for current user ID
- [ ] Pagination for streams index

### Phase 2: Real-time Features

- [ ] Supabase Realtime/SSE for live status updates
- [ ] Live chat system backend
- [ ] Viewer metrics tracking
- [ ] Stream recording playback

### Phase 3: Advanced Features

- [ ] Webhook signature verification
- [ ] Progressive Mux integration
- [ ] Stream thumbnail generation
- [ ] Advanced stream settings

## Technical Notes

### HLS Integration

- Uses hls.js for cross-browser HLS support
- Falls back to native HLS for Safari
- Dynamic import to reduce bundle size

### State Management

- Stream status: idle → live → ended
- Local state updates with server refresh
- Error handling with retry mechanisms

### Performance

- Skeleton loading states
- Lazy loading for heavy components
- Optimized re-renders with proper state management
