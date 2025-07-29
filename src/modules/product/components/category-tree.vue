<template>
	<div class="category-tree">
		<div class="tree-header">
			<el-input
				v-model="filterText"
				:placeholder="t('搜索分类')"
				clearable
				class="filter-input"
			>
				<template #prefix>
					<el-icon><Search /></el-icon>
				</template>
			</el-input>
			<el-button type="primary" size="small" @click="refresh">
				<el-icon><Refresh /></el-icon>
				{{ t('刷新') }}
			</el-button>
		</div>

		<el-tree
			ref="treeRef"
			:data="treeData"
			:props="treeProps"
			:filter-node-method="filterNode"
			node-key="id"
			:expand-on-click-node="false"
			:default-expand-all="false"
			:default-expanded-keys="defaultExpandedKeys"
			class="category-tree-node"
		>
			<template #default="{ node, data }">
				<div class="tree-node">
					<div class="node-content">
						<el-icon
							v-if="data.children && data.children.length > 0"
							class="folder-icon"
						>
							<Folder />
						</el-icon>
						<el-icon v-else class="file-icon">
							<Document />
						</el-icon>
						<span class="node-label">{{ data.name }}</span>
						<el-tag
							v-if="data.status === 0"
							type="danger"
							size="small"
							class="status-tag"
						>
							{{ t('禁用') }}
						</el-tag>
					</div>
					<div class="node-actions" v-if="showActions">
						<el-button type="primary" size="small" text @click="handleAdd(data)">
							<el-icon><Plus /></el-icon>
						</el-button>
						<el-button type="warning" size="small" text @click="handleEdit(data)">
							<el-icon><Edit /></el-icon>
						</el-button>
						<el-button type="danger" size="small" text @click="handleDelete(data)">
							<el-icon><Delete /></el-icon>
						</el-button>
					</div>
				</div>
			</template>
		</el-tree>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Folder, Document, Plus, Edit, Delete } from '@element-plus/icons-vue';

interface CategoryNode {
	id: number;
	name: string;
	parentId?: number;
	status: number;
	sort: number;
	children?: CategoryNode[];
}

const props = defineProps({
	// 是否显示操作按钮
	showActions: {
		type: Boolean,
		default: true
	},
	// 是否可选择
	selectable: {
		type: Boolean,
		default: false
	},
	// 默认展开的节点
	defaultExpanded: {
		type: Array<number>,
		default: () => []
	}
});

const emit = defineEmits(['node-click', 'add', 'edit', 'delete', 'refresh']);

const { t } = useI18n();
const { service } = useCool();

const treeRef = ref();
const filterText = ref('');
const treeData = ref<CategoryNode[]>([]);
const loading = ref(false);

const treeProps = {
	children: 'children',
	label: 'name'
};

const defaultExpandedKeys = computed(() => {
	return props.defaultExpanded;
});

// 过滤节点
const filterNode = (value: string, data: any) => {
	if (!value) return true;
	return data.name.includes(value);
};

// 监听搜索文本
watch(filterText, val => {
	treeRef.value?.filter(val);
});

// 加载分类树数据
const loadTreeData = async () => {
	loading.value = true;
	try {
		const res = await service.product.category.tree();
		treeData.value = res || [];
	} catch (error) {
		console.error('加载分类树失败:', error);
		ElMessage.error(t('加载分类树失败'));
	} finally {
		loading.value = false;
	}
};

// 刷新数据
const refresh = async () => {
	await loadTreeData();
	emit('refresh');
};

// 节点点击事件
const handleNodeClick = (data: CategoryNode) => {
	emit('node-click', data);
};

// 添加子分类
const handleAdd = (data: CategoryNode) => {
	emit('add', data);
};

// 编辑分类
const handleEdit = (data: CategoryNode) => {
	emit('edit', data);
};

// 删除分类
const handleDelete = async (data: CategoryNode) => {
	try {
		await ElMessageBox.confirm(
			`确认要删除分类"${data.name}"吗？删除后该分类下的所有子分类也将被删除。`,
			t('提示'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				type: 'warning'
			}
		);

		await service.product.category.delete({ id: data.id });
		ElMessage.success(t('删除成功'));
		await refresh();
		emit('delete', data);
	} catch (error) {
		if (error !== 'cancel') {
			console.error('删除分类失败:', error);
			ElMessage.error(t('删除失败'));
		}
	}
};

// 获取选中的节点
const getSelectedNode = () => {
	return treeRef.value?.getCurrentNode();
};

// 设置选中的节点
const setCurrentNode = (nodeId: number) => {
	nextTick(() => {
		treeRef.value?.setCurrentKey(nodeId);
	});
};

// 展开指定节点
const expandNode = (nodeId: number) => {
	const node = treeRef.value?.getNode(nodeId);
	if (node) {
		node.expand();
	}
};

// 折叠指定节点
const collapseNode = (nodeId: number) => {
	const node = treeRef.value?.getNode(nodeId);
	if (node) {
		node.collapse();
	}
};

// 展开所有节点
const expandAll = () => {
	const nodes = treeRef.value?.store?.nodesMap;
	if (nodes) {
		Object.values(nodes).forEach((node: any) => {
			node.expand();
		});
	}
};

// 折叠所有节点
const collapseAll = () => {
	const nodes = treeRef.value?.store?.nodesMap;
	if (nodes) {
		Object.values(nodes).forEach((node: any) => {
			node.collapse();
		});
	}
};

// 组件挂载时加载数据
onMounted(() => {
	loadTreeData();
});

// 导出方法供父组件使用
defineExpose({
	refresh,
	getSelectedNode,
	setCurrentNode,
	expandNode,
	collapseNode,
	expandAll,
	collapseAll,
	treeData
});
</script>

<style lang="scss" scoped>
.category-tree {
	height: 100%;
	display: flex;
	flex-direction: column;

	.tree-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 15px;

		.filter-input {
			flex: 1;
		}
	}

	.category-tree-node {
		flex: 1;
		overflow: auto;

		:deep(.el-tree-node__content) {
			height: 40px;

			&:hover {
				.node-actions {
					opacity: 1;
				}
			}
		}

		.tree-node {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding-right: 10px;

			.node-content {
				display: flex;
				align-items: center;
				gap: 8px;

				.folder-icon {
					color: #e6a23c;
				}

				.file-icon {
					color: #909399;
				}

				.node-label {
					font-size: 14px;
				}

				.status-tag {
					margin-left: 8px;
				}
			}

			.node-actions {
				display: flex;
				align-items: center;
				gap: 5px;
				opacity: 0;
				transition: opacity 0.2s;

				.el-button {
					padding: 4px;
					min-height: auto;
				}
			}
		}
	}
}
</style>
