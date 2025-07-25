<template>
	<div class="email-test-page">
		<email-test />
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'email-test-page'
});

import EmailTest from '../components/email-test.vue';
</script>

<style scoped>
.email-test-page {
	height: 100%;
}
</style>
