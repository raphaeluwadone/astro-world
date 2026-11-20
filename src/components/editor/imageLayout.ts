import type { ImageAlign, ImageSize } from './markdown'

const WIDTH: Record<ImageSize, string> = {
  small: 'w-2/3 sm:w-1/2',
  medium: 'w-full sm:w-3/4',
  full: 'w-full',
}

const ALIGN: Record<ImageAlign, string> = {
  left: 'self-start mr-auto',
  center: 'self-center mx-auto',
  right: 'self-end ml-auto',
}

/** Width and placement classes for an article image, shared by the editor and the reader. */
export function imageLayoutClass(size: ImageSize, align: ImageAlign) {
  return `${WIDTH[size]} ${size === 'full' ? '' : ALIGN[align]}`.trim()
}
