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
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Late Night Gaming Session',
    creator: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'gamer_pro',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 1247,
    startedAt: '2024-01-15T20:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Cooking with Chef Maria',
    creator: {
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'chef_maria',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 892,
    startedAt: '2024-01-15T19:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Music Production Live',
    creator: {
      id: '550e8400-e29b-41d4-a716-446655440006',
      username: 'music_maker',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 567,
    startedAt: '2024-01-15T18:45:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: 'Fitness Workout',
    creator: {
      id: '550e8400-e29b-41d4-a716-446655440008',
      username: 'fit_trainer',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 2341,
    startedAt: '2024-01-15T17:15:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    title: 'Art Drawing Session',
    creator: {
      id: '550e8400-e29b-41d4-a716-44665544000a',
      username: 'art_creator',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 445,
    startedAt: '2024-01-15T16:20:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000b',
    title: 'Tech Talk: AI Trends',
    creator: {
      id: '550e8400-e29b-41d4-a716-44665544000c',
      username: 'tech_expert',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: true,
    viewers: 1789,
    startedAt: '2024-01-15T15:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000d',
    title: 'Travel Vlog: Paris',
    creator: {
      id: '550e8400-e29b-41d4-a716-44665544000e',
      username: 'traveler_jane',
      avatarUrl: '/avatar-placeholder.svg',
    },
    thumbnailUrl: '/stream-placeholder.jpg',
    live: false,
    viewers: 0,
    startedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000f',
    title: 'Book Review: Sci-Fi Classics',
    creator: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      username: 'bookworm_alex',
      avatarUrl: '/avatar-placeholder.svg',
    },
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
