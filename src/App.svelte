<script>
	import Cropper from './Cropper.svelte';
	
	let crop = { x: 0, y: 0}
	let zoom = 1

	setTimeout(() => zoom = 2, 1000)
</script>

<Cropper  
	image="https://i.ytimg.com/vi/SfLV8hD7zX4/maxresdefault.jpg"
	bind:crop
	bind:zoom
	on:cropcomplete={e => console.log(e.detail)}
/>
