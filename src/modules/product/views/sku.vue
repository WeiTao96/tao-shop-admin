<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
			<!-- 批量库存操作 -->
			<el-dropdown>
				<el-button type="primary">
					{{ t('库存操作') }}
					<el-icon class="el-icon--right"><arrow-down /></el-icon>
				</el-button>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item @click="batchAddStock">
							{{ t('批量增加库存') }}
						</el-dropdown-item>
						<el-dropdown-item @click="batchReduceStock">
							{{ t('批量减少库存') }}
						</el-dropdown-item>
						<el-dropdown-item @click="batchSetStock">
							{{ t('批量设置库存') }}
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

		<!-- 库存操作对话框 -->
		<el-dialog v-model="stockDialog.visible" :title="stockDialog.title" width="500px">
			<el-form :model="stockDialog.form" label-width="100px">
				<el-form-item :label="t('操作数量')">
					<el-input-number
						v-model="stockDialog.form.quantity"
						:min="stockDialog.type === 'reduce' ? 1 : 0"
						:placeholder="t('请输入数量')"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item :label="t('操作原因')">
					<el-input
						v-model="stockDialog.form.reason"
						type="textarea"
						:placeholder="t('请输入操作原因')"
						:rows="3"
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="stockDialog.visible = false">{{ t('取消') }}</el-button>
				<el-button type="primary" @click="handleStockOperation">{{ t('确定') }}</el-button>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'product-sku'
});

import { useCrud, useTable, useUpsert, useSearch } from '@cool-vue/crud';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';

const { t } = useI18n();
const { service } = useCool();

