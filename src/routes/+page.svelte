<script lang="ts">
  import queryString from 'query-string'
  import Cropper from '../lib'

  let crop = $state({ x: 0, y: 0 })
  let zoom = $state(1)
  let minZoom = $state(0.5)
  let maxZoom = $state(3)

  const urlArgs = typeof window !== 'undefined' ? queryString.parse(window.location.search) : null
  let image = typeof urlArgs?.img === 'string' ? urlArgs.img : '/images/dog.jpeg' // so we can change the image from our tests
</script>

<Cropper
  {image}
  bind:crop
  bind:zoom
  bind:minZoom
  bind:maxZoom
  oncropcomplete={(e) => console.log(e)}
/>
