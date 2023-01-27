# svelte-easy-crop

A Svelte component to crop images with easy interactions

This is a rewrite of `react-easy-crop` (https://github.com/ricardo-ch/react-easy-crop).

[![version][version-badge]][package] [![Monthly downloads][npmstats-badge]][npmstats] ![gzip size][gzip-badge] [![Build Status][build-badge]][build-page] [![MIT License][license-badge]][license] [![PRs Welcome][prs-badge]][prs]

![svelte-easy-crop Demo](https://user-images.githubusercontent.com/2678610/41561426-365e7a44-734a-11e8-8e0e-1c04251f53e4.gif)

## Demo

- [Basic example](https://codesandbox.io/s/svelte-easy-crop-basic-demo-q1005?file=/App.svelte)
- [With file upload and live preview](https://codesandbox.io/s/svelte-easy-crop-with-file-upload-and-live-preview-36xsr)

## Features

- Supports drag and zoom interactions
- Provides crop dimensions as pixels and percentages
- Supports any images format (JPEG, PNG, even GIF) as url or base 64 string
- Mobile friendly

## Installation

```shell
yarn add svelte-easy-crop
```

or

```shell
npm install svelte-easy-crop --save
```

## Basic usage

> The Cropper is styled with `position: absolute` to take the full space of its parent.
> Thus, you need to wrap it with an element that uses `position: relative` or the Cropper will fill the whole page.

```jsx
<script>
  import Cropper from 'svelte-easy-crop'

  let image = '/images/dog.jpeg'
  let crop = { x: 0, y: 0 }
  let zoom = 1
</script>

<Cropper
 {image}
 bind:crop
 bind:zoom
 on:cropcomplete={e => console.log(e.detail)}
/>
```

## Props

| Prop               | Type                                | Required | Description                                                                                                                                                                                                                                                                                                 |
| :----------------- | :---------------------------------- | :------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image`            | string                              |    ✓     | The image to be cropped.                                                                                                                                                                                                                                                                                    |
| `crop`             | `{ x: number, y: number }`          |    ✓     | Position of the image. `{ x: 0, y: 0 }` will center the image under the cropper.                                                                                                                                                                                                                            |
| `zoom`             | number                              |          | Zoom of the image between `minZoom` and `maxZoom`. Defaults to 1.                                                                                                                                                                                                                                           |
| `aspect`           | number                              |          | Aspect of the cropper. The value is the ratio between its width and its height. The default value is `4/3`                                                                                                                                                                                                  |
| `minZoom`          | number                              |          | Minimum zoom of the image. Defaults to 1.                                                                                                                                                                                                                                                                   |
| `maxZoom`          | number                              |          | Maximum zoom of the image. Defaults to 3.                                                                                                                                                                                                                                                                   |
| `cropShape`        | 'rect' \| 'round'                   |          | Shape of the crop area. Defaults to 'rect'.                                                                                                                                                                                                                                                                 |
| `cropSize`         | `{ width: number, height: number }` |          | Size of the crop area (in pixels). If you don't provide it, it will be computed automatically using the `aspect` prop and the image size.                                                                                                                                                                   |
| `showGrid`         | boolean                             |          | Whether to show or not the grid (third-lines). Defaults to `true`.                                                                                                                                                                                                                                          |
| `zoomSpeed`        | number                              |          | Multiplies the value by which the zoom changes. Defaults to 1.                                                                                                                                                                                                                                              |
| `crossOrigin`      | string                              |          | Allows setting the crossOrigin attribute on the image.                                                                                                                                                                                                                                                      |
| `restrictPosition` | boolean                             |          | Whether the position of the image should be restricted to the boundaries of the cropper. Useful setting in case of `zoom < 1` or if the cropper should preserve all image content while forcing a specific aspect ratio for image throughout the application. Example: https://codesandbox.io/s/1rmqky233q. |

# Events

#### on:cropcomplete

This event is the one you should use to save the cropped area of the image. The `detail` property is an object with 2 values:

1. `percent`: coordinates and dimensions of the cropped area in percentage of the image dimension
1. `pixels`: coordinates and dimensions of the cropped area in pixels.

Both arguments have the following shape:

```js
const area = {
  x: number, // x/y are the coordinates of the top/left corner of the cropped area
  y: number,
  width: number, // width of the cropped area
  height: number, // height of the cropped area
}
```

## Development

```shell
yarn
yarn dev
```

Now, open `http://localhost:5000` and start hacking!

## License

[MIT](https://github.com/ValentinH/svelte-easy-crop/blob/master/LICENSE)

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[version-badge]: https://img.shields.io/npm/v/svelte-easy-crop.svg?style=flat-square
[package]: https://www.npmjs.com/package/svelte-easy-crop
[downloads-badge]: https://img.shields.io/npm/dm/svelte-easy-crop.svg?style=flat-square
[npmstats]: http://npm-stat.com/charts.html?package=svelte-easy-crop&from=2018-06-18
[npmstats-badge]: https://img.shields.io/npm/dm/svelte-easy-crop.svg?style=flat-square
[gzip-badge]: http://img.badgesize.io/https://unpkg.com/svelte-easy-crop@1.0.0/index.js?compression=gzip&style=flat-square
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license]: https://github.com/ValentinH/svelte-easy-crop/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[build-badge]: https://circleci.com/gh/ValentinH/svelte-easy-crop.svg?style=svg
[build-page]: https://circleci.com/gh/ValentinH/svelte-easy-crop