// 库存操作对话框
const stockDialog = ref({
	visible: false,
	title: '',
	type: '', // 'add', 'reduce', 'set'
	form: {
		quantity: 0,
		reason: ''
	},
	selectedRows: [] as any[]
});

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
			label: t('SKU编码'),
			prop: 'skuCode',
			width: 150,
			showOverflowTooltip: true
		},
		{
			label: t('商品信息'),
			prop: 'productInfo',
			minWidth: 200,
			component: {
				name: 'div',
				props: ({ scope }: any) => ({
					innerHTML: `
						<div style="display: flex; align-items: center;">
							${scope.row.image ? `<img src="${scope.row.image}" style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;" />` : ''}
							<div>
								<div style="font-weight: bold;">${scope.row.productName || '-'}</div>
								<div style="color: #999; font-size: 12px;">${scope.row.skuName || '-'}</div>
							</div>
						</div>
					`
				})
			}
		},
		{
			label: t('规格属性'),
			prop: 'attributes',
			width: 200,
			component: {
				name: 'div',
				props: ({ scope }: any) => {
					const attrs = scope.row.attributes || {};
					const attrTexts = Object.entries(attrs).map(
						([key, value]) => `${key}: ${value}`
					);
					return {
						innerHTML: attrTexts.join('<br>')
					};
				}
			}
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
			label: t('成本价'),
			prop: 'costPrice',
			width: 100,
			formatter: (row: any) => {
				return row.costPrice ? `¥${row.costPrice}` : '-';
			}
		},
		{
			label: t('库存'),
			prop: 'stock',
			width: 80,
			component: {
				name: 'div',
				props: ({ scope }: any) => {
					const stock = scope.row.stock || 0;
					const color = stock > 10 ? '#67C23A' : stock > 0 ? '#E6A23C' : '#F56C6C';
					return {
						innerHTML: `<span style="color: ${color}; font-weight: bold;">${stock}</span>`
					};
				}
			}
		},
		{
			label: t('销量'),
			prop: 'sales',
			width: 80
		},
		{
			label: t('重量(g)'),
			prop: 'weight',
			width: 100
		},
		{
			label: t('状态'),
			prop: 'status',
			width: 80,
			dict: options.status
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
					label: t('库存记录'),
					type: 'text',
					onClick: ({ scope }: any) => {
						viewStockHistory(scope.row);
					}
				}
			]
		}
	]
});

// cl-upsert
const Upsert = useUpsert({
	dialog: {
		width: '800px'
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
									prop: 'productId',
									label: t('所属商品'),
									component: {
										name: 'cl-select',
										props: {
											placeholder: t('请选择商品'),
											props: {
												label: 'name',
												value: 'id'
											}
										}
									},
									hook: {
										bind: ['options', () => service.product.info.list()]
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
									prop: 'skuCode',
									label: t('SKU编码'),
									component: {
										name: 'el-input',
										props: {
											placeholder: t('请输入SKU编码')
										}
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
			prop: 'skuName',
			label: t('SKU名称'),
			component: {
				name: 'el-input',
				props: {
					placeholder: t('请输入SKU名称')
				}
			},
			required: true
		},
		{
			prop: 'image',
			label: t('SKU图片'),
			component: {
				name: 'cl-upload',
				props: {
					type: 'image',
					text: t('上传SKU图片')
				}
			}
		},
		{
			label: t('价格设置'),
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
									label: t('销售价格'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											precision: 2,
											placeholder: t('请输入销售价格')
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
							props: { span: 8 },
							children: [
								{
									prop: 'costPrice',
									label: t('成本价格'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											precision: 2,
											placeholder: t('请输入成本价格')
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
									label: t('初始库存'),
									component: {
										name: 'el-input-number',
										props: {
											min: 0,
											placeholder: t('请输入初始库存')
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
			label: t('规格属性'),
			prop: 'attributes',
			component: {
				name: 'cl-form-tabs',
				props: {
					labels: [t('规格设置')],
					mergeProp: false
				},
				children: [
					{
						component: {
							name: 'div',
							children: [
								{
									component: {
										name: 'el-form-item',
										props: { label: t('规格属性') },
										children: [
											{
												component: {
													name: 'cl-editor-json',
													props: {
														height: 200
													}
												}
											}
										]
									}
								}
							]
						}
					}
				]
			}
		},
		{
			label: t('其他设置'),
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
									prop: 'barcode',
									label: t('条形码'),
									component: {
										name: 'el-input',
										props: {
											placeholder: t('请输入条形码')
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
									prop: 'status',
									label: t('状态'),
									value: 1,
									component: {
										name: 'el-radio-group',
										options: options.status
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
			label: t('SKU编码'),
			prop: 'skuCode',
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					placeholder: t('请输入SKU编码')
				}
			}
		},
		{
			label: t('SKU名称'),
			prop: 'skuName',
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					placeholder: t('请输入SKU名称')
				}
			}
		},
		{
			label: t('所属商品'),
			prop: 'productId',
			component: {
				name: 'cl-select',
				props: {
					clearable: true,
					placeholder: t('请选择商品'),
					props: {
						label: 'name',
						value: 'id'
					}
				}
			},
			hook: {
				bind: ['options', () => service.product.info.list()]
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
		},
		{
			label: t('库存范围'),
			prop: 'stockRange',
			component: {
				name: 'el-input',
				props: {
					placeholder: t('最小库存-最大库存')
				}
			}
		}
	]
});

// cl-crud
const Crud = useCrud(
	{
		service: service.product.sku
	},
	app => {
		app.refresh();
	}
);

// 批量库存操作
const batchAddStock = () => {
	openStockDialog('add', t('批量增加库存'));
};

const batchReduceStock = () => {
	openStockDialog('reduce', t('批量减少库存'));
};

const batchSetStock = () => {
	openStockDialog('set', t('批量设置库存'));
};

const openStockDialog = (type: string, title: string) => {
	const selectedRows = Table.value?.selection || [];
	if (selectedRows.length === 0) {
		ElMessage.warning(t('请选择要操作的SKU'));
		return;
	}

	stockDialog.value = {
		visible: true,
		title,
		type,
		form: {
			quantity: 0,
			reason: ''
		},
		selectedRows
	};
};

const handleStockOperation = async () => {
	const { type, form, selectedRows } = stockDialog.value;

	if (form.quantity === undefined || form.quantity < 0) {
		ElMessage.warning(t('请输入正确的数量'));
		return;
	}

	if (type === 'reduce' && form.quantity <= 0) {
		ElMessage.warning(t('减少数量必须大于0'));
		return;
	}

	try {
		const ids = selectedRows.map((row: any) => row.id);

		// 根据操作类型调用相应的API
		switch (type) {
			case 'add':
				await service.product.sku.update({
					ids,
					quantity: form.quantity,
					reason: form.reason,
					action: 'addStock'
				});
				break;
			case 'reduce':
				await service.product.sku.update({
					ids,
					quantity: form.quantity,
					reason: form.reason,
					action: 'reduceStock'
				});
				break;
			case 'set':
				await service.product.sku.update({
					ids,
					quantity: form.quantity,
					reason: form.reason,
					action: 'setStock'
				});
				break;
			default:
				return;
		}

		ElMessage.success(t('库存操作成功'));
		stockDialog.value.visible = false;
		Crud.value?.refresh();
	} catch (error) {
		console.error('库存操作失败:', error);
		ElMessage.error(t('库存操作失败'));
	}
};

// 查看库存记录
const viewStockHistory = async (row: any) => {
	try {
		const history = await service.product.sku.list({ skuId: row.id, type: 'stockHistory' });
		console.log('库存记录:', history);
		// 这里可以打开库存记录对话框
	} catch (error) {
		console.error('获取库存记录失败:', error);
	}
};
</script>
