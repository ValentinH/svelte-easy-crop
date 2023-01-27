export type CropShape = 'rect' | 'round'

export interface Size {
  width: number
  height: number
}

export interface ImageSize {
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
}

export interface Point {
  x: number
  y: number
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface DispatchEvents {
  cropcomplete: {
    percent: CropArea
    pixels: CropArea
  }
}
