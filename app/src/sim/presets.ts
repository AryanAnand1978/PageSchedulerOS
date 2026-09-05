export interface Preset {
  id: string
  name: string
  description: string
  referenceString: string
  defaultFrames: number
}

export const PRESETS: Preset[] = [
  {
    id: 'silberschatz',
    name: 'Silberschatz Classic (20 refs)',
    description: 'Canonical OS textbook reference string demonstrating FIFO (15), Clock (14), LRU (12), and Optimal (9) on 3 frames.',
    referenceString: '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1',
    defaultFrames: 3,
  },
  {
    id: 'belady',
    name: "Bélády's Anomaly (FIFO)",
    description: 'Counterintuitive case where increasing frames from 3 to 4 increases FIFO faults from 9 to 10.',
    referenceString: '1 2 3 4 1 2 5 1 2 3 4 5',
    defaultFrames: 3,
  },
  {
    id: 'high-locality',
    name: 'High Temporal Locality',
    description: 'Frequent re-access of recently referenced working set, showcasing LRU and Clock effectiveness.',
    referenceString: '1 2 1 2 3 1 2 3 4 1 2 1 2 5 1 2 3 4 1 2',
    defaultFrames: 3,
  },
  {
    id: 'loop-cyclic',
    name: 'Cyclic Scan (Thrashing)',
    description: 'Repeated sequential scan over 5 pages with 4 frames, provoking continuous eviction cycles.',
    referenceString: '0 1 2 3 4 0 1 2 3 4 0 1 2 3 4',
    defaultFrames: 4,
  },
]
