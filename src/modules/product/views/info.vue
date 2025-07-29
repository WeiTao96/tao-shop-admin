<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
			<!-- 批量操作 -->
			<el-dropdown>
				<el-button type="primary">
					{{ t('批量操作') }}
					<el-icon class="el-icon--right"><arrow-down /></el-icon>
				</el-button>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item @click="batchUpdateStatus(1)">
							{{ t('批量上架') }}
						</el-dropdown-item>
						<el-dropdown-item @click="batchUpdateStatus(0)">
							{{ t('批量下架') }}
						</el-dropdown-item>
						<el-dropdown-item @click="batchUpdateRecommend(1)">
							{{ t('批量推荐') }}
						</el-dropdown-item>
						<el-dropdown-item @click="batchUpdateRecommend(0)">
							{{ t('取消推荐') }}
						</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
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
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'product-info'
});

import { useCrud, useTable, useUpsert, useSearch } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';

const { t } = useI18n();
const { service } = useCool();

const options = reactive({
	status: [
		{
			label: t('下架'),
			value: 0,
			type: 'danger'
		},
		{
			label: t('上架'),
			value: 1,
			type: 'success'
		}
	],
	recommend: [
		{
			label: t('否'),
			value: 0,
			type: 'info'
		},
		{
			label: t('是'),
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
			label: t('商品图片'),
			prop: 'images',
			width: 100,
			component: {
				name: 'cl-image',
				props: ({ scope }: any) => {
					const images = scope.row.images;
					if (Array.isArray(images) && images.length > 0) {
						return {
							src: images[0],
							fit: 'cover',
							style: { width: '60px', height: '60px' }
						};
					}
					return {
						src: '',
						fit: 'cover',
						style: { width: '60px', height: '60px' }
					};
				}
			}
		},
		{
			label: t('商品名称'),
			prop: 'name',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			label: t('分类'),
			prop: 'categoryName',
			width: 120
		},
		{
			label: t('价格'),
			prop: 'price',
			width: 100,
			formatter: (row: any) => {
				return row.price ? `¥${row.price}` : '-';
			}
		},
		{
			label: t('库存'),
			prop: 'stock',
			width: 80
		},
		{
			label: t('销量'),
			prop: 'sales',
			width: 80
		},
		{
			label: t('状态'),
			prop: 'status',
			width: 120,
			dict: options.status
		},
		{
			label: t('推荐'),
			prop: 'isRecommend',
			width: 80,
			dict: options.recommend
		},
		{
			label: t('新品'),
			prop: 'isNew',
			width: 80,
			dict: options.recommend
		},
		{
			label: t('热销'),
			prop: 'isHot',
			width: 80,
			dict: options.recommend
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
					label: t('商品详情'),
					type: 'text',
					onClick: ({ scope }: any) => {
						viewDetail(scope.row);
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
	dialog: {
		width: '1000px'
	},
	items: [
		{
			label: t('基本信息'),
			component: {
				name: 'el-row',
				children: [
					{
						component: {
							name: 'el-col',
							props: { span: 12 },
							children: [
								{
									prop: 'name',
									label: t('商品名称'),
									component: {
										name: 'el-input',
										props: {
											placeholder: t('请输入商品名称')
										}
									},
									required: true
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 12 },
							children: [
								{
									prop: 'categoryId',
									label: t('商品分类'),
									component: {
										name: 'cl-select',
										props: {
											placeholder: t('请选择商品分类'),
											props: {
												label: 'name',
												value: 'id'
											}
										}
									},
									hook: {
										bind: ['options', () => service.product.category.tree()]
									},
									required: true
								}
							]
						}
					}
				]
			}
		},
		{
			prop: 'description',
			label: t('商品描述'),
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					placeholder: t('请输入商品描述')
				}
			}
		},
		{
			prop: 'images',
			label: t('商品图片'),
			component: {
				name: 'cl-upload',
				props: {
					multiple: true,
					limit: 10,
					text: t('上传商品图片')
				}
			}
		},
		{
			label: t('价格库存'),
			component: {
				name: 'el-row',
				children: [
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'price',
									label: t('商品价格'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											precision: 2,
											placeholder: t('请输入商品价格')
										}
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'originalPrice',
									label: t('原价'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											precision: 2,
											placeholder: t('请输入原价')
										}
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'stock',
									label: t('库存'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											placeholder: t('请输入库存数量')
										}
									}
								}
							]
						}
					}
				]
			}
		},
		{
			label: t('商品属性'),
			component: {
				name: 'el-row',
				children: [
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'weight',
									label: t('重量(g)'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											placeholder: t('商品重量')
										}
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'unit',
									label: t('单位'),
									component: {
										name: 'el-input',
										props: {
											placeholder: t('如：件、盒、包等')
										}
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 8 },
							children: [
								{
									prop: 'tags',
									label: t('商品标签'),
									component: {
										name: 'el-select',
										props: {
											multiple: true,
											filterable: true,
											allowCreate: true,
											placeholder: t('输入标签，回车添加')
										}
									}
								}
							]
						}
					}
				]
			}
		},
		{
			label: t('状态设置'),
			component: {
				name: 'el-row',
				children: [
					{
						component: {
							name: 'el-col',
							props: { span: 6 },
							children: [
								{
									prop: 'status',
									label: t('商品状态'),
									value: 1,
									component: {
										name: 'el-radio-group',
										options: options.status
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 6 },
							children: [
								{
									prop: 'isRecommend',
									label: t('推荐商品'),
									value: 0,
									component: {
										name: 'el-radio-group',
										options: options.recommend
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 6 },
							children: [
								{
									prop: 'isNew',
									label: t('新品'),
									value: 0,
									component: {
										name: 'el-radio-group',
										options: options.recommend
									}
								}
							]
						}
					},
					{
						component: {
							name: 'el-col',
							props: { span: 6 },
							children: [
								{
									prop: 'isHot',
									label: t('热销'),
									value: 0,
									component: {
										name: 'el-radio-group',
										options: options.recommend
									}
								}
							]
						}
					}
				]
			}
		}
	]
});

// cl-search
const Search = useSearch({
	items: [
		{
			label: t('商品名称'),
			prop: 'name',
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					placeholder: t('请输入商品名称')
				}
			}
		},
		{
			label: t('商品分类'),
			prop: 'categoryId',
			component: {
				name: 'cl-select',
				props: {
					clearable: true,
					placeholder: t('请选择商品分类'),
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
			label: t('商品状态'),
			prop: 'status',
			component: {
				name: 'el-select',
				options: options.status,
				props: {
					clearable: true,
					placeholder: t('请选择状态')
				}
			}
		},
		{
			label: t('推荐商品'),
			prop: 'isRecommend',
			component: {
				name: 'el-select',
				options: options.recommend,
				props: {
					clearable: true,
					placeholder: t('是否推荐')
				}
			}
		},
		{
			label: t('价格区间'),
			prop: 'priceRange',
			component: {
				name: 'el-input',
				props: {
					placeholder: t('最低价-最高价')
				}
			}
		}
	]
});

// cl-crud
const Crud = useCrud(
	{
		service: service.product.info
	},
	app => {
		app.refresh();
	}
);

// 自定义方法
const viewDetail = async (row: any) => {
	try {
		const detail = await service.product.info.detail({ id: row.id });
		// 这里可以打开详情对话框或跳转到详情页面
		console.log('商品详情:', detail);
	} catch (error) {
		console.error('获取商品详情失败:', error);
	}
};

const updateStatus = async (row: any) => {
	const newStatus = row.status === 1 ? 0 : 1;
	const action = newStatus === 1 ? t('上架') : t('下架');

	try {
		await ElMessageBox.confirm(`确认要${action}商品"${row.name}"吗？`, t('提示'), {
			confirmButtonText: t('确定'),
			cancelButtonText: t('取消'),
			type: 'warning'
		});

		await service.product.info.updateStatus({
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

const batchUpdateStatus = async (status: number) => {
	const selectedRows = Table.value?.selection || [];
	if (selectedRows.length === 0) {
		ElMessage.warning(t('请选择要操作的商品'));
		return;
	}

	const action = status === 1 ? t('上架') : t('下架');
	try {
		await ElMessageBox.confirm(
			`确认要批量${action}选中的 ${selectedRows.length} 个商品吗？`,
			t('提示'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				type: 'warning'
			}
		);

		const ids = selectedRows.map((row: any) => row.id);
		await service.product.info.updateStatus({ ids, status });

		ElMessage.success(`批量${action}成功`);
		Crud.value?.refresh();
	} catch (error) {
		if (error !== 'cancel') {
			console.error('批量更新状态失败:', error);
		}
	}
};

const batchUpdateRecommend = async (isRecommend: number) => {
	const selectedRows = Table.value?.selection || [];
	if (selectedRows.length === 0) {
		ElMessage.warning(t('请选择要操作的商品'));
		return;
	}

	const action = isRecommend === 1 ? t('设为推荐') : t('取消推荐');
	try {
		await ElMessageBox.confirm(
			`确认要批量${action}选中的 ${selectedRows.length} 个商品吗？`,
			t('提示'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				type: 'warning'
			}
		);

		const ids = selectedRows.map((row: any) => row.id);
		await service.product.info.updateRecommend({ ids, isRecommend });

		ElMessage.success(`批量${action}成功`);
		Crud.value?.refresh();
	} catch (error) {
		if (error !== 'cancel') {
			console.error('批量更新推荐失败:', error);
		}
	}
};
</script>
