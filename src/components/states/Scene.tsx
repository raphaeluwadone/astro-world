import { useState, type ComponentType } from 'react'
import { OverTheBarIcon } from './icons'
import { CalendarIcon, ChatIcon, CoinJarIcon, EmptyBenchIcon, MagnifierIcon, NotebookIcon, ScorecardIcon, SleepyBellIcon, TrophyIcon, WhistleIcon } from './scenes'
import {
  BibsIcon,
  BinocularsIcon,
  ClipboardIcon,
  CoinStackIcon,
  ConesIcon,
  CornerFlagIcon,
  CursorIcon,
  EmptyNetIcon,
  EnvelopeIcon,
  HourglassIcon,
  MedalIcon,
  MegaphoneIcon,
  NewspaperIcon,
  OffThePostIcon,
  PaperPlaneIcon,
  PodiumIcon,
  RadarIcon,
  ReactionsIcon,
  SliderIcon,
  StarsIcon,
  StopwatchIcon,
  WalletIcon,
} from './scenes-more'

const SCENES = {
  bench: [EmptyBenchIcon, BibsIcon, ConesIcon],
  whistle: [WhistleIcon, StopwatchIcon, ClipboardIcon],
  notebook: [NotebookIcon, NewspaperIcon, CursorIcon],
  chat: [ChatIcon, MegaphoneIcon, ReactionsIcon],
  trophy: [TrophyIcon, MedalIcon, PodiumIcon],
  kitty: [CoinJarIcon, CoinStackIcon, WalletIcon],
  search: [MagnifierIcon, BinocularsIcon, RadarIcon],
  rating: [ScorecardIcon, StarsIcon, SliderIcon],
  bell: [SleepyBellIcon, EnvelopeIcon, PaperPlaneIcon],
  calendar: [CalendarIcon, HourglassIcon, CornerFlagIcon],
  goals: [OverTheBarIcon, OffThePostIcon, EmptyNetIcon],
} satisfies Record<string, ComponentType[]>

export type SceneKind = keyof typeof SCENES

const next: Partial<Record<SceneKind, number>> = {}

/** An empty-state scene of the given kind. Each new one takes the next variant, so neighbours differ. */
export function Scene({ kind }: { kind: SceneKind }) {
  const [variant] = useState(() => {
    const n = next[kind] ?? 0
    next[kind] = n + 1
    return n % SCENES[kind].length
  })
  const Pick = SCENES[kind][variant]
  return <Pick />
}
