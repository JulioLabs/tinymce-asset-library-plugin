/**
 * TinyMCE settings for the Vue example, kept out of the component.
 */
import { PLUGIN_ENTRY } from "../../src/assetsPlugin.js";

const PLUGINS = ["advlist", "autolink", "lists", "link", "image", "media", "table", "code", "wordcount", PLUGIN_ENTRY];

// "pwassets" is the plugin's button and menu item; "image" stays in the context menu to edit an inserted image
const TOOLBAR = "undo redo | blocks | bold italic | bullist numlist | pwassets link media | code";
const INSERT_MENU = "pwassets image link media inserttable | charmap hr";

/**
 * @param {object} options
 * @param {(opts: {filetype: string}) => Promise<object|null>} options.pickAsset - opens your asset picker
 * @param {(blob: Blob, fileName: string) => Promise<object>} options.uploadAsset - uploads one file to your library
 */
export function createEditorConfig({ pickAsset, uploadAsset }) {
    return {
        // Self-hosted TinyMCE: point base_url at where your build copies node_modules/tinymce
        base_url: "/tinymce",
        suffix: ".min",
        promotion: false,
        height: 500,

        plugins: PLUGINS.join(" "),
        toolbar: TOOLBAR,
        menu: { insert: { title: "Insert", items: INSERT_MENU } },
        contextmenu: "link image table",
        relative_urls: false,
        remove_script_host: false,

        // Images: pasted or dropped ones are uploaded to your library; the image dialog's browse button opens your picker
        paste_data_images: true,
        automatic_uploads: true,
        image_uploadtab: false,
        pwassets_pick: pickAsset,
        pwassets_upload: uploadAsset,
    };
}
