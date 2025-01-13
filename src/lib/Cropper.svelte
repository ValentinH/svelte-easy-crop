<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import * as helpers from './helpers'
  import type { ImageSize, Point, CropperProps, Size } from './types'
  import type { Action } from 'svelte/action'

  let {
    image,
    crop = $bindable({ x: 0, y: 0 }),
    zoom = $bindable(1),
    minZoom = $bindable(1),
    maxZoom = $bindable(3),
    aspect = 4 / 3,
    cropSize = null,
    cropShape = 'rect',
    showGrid = true,
    zoomSpeed = 1,
    crossOrigin = null,
    restrictPosition = true,
    tabindex = undefined,
    oncropcomplete,
  }: Partial<CropperProps> = $props()

  let cropperSize = $state<Size | null>(null)
  let imageSize = $state<ImageSize>({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
  let containerEl = $state<HTMLDivElement | null>(null)
  let containerRect = $state<DOMRect | null>(null)
  let imgEl = $state<HTMLImageElement | null>(null)
  let dragStartPosition = $state<Point>({ x: 0, y: 0 })
  let dragStartCrop = $state<Point>({ x: 0, y: 0 })
  let lastPinchDistance = $state(0)
  let rafDragTimeout = $state<number | null>(null)
  let rafZoomTimeout = $state<number | null>(null)

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
    e.preventDefault()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onDragStopped)
    onDragStart(getMousePoint(e))
  }

  const onMouseMove = (e: MouseEvent) => onDrag(getMousePoint(e))

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault()
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
    e.preventDefault()
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

    oncropcomplete?.({
      percent: croppedAreaPercentages,
      pixels: croppedAreaPixels,
    })
  }

  // ------ Reactive statement ------
  //when aspect changes, we reset the cropperSize
  $effect(() => {
    if (imgEl) {
      cropperSize = cropSize ? cropSize : helpers.getCropSize(imgEl.width, imgEl.height, aspect)
    }
  })

  // when zoom changes, we recompute the cropped area
  $effect(() => {
    if (zoom) {
      emitCropData()
    }
  })

  const containerAction: Action<HTMLDivElement> = node => {
    $effect(() => {
      node.addEventListener('touchstart', onTouchStart)
      node.addEventListener('mousedown', onMouseDown)
      node.addEventListener('wheel', onWheel, { passive: false })

      return () => {
        node.removeEventListener('touchstart', onTouchStart)
        node.removeEventListener('mousedown', onMouseDown)
        node.removeEventListener('wheel', onWheel)
      }
    })
  }
</script>

<svelte:window on:resize={computeSizes} />
<div
  class="svelte-easy-crop-container"
  bind:this={containerEl}
  use:containerAction
  {tabindex}
  role="button"
  data-testid="container"
>
  <img
    bind:this={imgEl}
    class="svelte-easy-crop-image"
    src={image}
    onload={onImgLoad}
    alt=""
    style="transform: translate({crop.x}px, {crop.y}px) scale({zoom});"
    crossorigin={crossOrigin}
  />
  {#if cropperSize}
    <div
      class="svelte-easy-crop-area"
      class:svelte-easy-crop-round={cropShape === 'round'}
      class:svelte-easy-crop-grid={showGrid}
      style="width: {cropperSize.width}px; height: {cropperSize.height}px;"
      data-testid="cropper"
    ></div>
  {/if}
</div>

<style>
  .svelte-easy-crop-container {
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

  .svelte-easy-crop-image {
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

  .svelte-easy-crop-area {
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

  .svelte-easy-crop-grid:before {
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

  .svelte-easy-crop-grid:after {
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

  .svelte-easy-crop-round {
    border-radius: 50%;
  }
</style>
