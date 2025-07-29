<template>
	<div class="sku-manager">
		<div class="manager-header">
			<el-row :gutter="20">
				<el-col :span="12">
					<el-input
						v-model="searchText"
						:placeholder="t('搜索SKU编码或名称')"
						clearable
						@input="handleSearch"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</el-col>
				<el-col :span="12">
					<div class="header-actions">
						<el-button type="primary" @click="handleAdd">
							<el-icon><Plus /></el-icon>
							{{ t('新增SKU') }}
						</el-button>
						<el-button @click="refresh">
							<el-icon><Refresh /></el-icon>
							{{ t('刷新') }}
						</el-button>
					</div>
				</el-col>
			</el-row>
		</div>

		<div class="manager-content">
			<el-table
				:data="filteredSkuList"
				v-loading="loading"
				stripe
				@selection-change="handleSelectionChange"
			>
				<el-table-column type="selection" width="50" />

				<el-table-column :label="t('SKU信息')" min-width="200">
					<template #default="{ row }">
						<div class="sku-info">
							<el-image
								v-if="row.image"
								:src="row.image"
								fit="cover"
								class="sku-image"
							/>
							<div class="sku-details">
								<div class="sku-name">{{ row.skuName }}</div>
								<div class="sku-code">{{ row.skuCode }}</div>
							</div>
						</div>
					</template>
				</el-table-column>

				<el-table-column :label="t('规格')" width="150">
					<template #default="{ row }">
						<div class="attributes">
							<el-tag
								v-for="(value, key) in row.attributes"
								:key="key"
								size="small"
								class="attribute-tag"
							>
								{{ key }}: {{ value }}
							</el-tag>
						</div>
					</template>
				</el-table-column>

				<el-table-column :label="t('价格')" width="100">
					<template #default="{ row }">
						<span class="price">¥{{ row.price }}</span>
					</template>
				</el-table-column>

				<el-table-column :label="t('库存')" width="80">
					<template #default="{ row }">
						<el-tag :type="getStockTagType(row.stock)" size="small">
							{{ row.stock }}
						</el-tag>
					</template>
				</el-table-column>

				<el-table-column :label="t('状态')" width="80">
					<template #default="{ row }">
						<el-switch
							v-model="row.status"
							:active-value="1"
							:inactive-value="0"
							@change="handleStatusChange(row)"
						/>
					</template>
				</el-table-column>

				<el-table-column :label="t('操作')" width="150" fixed="right">
					<template #default="{ row }">
						<el-button type="primary" size="small" text @click="handleEdit(row)">
							{{ t('编辑') }}
						</el-button>
						<el-button type="danger" size="small" text @click="handleDelete(row)">
							{{ t('删除') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<div class="manager-footer" v-if="selectedRows.length > 0">
			<div class="batch-actions">
				<span class="selected-info">
					{{ t('已选择') }} {{ selectedRows.length }} {{ t('个SKU') }}
				</span>
				<el-button-group>
					<el-button size="small" @click="batchUpdateStatus(1)">
						{{ t('批量启用') }}
					</el-button>
					<el-button size="small" @click="batchUpdateStatus(0)">
						{{ t('批量禁用') }}
					</el-button>
					<el-button size="small" @click="batchDelete">
						{{ t('批量删除') }}
					</el-button>
				</el-button-group>
			</div>
		</div>

		<!-- SKU编辑对话框 -->
		<el-dialog
			v-model="dialogVisible"
			:title="dialogTitle"
			width="600px"
			:close-on-click-modal="false"
		>
			<el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
				<el-form-item :label="t('SKU编码')" prop="skuCode">
					<el-input v-model="formData.skuCode" :placeholder="t('请输入SKU编码')" />
				</el-form-item>

				<el-form-item :label="t('SKU名称')" prop="skuName">
					<el-input v-model="formData.skuName" :placeholder="t('请输入SKU名称')" />
				</el-form-item>

				<el-form-item :label="t('SKU图片')">
					<cl-upload v-model="formData.image" :type="'image'" :text="t('上传图片')" />
				</el-form-item>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item :label="t('销售价格')" prop="price">
							<el-input-number
								v-model="formData.price"
								:min="0"
								:precision="2"
								:placeholder="t('请输入价格')"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item :label="t('库存')" prop="stock">
							<el-input-number
								v-model="formData.stock"
								:min="0"
								:placeholder="t('请输入库存')"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
				</el-row>

				<el-form-item :label="t('规格属性')">
					<div class="attributes-editor">
						<div
							v-for="(attr, index) in attributeList"
							:key="index"
							class="attribute-item"
						>
							<el-input
								v-model="attr.key"
								:placeholder="t('属性名')"
								style="width: 120px"
							/>
							<span class="separator">:</span>
							<el-input
								v-model="attr.value"
								:placeholder="t('属性值')"
								style="width: 120px"
							/>
							<el-button
								type="danger"
								size="small"
								text
								@click="removeAttribute(index)"
							>
								<el-icon><Delete /></el-icon>
							</el-button>
						</div>
						<el-button type="primary" size="small" text @click="addAttribute">
							<el-icon><Plus /></el-icon>
							{{ t('添加属性') }}
						</el-button>
					</div>
				</el-form-item>

				<el-form-item :label="t('状态')">
					<el-radio-group v-model="formData.status">
						<el-radio :value="1">{{ t('启用') }}</el-radio>
						<el-radio :value="0">{{ t('禁用') }}</el-radio>
					</el-radio-group>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="dialogVisible = false">{{ t('取消') }}</el-button>
				<el-button type="primary" @click="handleSubmit" :loading="submitting">
					{{ t('确定') }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh, Delete } from '@element-plus/icons-vue';

interface SkuItem {
	id?: number;
	skuCode: string;
	skuName: string;
	image?: string;
	price: number;
	stock: number;
	attributes: Record<string, any>;
	status: number;
}

interface AttributeItem {
	key: string;
	value: string;
}

const props = defineProps({
	productId: {
		type: Number,
		required: true
	}
});

const emit = defineEmits(['change', 'add', 'edit', 'delete']);

const { t } = useI18n();
const { service } = useCool();

const searchText = ref('');
const loading = ref(false);
const skuList = ref<SkuItem[]>([]);
const selectedRows = ref<SkuItem[]>([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitting = ref(false);
const formRef = ref();

const formData = ref<SkuItem>({
	skuCode: '',
	skuName: '',
	image: '',
	price: 0,
	stock: 0,
	attributes: {},
	status: 1
});

// 属性编辑列表
const attributeList = ref<AttributeItem[]>([]);

// 表单验证规则
const formRules = reactive({
	skuCode: [{ required: true, message: t('请输入SKU编码'), trigger: 'blur' }],
	skuName: [{ required: true, message: t('请输入SKU名称'), trigger: 'blur' }],
	price: [{ required: true, message: t('请输入价格'), trigger: 'blur' }]
});

// 过滤后的SKU列表
const filteredSkuList = computed(() => {
	if (!searchText.value) return skuList.value;
	return skuList.value.filter(
		item => item.skuCode.includes(searchText.value) || item.skuName.includes(searchText.value)
	);
});

// 获取库存标签类型
const getStockTagType = (stock: number) => {
	if (stock > 10) return 'success';
	if (stock > 0) return 'warning';
	return 'danger';
};

// 加载SKU列表
const loadSkuList = async () => {
	loading.value = true;
	try {
		const res = await service.product.sku.list({
			productId: props.productId
		});
		skuList.value = Array.isArray(res) ? res : (res as any)?.list || [];
	} catch (error) {
		console.error('加载SKU列表失败:', error);
		ElMessage.error(t('加载SKU列表失败'));
	} finally {
		loading.value = false;
	}
};

// 刷新
const refresh = () => {
	loadSkuList();
};

// 搜索
const handleSearch = () => {
	// 搜索逻辑已在computed中处理
};

// 选择变化
const handleSelectionChange = (selection: SkuItem[]) => {
	selectedRows.value = selection;
};

// 添加SKU
const handleAdd = () => {
	dialogTitle.value = t('新增SKU');
	formData.value = {
		skuCode: '',
		skuName: '',
		image: '',
		price: 0,
		stock: 0,
		attributes: {},
		status: 1
	};
	attributeList.value = [];
	dialogVisible.value = true;
};

// 编辑SKU
const handleEdit = (row: SkuItem) => {
	dialogTitle.value = t('编辑SKU');
	formData.value = { ...row };

	// 转换attributes为编辑列表
	attributeList.value = Object.entries(row.attributes || {}).map(([key, value]) => ({
		key,
		value: String(value)
	}));

	dialogVisible.value = true;
};

// 删除SKU
const handleDelete = async (row: SkuItem) => {
	try {
		await ElMessageBox.confirm(`确认要删除SKU"${row.skuName}"吗？`, t('提示'), {
			confirmButtonText: t('确定'),
			cancelButtonText: t('取消'),
			type: 'warning'
		});

		await service.product.sku.delete({ id: row.id });
		ElMessage.success(t('删除成功'));
		await refresh();
		emit('delete', row);
	} catch (error) {
		if (error !== 'cancel') {
			console.error('删除SKU失败:', error);
		}
	}
};

// 状态变化
const handleStatusChange = async (row: SkuItem) => {
	try {
		await service.product.sku.update({
			id: row.id,
			status: row.status
		});
		ElMessage.success(t('状态更新成功'));
		emit('change', row);
	} catch (error) {
		console.error('更新状态失败:', error);
		// 恢复原状态
		row.status = row.status === 1 ? 0 : 1;
	}
};

// 批量更新状态
const batchUpdateStatus = async (status: number) => {
	if (selectedRows.value.length === 0) return;

	try {
		const ids = selectedRows.value.map(row => row.id);
		await service.product.sku.update({
			ids,
			status
		});

		ElMessage.success(t('批量更新成功'));
		await refresh();
	} catch (error) {
		console.error('批量更新失败:', error);
	}
};

// 批量删除
const batchDelete = async () => {
	if (selectedRows.value.length === 0) return;

	try {
		await ElMessageBox.confirm(
			`确认要删除选中的 ${selectedRows.value.length} 个SKU吗？`,
			t('提示'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				type: 'warning'
			}
		);

		const ids = selectedRows.value.map(row => row.id);
		await service.product.sku.delete({ ids });

		ElMessage.success(t('批量删除成功'));
		await refresh();
	} catch (error) {
		if (error !== 'cancel') {
			console.error('批量删除失败:', error);
		}
	}
};

// 添加属性
const addAttribute = () => {
	attributeList.value.push({ key: '', value: '' });
};

// 移除属性
const removeAttribute = (index: number) => {
	attributeList.value.splice(index, 1);
};

// 提交表单
const handleSubmit = async () => {
	try {
		await formRef.value?.validate();

		submitting.value = true;

		// 转换属性列表为对象
		const attributes: Record<string, string> = {};
		attributeList.value.forEach(attr => {
			if (attr.key && attr.value) {
				attributes[attr.key] = attr.value;
			}
		});

		const data = {
			...formData.value,
			productId: props.productId,
			attributes
		};

		if (data.id) {
			await service.product.sku.update(data);
			ElMessage.success(t('更新成功'));
			emit('edit', data);
		} else {
			await service.product.sku.add(data);
			ElMessage.success(t('添加成功'));
			emit('add', data);
		}

		dialogVisible.value = false;
		await refresh();
	} catch (error) {
		console.error('提交失败:', error);
	} finally {
		submitting.value = false;
	}
};

// 组件挂载时加载数据
onMounted(() => {
	loadSkuList();
});

// 导出方法
defineExpose({
	refresh,
	loadSkuList
});
</script>

<style lang="scss" scoped>
.sku-manager {
	.manager-header {
		margin-bottom: 20px;

		.header-actions {
			display: flex;
			justify-content: flex-end;
			gap: 10px;
		}
	}

	.manager-content {
		.sku-info {
			display: flex;
			align-items: center;
			gap: 10px;

			.sku-image {
				width: 40px;
				height: 40px;
				border-radius: 4px;
			}

			.sku-details {
				flex: 1;

				.sku-name {
					font-weight: bold;
					margin-bottom: 4px;
				}

				.sku-code {
					font-size: 12px;
					color: #999;
				}
			}
		}

		.attributes {
			.attribute-tag {
				margin: 2px;
				display: block;
			}
		}

		.price {
			font-weight: bold;
			color: #f56c6c;
		}
	}

	.manager-footer {
		margin-top: 20px;
		padding: 15px;
		background-color: #f5f7fa;
		border-radius: 4px;

		.batch-actions {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.selected-info {
				color: #606266;
			}
		}
	}
}

.attributes-editor {
	.attribute-item {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;

		.separator {
			color: #909399;
		}
	}
}
</style>
