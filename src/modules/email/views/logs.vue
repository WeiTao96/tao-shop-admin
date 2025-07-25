<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
			<!-- 重试发送按钮 -->
			<el-button type="warning" @click="retrySelected">
				{{ t('重新发送') }}
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

		<!-- 查看详情 -->
		<cl-form ref="DetailForm" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'email-logs'
});

import { useCrud, useSearch, useTable, useForm } from '@cool-vue/crud';
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
			minWidth: 200,
			showOverflowTooltip: true
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
			label: t('错误信息'),
			prop: 'errorMsg',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			type: 'op',
			buttons: [
				{
					label: t('查看详情'),
					type: 'text',
					onClick: ({ scope }: any) => {
						showDetail(scope.row);
					}
				},
				{
					label: t('重新发送'),
					type: 'text',
					onClick: ({ scope }: any) => {
						if (scope.row.status !== 1) {
							retryEmail(scope.row);
						}
					}
				}
			],
			width: 150
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
		},
		{
			label: t('发送时间'),
			prop: 'sendTime',
			component: {
				name: 'el-date-picker',
				props: {
					type: 'datetimerange',
					'range-separator': '至',
					'start-placeholder': '开始时间',
					'end-placeholder': '结束时间',
					'value-format': 'YYYY-MM-DD HH:mm:ss'
				}
			}
		}
	]
});

// 详情表单
const DetailForm = useForm();

// 查看详情
function showDetail(item: any) {
	DetailForm.value?.open({
		title: t('邮件详情'),
		width: '80%',
		items: [
			{
				prop: 'to',
				label: t('收件人'),
				component: {
					name: 'el-input',
					props: {
						readonly: true
					}
				}
			},
			{
				prop: 'subject',
				label: t('主题'),
				component: {
					name: 'el-input',
					props: {
						readonly: true
					}
				}
			},
			{
				prop: 'content',
				label: t('内容'),
				component: {
					name: 'div',
					props: {
						innerHTML: item.content,
						style: 'border: 1px solid #dcdfe6; padding: 12px; border-radius: 4px; min-height: 200px;'
					}
				}
			},
			{
				prop: 'status',
				label: t('发送状态'),
				component: {
					name: 'el-tag',
					props: {
						type: item.status === 1 ? 'success' : item.status === 2 ? 'danger' : 'info'
					},
					children: options.status.find(s => s.value === item.status)?.label
				}
			},
			{
				prop: 'sendTime',
				label: t('发送时间'),
				component: {
					name: 'el-input',
					props: {
						readonly: true
					}
				}
			},
			{
				prop: 'errorMsg',
				label: t('错误信息'),
				hidden: item.status === 1,
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 3,
						readonly: true
					}
				}
			}
		],
		form: item,
		op: {
			hidden: true
		}
	});
}

// 重新发送单个邮件
function retryEmail(item: any) {
	ElMessageBox.confirm(t('确认重新发送该邮件？'), t('提示'), {
		type: 'warning'
	}).then(() => {
		service.email.email
			.retry({ id: item.id })
			.then(() => {
				ElMessage.success(t('重新发送成功'));
				Crud.value?.refresh();
			})
			.catch(err => {
				ElMessage.error(err.message);
			});
	});
}

// 批量重新发送
function retrySelected() {
	const selection = Table.value?.selection || [];
	const ids = selection.map((item: any) => item.id);
	if (!ids.length) {
		ElMessage.warning('请选择要重新发送的邮件');
		return;
	}

	ElMessageBox.confirm(`确认重新发送选中的 ${ids.length} 封邮件？`, t('提示'), {
		type: 'warning'
	}).then(() => {
		service.email.email
			.retry({ ids })
			.then(() => {
				ElMessage.success(t('批量重新发送成功'));
				Crud.value?.refresh();
			})
			.catch(err => {
				ElMessage.error(err.message);
			});
	});
}

// cl-crud
const Crud = useCrud(
	{
		service: service.email.email,
		dict: {
			api: {
				page: 'logs'
			}
		}
	},
	app => {
		app.refresh();
	}
);
</script>
