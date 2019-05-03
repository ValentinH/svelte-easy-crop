<script>
	import queryString from 'query-string'
	import Cropper from '../src/index.svelte'

	let crop = { x: 0, y: 0 }
	let zoom = 1

	const urlArgs = queryString.parse(window.location.search)
	let image = urlArgs.img || '/images/dog.jpeg' // so we can change the image from our tests
</script>

<Cropper  
	{image}
	bind:crop
	bind:zoom
	on:cropcomplete={e => console.log(e.detail)}
/>
