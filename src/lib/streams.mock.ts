export type MockStream = {
  id: string
  title: string
  creator: { id: string; username: string; avatarUrl?: string }
  thumbnailUrl?: string
  live: boolean
  viewers: number
  startedAt?: string
}

const mockStreams: MockStream[] = [
  {
    id: 'stream-1',
    title: 'Late Night Gaming Session',
    creator: { id: 'user-1', username: 'gamer_pro', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 1247,
    startedAt: '2024-01-15T20:00:00Z',
  },
  {
    id: 'stream-2',
    title: 'Cooking with Chef Maria',
    creator: { id: 'user-2', username: 'chef_maria', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 892,
    startedAt: '2024-01-15T19:30:00Z',
  },
  {
    id: 'stream-3',
    title: 'Music Production Live',
    creator: { id: 'user-3', username: 'music_maker', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 567,
    startedAt: '2024-01-15T18:45:00Z',
  },
  {
    id: 'stream-4',
    title: 'Fitness Workout',
    creator: { id: 'user-4', username: 'fit_trainer', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 2341,
    startedAt: '2024-01-15T17:15:00Z',
  },
  {
    id: 'stream-5',
    title: 'Art Drawing Session',
    creator: { id: 'user-5', username: 'art_creator', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 445,
    startedAt: '2024-01-15T16:20:00Z',
  },
  {
    id: 'stream-6',
    title: 'Tech Talk: AI Trends',
    creator: { id: 'user-6', username: 'tech_expert', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 1789,
    startedAt: '2024-01-15T15:00:00Z',
  },
  {
    id: 'stream-7',
    title: 'Travel Vlog: Paris',
    creator: { id: 'user-7', username: 'traveler_jane', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: false,
    viewers: 0,
    startedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'stream-8',
    title: 'Book Review: Sci-Fi Classics',
    creator: { id: 'user-8', username: 'bookworm_alex', avatarUrl: '/avatar-placeholder.svg' },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: false,
    viewers: 0,
    startedAt: '2024-01-13T14:00:00Z',
  },
]

export async function getMockStreams(): Promise<MockStream[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockStreams
}

export async function getMockStreamById(id: string): Promise<MockStream | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockStreams.find((stream) => stream.id === id) || null
}
