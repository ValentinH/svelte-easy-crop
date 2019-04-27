<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import * as helpers from './helpers'

	export let image
	export let crop = { x: 0,    y: 0};
	export let zoom = 1
	export let minZoom = 1
	export let maxZoom = 3
	export let zoomSpeed = 1
	export let aspect = 4 / 3
	export let restrictPosition = true
	export let onImgError = null

	let cropSize = null
	let imageSize = { width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 }
	let containerEl = null
	let containerRect = {}
	let imgEl = null
	let dragStartPosition = { x: 0, y: 0 }
  let dragStartCrop = { x: 0, y: 0 }
  let lastPinchDistance = 0
  let rafDragTimeout = null
	let rafZoomTimeout = null
	
	const dispatch = createEventDispatcher()

	// when aspect changes, we reset the cropSize
	$: if (imgEl) {
		cropSize = helpers.getCropSize(imgEl.width, imgEl.height, aspect)
	}

	// when zoom changes, we recompute the cropped area
	$: zoom && emitCropData()

	onMount(() => {
		window.addEventListener('resize', computeSizes)
    containerEl.addEventListener('wheel', onWheel, { passive: false })
    containerEl.addEventListener('gesturestart', preventZoomSafari)
    containerEl.addEventListener('gesturechange', preventZoomSafari)

    // when rendered via SSR, the image can already be loaded and its onLoad callback will never be called
    if (imgEl && imgEl.complete) {
      onImgLoad()
    }
	})

	onDestroy(() => {
		window.removeEventListener('resize', computeSizes)
    containerEl.removeEventListener('wheel', onWheel)
    containerEl.removeEventListener('gesturestart', preventZoomSafari)
    containerEl.removeEventListener('gesturechange', preventZoomSafari)
    cleanEvents()
	})

	// this is to prevent Safari on iOS >= 10 to zoom the page
	const preventZoomSafari = e => e.preventDefault()

	const cleanEvents = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onDragStopped)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onDragStopped)
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
			cropSize = helpers.getCropSize(imgEl.width, imgEl.height, aspect)
    }
    if (containerEl) {
      containerRect = containerEl.getBoundingClientRect()
    }
	}
	
	const getMousePoint = e => ({ x: Number(e.clientX), y: Number(e.clientY) })

  const getTouchPoint = touch => ({
    x: Number(touch.clientX),
    y: Number(touch.clientY),
  })

	const onMouseDown = e => {
    e.preventDefault()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onDragStopped)
    onDragStart(getMousePoint(e))
	}
	
	const onMouseMove = e => onDrag(getMousePoint(e))

	const onTouchStart = e => {
    e.preventDefault()
    document.addEventListener('touchmove', onTouchMove, { passive: false }) // iOS 11 now defaults to passive: true
    document.addEventListener('touchend', onDragStopped)
    if (e.touches.length === 2) {
      onPinchStart(e)
    } else if (e.touches.length === 1) {
      onDragStart(getTouchPoint(e.touches[0]))
    }
	}
	
	const onTouchMove = e => {
    // Prevent whole page from scrolling on iOS.
    e.preventDefault()
    if (e.touches.length === 2) {
      onPinchMove(e)
    } else if (e.touches.length === 1) {
      onDrag(getTouchPoint(e.touches[0]))
    }
	}
	
	const onDragStart = ({ x, y }) => {
    dragStartPosition = { x, y }
    dragStartCrop = { x: crop.x, y: crop.y }
	}
	
	const onDrag = ({ x, y }) => {
    if (rafDragTimeout) window.cancelAnimationFrame(rafDragTimeout)

    rafDragTimeout = window.requestAnimationFrame(() => {
      if (x === undefined || y === undefined) return
      const offsetX = x - dragStartPosition.x
      const offsetY = y - dragStartPosition.y
      const requestedPosition = {
        x: dragStartCrop.x + offsetX,
        y: dragStartCrop.y + offsetY,
      }

      crop = restrictPosition
        ? helpers.restrictPosition(requestedPosition, imageSize, cropSize, zoom)
        : requestedPosition
    })
	}
	
	const onDragStopped = () => {
    cleanEvents()
    emitCropData()
	}
	
	const onPinchStart = e =>  {
    const pointA = getTouchPoint(e.touches[0])
    const pointB = getTouchPoint(e.touches[1])
    lastPinchDistance = helpers.getDistanceBetweenPoints(pointA, pointB)
    onDragStart(helpers.getCenter(pointA, pointB))
  }

  const onPinchMove = e => {
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

	const onWheel = e => {
    e.preventDefault()
    const point = getMousePoint(e)
    const newZoom =zoom - (e.deltaY * zoomSpeed) / 200
		setNewZoom(newZoom, point)
	}
	
	const getPointOnContainer = ({ x, y }) => {
    if (!containerRect) {
      throw new Error('The Cropper is not mounted')
    }
    return {
      x: containerRect.width / 2 - (x - containerRect.left),
      y: containerRect.height / 2 - (y - containerRect.top),
    }
	}
	
	const getPointOnImage = ({ x, y }) => ({
		x: (x + crop.x) / zoom,
		y: (y + crop.y) / zoom,
	})

	const setNewZoom = (newZoom, point) => {
    const zoomPoint = getPointOnContainer(point)
    const zoomTarget = getPointOnImage(zoomPoint)
		zoom =  Math.min(maxZoom, Math.max(newZoom, minZoom))
		
    const requestedPosition = {
      x: zoomTarget.x * zoom - zoomPoint.x,
      y: zoomTarget.y * zoom - zoomPoint.y,
    }
    crop = restrictPosition
      ? helpers.restrictPosition(requestedPosition, imageSize, cropSize, zoom)
      : requestedPosition
  }

	const emitCropData = () => {
    if (!cropSize || cropSize.width === 0) return
    // this is to ensure the crop is correctly restricted after a zoom back (https://github.com/ricardo-ch/react-easy-crop/issues/6)
    const position = restrictPosition
      ? helpers.restrictPosition(crop, imageSize, cropSize, zoom)
			: crop
    const { croppedAreaPercentages, croppedAreaPixels } = helpers.computeCroppedArea(
      position,
      imageSize,
      cropSize,
      getAspect(),
      zoom,
      restrictPosition
		)
		
		dispatch('cropcomplete', {
			percent: croppedAreaPercentages, 
			pixels: croppedAreaPixels
		})
  }
</script>

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
		willChange: transform;
	}

	.cropperArea {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-sizing: border-box;
		box-shadow: 0 0 0 9999em;
		color: rgba(0,0,0,0.5);
		overflow: hidden;
	}

	.cropperArea:before {
		content: " ";
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

	.cropperArea:after {
		content: " ";
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
</style> 

<div
	class="container"
	bind:this={containerEl}
	on:mousedown={onMouseDown}
	on:touchstart={onTouchStart}
	data-testid="container"
>
	<img
		bind:this={imgEl}
		class="image"
		src={image}
		on:load={onImgLoad}
		on:error={onImgError}
		alt=""
		style="transform: translate({crop.x}px, {crop.y}px) scale({zoom});"
	/>
	{#if cropSize}
		<div
			class="cropperArea"
			style="width: {cropSize.width}px; height: {cropSize.height}px;"
			data-testid="cropper"
		></div>
	{/if}
</div>
