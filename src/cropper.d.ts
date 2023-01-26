export type CropShape = 'rect' | 'round' | undefined

export interface CropSize {
  width: number
  height: number
}

export interface Crop {
  x: number
  y: number
}

export type CrossOrigin = '' | 'anonymous' | 'use-credentials'
