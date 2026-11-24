<!--
    Vue 3 wiring for the asset library plugin, with @tinymce/tinymce-vue and a self-hosted TinyMCE (npm "tinymce").
    The component supplies the plugin's two options: pickAsset opens AssetPickerDialog and waits for a choice,
    uploadAsset posts a pasted or dropped image to your backend.
-->
<template>
    <Editor v-model="content" :init="editorConfig" />
    <AssetPickerDialog v-model="pickerOpen" @select="resolvePick" @cancel="resolvePick(null)" />
</template>

<script setup>
import { ref, watch } from "vue";
import Editor from "@tinymce/tinymce-vue";
import tinymce from "tinymce";

import AssetPickerDialog from "./AssetPickerDialog.vue";
import { createEditorConfig } from "./editorConfig.js";
import { registerAssetsPlugin } from "../../src/assetsPlugin.js";

registerAssetsPlugin(tinymce);

const props = defineProps({ modelValue: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue"]);

const content = ref(props.modelValue);
watch(content, (value) => emit("update:modelValue", value));
watch(() => props.modelValue, (value) => { if (value !== content.value) content.value = value; });

// --- The picker as a promise: open the dialog, resolve with the chosen asset (or null) ---
const pickerOpen = ref(false);
let pendingPick = null;

const resolvePick = (asset) => {
    const resolve = pendingPick;
    pendingPick = null;
    if (resolve) resolve(asset);
};

const pickAsset = () => {
    resolvePick(null); // a picker still open counts as cancelled
    return new Promise((resolve) => {
        pendingPick = resolve;
        pickerOpen.value = true;
    });
};

// --- Upload a pasted or dropped image to your asset library ---
const uploadAsset = async (blob, fileName) => {
    const formData = new FormData();
    formData.append("files", blob, fileName); // use the field name your endpoint expects
    const response = await fetch("/api/assets/upload", { method: "POST", body: formData });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        // TinyMCE shows this message; pass the server's reason on
        throw new Error(body.message || `HTTP ${response.status}`);
    }
    return body[0]; // { url, altText, ... }
};

const editorConfig = createEditorConfig({ pickAsset, uploadAsset });
</script>
