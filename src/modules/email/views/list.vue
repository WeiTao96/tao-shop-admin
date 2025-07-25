<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
			<!-- 发送邮件按钮 -->
			<el-button type="primary" @click="sendEmail">
				{{ t('发送邮件') }}
			</el-button>
			<cl-flex1 />
			<!-- 搜索 -->
			<cl-search ref="Search" />
		</cl-row>

		<cl-row>
			<!-- 数据表格 -->
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<!-- 分页控件 -->
			<cl-pagination />
		</cl-row>

		<!-- 新增、编辑 -->
		<cl-upsert ref="Upsert" />

		<!-- 发送邮件弹窗 -->
		<cl-form ref="SendForm" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'email-list'
});

import { useCrud, useSearch, useTable, useUpsert, useForm } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const { service } = useCool();

const options = reactive({
	status: [
		{
			label: t('待发送'),
			value: 0,
			type: 'info'
		},
		{
			label: t('发送成功'),
			value: 1,
			type: 'success'
		},
		{
			label: t('发送失败'),
			value: 2,
			type: 'danger'
		}
	]
});

// cl-table
const Table = useTable({
	columns: [
		{
			type: 'selection',
			width: 60
		},
		{
			label: t('收件人'),
			prop: 'to',
			minWidth: 200
		},
		{
			label: t('主题'),
			prop: 'subject',
			minWidth: 200
		},
		{
			label: t('发送状态'),
			prop: 'status',
			dict: options.status,
			minWidth: 120
		},
		{
			label: t('发送时间'),
			prop: 'sendTime',
			sortable: 'desc',
			minWidth: 170
		},
		{
			label: t('创建时间'),
			prop: 'createTime',
			sortable: 'custom',
			minWidth: 170
		},
		{
			type: 'op',
			buttons: ['edit', 'delete'],
			width: 120
		}
	]
});

// cl-upsert
const Upsert = useUpsert({
	items: [
		{
			prop: 'to',
			label: t('收件人'),
			component: {
				name: 'el-input',
				props: {
					placeholder: '多个邮箱用逗号分隔'
				}
			},
			required: true
		},
		{
			prop: 'subject',
			label: t('主题'),
			component: { name: 'el-input' },
			required: true
		},
		{
			prop: 'content',
			label: t('内容'),
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 8
				}
			},
			required: true
		},
		{
			prop: 'status',
			label: t('状态'),
			value: 0,
			component: {
				name: 'el-radio-group',
				options: options.status
			}
		}
	]
});

// cl-search
const Search = useSearch({
	items: [
		{
			label: t('收件人'),
			prop: 'to',
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('主题'),
			prop: 'subject',
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('发送状态'),
			prop: 'status',
			component: {
				name: 'el-select',
				options: options.status,
				props: {
					clearable: true
				}
			}
		}
	]
});

// 发送邮件表单
const SendForm = useForm();

// 发送邮件
function sendEmail() {
	SendForm.value?.open({
		title: t('发送邮件'),
		items: [
			{
				prop: 'to',
				label: t('收件人'),
				component: {
					name: 'el-input',
					props: {
						placeholder: '多个邮箱用逗号分隔'
					}
				},
				required: true
			},
			{
				prop: 'subject',
				label: t('主题'),
				component: { name: 'el-input' },
				required: true
			},
			{
				prop: 'content',
				label: t('内容'),
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 8
					}
				},
				required: true
			}
		],
		on: {
			submit: (data, { done, close }) => {
				service.email.email
					.send(data)
					.then(() => {
						ElMessage.success(t('邮件发送成功'));
						close();
						Crud.value?.refresh();
					})
					.catch(err => {
						ElMessage.error(err.message);
						done();
					});
			}
		}
	});
}

// cl-crud
const Crud = useCrud(
	{
		service: service.email.email
	},
	app => {
		app.refresh();
	}
);
</script>
