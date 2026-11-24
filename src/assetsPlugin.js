/**
 * TinyMCE 6 plugin "pwassets": images in the editor come from, and go to, your own asset library.
 *
 * - A toolbar button and an Insert menu item ("pwassets") open your asset picker and insert the chosen image.
 * - The image dialog's browse button opens the same picker and fills in the URL and alt text (file_picker_callback).
 * - Pasted and dropped images are uploaded to your library and replaced by their URL (images_upload_handler).
 *
 * The plugin only wires TinyMCE up. Your app supplies the picker and the upload as two editor options:
 *
 *   pwassets_pick({ filetype })      -> Promise<{ url, altText } | null>   (null: closed without a choice)
 *   pwassets_upload(blob, fileName)  -> Promise<{ url, altText }>          (reject with an Error; its message is shown)
 *
 * Usage:
 *
 *   import { registerAssetsPlugin, PLUGIN_ENTRY } from "./assetsPlugin.js";
 *   registerAssetsPlugin(tinymce);                       // once, after TinyMCE has loaded
 *   tinymce.init({
 *     plugins: `image link ${PLUGIN_ENTRY}`,            // "-pwassets": the dash stops TinyMCE downloading it
 *     toolbar: "bold italic | pwassets link",
 *     paste_data_images: true,
 *     automatic_uploads: true,
 *     image_uploadtab: false,
 *     pwassets_pick: (opts) => openMyPicker(opts),
 *     pwassets_upload: (blob, name) => uploadToMyLibrary(blob, name),
 *   });
 */

export const PLUGIN_NAME = "pwassets";

/** The entry for the editor's `plugins` option: the leading "-" tells TinyMCE the plugin is already registered. */
export const PLUGIN_ENTRY = `-${PLUGIN_NAME}`;

const INSERT_COMMAND = "pwInsertAsset";

const registerOptions = (editor) => {
    editor.options.register("pwassets_pick", { processor: "function" });
    editor.options.register("pwassets_upload", { processor: "function" });
};

/** Opens the picker; resolves with the chosen asset, or null when there is no picker or nothing was chosen. */
const pickAsset = (editor, filetype) => {
    const pick = editor.options.get("pwassets_pick");
    return pick ? Promise.resolve(pick({ filetype })) : Promise.resolve(null);
};

const insertImage = (editor, asset) => {
    // createHTML escapes the attribute values
    editor.insertContent(editor.dom.createHTML("img", { src: asset.url, alt: asset.altText || "" }));
};

/** Sets a core option unless the app's own configuration already set it. */
const setDefault = (editor, name, value) => {
    if (!editor.options.isSet(name)) {
        editor.options.set(name, value);
    }
};

const registerUi = (editor) => {
    editor.addCommand(INSERT_COMMAND, () => {
        pickAsset(editor, "image").then((asset) => {
            if (asset) {
                insertImage(editor, asset);
            }
        });
    });

    editor.ui.registry.addButton(PLUGIN_NAME, {
        icon: "image",
        tooltip: "Insert image from assets",
        onAction: () => editor.execCommand(INSERT_COMMAND),
    });

    editor.ui.registry.addMenuItem(PLUGIN_NAME, {
        icon: "image",
        text: "Image from assets...",
        onAction: () => editor.execCommand(INSERT_COMMAND),
    });
};

const registerFilePicker = (editor) => {
    setDefault(editor, "file_picker_types", "image");
    setDefault(editor, "file_picker_callback", (callback, value, meta) => {
        pickAsset(editor, meta.filetype).then((asset) => {
            if (asset) {
                callback(asset.url, { alt: asset.altText || "" });
            }
        });
    });
};

const registerUploads = (editor) => {
    setDefault(editor, "images_upload_handler", (blobInfo) => {
        const upload = editor.options.get("pwassets_upload");
        if (!upload) {
            return Promise.reject({ message: "Image upload isn't available here", remove: true });
        }
        return upload(blobInfo.blob(), blobInfo.filename())
            // TinyMCE uses the resolved value as the image's src: it must be the URL string
            .then((asset) => asset.url)
            // remove: TinyMCE takes the failed image out of the content instead of leaving a broken blob behind
            .catch((error) => Promise.reject({ message: `Image upload failed: ${error.message}`, remove: true }));
    });
};

/**
 * Registers the plugin with TinyMCE. Call once, after TinyMCE has loaded and before `tinymce.init`.
 *
 * @param {object} tinymce - the TinyMCE global (`window.tinymce`, or the default export of the "tinymce" package)
 */
export function registerAssetsPlugin(tinymce = window.tinymce) {
    if (tinymce.PluginManager.get(PLUGIN_NAME)) {
        return;
    }
    tinymce.PluginManager.add(PLUGIN_NAME, (editor) => {
        registerOptions(editor);
        registerUi(editor);
        registerFilePicker(editor);
        registerUploads(editor);
        return {
            getMetadata: () => ({ name: "Asset library", url: "https://github.com/JulioLabs/tinymce-asset-library-plugin" }),
        };
    });
}
