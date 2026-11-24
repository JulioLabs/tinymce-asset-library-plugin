# tinymce-asset-library-plugin

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A small **TinyMCE 6 plugin that plugs your own asset library into the editor**:

- an **"Insert image from assets"** toolbar button and Insert menu item that open *your* picker and insert the chosen image with its alt text;
- the **browse button** in TinyMCE's image dialog opens the same picker and fills in the URL and alt text;
- **pasted and dropped images** are uploaded to *your* library and replaced by their URL, with no base64 in the content. A refused upload is removed from the content and its error is shown.

The plugin is one file with no dependencies and no framework. Your app passes in two functions, one that opens the picker and one that uploads a file, so it works with Vue, React, plain JavaScript or anything else.

It's the plugin we use in [PresenceWave](https://presencewave.com) for blog posts, job posts and emails.

## Try the demo

```bash
git clone https://github.com/JulioLabs/tinymce-asset-library-plugin.git
cd tinymce-asset-library-plugin
python3 -m http.server 8000      # or: npx serve
```

Open http://localhost:8000/examples/vanilla/. ES modules don't load from `file://`, so serve the folder rather than opening the file. TinyMCE 6 loads from jsDelivr. The demo's "library" is a few sample images plus whatever you upload, kept in memory.

## Use it

```js
import tinymce from "tinymce";                       // or the window.tinymce global
import { registerAssetsPlugin, PLUGIN_ENTRY } from "./assetsPlugin.js";

registerAssetsPlugin(tinymce);                       // once, before tinymce.init

tinymce.init({
    selector: "#editor",
    plugins: `image link lists ${PLUGIN_ENTRY}`,     // "-pwassets": the dash stops TinyMCE downloading it
    toolbar: "undo redo | bold italic | pwassets link",
    menu: { insert: { title: "Insert", items: "pwassets image link" } },

    paste_data_images: true,                         // pasted images become uploads...
    automatic_uploads: true,                         // ...sent straight away
    image_uploadtab: false,                          // uploads happen in your picker, not TinyMCE's dialog

    // Open your picker; resolve with { url, altText }, or null if it was closed without a choice
    pwassets_pick: ({ filetype }) => openMyAssetPicker(filetype),
    // Upload a pasted or dropped image; resolve with { url, altText }, or throw an Error whose message is shown
    pwassets_upload: (blob, fileName) => uploadToMyLibrary(blob, fileName),
});
```

Copy [`src/assetsPlugin.js`](src/assetsPlugin.js) into your project. It isn't published to npm.

### Options

| Option | Signature | Used by |
|---|---|---|
| `pwassets_pick` | `({ filetype }) => Promise<{ url, altText } \| null>` | the toolbar button, the menu item, the image dialog's browse button |
| `pwassets_upload` | `(blob, fileName) => Promise<{ url, altText }>` | pasted and dropped images |

The plugin also sets `file_picker_types`, `file_picker_callback` and `images_upload_handler`, unless your config already sets them.

### Toolbar button and menu item

Both are called `pwassets`: put `pwassets` in `toolbar` and in the `menu.insert.items` list. Keep TinyMCE's own `image` plugin too. It's the way to edit an inserted image's alt text and size, from the context menu or Insert → Image.

## Examples

- [`examples/vanilla/index.html`](examples/vanilla/index.html): plain JavaScript with a `<dialog>` picker. It runs as is.
- [`examples/vue/`](examples/vue/): Vue 3 with `@tinymce/tinymce-vue`.
  - `RichTextEditor.vue` turns "open the picker, wait for a choice" into a promise.
  - `editorConfig.js` keeps TinyMCE's settings out of the component.
  - `AssetPickerDialog.vue` is a minimal picker.

  Swap the `fetch` calls for your own API.

## Things worth knowing

- **`images_upload_handler` must resolve with the URL string.** TinyMCE uses whatever you resolve with as the image's `src`: an object becomes `src="[object Object]"`. The plugin takes `url` from the asset your upload function returns.
- **Reject with `remove: true`.** Then TinyMCE removes a failed upload from the content instead of leaving a broken blob image. The plugin does this, and shows your error message.
- **The dash in `-pwassets`.** `PluginManager.add` doesn't stop TinyMCE from trying to download `plugins/pwassets/plugin.min.js`. A leading `-` in the `plugins` list does, and TinyMCE strips it before initialising the plugin.
- **A dialog on top of a dialog.** The browse button opens your picker over TinyMCE's image dialog. A native `<dialog>` (top layer) and Vuetify's dialog both work, including typing in the picker. Check yours.
- **Testing a paste without a clipboard:** insert a `data:` image and call `editor.uploadImages()`. Your upload function is called and the `src` is swapped for the returned URL.

## Compatibility

Written for and tested with **TinyMCE 6.8**: the open source build, self-hosted or from a CDN, with no API key. It uses only public plugin APIs (`PluginManager`, `editor.options`, `editor.ui.registry`), so TinyMCE 7 should work too, but it hasn't been tested there.

## About

Maintained by the team behind [PresenceWave](https://presencewave.com), which helps local service businesses capture more leads, understand their customers and bring them back, all from one platform. Questions and fixes are welcome as [issues](https://github.com/JulioLabs/tinymce-asset-library-plugin/issues).

## License

[MIT](LICENSE)
