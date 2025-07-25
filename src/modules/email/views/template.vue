<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
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

		<!-- 预览模板弹窗 -->
		<cl-form ref="PreviewForm" />

		<!-- 使用模板发送邮件弹窗 -->
		<cl-form ref="SendTemplateForm" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'email-template'
});

import { useCrud, useSearch, useTable, useUpsert, useForm } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const { service } = useCool();

// cl-table
const Table = useTable({
	columns: [
		{
			type: 'selection',
			width: 60
		},
		{
			label: t('模板名称'),
			prop: 'name',
			minWidth: 150
		},
		{
			label: t('模板代码'),
			prop: 'code',
			minWidth: 120
		},
		{
			label: t('主题'),
			prop: 'subject',
			minWidth: 200
		},
		{
			label: t('创建时间'),
			prop: 'createTime',
			sortable: 'desc',
			minWidth: 170
		},
		{
			type: 'op',
			buttons: [
				'edit',
				'delete',
				{
					label: t('预览'),
					type: 'primary',
					onClick: ({ scope }: any) => {
						previewTemplate(scope.row);
					}
				},
				{
					label: t('使用模板发送'),
					type: 'success',
					onClick: ({ scope }: any) => {
						sendWithTemplate(scope.row);
					}
				}
			],
			width: 280
		}
	]
});

// cl-upsert
const Upsert = useUpsert({
	items: [
		{
			prop: 'name',
			label: t('模板名称'),
			component: { name: 'el-input' },
			required: true
		},
		{
			prop: 'code',
			label: t('模板代码'),
			component: {
				name: 'el-input',
				props: {
					placeholder: '唯一标识，如：welcome_email'
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
			label: t('模板内容'),
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 10,
					placeholder: '支持HTML和变量，如：{{name}}、{{email}}'
				}
			},
			required: true
		},
		{
			prop: 'variables',
			label: t('模板变量'),
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 3,
					placeholder: 'JSON格式，如：{"name":"姓名","email":"邮箱"}'
				}
			}
		}
	]
});

// cl-search
const Search = useSearch({
	items: [
		{
			label: t('模板名称'),
			prop: 'name',
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('模板代码'),
			prop: 'code',
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		}
	]
});

// 预览表单
const PreviewForm = useForm();

// 发送模板邮件表单
const SendTemplateForm = useForm();

// 预览模板
function previewTemplate(item: any) {
	service.email.emailTemplate
		.preview({ id: item.id })
		.then(res => {
			PreviewForm.value?.open({
				title: t('模板预览'),
				width: '80%',
				items: [
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
								innerHTML: res.content || res
							}
						}
					}
				],
				form: {
					subject: res.subject || item.subject,
					content: res.content || res
				},
				op: {
					hidden: true
				}
			});
		})
		.catch(err => {
			ElMessage.error(err.message);
		});
}

// 使用模板发送邮件
function sendWithTemplate(item: any) {
	SendTemplateForm.value?.open({
		title: t('使用模板发送'),
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
				prop: 'variables',
				label: t('模板变量'),
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 5,
						placeholder:
							'JSON格式的变量值，如：{"name":"张三","email":"test@example.com"}'
					}
				}
			}
		],
		form: {
			templateId: item.id
		},
		on: {
			submit: (data, { done, close }) => {
				service.email.email
					.sendTemplate({
						...data,
						templateId: item.id
					})
					.then(() => {
						ElMessage.success(t('模板邮件发送成功'));
						close();
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
		service: service.email.emailTemplate
	},
	app => {
		app.refresh();
	}
);
</script>
