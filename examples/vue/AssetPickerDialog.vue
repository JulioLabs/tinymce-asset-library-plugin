<!--
    A minimal asset picker for the Vue example, with no UI library: search, a grid, upload, insert.
    Swap the two fetch calls for your own API, or replace the markup with your design system's dialog.
-->
<template>
    <dialog ref="dialog" class="asset-picker" @cancel.prevent="cancel">
        <div class="asset-picker__head">
            <input v-model="query" type="search" placeholder="Search images" aria-label="Search images" @input="load">
            <label class="asset-picker__upload">
                Upload
                <input type="file" accept="image/*" hidden @change="upload">
            </label>
        </div>

        <div class="asset-picker__grid">
            <button
                v-for="asset in assets"
                :key="asset.id"
                type="button"
                class="asset-picker__tile"
                :aria-pressed="selected?.id === asset.id"
                @click="selected = asset"
                @dblclick="choose(asset)"
            >
                <img :src="asset.url" alt="">
                <span>{{ asset.name }}</span>
            </button>
            <p v-if="!assets.length">No images found.</p>
        </div>

        <p v-if="error" class="asset-picker__error">{{ error }}</p>

        <div class="asset-picker__foot">
            <button type="button" @click="cancel">Cancel</button>
            <button type="button" :disabled="!selected" @click="choose(selected)">Insert</button>
        </div>
    </dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue", "select", "cancel"]);

const dialog = ref(null);
const assets = ref([]);
const selected = ref(null);
const query = ref("");
const error = ref("");

const load = async () => {
    const params = new URLSearchParams({ q: query.value.trim(), type: "image" });
    const response = await fetch(`/api/assets?${params}`);
    assets.value = response.ok ? await response.json() : [];
};

const upload = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    error.value = "";
    const formData = new FormData();
    formData.append("files", file);
    const response = await fetch("/api/assets/upload", { method: "POST", body: formData });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        error.value = body.message || "Upload failed";
        return;
    }
    assets.value = [...body, ...assets.value];
    selected.value = body[0];
};

watch(() => props.modelValue, (open) => {
    if (open) {
        selected.value = null;
        query.value = "";
        error.value = "";
        load();
        dialog.value.showModal();
    } else if (dialog.value?.open) {
        dialog.value.close();
    }
});

const close = () => emit("update:modelValue", false);
const choose = (asset) => { if (asset) { emit("select", asset); close(); } };
const cancel = () => { emit("cancel"); close(); };
</script>

<style>
.asset-picker { width: min(720px, 92vw); border: none; border-radius: 12px; padding: 16px; }
.asset-picker__head, .asset-picker__foot { display: flex; gap: 12px; align-items: center; }
.asset-picker__head input[type=search] { flex: 1; }
.asset-picker__foot { justify-content: flex-end; margin-top: 12px; }
.asset-picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 12px; max-height: 50vh; overflow: auto; }
.asset-picker__tile { border: 3px solid transparent; padding: 0; background: #f1f5f9; border-radius: 8px; cursor: pointer; text-align: left; }
.asset-picker__tile[aria-pressed=true] { border-color: #4e9a69; }
.asset-picker__tile img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
.asset-picker__tile span { display: block; font-size: 12px; padding: 4px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.asset-picker__error { color: #b91c1c; }
</style>
