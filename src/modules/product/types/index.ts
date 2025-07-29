// 商品分类
export interface ProductCategory {
	id?: number;
	name: string;
	parentId?: number;
	sort?: number;
	status: number;
	icon?: string;
	description?: string;
	createTime?: string;
	updateTime?: string;
	children?: ProductCategory[];
}

// 商品信息
export interface ProductInfo {
	id?: number;
	name: string;
	description?: string;
	categoryId: number;
	brandId?: number;
	images?: string[];
	video?: string;
	status: number;
	isRecommend: number;
	isNew: number;
	isHot: number;
	tags?: string[];
	price?: number;
	originalPrice?: number;
	stock?: number;
	sales?: number;
	weight?: number;
	unit?: string;
	createTime?: string;
	updateTime?: string;
	categoryName?: string;
	skus?: ProductSku[];
}

// 商品SKU
export interface ProductSku {
	id?: number;
	productId: number;
	skuCode: string;
	name: string;
	price: number;
	originalPrice?: number;
	stock: number;
	sales?: number;
	status: number;
	image?: string;
	weight?: number;
	volume?: number;
	specs?: SkuSpec[];
	createTime?: string;
	updateTime?: string;
}

// SKU规格
export interface SkuSpec {
	specName: string;
	specValue: string;
}

// 商品品牌
export interface ProductBrand {
	id?: number;
	name: string;
	logo?: string;
	description?: string;
	status: number;
	sort?: number;
	createTime?: string;
}

// 商品规格
export interface ProductSpec {
	id?: number;
	name: string;
	values: string[];
	sort?: number;
	status: number;
}

// 商品搜索参数
export interface ProductSearchParams {
	keyword?: string;
	categoryId?: number;
	brandId?: number;
	status?: number;
	isRecommend?: number;
	isNew?: number;
	isHot?: number;
	priceMin?: number;
	priceMax?: number;
}
