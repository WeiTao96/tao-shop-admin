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

		<!-- 新增、编辑 -->
		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'product-category'
});

import { useCrud, useTable, useUpsert, useSearch } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const { service } = useCool();

const options = reactive({
	status: [
		{
			label: t('禁用'),
			value: 0,
			type: 'danger'
		},
		{
			label: t('启用'),
			value: 1,
			type: 'success'
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
			label: t('分类名称'),
			prop: 'name',
			minWidth: 200
		},
		{
			label: t('分类图标'),
			prop: 'icon',
			width: 80,
			component: {
				name: 'el-icon',
				props: ({ scope }: any) => ({
					name: scope.row.icon
				})
			}
		},
		{
			label: t('排序'),
			prop: 'sort',
			width: 80
		},
		{
			label: t('状态'),
			prop: 'status',
			width: 120,
			dict: options.status
		},
		{
			label: t('分类描述'),
			prop: 'description',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			label: t('创建时间'),
			prop: 'createTime',
			sortable: 'desc',
			width: 170
		},
		{
			type: 'op',
			buttons: [
				'edit',
				'delete',
				{
					label: t('添加子分类'),
					type: 'text',
					onClick: ({ scope }: any) => {
						addSubCategory(scope.row);
					}
				},
				{
					label: t('更新状态'),
					type: 'text',
					onClick: ({ scope }: any) => {
						updateStatus(scope.row);
					}
				}
			]
		}
	]
});

// cl-upsert
const Upsert = useUpsert({
	items: [
		{
			prop: 'name',
			label: t('分类名称'),
			component: {
				name: 'el-input',
				props: {
					placeholder: t('请输入分类名称')
				}
			},
			required: true
		},
		{
			prop: 'parentId',
			label: t('父级分类'),
			component: {
				name: 'cl-select',
				props: {
					placeholder: t('选择父级分类，留空为顶级分类'),
					clearable: true,
					props: {
						label: 'name',
						value: 'id'
					}
				}
			},
			hook: {
				bind: ['options', () => service.product.category.tree()]
			}
		},
		{
			prop: 'icon',
			label: t('分类图标'),
			component: {
				name: 'el-input',
				props: {
					placeholder: t('分类图标class名称')
				}
			}
		},
		{
			prop: 'sort',
			label: t('排序'),
			value: 0,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					placeholder: t('数字越大排序越靠前')
				}
			}
		},
		{
			prop: 'status',
			label: t('状态'),
			value: 1,
			component: {
				name: 'el-radio-group',
				options: options.status
			}
		},
		{
			prop: 'description',
			label: t('分类描述'),
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					placeholder: t('分类描述信息')
				}
			}
		}
	]
});

// cl-search
const Search = useSearch({
	items: [
		{
			label: t('分类名称'),
			prop: 'name',
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					placeholder: t('请输入分类名称')
				}
			}
		},
		{
			label: t('状态'),
			prop: 'status',
			component: {
				name: 'el-select',
				options: options.status,
				props: {
					clearable: true,
					placeholder: t('请选择状态')
				}
			}
		}
	]
});

// cl-crud
const Crud = useCrud(
	{
		service: service.product.category
	},
	app => {
		app.refresh();
	}
);

// 自定义方法
const addSubCategory = (row: any) => {
	Upsert.value?.open({
		items: [
			{
				prop: 'name',
				label: t('分类名称'),
				component: {
					name: 'el-input',
					props: {
						placeholder: t('请输入分类名称')
					}
				},
				required: true
			},
			{
				prop: 'parentId',
				label: t('父级分类'),
				value: row.id,
				component: {
					name: 'el-input',
					props: {
						disabled: true,
						value: row.name
					}
				}
			},
			{
				prop: 'icon',
				label: t('分类图标'),
				component: {
					name: 'el-input',
					props: {
						placeholder: t('分类图标class名称')
					}
				}
			},
			{
				prop: 'sort',
				label: t('排序'),
				value: 0,
				component: {
					name: 'el-input-number',
					props: {
						min: 0
					}
				}
			},
			{
				prop: 'status',
				label: t('状态'),
				value: 1,
				component: {
					name: 'el-radio-group',
					options: options.status
				}
			},
			{
				prop: 'description',
				label: t('分类描述'),
				component: {
					name: 'el-input',
					props: {
						type: 'textarea',
						rows: 4
					}
				}
			}
		]
	});
};

const updateStatus = async (row: any) => {
	const newStatus = row.status === 1 ? 0 : 1;
	const action = newStatus === 1 ? t('启用') : t('禁用');

	try {
		await ElMessageBox.confirm(`确认要${action}分类"${row.name}"吗？`, t('提示'), {
			confirmButtonText: t('确定'),
			cancelButtonText: t('取消'),
			type: 'warning'
		});

		await service.product.category.updateStatus({
			id: row.id,
			status: newStatus
		});

		ElMessage.success(`${action}成功`);
		Crud.value?.refresh();
	} catch (error) {
		if (error !== 'cancel') {
			console.error('更新状态失败:', error);
		}
	}
};
</script>
