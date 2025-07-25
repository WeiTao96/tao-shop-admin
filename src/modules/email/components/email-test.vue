<template>
	<div class="email-test">
		<el-card>
			<template #header>
				<div class="card-header">
					<span>{{ t('邮件测试') }}</span>
				</div>
			</template>

			<cl-form ref="TestForm" />
		</el-card>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'email-test'
});

import { useForm } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const { t } = useI18n();
const { service } = useCool();

// 测试表单
const TestForm = useForm();

onMounted(() => {
	TestForm.value?.open({
		title: '',
		op: {
			saveButtonText: t('发送测试邮件')
		},
		items: [
			{
				prop: 'to',
				label: t('收件人'),
				component: {
					name: 'el-input',
					props: {
						placeholder: '请输入测试邮箱地址'
					}
				},
				required: true
			},
			{
				prop: 'subject',
				label: t('主题'),
				component: {
					name: 'el-input',
					props: {
						placeholder: '测试邮件主题'
					}
				},
				value: '邮件服务测试',
				required: true
			},
			{
				prop: 'content',
				label: t('内容'),
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 8,
						placeholder: '测试邮件内容'
					}
				},
				value: '这是一封测试邮件，用于验证邮件服务是否正常工作。\n\n如果您收到这封邮件，说明邮件服务配置正确。',
				required: true
			}
		],
		on: {
			submit: (data, { done, close }) => {
				service.email.email
					.test(data)
					.then(() => {
						ElMessage.success(t('测试邮件发送成功，请检查邮箱'));
						done();
					})
					.catch(err => {
						ElMessage.error(err.message);
						done();
					});
			}
		}
	});
});
</script>

<style scoped>
.email-test {
	padding: 20px;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
