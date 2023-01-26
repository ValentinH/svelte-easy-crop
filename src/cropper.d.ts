export type CropShape = 'rect' | 'round' | undefined

export interface CropSize {
  width: number
  height: number
}

export interface Crop {
  x: number
  y: number
}

export interface DispatchPixels {
  x: any
  y: any
  width: number | any
  height: any
}

export interface DispatchPercent {
  x: any
  y: any
  width: any
  height: any
}

export type CrossOrigin = '' | 'anonymous' | 'use-credentials'
