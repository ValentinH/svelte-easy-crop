<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import type { HTMLImgAttributes } from 'svelte/elements'
  import * as helpers from './helpers'
  import type { Point, CropShape, Size, DispatchEvents, ImageSize } from './types'

  export let image: string
  export let crop: Point = { x: 0, y: 0 }
  export let zoom = 1
  export let aspect = 4 / 3
  export let minZoom = 1
  export let maxZoom = 3
  export let cropSize: Size | null = null
  export let cropShape: CropShape = 'rect'
  export let showGrid = true
  export let zoomSpeed = 1
  export let crossOrigin: HTMLImgAttributes['crossorigin'] = null
  export let restrictPosition = true
  export let tabindex: number | undefined = undefined

  let cropperSize: Size | null = null
  let imageSize: ImageSize = { width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 }
  let containerEl: HTMLDivElement | null = null
  let containerRect: DOMRect | null = null
  let imgEl: HTMLImageElement | null = null
  let dragStartPosition: Point = { x: 0, y: 0 }
  let dragStartCrop: Point = { x: 0, y: 0 }
  let lastPinchDistance = 0
  let rafDragTimeout: number | null = null
  let rafZoomTimeout: number | null = null

  const dispatch = createEventDispatcher<DispatchEvents>()

  onMount(() => {
    // when rendered via SSR, the image can already be loaded and its onLoad callback will never be called
    if (imgEl && imgEl.complete) {
      onImgLoad()
    }
    if (containerEl) {
      containerEl.addEventListener('gesturestart', preventZoomSafari)
      containerEl.addEventListener('gesturechange', preventZoomSafari)
    }
  })

  onDestroy(() => {
    if (containerEl) {
      containerEl.removeEventListener('gesturestart', preventZoomSafari)
      containerEl.removeEventListener('gesturechange', preventZoomSafari)
    }
    cleanEvents()
  })

  // this is to prevent Safari on iOS >= 10 to zoom the page
  const preventZoomSafari = (e: Event) => e.preventDefault()

  const cleanEvents = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onDragStopped)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onDragStopped)
    }
  }

  const onImgLoad = () => {
    computeSizes()
    emitCropData()
  }

  const getAspect = () => {
    if (cropSize) {
      return cropSize.width / cropSize.height
    }
    return aspect
  }

  const computeSizes = () => {
    if (imgEl) {
      imageSize = {
        width: imgEl.width,
        height: imgEl.height,
        naturalWidth: imgEl.naturalWidth,
        naturalHeight: imgEl.naturalHeight,
      }
      cropperSize = cropSize ? cropSize : helpers.getCropSize(imgEl.width, imgEl.height, aspect)
    }
    if (containerEl) {
      containerRect = containerEl.getBoundingClientRect()
    }
  }

  const getMousePoint = (e: MouseEvent) => ({
    x: Number(e.clientX),
    y: Number(e.clientY),
  })

  const getTouchPoint = (touch: TouchEvent['touches'][0]) => ({
    x: Number(touch.clientX),
    y: Number(touch.clientY),
  })

  const onMouseDown = (e: MouseEvent) => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onDragStopped)
    onDragStart(getMousePoint(e))
  }

  const onMouseMove = (e: MouseEvent) => onDrag(getMousePoint(e))

  const onTouchStart = (e: TouchEvent) => {
    document.addEventListener('touchmove', onTouchMove, { passive: false }) // iOS 11 now defaults to passive: true
    document.addEventListener('touchend', onDragStopped)

    if (e.touches.length === 2) {
      onPinchStart(e)
    } else if (e.touches.length === 1) {
      onDragStart(getTouchPoint(e.touches[0]))
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    // Prevent whole page from scrolling on iOS.
    e.preventDefault()
    if (e.touches.length === 2) {
      onPinchMove(e)
    } else if (e.touches.length === 1) {
      onDrag(getTouchPoint(e.touches[0]))
    }
  }

  const onDragStart = ({ x, y }: Point) => {
    dragStartPosition = { x, y }
    dragStartCrop = { x: crop.x, y: crop.y }
  }

  const onDrag = ({ x, y }: Point) => {
    if (rafDragTimeout) window.cancelAnimationFrame(rafDragTimeout)

    rafDragTimeout = window.requestAnimationFrame(() => {
      if (x === undefined || y === undefined || !cropperSize) return
      const offsetX = x - dragStartPosition.x
      const offsetY = y - dragStartPosition.y
      const requestedPosition = {
        x: dragStartCrop.x + offsetX,
        y: dragStartCrop.y + offsetY,
      }

      crop = restrictPosition
        ? helpers.restrictPosition(requestedPosition, imageSize, cropperSize, zoom)
        : requestedPosition
    })
  }

  const onDragStopped = () => {
    cleanEvents()
    emitCropData()
  }

  const onPinchStart = (e: TouchEvent) => {
    const pointA = getTouchPoint(e.touches[0])
    const pointB = getTouchPoint(e.touches[1])
    lastPinchDistance = helpers.getDistanceBetweenPoints(pointA, pointB)
    onDragStart(helpers.getCenter(pointA, pointB))
  }

  const onPinchMove = (e: TouchEvent) => {
    const pointA = getTouchPoint(e.touches[0])
    const pointB = getTouchPoint(e.touches[1])
    const center = helpers.getCenter(pointA, pointB)
    onDrag(center)

    if (rafZoomTimeout) window.cancelAnimationFrame(rafZoomTimeout)
    rafZoomTimeout = window.requestAnimationFrame(() => {
      const distance = helpers.getDistanceBetweenPoints(pointA, pointB)
      const newZoom = zoom * (distance / lastPinchDistance)
      setNewZoom(newZoom, center)
      lastPinchDistance = distance
    })
  }

  const onWheel = (e: WheelEvent) => {
    const point = getMousePoint(e)
    const newZoom = zoom - (e.deltaY * zoomSpeed) / 200
    setNewZoom(newZoom, point)
  }

  const getPointOnContainer = ({ x, y }: Point) => {
    if (!containerRect) {
      throw new Error('The Cropper is not mounted')
    }
    return {
      x: containerRect.width / 2 - (x - containerRect.left),
      y: containerRect.height / 2 - (y - containerRect.top),
    }
  }

  const getPointOnImage = ({ x, y }: Point) => ({
    x: (x + crop.x) / zoom,
    y: (y + crop.y) / zoom,
  })

  const setNewZoom = (newZoom: number, point: Point) => {
    if (!cropperSize) return
    const zoomPoint = getPointOnContainer(point)
    const zoomTarget = getPointOnImage(zoomPoint)
    zoom = Math.min(maxZoom, Math.max(newZoom, minZoom))

    const requestedPosition = {
      x: zoomTarget.x * zoom - zoomPoint.x,
      y: zoomTarget.y * zoom - zoomPoint.y,
    }
    crop = restrictPosition
      ? helpers.restrictPosition(requestedPosition, imageSize, cropperSize, zoom)
      : requestedPosition
  }

  const emitCropData = () => {
    if (!cropperSize || cropperSize.width === 0) return
    // this is to ensure the crop is correctly restricted after a zoom back (https://github.com/ricardo-ch/svelte-easy-crop/issues/6)
    const position = restrictPosition
      ? helpers.restrictPosition(crop, imageSize, cropperSize, zoom)
      : crop
    const { croppedAreaPercentages, croppedAreaPixels } = helpers.computeCroppedArea(
      position,
      imageSize,
      cropperSize,
      getAspect(),
      zoom,
      restrictPosition
    )

    dispatch('cropcomplete', {
      percent: croppedAreaPercentages,
      pixels: croppedAreaPixels,
    })
  }

  // ------ Reactive statement ------
  //when aspect changes, we reset the cropperSize
  $: if (imgEl) {
    cropperSize = cropSize ? cropSize : helpers.getCropSize(imgEl.width, imgEl.height, aspect)
  }

  // when zoom changes, we recompute the cropped area
  $: zoom && emitCropData()
</script>

<svelte:window on:resize={computeSizes} />
<div
  class="container"
  bind:this={containerEl}
  on:mousedown|preventDefault={onMouseDown}
  on:touchstart|preventDefault={onTouchStart}
  on:wheel|preventDefault={onWheel}
  {tabindex}
  role="button"
  data-testid="container"
>
  <img
    bind:this={imgEl}
    class="image"
    src={image}
    on:load={onImgLoad}
    alt=""
    style="transform: translate({crop.x}px, {crop.y}px) scale({zoom});"
    crossorigin={crossOrigin}
  />
  {#if cropperSize}
    <div
      class="cropperArea"
      class:round={cropShape === 'round'}
      class:grid={showGrid}
      style="width: {cropperSize.width}px; height: {cropperSize.height}px;"
      data-testid="cropper"
    />
  {/if}
</div>

<style>
  .container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    user-select: none;
    touch-action: none;
    cursor: move;
  }

  .image {
    max-width: 100%;
    max-height: 100%;
    margin: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    will-change: transform;
  }

  .cropperArea {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 9999em;
    box-sizing: border-box;
    color: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
  }

  .grid:before {
    content: ' ';
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.5);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 33.33%;
    right: 33.33%;
    border-top: 0;
    border-bottom: 0;
  }

  .grid:after {
    content: ' ';
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.5);
    position: absolute;
    top: 33.33%;
    bottom: 33.33%;
    left: 0;
    right: 0;
    border-left: 0;
    border-right: 0;
  }

  .round {
    border-radius: 50%;
  }
</style>
