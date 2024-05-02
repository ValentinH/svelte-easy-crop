<script lang="ts">
  import queryString from 'query-string'
  import Cropper from '../lib'
  import type { ObjectFit } from "$lib/types"

  let crop = { x: 0, y: 0 }
  let zoom = 1
  let zoomSpeed = 0.5;
  let minZoom = 0.5;
  let maxZoom = 3;
  let objectFit: ObjectFit = 'contain';
  let mediaObjectFit: ObjectFit;

  let croppedSize = 450;

  const urlArgs = typeof window !== 'undefined' ? queryString.parse(window.location.search) : null
  let image = typeof urlArgs?.img === 'string' ? urlArgs.img : '/images/dog.jpeg' // so we can change the image from our tests
</script>

<div class="properties">
  <b>Properties</b><br />
  <ul>
    <li>Crop: {crop.x}, {crop.y}</li>
    <li>Zoom: {zoom}</li>
    <li>Zoomspeed: {zoomSpeed}</li>
    <li>objectFit: {mediaObjectFit}</li>
  </ul>
</div>
<div class="cropperContainer" style={`width: ${croppedSize}px; height: ${croppedSize}px`}>
  <Cropper
    {image}
    bind:crop
    bind:zoom
    bind:zoomSpeed
    bind:minZoom
    bind:maxZoom
    bind:objectFit={objectFit}
    bind:mediaObjectFit
    on:cropcomplete={e => console.log(e.detail)}
  />
</div>
<div class="settingsContainer flex flex-col gap-4">
  <h2>Settings:</h2>
  <div class="flex gap-4">
    <div class="setting flex flex-col gap-2">
      <label for="zoomSpeed">zoomSpeed</label>
      <input id="zoomSpeed" type="number" bind:value={zoomSpeed} />
    </div>
    <div class="setting flex flex-col gap-2">
        <label for="minZoom">minZoom</label>
        <input id="minZoom" type="number" bind:value={minZoom} />
    </div>
    <div class="setting flex flex-col gap-2">
      <label for="maxZoom">maxZoom</label>
      <input id="maxZoom" type="number" bind:value={maxZoom} />
    </div>
  </div>

  <div class="flex gap-4">
    <div class="setting flex flex-col gap-2">
      <label for="zoomSpeed">Image</label>
      <select bind:value={image}>
        <option value="/images/dog.jpeg">horizontal</option>
        <option value="/images/cat.jpeg">vertical</option>
      </select>
    </div>
    <div class="setting flex flex-col gap-2">
      <label for="width">Width</label>
      <input type="number" bind:value={croppedSize} />
    </div>
  </div>
</div>

<style>
  .properties{
      position: absolute;
      top: 0;
      left: 0;
      z-index: 30;
      background: rgba(0,0,0,0.3);
      padding: 16px;
      border-bottom-right-radius: 10px;
      color: white;
  }
  .properties ul{
      padding-left: 20px;
  }
  .cropperContainer{
      position: relative;
      background: lightgray;
      margin: 0 auto 16px;
  }
  .settingsContainer{
      position: relative;
      width: 450px;
      height: 450px;
      margin: auto;
  }
  .settingsContainer .setting{
      width: 100px;
  }
  .settingsContainer .setting label{

      font-weight:  bold;
  }
  .flex{
      display: flex;
  }
  .flex-col{
      flex-direction: column;
  }
  .gap-2{
      gap: 8px;
  }
  .gap-4{
      gap: 16px;
  }
</style>